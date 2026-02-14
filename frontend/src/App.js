import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import Farm3D from "./Farm3D";

function App() {
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({
    crop: "",
    soil: "loamy",
    water: "medium",
    fertilizer: "medium",
    season: "summer",
    farmSize: 1,
  });
  const [result, setResult] = useState(null);

  const soils = ["sandy", "loamy", "clayey"];
  const waters = ["low", "medium", "high"];
  const fertilizers = ["low", "medium", "high"];
  const seasons = ["spring", "summer", "monsoon", "rainy", "winter"];

  useEffect(() => {
    axios
      .get("http://localhost:5000/crops")
      .then((res) => setCrops(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const simulate = async () => {
    try {
      const res = await axios.post("http://localhost:5000/simulate", form);
      setResult(res.data);
    } catch (err) {
      alert("Simulation failed");
    }
  };

  return (
    <div className="App">
      <div className="top-strip">📧 farmtwin@smartagri.com</div>

      <header className="header">
        <div className="logo">🌾 FARMTWIN</div>
        <div className="contact">
          📞 +91 9876543210 <br />
          📍 Smart Farming India
        </div>
      </header>

      <nav className="navbar">
        <a href="/">HOME</a>
        <a href="#simulator">SIMULATOR</a>
        <a href="#services">SERVICES</a>
        <a href="#contact">CONTACT</a>
      </nav>

      <section className="hero">
        <div className="hero-text">
          <h1>AGRICULTURE IS THE MOST HEALTHFUL</h1>
          <p>AI-powered prediction system for modern farmers</p>
        </div>
      </section>

      <section className="simulator" id="simulator">
        <h2>🌱 Farm Simulation</h2>

        <div className="form-grid">
          {[
            { label: "Crop", name: "crop", options: crops },
            { label: "Soil", name: "soil", options: soils },
            { label: "Water", name: "water", options: waters },
            { label: "Fertilizer", name: "fertilizer", options: fertilizers },
            { label: "Season", name: "season", options: seasons },
          ].map((item) => (
            <div key={item.name} className="form-item">
              <label>{item.label}</label>
              <select
                name={item.name}
                value={form[item.name]}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {item.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="form-item">
            <label>Farm Size (acre)</label>
            <input
              type="number"
              name="farmSize"
              min="1"
              value={form.farmSize}
              onChange={handleChange}
            />
          </div>
        </div>

        <button className="simulate-btn" onClick={simulate}>
          Simulate
        </button>

        {result && (
          <div className="result">
            <p>Yield: {result.expectedYield} tons</p>
            <p>Profit: ₹{result.expectedProfit}</p>
            <p>Harvest: {result.harvestMonths} months</p>

            <Farm3D
              crop={form.crop}
              soilType={form.soil}
              farmSize={form.farmSize}
            />
          </div>
        )}
      </section>

      <footer className="footer">© 2026 FarmTwin</footer>
    </div>
  );
}

export default App;
