import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import "./App.css";

function App() {
  const [profile, setProfile] = useState(null);

  const API_URL = "http://127.0.0.1:8888";

  const fetchProfile = () => {
    fetch(`${API_URL}/profile`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch(() => setProfile(null));
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/login`;
  };

  const handleLogout = () => {
    fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => setProfile(null))
      .catch((err) => console.error("Logout failed:", err));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <Router>
      <div className="AppWrapper" style={{ padding: "1rem" }}>
        <Header profile={profile} onLogin={handleLogin} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
