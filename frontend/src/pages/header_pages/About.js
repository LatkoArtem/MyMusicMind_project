import "./styles/About.css";
import { useTranslation } from "react-i18next";

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="about-wrapper">
      <nav className="about-sidebar">
        <ul>
          <li>
            <a href="#about-platform">{t("about_platform")}</a>
          </li>
          <li>
            <a href="#features">{t("features")}</a>
          </li>
          <li>
            <a href="#technologies">{t("technologies")}</a>
          </li>
          <li>
            <a href="#mission">{t("mission")}</a>
          </li>
          <li>
            <a href="#team">{t("team")}</a>
          </li>
          <li>
            <a href="#contacts">{t("contacts")}</a>
          </li>
        </ul>
      </nav>

      <div className="about-container">
        <h1 className="about-title">{t("about_mymusicmind")}</h1>

        <section id="about-platform" className="about-section">
          <h2 className="section-title">{t("about_platform")}</h2>
          <p className="section-text">{t("about_platform_text1")}</p>
          <p className="section-text">{t("about_platform_text2")}</p>
        </section>

        <section id="features" className="about-section">
          <h2 className="section-title">{t("features")}</h2>
          <ul className="features-list">
            <li>{t("feature_album_analysis")}</li>
            <li>{t("feature_lyrics_analysis")}</li>
            <li>{t("feature_genius_lyrics")}</li>
            <li>{t("feature_clustering")}</li>
            <li>{t("feature_artist_album_pages")}</li>
            <li>{t("feature_full_album_pages")}</li>
            <li>{t("feature_playlist_pages")}</li>
            <li>{t("feature_liked_songs")}</li>
            <li>{t("feature_recommendations")}</li>
            <li>{t("feature_responsive_sidebar")}</li>
            <li>{t("feature_spotify_auth")}</li>
          </ul>
        </section>

        <section id="technologies" className="about-section">
          <h2 className="section-title">{t("technologies")}</h2>
          <div className="tech-logos">
            <div className="tech-item">
              <a href="https://developer.spotify.com/documentation/web-api/" target="_blank" rel="noopener noreferrer">
                Spotify API
              </a>
            </div>
            <div className="tech-item">
              <a href="https://docs.genius.com/" target="_blank" rel="noopener noreferrer">
                Genius API
              </a>
            </div>
            <div className="tech-item">
              <a href="https://www.last.fm/api" target="_blank" rel="noopener noreferrer">
                Last.fm API
              </a>
            </div>
            <div className="tech-item">
              <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
                React
              </a>
            </div>
            <div className="tech-item">
              <a href="https://flask.palletsprojects.com/" target="_blank" rel="noopener noreferrer">
                Flask
              </a>
            </div>
            <div className="tech-item">
              <a href="https://www.python.org/" target="_blank" rel="noopener noreferrer">
                Python
              </a>{" "}
              /{" "}
              <a href="https://scikit-learn.org/" target="_blank" rel="noopener noreferrer">
                Machine Learning
              </a>
            </div>
            <div className="tech-item">
              <a href="https://www.postgresql.org/" target="_blank" rel="noopener noreferrer">
                PostgreSQL
              </a>
            </div>
          </div>
        </section>

        <section id="mission" className="about-section">
          <h2 className="section-title">{t("mission")}</h2>
          <p className="section-text">{t("mission_text1")}</p>
          <p className="section-text">{t("mission_text2")}</p>
        </section>

        <section id="team" className="about-section">
          <h2 className="section-title">{t("team")}</h2>
          <p className="section-text">{t("team_text")}</p>
        </section>

        <section id="contacts" className="about-section">
          <h2 className="section-title">{t("contacts")}</h2>
          <p className="contact-section">{t("email")}: latko8973@gmail.com</p>
          <p className="contact-section">
            GitHub:{" "}
            <a href="https://github.com/LatkoArtem" target="_blank" rel="noopener noreferrer">
              https://github.com/LatkoArtem
            </a>
          </p>
          <p className="contact-section">
            LinkedIn:{" "}
            <a href="https://www.linkedin.com/in/artem-latko-97414a31b" target="_blank" rel="noopener noreferrer">
              https://www.linkedin.com/in/artem-latko-97414a31b
            </a>
          </p>
          <p className="contact-section">
            Instagram:{" "}
            <a href="https://instagram.com/l.artem.3" target="_blank" rel="noopener noreferrer">
              @l.artem.3
            </a>
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
