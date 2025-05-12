import { Link } from "react-router-dom";
import MyMusicMindLogo from "../src/images/MyMusicMindLogo.png";
import "./Header.css";

const Header = ({ profile, onLogin, onLogout }) => {
  return (
    <header className="Navigation_bar">
      <img src={MyMusicMindLogo} alt="logo" height="100" />

      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
      </ul>

      <div className="AuthSection">
        {profile ? (
          <>
            <p>
              Logged in as: <strong>{profile.display_name || profile.email}</strong>
            </p>
            <button className="HeaderButton" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="HeaderButton" onClick={onLogin}>
              Log in with Spotify
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
