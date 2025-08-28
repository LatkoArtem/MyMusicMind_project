import "./styles/About.css";

const AboutPage = () => {
  return (
    <div className="about-wrapper">
      <nav className="about-sidebar">
        <ul>
          <li>
            <a href="#about-platform">About the Platform</a>
          </li>
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#technologies">Technologies</a>
          </li>
          <li>
            <a href="#mission">Mission</a>
          </li>
          <li>
            <a href="#team">Who is Behind the Project</a>
          </li>
          <li>
            <a href="#contacts">Contacts</a>
          </li>
        </ul>
      </nav>

      <div className="about-container">
        <h1 className="about-title">About MyMusicMind</h1>

        <section id="about-platform" className="about-section">
          <h2 className="section-title">About the Platform</h2>
          <p className="section-text">
            MyMusicMind is a modern platform for analyzing users' music preferences. Here you can explore your musical
            taste, get recommendations, and discover new music trends around the world. The platform integrates Spotify
            and Genius data to analyze both music preferences and song lyrics in depth.
          </p>
          <p className="section-text">
            Advanced machine learning methods and the Last.fm API are used to build personalized recommendations and
            visualize music preferences in an interactive format.
          </p>
        </section>

        <section id="features" className="about-section">
          <h2 className="section-title">Features</h2>
          <ul className="features-list">
            <li>Detailed album analysis with audio feature visualization</li>
            <li>Semantic analysis of song lyrics and thematic detection</li>
            <li>Fetching and displaying lyrics using the Genius API</li>
            <li>Clustering of album and playlist tracks on an interactive scatter plot</li>
            <li>Artist, album, and podcast pages with detailed information</li>
            <li>Full album pages with access to tracks</li>
            <li>Playlist pages with the ability to explore included tracks</li>
            <li>Liked songs page with search and adaptive display</li>
            <li>Personalized music recommendations</li>
            <li>Responsive sidebar navigation</li>
            <li>Stable Spotify authorization process</li>
          </ul>
        </section>

        <section id="technologies" className="about-section">
          <h2 className="section-title">Technologies</h2>
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
          <h2 className="section-title">Mission</h2>
          <p className="section-text">
            MyMusicMind is built to help users better understand their music taste, discover new songs and artists, and
            enjoy exploring global music trends.
          </p>
          <p className="section-text">
            Our goal is to combine music data, analytics, and innovative tools to create a unique experience for every
            user.
          </p>
        </section>

        <section id="team" className="about-section">
          <h2 className="section-title">Who is Behind the Project</h2>
          <p className="section-text">
            This project is developed solely by me — a developer combining backend, frontend, and elements of data
            analytics and data science to build a complete music analysis platform.
          </p>
        </section>

        <section id="contacts" className="about-section">
          <h2 className="section-title">Contacts</h2>
          <p className="contact-section"> Email: latko8973@gmail.com</p>
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
