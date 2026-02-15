const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Load crop & disease data
const crops = JSON.parse(fs.readFileSync("crop.json"));
const diseases = JSON.parse(fs.readFileSync("diseases.json"));

// Ensure JSON storage files exist
if (!fs.existsSync("users.json")) fs.writeFileSync("users.json", "[]");
if (!fs.existsSync("results.json")) fs.writeFileSync("results.json", "[]");

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ------------------- MOCK AI FUNCTIONS ------------------- //

// Mock AI soil detection
function detectSoilType(imagePath) {
  const soils = ["sandy", "loamy", "clayey"];
  return soils[Math.floor(Math.random() * soils.length)];
}

// Mock AI disease detection
function detectDisease(imagePath) {
  const diseaseList = Object.keys(diseases);
  return diseaseList[Math.floor(Math.random() * diseaseList.length)];
}

// ------------------- CROP SIMULATION ------------------- //

function simulate(
  cropName,
  soil,
  water,
  fertilizer,
  season,
  farmSize,
  animalAttackLoss = 0,      // percentage 0-100
  naturalDisasterLoss = 0    // percentage 0-100
) {
  const crop = crops[cropName];
  if (!crop) return null;

  let issues = [];
  const levels = { low: 1, medium: 2, high: 3 };

  // Check for real mismatches
  if (!crop.soil.includes(soil)) issues.push("Soil type not suitable");
  if (season !== "rainy" && season !== "monsoon") {
    if (levels[water] < levels[crop.water_need]) issues.push("Insufficient water");
  }
  if (levels[fertilizer] < levels[crop.fertilizer_need]) issues.push("Insufficient fertilizer");
  if (!crop.season.includes(season)) issues.push("Wrong season");

  // Base yield calculation
  const soilFactor = crop.soil.includes(soil) ? 1.2 : 0.85;
  const waterFactor = water === crop.water_need ? 1.2 : 0.85;
  const fertFactor = fertilizer === crop.fertilizer_need ? 1.2 : 0.85;
  const seasonFactor = crop.season.includes(season) ? 1.2 : 0.85;

  let baseYield = crop.base_yield * soilFactor * waterFactor * fertFactor * seasonFactor * farmSize;
  let baseProfit = baseYield * crop.price;

  // Apply attack & disaster losses
  const totalLossFactor = (100 - animalAttackLoss - naturalDisasterLoss) / 100;
  const finalYield = baseYield * totalLossFactor;
  const finalProfit = finalYield * crop.price;

  // Add advisory info (optional)
  if (animalAttackLoss > 0)
    issues.push(`Expected loss due to animal attacks: ${animalAttackLoss}%`);
  if (naturalDisasterLoss > 0)
    issues.push(`Expected loss due to natural disasters: ${naturalDisasterLoss}%`);

  // Determine status
  const status = issues.length === 0 ? "success" : "fail";

  return {
    status: status,
    message: status === "success" ? "You can plant this crop." : "Crop growth may be affected.",
    reasons: issues,
    expectedYield: finalYield.toFixed(2),
    expectedProfit: finalProfit.toFixed(2),
    harvestMonths: crop.harvest_months
  };
}


// ------------------- AUTH APIs ------------------- //

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  const users = JSON.parse(fs.readFileSync("users.json"));
  if (users.find(u => u.email === email)) return res.json({ message: "User already exists" });

  users.push({ email, password });
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
  res.json({ message: "Registration successful" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const users = JSON.parse(fs.readFileSync("users.json"));
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.json({ message: "Invalid credentials" });
  res.json({ message: "Login successful" });
});

// ------------------- MAIN APIs ------------------- //

app.get("/crops", (req, res) => {
  res.json(Object.keys(crops));
});

app.post("/simulate", (req, res) => {
  const {
    crop,
    soil,
    water,
    fertilizer,
    season,
    farmSize,
    email,
    animalAttackLoss = 0,
    naturalDisasterLoss = 0
  } = req.body;

  const result = simulate(
    crop,
    soil,
    water,
    fertilizer,
    season,
    farmSize,
    Number(animalAttackLoss),
    Number(naturalDisasterLoss)
  );

  if (!result) return res.status(400).json({ error: "Invalid crop" });

  const results = JSON.parse(fs.readFileSync("results.json"));
  results.push({
    email: email || "guest",
    crop,
    result,
    date: new Date()
  });
  fs.writeFileSync("results.json", JSON.stringify(results, null, 2));

  res.json(result);
});

// Crop disease detection
app.post("/detect-disease", upload.single("cropImage"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const disease = detectDisease(req.file.path);
  const data = diseases[disease];
  res.json({
    disease: disease,
    suggestion: data.suggestion,
    yieldLoss: data.yield_loss
  });
});

// ------------------- START SERVER ------------------- //

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
