import { useState } from "react";
import { useTranslation } from "react-i18next"; // <-- імпорт
import { fetchRecommendations } from "../utils/fetchRecommendations";
import SpotifyIcon from "../../../icons/SpotifyIcon";
import SidePanelWrapper from "./SidePanelWrapper";
import { fetchLyrics } from "../../sidebar_pages/utils/fetchLyrics";
import "../styles/RecommendationsButton.css";

const RecommendationsButton = ({ userId, topTracks, topArtists, spotifyAccessToken }) => {
  const { t } = useTranslation(); // <-- використання хука
  const [recommendations, setRecommendations] = useState(() => {
    const saved = localStorage.getItem("recommendations");
    return saved ? JSON.parse(saved) : { tracks: [], artists: [] };
  });
  const [lastUpdated, setLastUpdated] = useState(() => {
    const saved = localStorage.getItem("recommendationsLastUpdated");
    return saved ? new Date(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  const handleClick = async () => {
    if (!userId || !spotifyAccessToken) return;

    setLoading(true);
    try {
      const data = await fetchRecommendations(userId, topTracks, topArtists, spotifyAccessToken);

      const uniqueTracks = Array.from(new Map((data.tracks || []).map((t) => [t.id, t])).values());
      const uniqueArtists = Array.from(new Map((data.artists || []).map((a) => [a.id, a])).values());

      setRecommendations({ tracks: uniqueTracks, artists: uniqueArtists });
      const now = new Date();
      setLastUpdated(now);

      localStorage.setItem("recommendations", JSON.stringify({ tracks: uniqueTracks, artists: uniqueArtists }));
      localStorage.setItem("recommendationsLastUpdated", now.toISOString());
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const tracksSection = recommendations.tracks.length > 0 && (
    <section className="trends-section trends-tracks">
      <h4>{t("recommendedTracks")}</h4>
      <ul>
        {recommendations.tracks.map((track, index) => (
          <li
            key={track.id}
            className="track-item"
            onClick={() => {
              setSelectedTrack(track);
              fetchLyrics(track, setLyrics, setIsLoadingLyrics);
            }}
          >
            <span className="track-rank">{index + 1}</span>
            <img
              src={track.album?.images?.[0]?.url}
              alt={track.name}
              className="recommendations-track-thumb track-thumb"
            />
            <span className="recommendations-track-name trend-track-name">
              {track.name} – {track.artists.map((a) => a.name).join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  const artistsSection = recommendations.artists.length > 0 && (
    <section className="trends-section trends-artists">
      <h4>{t("recommendedArtists")}</h4>
      <ul>
        {recommendations.artists.map((artist, index) => (
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
                  className="recommendations-spotify-button spotify-button"
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
      <div className="recommendations-container">
        <div className="recommendations-header">
          <button className="trends-periods-button" onClick={handleClick} disabled={loading}>
            {loading ? t("loading-recs") : t("getRecommendations")}
          </button>
          {lastUpdated && (
            <span className="recommendations-timestamp">
              {t("lastUpdate")}: {lastUpdated.toLocaleString()}
            </span>
          )}
        </div>

        {tracksSection}
        {artistsSection}
      </div>

      {selectedTrack && (
        <SidePanelWrapper
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

export default RecommendationsButton;
