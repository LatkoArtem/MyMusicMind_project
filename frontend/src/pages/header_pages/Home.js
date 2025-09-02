import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaList, FaHeart, FaCompactDisc, FaMusic, FaPodcast, FaPlayCircle, FaChartLine, FaCloud } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./styles/Home.css";

import quickRateImg from "../../images/quick_rate_album.png";
import quickRatingsImg from "../../images/quick_my_ratings.png";
import quickProfileImg from "../../images/quick_profile.png";
import quickTopsImg from "../../images/quick_tops.png";

import episodesImg from "../../images/episodes.png";
import podcastsImg from "../../images/podcasts.png";
import artistsImg from "../../images/artists.png";
import albumsImg from "../../images/albums.png";
import playlistsImg from "../../images/Playlists.png";
import likedSongsImg from "../../images/liked_songs.png";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetch("https://mymusicmind.netlify.app/profile", { credentials: "include" })
      .then((res) => setIsLoggedIn(res.status === 200))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const quickLinks = useMemo(
    () => [
      {
        title: t("quick.rate.title"),
        desc: t("quick.rate.desc"),
        to: "/TrackAlbumRatings/RateTrackOrAlbum",
        requiresAuth: true,
        img: quickRateImg,
      },
      {
        title: t("quick.myRatings.title"),
        desc: t("quick.myRatings.desc"),
        to: "/TrackAlbumRatings",
        requiresAuth: false, // доступно без логіну
        img: quickRatingsImg,
      },
      {
        title: t("quick.profile.title"),
        desc: t("quick.profile.desc"),
        to: "/Profile",
        requiresAuth: true,
        img: quickProfileImg,
      },
      {
        title: t("quick.tops.title"),
        desc: t("quick.tops.desc"),
        to: "/MyMusicTrends",
        requiresAuth: true,
        img: quickTopsImg,
      },
    ],
    [t]
  );

  const libraryLinks = useMemo(
    () => [
      {
        title: t("library.likedSongs.title"),
        desc: t("library.likedSongs.desc"),
        to: "/LikedSongsPage",
        requiresAuth: true,
        icon: <FaHeart size={28} />,
        img: likedSongsImg,
      },
      {
        title: t("library.playlists.title"),
        desc: t("library.playlists.desc"),
        to: "/PlaylistsPage",
        requiresAuth: true,
        icon: <FaList size={28} />,
        img: playlistsImg,
      },
      {
        title: t("library.albums.title"),
        desc: t("library.albums.desc"),
        to: "/AlbumsPage",
        requiresAuth: true,
        icon: <FaCompactDisc size={28} />,
        img: albumsImg,
      },
      {
        title: t("library.artists.title"),
        desc: t("library.artists.desc"),
        to: "/ArtistsPage",
        requiresAuth: true,
        icon: <FaMusic size={28} />,
        img: artistsImg,
      },
      {
        title: t("library.podcasts.title"),
        desc: t("library.podcasts.desc"),
        to: "/PodcastsPage",
        requiresAuth: true,
        icon: <FaPodcast size={28} />,
        img: podcastsImg,
      },
      {
        title: t("library.episodes.title"),
        desc: t("library.episodes.desc"),
        to: "/LikedEpisodesPage",
        requiresAuth: true,
        icon: <FaPlayCircle size={28} />,
        img: episodesImg,
      },
    ],
    [t]
  );

  const infoCards = [
    { title: t("feats.themes.title"), text: t("feats.themes.desc"), icon: <FaChartLine size={28} /> },
    { title: t("feats.audio.title"), text: t("feats.audio.desc"), icon: <FaMusic size={28} /> },
    { title: t("feats.spider.title"), text: t("feats.spider.desc"), icon: <FaChartLine size={28} /> },
    { title: t("feats.cache.title"), text: t("feats.cache.desc"), icon: <FaCloud size={28} /> },
  ];

  const handleNavigation = (to) => {
    if (isLoggedIn !== true) {
      if (to.startsWith("/TrackAlbumRatings/RateTrackOrAlbum")) {
        navigate("/TrackAlbumRatings");
        return;
      }

      if (to === "/TrackAlbumRatings") {
        navigate(to);
        return;
      }

      if (to === "/MyMusicTrends") {
        navigate(to);
        return;
      }

      setShowLoginModal(true);
      return;
    }
    navigate(to);
  };

  return (
    <div className="home-container">
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-text">
          <div className="hero-badge">{t("hero.badge")}</div>
          <h1 className="hero-title">
            {t("hero.welcome")} <br />
            <span className="hero-gradient-text">{t("hero.subtitle")}</span>
          </h1>
          <p className="hero-description">{t("hero.description")}</p>
          <div className="hero-buttons">
            <button
              onClick={() => handleNavigation("/TrackAlbumRatings/RateTrackOrAlbum", true)}
              className="btn-primary"
            >
              {t("buttons.startRating")}
            </button>
            <button onClick={() => handleNavigation("/TrackAlbumRatings", false)} className="btn-secondary">
              {t("buttons.myRatings")}
            </button>
            <button onClick={() => handleNavigation("/Profile", true)} className="btn-secondary">
              {t("buttons.profile")}
            </button>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="cards-section">
        <h2>{t("sections.quickActions")}</h2>
        <div className="cards-grid">
          {quickLinks.map((item) => (
            <button key={item.title} onClick={() => handleNavigation(item.to, item.requiresAuth)} className="card">
              <img src={item.img} alt={item.title} className="card-image" />
              <div className="card-title">{item.title}</div>
              <div className="card-desc">{item.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Library */}
      <section className="cards-section">
        <h2>{t("sections.library")}</h2>
        <div className="cards-grid">
          {libraryLinks.map((item) => (
            <button key={item.title} onClick={() => handleNavigation(item.to, item.requiresAuth)} className="card">
              <img src={item.img} alt={item.title} className="card-image" />
              <div className="card-icon">{item.icon}</div>
              <div className="card-title">{item.title}</div>
              <div className="card-desc">{item.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Modal */}
      {showLoginModal && (
        <div className="login-modal-overlay">
          <div className="login-modal">
            <p>{t("modal.loginRequired")}</p>
            <button className="login-modal-close-btn" onClick={() => setShowLoginModal(false)}>
              {t("modal.close")}
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <section className="cards-section">
        <h2>{t("sections.features")}</h2>
        <div className="cards-grid">
          {infoCards.map((info) => (
            <div key={info.title} className="card-inner">
              <div className="card-icon">{info.icon}</div>
              <div className="card-title">{info.title}</div>
              <div className="card-desc">{info.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
