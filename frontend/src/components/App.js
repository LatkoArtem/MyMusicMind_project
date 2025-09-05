import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import i18n from "../i18n";

import Header from "./Header";
import Footer from "./Footer";
import Home from "../pages/header_pages/Home";
import TrackAlbumRatings from "../pages/header_pages/TrackAlbumRatings";
import RateTrackOrAlbum from "../pages/header_pages/RateTrackOrAlbum";
import About from "../pages/header_pages/About";
import MyMusicTrends from "../pages/header_pages/MyMusicTrends";
import ProfilePage from "../pages/header_pages/ProfilePage";
import HelpSupportPage from "../pages/header_pages/HelpSupportPage";

import LikedSongsPage from "../pages/sidebar_pages/LikedSongsPage";
import LikedEpisodesPage from "../pages/sidebar_pages/LikedEpisodesPage";
import PlaylistsPage from "../pages/sidebar_pages/PlaylistsPage";
import AlbumsPage from "../pages/sidebar_pages/AlbumsPage";
import ArtistsPage from "../pages/sidebar_pages/ArtistsPage";
import PodcastsPage from "../pages/sidebar_pages/PodcastsPage";
import DetailPage from "../pages/sidebar_pages/DetailPage";

import "./styles/App.css";
import Background from "../images/Background.png";

function App() {
  const [profile, setProfile] = useState(null);
  const [langReady, setLangReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // const API_URL = "https://mymusicmind.onrender.com";
  const API_URL = "/api";
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/profile`, { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");

      const data = await res.json();

      // встановлюємо мову з профілю перед рендером
      if (data.language && data.language !== i18n.language) {
        await i18n.changeLanguage(data.language);
      }

      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
      setLangReady(true);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/login`;
  };

  const handleLogout = () => {
    fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setProfile(null);
        window.dispatchEvent(new Event("logout"));
        navigate("/");
      })
      .catch((err) => console.error("Logout failed:", err));
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (!langReady) return null;

  return (
    <div
      className="AppWrapper"
      style={{
        backgroundImage: `url(${Background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <Header profile={profile} onLogin={handleLogin} onLogout={handleLogout} loading={loading} />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/TrackAlbumRatings" element={<TrackAlbumRatings profile={profile} />} />
          <Route path="/About" element={<About />} />
          <Route path="/MyMusicTrends" element={<MyMusicTrends />} />
          <Route path="/Profile" element={<ProfilePage profile={profile} onUpdate={handleProfileUpdate} />} />
          <Route path="/HelpSupport" element={<HelpSupportPage />} />

          {/* Sidebar routes */}
          <Route path="/LikedSongsPage" element={<LikedSongsPage />} />
          <Route path="/LikedEpisodesPage" element={<LikedEpisodesPage />} />
          <Route path="/PlaylistsPage" element={<PlaylistsPage />} />
          <Route path="/AlbumsPage" element={<AlbumsPage />} />
          <Route path="/ArtistsPage" element={<ArtistsPage />} />
          <Route path="/PodcastsPage" element={<PodcastsPage />} />

          {/* Detail page */}
          <Route path="/:type/:id" element={<DetailPage />} />
          <Route path="/TrackAlbumRatings/RateTrackOrAlbum" element={<RateTrackOrAlbum />} />
          <Route path="/TrackAlbumRatings/RateTrackOrAlbum/:type" element={<RateTrackOrAlbum />} />
          <Route path="/TrackAlbumRatings/RateTrackOrAlbum/:type/:id" element={<RateTrackOrAlbum />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
