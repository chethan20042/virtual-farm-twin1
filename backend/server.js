const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const crops = JSON.parse(fs.readFileSync("crop.json"));
const diseases = JSON.parse(fs.readFileSync("diseases.json"));

// Ensure JSON storage files exist
if (!fs.existsSync("users.json")) fs.writeFileSync("users.json", "[]");
if (!fs.existsSync("results.json")) fs.writeFileSync("results.json", "[]");

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

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

// Crop simulation
function simulate(cropName, soil, water, fertilizer, season, farmSize) {
    const crop = crops[cropName];
    if (!crop) return null;

    let issues = [];
    const levels = { low: 1, medium: 2, high: 3 };

    if (!crop.soil.includes(soil)) issues.push("Soil type not suitable");

    if (season !== "rainy" && season !== "monsoon") {
        if (levels[water] < levels[crop.water_need]) {
            issues.push("Insufficient water");
        }
    }

    if (levels[fertilizer] < levels[crop.fertilizer_need]) {
        issues.push("Insufficient fertilizer");
    }

    if (!crop.season.includes(season)) {
        issues.push("Wrong season");
    }

    let soilFactor = crop.soil.includes(soil) ? 1.2 : 0.85;
    let waterFactor = water === crop.water_need ? 1.2 : 0.85;
    let fertFactor = fertilizer === crop.fertilizer_need ? 1.2 : 0.85;
    let seasonFactor = crop.season.includes(season) ? 1.2 : 0.85;

    const yieldValue =
        crop.base_yield *
        soilFactor *
        waterFactor *
        fertFactor *
        seasonFactor *
        farmSize;

    const profit = yieldValue * crop.price;

    if (issues.length === 0) {
        return {
            status: "success",
            message: "You can plant this crop.",
            expectedYield: yieldValue.toFixed(2),
            expectedProfit: profit.toFixed(2),
            harvestMonths: crop.harvest_months
        };
    } else {
        return {
            status: "fail",
            message: "Not suitable to grow this crop.",
            reasons: issues
        };
    }
}

//////////////////// AUTH APIs ////////////////////

app.post("/register", (req, res) => {
    const { email, password } = req.body;

    const users = JSON.parse(fs.readFileSync("users.json"));

    const exists = users.find((u) => u.email === email);
    if (exists) {
        return res.json({ message: "User already exists" });
    }

    users.push({ email, password });
    fs.writeFileSync("users.json", JSON.stringify(users, null, 2));

    res.json({ message: "Registration successful" });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    const users = JSON.parse(fs.readFileSync("users.json"));
    const user = users.find(
        (u) => u.email === email && u.password === password
    );

    if (!user) {
        return res.json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful" });
});

//////////////////// MAIN APIs ////////////////////

app.get("/crops", (req, res) => {
    res.json(Object.keys(crops));
});

app.post("/simulate", (req, res) => {
    const { crop, soil, water, fertilizer, season, farmSize, email } =
        req.body;

    const result = simulate(crop, soil, water, fertilizer, season, farmSize);

    if (!result) {
        return res.status(400).json({ error: "Invalid crop" });
    }

    // Save result to results.json
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

app.post("/upload", upload.single("soilImage"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const soilType = detectSoilType(req.file.path);
    res.json({ detectedSoil: soilType });
});

app.post("/detect-disease", upload.single("cropImage"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const disease = detectDisease(req.file.path);
    const data = diseases[disease];

    res.json({
        disease: disease,
        suggestion: data.suggestion,
        yieldLoss: data.yield_loss
    });
});

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
