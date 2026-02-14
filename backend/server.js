const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const crops = JSON.parse(fs.readFileSync("crop.json"));

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Mock AI soil detection
function detectSoilType(imagePath) {
    // For demo, randomly select soil type
    const soils = ["sandy", "loamy", "clayey"];
    return soils[Math.floor(Math.random() * soils.length)];
}

// Crop simulation (as before)
function simulate(cropName, soil, water, fertilizer, season, farmSize) {
    const crop = crops[cropName];
    if (!crop) return null;

    let soilFactor = crop.soil.includes(soil) ? 1.2 : 0.85;
    let waterFactor = water === crop.water_need ? 1.2 : 0.85;
    let fertFactor = fertilizer === crop.fertilizer_need ? 1.2 : 0.85;
    let seasonFactor = crop.season.includes(season) ? 1.2 : 0.85;

    const yieldValue = crop.base_yield * soilFactor * waterFactor * fertFactor * seasonFactor * farmSize;
    const profit = yieldValue * crop.price;

    return {
        expectedYield: yieldValue.toFixed(2),
        expectedProfit: profit.toFixed(2),
        harvestMonths: crop.harvest_months
    };
}

// API: Get crops
app.get("/crops", (req, res) => res.json(Object.keys(crops)));

// API: Simulate crop
app.post("/simulate", (req, res) => {
    const { crop, soil, water, fertilizer, season, farmSize } = req.body;
    const result = simulate(crop, soil, water, fertilizer, season, farmSize);
    if (!result) return res.status(400).json({ error: "Invalid crop" });
    res.json(result);
});

// API: Upload image for soil detection
app.post("/upload", upload.single("soilImage"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const soilType = detectSoilType(req.file.path); // AI model would replace this
    res.json({ detectedSoil: soilType });
});

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
