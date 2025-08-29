import { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MyMusicMindLogo from "../images/MyMusicMindLogo2_crop.png";
import ProfileIcon from "../images/ProfileIcon.png";
import "./styles/Header.css";

const Header = ({ profile, onLogin, onLogout, loading }) => {
  const { t, i18n } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  };

  const closeSideMenu = () => setSideMenuOpen(false);

  const handleLanguageSwitch = async () => {
    const newLang = i18n.language === "en" ? "uk" : "en";
    i18n.changeLanguage(newLang);

    try {
      await fetch("http://127.0.0.1:8888/profile/set-language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ language: newLang }),
      });
    } catch (err) {
      console.error("Failed to update language:", err);
    }
  };

  useEffect(() => {
    if (profile?.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile, i18n]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="Navigation_bar">
        <div className="LeftHeaderSection">
          <button className="MenuToggleButton" onClick={() => setSideMenuOpen(true)} aria-label="Toggle menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="BarsSection"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5" />
            </svg>
          </button>

          <Link to="/">
            <img src={MyMusicMindLogo} alt="logo" className="MyMusicMindLogo" />
          </Link>
        </div>

        <ul>
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("home")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/TrackAlbumRatings" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("track_album_ratings")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/About" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("about")}
            </NavLink>
          </li>
          <li>
            <NavLink to="/Page5" className={({ isActive }) => (isActive ? "active" : "")}>
              {t("more")}
            </NavLink>
          </li>
        </ul>

        <div className="AuthSection">
          {loading ? null : profile ? (
            <div className="ProfileWrapper" ref={dropdownRef}>
              <img
                src={profile.images?.[0]?.url || ProfileIcon}
                alt="Profile"
                className="ProfileAvatar"
                onClick={toggleDropdown}
                style={{
                  width: "50px",
                  height: "50px",
                  filter: profile.images?.[0]?.url ? "none" : "brightness(0) invert(1)",
                }}
              />
              {dropdownOpen && (
                <div className="DropdownMenu">
                  <p className="ProfileName">
                    {profile.display_name} <span className="ProfileProduct">{profile.product}</span>
                  </p>
                  <p className="ProfileEmail">{profile.email}</p>
                  <hr className="DropdownDivider" />

                  <Link to="/Profile" className="DropdownMenuSection" onClick={() => setDropdownOpen(false)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="DropdownMenuSectionSVG"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                    <span className="DropdownMenuSectionText">{t("profile")}</span>
                  </Link>

                  {/* Language Switch Button */}
                  <div className="DropdownMenuSection" onClick={handleLanguageSwitch}>
                    <img
                      src="https://img.icons8.com/ios/50/globe--v1.png"
                      alt="globe"
                      style={{
                        width: "24px",
                        height: "24px",
                        objectFit: "contain",
                        filter: "invert(100%)",
                      }}
                    />
                    <span className="DropdownMenuSectionText">
                      {i18n.language === "en" ? t("switch_to_uk") : t("switch_to_en")}
                    </span>
                  </div>

                  <Link to="/HelpSupport" className="DropdownMenuSection" onClick={() => setDropdownOpen(false)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="DropdownMenuSectionSVG"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                      />
                    </svg>
                    <span className="DropdownMenuSectionText">{t("help_support")}</span>
                  </Link>

                  <hr className="DropdownDivider" />
                  <button className="LogoutButton" onClick={onLogout}>
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="LoginButton" onClick={onLogin}>
              {t("login")}
            </button>
          )}
        </div>
      </header>

      {sideMenuOpen && (
        <div className="SidebarOverlay" onClick={closeSideMenu}>
          <div className="Sidebar" onClick={(e) => e.stopPropagation()}>
            <button className="CloseSidebarButton" onClick={closeSideMenu} aria-label="Close sidebar">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="CloseIcon"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {profile ? (
              <ul className="SidebarNav">
                <li>
                  <NavLink to="/LikedSongsPage" onClick={closeSideMenu}>
                    {t("liked_songs")}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/LikedEpisodesPage" onClick={closeSideMenu}>
                    {t("liked_episodes")}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/PlaylistsPage" onClick={closeSideMenu}>
                    {t("playlists")}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/AlbumsPage" onClick={closeSideMenu}>
                    {t("albums")}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/ArtistsPage" onClick={closeSideMenu}>
                    {t("artists")}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/PodcastsPage" onClick={closeSideMenu}>
                    {t("podcasts")}
                  </NavLink>
                </li>
              </ul>
            ) : (
              <div className="SidebarMessage">
                <button className="LoginButton" onClick={onLogin}>
                  {t("login")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
