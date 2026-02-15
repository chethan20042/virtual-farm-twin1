import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import Farm3D from "./Farm3D";

function Home() {
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState({
  crop: "",
  soil: "loamy",
  water: "medium",
  fertilizer: "medium",
  season: "summer",
  farmSize: 1,
  email: localStorage.getItem("userEmail") || "guest",
  animalAttack: 0,
  naturalDisaster: 0
});


  const [result, setResult] = useState(null);
  const [diseaseResult, setDiseaseResult] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diseaseLoading, setDiseaseLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

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
  setLoading(true);
  try {
    const res = await axios.post("http://localhost:5000/simulate", {
      ...form,
      animalAttackLoss: form.animalAttack || 0,        // from input field
      naturalDisasterLoss: form.naturalDisaster || 0  // from input field
    });
    setResult(res.data);
  } catch (err) {
    alert("Simulation failed");
  } finally {
    setLoading(false);
  }
};


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const detectDisease = async () => {
    if (!image) {
      alert("Upload a crop image first");
      return;
    }

    setDiseaseLoading(true);
    const formData = new FormData();
    formData.append("cropImage", image);

    try {
      const res = await axios.post(
        "http://localhost:5000/detect-disease",
        formData
      );
      setDiseaseResult(res.data);
    } catch (err) {
      alert("Disease detection failed");
    } finally {
      setDiseaseLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveSection(sectionId);
  };

  return (
    <div className="App">
      <div className="top-strip">
        <div className="container">
          <span>📧 agritwin@smartagri.com</span>
          <span>🌱 Smart Farming Solutions</span>
        </div>
      </div>

      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <span className="logo-icon">🌾</span>
            AgriTwin
          </div>
          <div className="user-info">
            <div className="user-email">
              <span className="user-icon">👤</span>
              {form.email}
            </div>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <div className="container nav-container">
          <a 
            href="#home" 
            className={activeSection === "home" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}
          >
            HOME
          </a>
          <a 
            href="#simulator" 
            className={activeSection === "simulator" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); scrollToSection("simulator"); }}
          >
            SIMULATOR
          </a>
          <a 
            href="#disease" 
            className={activeSection === "disease" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); scrollToSection("disease"); }}
          >
            DISEASE DETECTION
          </a>
          <a 
            href="#contact" 
            className={activeSection === "contact" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}
          >
            CONTACT
          </a>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="container hero-container">
          <div className="hero-text">
            <h1 className="animate-text">
              AGRICULTURE IS THE MOST HEALTHFUL
            </h1>
            <p>AI-powered prediction system for modern farmers</p>
            <div className="hero-buttons">
              <button className="primary-btn" onClick={() => scrollToSection("simulator")}>
                Get Started
              </button>
              <button className="secondary-btn" onClick={() => scrollToSection("disease")}>
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-icon">🌱</div>
            <div className="floating-icon">🌾</div>
            <div className="floating-icon">🚜</div>
          </div>
        </div>
      </section>

      {/* SIMULATOR */}
      <section className="simulator section" id="simulator">
        <div className="container">
          <div className="section-header">
            <h2>
              <span className="section-icon">🌱</span>
              AgriTwin Simulation
            </h2>
            <p>Predict your crop yield and profit with AI</p>
          </div>

          <div className="simulator-card">
            <div className="form-grid">
              {[
                { label: "Crop Type", name: "crop", options: crops },
                { label: "Soil Type", name: "soil", options: soils },
                { label: "Water Requirement", name: "water", options: waters },
                { label: "Fertilizer Level", name: "fertilizer", options: fertilizers },
                { label: "Season", name: "season", options: seasons },
              ].map((item) => (
                <div key={item.name} className="form-item">
                  <label>{item.label}</label>
                  <div className="select-wrapper">
                    <select
                      name={item.name}
                      value={form[item.name]}
                      onChange={handleChange}
                    >
                      <option value="">Select {item.label}</option>
                      {item.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <div className="form-item">
                <label>Farm Size (acres)</label>
                <input
                  type="number"
                  name="farmSize"
                  min="1"
                  value={form.farmSize}
                  onChange={handleChange}
                  className="number-input"
                />
              </div>
            </div>
           <div className="form-item">
  <label>Animal Attack Loss (%)</label>
  <input
    type="number"
    name="animalAttack"
    min="0"
    max="100"
    value={form.animalAttack || 0}
    onChange={handleChange}
  />
</div>

<div className="form-item">
  <label>Natural Disaster Loss (%)</label>
  <input
    type="number"
    name="naturalDisaster"
    min="0"
    max="100"
    value={form.naturalDisaster || 0}
    onChange={handleChange}
  />
</div>

            <button 
              className="simulate-btn" 
              onClick={simulate}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">⟳</span>
              ) : (
                "Run Simulation"
              )}
            </button>

            {result && (
              <div className="result-card">
                <div
                  className={`status-badge ${
                    result.status === "success" ? "success" : "fail"
                  }`}
                >
                  {result.status === "success" ? "✓ Success" : "⚠ Warning"}
                </div>

                <div className="result-message">{result.message}</div>

                {result.reasons && result.reasons.length > 0 && (
                  <div className="reasons-container">
                    <h4>Optimization Suggestions:</h4>
                    <ul className="reasons-list">
                      {result.reasons.map((r, i) => (
                        <li key={i}>
                          <span className="reason-icon">💡</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.status === "success" && (
                  <>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <span className="metric-icon">📊</span>
                        <div className="metric-content">
                          <label>Expected Yield</label>
                          <span className="metric-value">{result.expectedYield} tons</span>
                        </div>
                      </div>
                      <div className="metric-card">
                        <span className="metric-icon">💰</span>
                        <div className="metric-content">
                          <label>Expected Profit</label>
                          <span className="metric-value">₹{result.expectedProfit}</span>
                        </div>
                      </div>
                      <div className="metric-card">
                        <span className="metric-icon">⏰</span>
                        <div className="metric-content">
                          <label>Harvest Time</label>
                          <span className="metric-value">{result.harvestMonths} months</span>
                        </div>
                      </div>
                    </div>

                    <div className="farm-visualization">
                      <h4>Farm Visualization</h4>
                      <Farm3D
                        crop={form.crop}
                        soilType={form.soil}
                        farmSize={form.farmSize}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DISEASE DETECTION */}
      <section className="disease-section section" id="disease">
        <div className="container">
          <div className="section-header">
            <h2>
              <span className="section-icon">🦠</span>
              Crop Disease Detection
            </h2>
            <p>Upload an image to detect crop diseases instantly</p>
          </div>

          <div className="disease-card">
            <div className="upload-area">
              <div 
                className="image-preview"
                onClick={() => document.getElementById('file-input').click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon">📸</span>
                    <p>Click to upload crop image</p>
                    <span className="upload-hint">JPG, PNG or GIF</span>
                  </div>
                )}
              </div>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>

            <button 
              className="detect-btn" 
              onClick={detectDisease}
              disabled={diseaseLoading || !image}
            >
              {diseaseLoading ? (
                <span className="loading-spinner">⟳</span>
              ) : (
                "Detect Disease"
              )}
            </button>

            {diseaseResult && (
              <div className="disease-result">
                <div className="result-header">
                  <h3>Detection Results</h3>
                  <span className="result-date">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                
                <div className="disease-info">
                  <div className="info-item">
                    <label>Disease Identified:</label>
                    <span className="disease-name">{diseaseResult.disease}</span>
                  </div>
                  
                  <div className="info-item">
                    <label>Treatment Suggestion:</label>
                    <p className="suggestion">{diseaseResult.suggestion}</p>
                  </div>
                  
                  <div className="info-item">
                    <label>Expected Yield Loss:</label>
                    <div className="yield-loss">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${diseaseResult.yieldLoss * 100}%` }}
                        ></div>
                      </div>
                      <span className="loss-percentage">
                        {diseaseResult.yieldLoss * 100}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="contact-section section" id="contact">
        <div className="container">
          <div className="section-header">
            <h2>
              <span className="section-icon">📞</span>
              Contact Us
            </h2>
            <p>Get in touch with our agricultural experts</p>
          </div>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <h4>Address</h4>
                  <p>AgriTwin Tech Park, Smart City<br />SPC Puttur</p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div>
                  <h4>Email</h4>
                  <p>chethan@gmail.com<br />spc@gmail.com</p>
                </div>
              </div>
              
              <div className="contact-item">
                <span className="contact-icon">📱</span>
                <div>
                  <h4>Phone</h4>
                  <p>+91 7259864537<br />+91 9767856457</p>
                </div>
              </div>
            </div>

            <div className="contact-form">
              <input type="text" placeholder="Your Name" />
              <input type="email" placeholder="Your Email" />
              <textarea placeholder="Your Message" rows="4"></textarea>
              <button className="submit-btn">Send Message</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>AgriTwin</h4>
              <p>Smart farming solutions for a sustainable future</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <a href="#home">Home</a>
              <a href="#simulator">Simulator</a>
              <a href="#disease">Disease Detection</a>
            </div>
            <div className="footer-section">
              <h4>Follow Us</h4>
              <div className="social-links">
                <span>📘</span>
                <span>🐦</span>
                <span>📷</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            © 2026 AgriTwin. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;