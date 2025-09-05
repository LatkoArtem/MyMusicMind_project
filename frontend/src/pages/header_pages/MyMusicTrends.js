import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MediaSidePanel from "../sidebar_pages/components/MediaSidePanel";
import SpotifyIcon from "../../icons/SpotifyIcon";
import { fetchLyrics } from "../sidebar_pages/utils/fetchLyrics";
import RecommendationsButton from "./components/RecommendationsButton";
import "./styles/MyMusicTrends.css";
import "../sidebar_pages/styles/MediaSidePanel.css";

const MyMusicTrends = () => {
  const { t } = useTranslation();
  const [profileData, setProfileData] = useState(null);
  const [spotifyAccessToken, setSpotifyAccessToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [period, setPeriod] = useState("short_term");
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedTrack, setSelectedTrack] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const PERIODS = [
    { label: t("period_short_term"), value: "short_term" },
    { label: t("period_medium_term"), value: "medium_term" },
    { label: t("period_long_term"), value: "long_term" },
  ];

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (res.status === 200) {
          const data = await res.json();
          setProfileData(data);
          setSpotifyAccessToken(data.spotifyAccessToken);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !spotifyAccessToken) return;

    const fetchTop = async () => {
      setLoading(true);
      try {
        const [artistsRes, tracksRes] = await Promise.all([
          fetch(`/api/spotify/top-artists?time_range=${period}&limit=20`, {
            credentials: "include",
          }),
          fetch(`/api/spotify/top-tracks?time_range=${period}&limit=50`, {
            credentials: "include",
          }),
        ]);

        const artistsData = await artistsRes.json();
        const tracksData = await tracksRes.json();

        setTopArtists(artistsData.items || []);
        setTopTracks(tracksData.items || []);
      } catch (err) {
        console.error(err);
        setTopArtists([]);
        setTopTracks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTop();
  }, [period, isLoggedIn, spotifyAccessToken]);

  const tracksSection = loading ? (
    <div>{t("loading_trends")}</div>
  ) : (
    <section className="trends-section trends-tracks">
      <h3>{t("top_tracks")}</h3>
      <ul>
        {topTracks.map((track, index) => (
          <li
            key={track.id}
            className="track-item"
            onClick={() => {
              setSelectedTrack(track);
              fetchLyrics(track, setLyrics, setIsLoadingLyrics);
            }}
          >
            <span className="track-rank">{index + 1}</span>
            <img src={track.album?.images?.[0]?.url} alt={track.name} className="track-thumb" />
            <span className="trend-track-name">
              {track.name} – {track.artists.map((a) => a.name).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  const artistsSection = loading ? null : (
    <section className="trends-section trends-artists">
      <h3>{t("top_artists")}</h3>
      <ul>
        {topArtists.map((artist, index) => (
          <li key={artist.id} className="artist-item">
            <span className="artist-rank">{index + 1}</span>
            <img src={artist.images?.[0]?.url} alt={artist.name} className="artist-thumb" />
            <div className="artist-info">
              <span className="artist-name">{artist.name}</span>
              {artist.external_urls?.spotify && (
                <a
                  href={artist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="spotify-button"
                >
                  <SpotifyIcon />
                  {t("openInSpotify")}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <>
      <div className="trends-page">
        {isCheckingAuth ? (
          <div style={{ textAlign: "center" }}>{t("loading_trends")}</div>
        ) : !isLoggedIn ? (
          <div style={{ textAlign: "center" }}>{t("login_prompt_trends")}</div>
        ) : (
          <>
            <h2>{t("my_top_music")}</h2>
            <div className="trends-periods">
              {PERIODS.map((p) => (
                <button key={p.value} onClick={() => setPeriod(p.value)} className={period === p.value ? "active" : ""}>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="trends-container">
              {artistsSection}
              {tracksSection}
            </div>

            <h2>{t("recommendations")}</h2>
            {profileData && spotifyAccessToken && (
              <RecommendationsButton
                userId={profileData.id}
                topTracks={topTracks.slice(0, 25)}
                topArtists={topArtists.slice(0, 10)}
                spotifyAccessToken={spotifyAccessToken}
              />
            )}
          </>
        )}
      </div>

      {/* SidePanel винесений окремо */}
      {selectedTrack && (
        <MediaSidePanel
          item={selectedTrack}
          type="track"
          onClose={() => {
            setSelectedTrack(null);
            setLyrics(null);
          }}
          lyrics={lyrics}
          isLoadingLyrics={isLoadingLyrics}
        />
      )}
    </>
  );
};

export default MyMusicTrends;
