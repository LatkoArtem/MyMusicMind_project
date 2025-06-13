import { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import MyMusicMindLogo from "../src/images/MyMusicMindLogo2_crop.png";
import ProfileIcon from "../src/images/ProfileIcon.png";
import "./Header.css";

const Header = ({ profile, onLogin, onLogout, loading }) => {
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
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/Page2" className={({ isActive }) => (isActive ? "active" : "")}>
              Hello world
            </NavLink>
          </li>
          <li>
            <NavLink to="/Page3" className={({ isActive }) => (isActive ? "active" : "")}>
              Contacts
            </NavLink>
          </li>
          <li>
            <NavLink to="/Page4" className={({ isActive }) => (isActive ? "active" : "")}>
              About
            </NavLink>
          </li>
          <li>
            <NavLink to="/Page5" className={({ isActive }) => (isActive ? "active" : "")}>
              More
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
                    <span className="DropdownMenuSectionText">Profile</span>
                  </Link>
                  <div className="DropdownMenuSection">
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
                        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span className="DropdownMenuSectionText">Settings</span>
                  </div>
                  <div className="DropdownMenuSection">
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
                    <span className="DropdownMenuSectionText">Help & Support</span>
                  </div>
                  <hr className="DropdownDivider" />
                  <button className="LogoutButton" onClick={onLogout}>
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="LoginButton" onClick={onLogin}>
              Log in with Spotify
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
                    Liked songs
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/LikedEpisodesPage" onClick={closeSideMenu}>
                    Liked episodes
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/PlaylistsPage" onClick={closeSideMenu}>
                    Playlists
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/AlbumsPage" onClick={closeSideMenu}>
                    Albums
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/ArtistsPage" onClick={closeSideMenu}>
                    Artists
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/PodcastsPage" onClick={closeSideMenu}>
                    Podcasts
                  </NavLink>
                </li>
              </ul>
            ) : (
              <div className="SidebarMessage">
                <button className="LoginButton" onClick={onLogin}>
                  Log in with Spotify
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
