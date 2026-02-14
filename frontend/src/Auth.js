import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // navigation hook

  const handleSubmit = async () => {
    // Validation
    if (!email || !password) {
      alert("Please fill all the details");
      return;
    }

    try {
      const url = isLogin
        ? "http://localhost:5000/login"
        : "http://localhost:5000/register";

      const res = await axios.post(url, { email, password });

      alert(res.data.message);

      // After login → go to home page
      if (isLogin && res.data.message === "Login successful") {
        navigate("/home");
      }

      // After registration → switch to login
      if (!isLogin && res.data.message === "Registration successful") {
        setIsLogin(true);
      }
    } catch (err) {
      alert("Operation failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? "User Login" : "User Register"}</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleSubmit}>
          {isLogin ? "Login" : "Register"}
        </button>

        <p>
          {isLogin ? "No account?" : "Already have an account?"}{" "}
          <span
            className="toggle-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register here" : "Login here"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;
