import React, { useEffect, useState } from "react";

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
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Spotify Profile</h1>
      {profile ? (
        <>
          <p>
            Logged in as: <strong>{profile.display_name || profile.email}</strong>
          </p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <p>You are not logged in.</p>
          <button onClick={handleLogin}>Login with Spotify</button>
        </>
      )}
    </div>
  );
}

export default App;
