import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (value && !validatePassword(value)) {
      setPasswordError("Password must be at least 6 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!email || !password) {
      alert("Please fill all the details");
      return;
    }

    if (!validateEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const url = isLogin
        ? "http://localhost:5000/login"
        : "http://localhost:5000/register";

      const res = await axios.post(url, { email, password });

      alert(res.data.message);

      // After login → go to home page
      if (isLogin && res.data.message === "Login successful") {
        localStorage.setItem("userEmail", email);
        navigate("/home");
      }

      // After registration → switch to login
      if (!isLogin && res.data.message === "Registration successful") {
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="auth-container">
      {/* Animated background elements */}
      <div className="floating-elements">
        <div className="floating-element leaf">🌱</div>
        <div className="floating-element leaf2">🌾</div>
        <div className="floating-element leaf3">🍃</div>
        <div className="floating-element sun">☀️</div>
        <div className="floating-element cloud">☁️</div>
        <div className="floating-element tractor">🚜</div>
      </div>

      <div className="auth-wrapper">
        <div className="auth-brand">
          <div className="brand-content">
            <h1 className="brand-title">
              <span className="brand-icon"></span>
              AgriTwin
            </h1>
            <p className="brand-subtitle">Smart Farming Solutions</p>
            <div className="brand-features">
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>AI Crop Predictions</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🦠</span>
                <span>Disease Detection</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📈</span>
                <span>Yield Analytics</span>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-toggle">
              <button
                className={`toggle-btn ${isLogin ? "active" : ""}`}
                onClick={() => {
                  setIsLogin(true);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setEmailError("");
                  setPasswordError("");
                }}
              >
                Login
              </button>
              <button
                className={`toggle-btn ${!isLogin ? "active" : ""}`}
                onClick={() => {
                  setIsLogin(false);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setEmailError("");
                  setPasswordError("");
                }}
              >
                Register
              </button>
            </div>
          </div>

          <div className="auth-body">
            <h2 className="auth-title">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h2>
            <p className="auth-subtitle">
              {isLogin
                ? "Please enter your details to login"
                : "Sign up to start using AgriTwin"}
            </p>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  onKeyPress={handleKeyPress}
                  className={emailError ? "error" : ""}
                />
                {email && !emailError && (
                  <span className="input-valid">✓</span>
                )}
              </div>
              {emailError && <span className="error-message">{emailError}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyPress={handleKeyPress}
                  className={passwordError ? "error" : ""}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {passwordError && (
                <span className="error-message">{passwordError}</span>
              )}
            </div>

            {!isLogin && (
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
            )}

            {isLogin && (
              <div className="auth-options">
                <label className="remember-me">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#forgot" className="forgot-password">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              className={`auth-submit-btn ${loading ? "loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">⟳</span>
              ) : isLogin ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </button>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <span
                  className="toggle-link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setEmailError("");
                    setPasswordError("");
                  }}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;