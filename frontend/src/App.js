import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Page2 from "./Page2";
import Page3 from "./Page3";
import Page4 from "./Page4";
import Page5 from "./Page5";
import "./App.css";
import Background from "../src/images/Background.png";

function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = "http://127.0.0.1:8888";

  const fetchProfile = () => {
    fetch(`${API_URL}/profile`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
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
      <div
        className="AppWrapper"
        style={{
          backgroundImage: `url(${Background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          padding: "1rem",
        }}
      >
        <Header profile={profile} onLogin={handleLogin} onLogout={handleLogout} loading={loading} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Page2" element={<Page2 />} />
            <Route path="/Page3" element={<Page3 />} />
            <Route path="/Page4" element={<Page4 />} />
            <Route path="/Page5" element={<Page5 />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
