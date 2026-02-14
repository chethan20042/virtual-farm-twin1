import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Auth";
import Home from "./Home";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login page first */}
        <Route path="/" element={<Auth />} />

        {/* Home after login */}
        <Route path="/home" element={<Home />} />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
