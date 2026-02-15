const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt"); // Make sure to install this

const app = express();
app.use(cors());
app.use(express.json());

// Load crop & disease data
const crops = JSON.parse(fs.readFileSync("crop.json"));
const diseases = JSON.parse(fs.readFileSync("diseases.json"));

// Ensure JSON storage files exist
if (!fs.existsSync("users.json")) fs.writeFileSync("users.json", "[]");
if (!fs.existsSync("results.json")) fs.writeFileSync("results.json", "[]");
if (!fs.existsSync("contacts.json")) fs.writeFileSync("contacts.json", "[]"); // Add this for contact messages

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
  animalAttackLoss = 0,
  naturalDisasterLoss = 0
) {
  const crop = crops[cropName];
  if (!crop) return null;

  let issues = [];
  const levels = { low: 1, medium: 2, high: 3 };

  if (!crop.soil.includes(soil)) issues.push("Soil type not suitable");
  if (season !== "rainy" && season !== "monsoon") {
    if (levels[water] < levels[crop.water_need]) issues.push("Insufficient water");
  }
  if (levels[fertilizer] < levels[crop.fertilizer_need]) issues.push("Insufficient fertilizer");
  if (!crop.season.includes(season)) issues.push("Wrong season");

  const soilFactor = crop.soil.includes(soil) ? 1.2 : 0.85;
  const waterFactor = water === crop.water_need ? 1.2 : 0.85;
  const fertFactor = fertilizer === crop.fertilizer_need ? 1.2 : 0.85;
  const seasonFactor = crop.season.includes(season) ? 1.2 : 0.85;

  let baseYield = crop.base_yield * soilFactor * waterFactor * fertFactor * seasonFactor * farmSize;

  const totalLossFactor = (100 - animalAttackLoss - naturalDisasterLoss) / 100;
  const finalYield = baseYield * totalLossFactor;
  const finalProfit = finalYield * crop.price;

  if (animalAttackLoss > 0)
    issues.push(`Expected loss due to animal attacks: ${animalAttackLoss}%`);
  if (naturalDisasterLoss > 0)
    issues.push(`Expected loss due to natural disasters: ${naturalDisasterLoss}%`);

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

// ------------------- AUTH APIs with HASHING ------------------- //

// Register endpoint with password hashing
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const users = JSON.parse(fs.readFileSync("users.json"));
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password (10 salt rounds is standard)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user with hashed password
    users.push({ 
      email, 
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });
    
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
    
    res.json({ message: "Registration successful" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login endpoint with password verification
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const users = JSON.parse(fs.readFileSync("users.json"));
    const user = users.find(u => u.email === email);

    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Login successful - don't send password back
    res.json({ 
      message: "Login successful",
      user: {
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
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

// ------------------- NEW CONTACT API ------------------- //

// Contact form endpoint
app.post("/contact", (req, res) => {
  try {
    const { name, email, message, date } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email and message are required" 
      });
    }

    // Read existing contacts
    const contacts = JSON.parse(fs.readFileSync("contacts.json"));

    // Create new contact entry
    const newContact = {
      id: Date.now(),
      name,
      email,
      message,
      date: date || new Date().toISOString(),
      status: "unread" // Track if message has been read
    };

    // Add to contacts array
    contacts.push(newContact);

    // Save to file
    fs.writeFileSync("contacts.json", JSON.stringify(contacts, null, 2));

    // Send success response
    res.json({
      success: true,
      message: "Thank you for contacting us! We'll get back to you soon.",
      contactId: newContact.id
    });

    // Optional: Log to console for demo purposes
    console.log("New contact message received:");
    console.log(`From: ${name} (${email})`);
    console.log(`Message: ${message}`);
    console.log("------------------------");

  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to save your message. Please try again." 
    });
  }
});

// Optional: Get all contact messages (for admin purposes)
app.get("/contacts", (req, res) => {
  try {
    const contacts = JSON.parse(fs.readFileSync("contacts.json"));
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve contacts" });
  }
});

// Optional: Mark message as read
app.patch("/contacts/:id/read", (req, res) => {
  try {
    const contacts = JSON.parse(fs.readFileSync("contacts.json"));
    const contact = contacts.find(c => c.id === parseInt(req.params.id));
    
    if (contact) {
      contact.status = "read";
      fs.writeFileSync("contacts.json", JSON.stringify(contacts, null, 2));
      res.json({ success: true, message: "Contact marked as read" });
    } else {
      res.status(404).json({ success: false, message: "Contact not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// ------------------- START SERVER ------------------- //

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));