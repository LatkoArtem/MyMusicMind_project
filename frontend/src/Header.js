import { Link } from "react-router-dom";
import MyMusicMindLogo from "../src/images/MyMusicMindLogo.png";

const Header = () => {
  return (
    <main>
      <nav className="Navigation_bar">
        <img src={MyMusicMindLogo} alt="littleLemonLogo" />
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
};

export default Header;
