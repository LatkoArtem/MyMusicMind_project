import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SpotifyIcon from "../../../icons/SpotifyIcon";

const MediaSidePanel = ({ item, type, onClose, lyrics, isLoadingLyrics, albumDetails }) => {
  const [topicsById, setTopicsById] = useState({});
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [infoTopics, setInfoTopics] = useState(null);
  const [errorTopics, setErrorTopics] = useState(null);
  const [requestsLeft, setRequestsLeft] = useState(null);
  const [resetInSec, setResetInSec] = useState(null);

  const isTrack = type === "track";
  const isEpisode = type === "episode";
  const trackId = item.id;

  const imageUrl = item.images?.[0]?.url || item.album?.images?.[0]?.url || albumDetails?.images?.[0]?.url;
  const albumName = item.album?.name || albumDetails?.name || "Unknown Album";
  const releaseDate = item.album?.release_date || albumDetails?.release_date || "Unknown";
  const artistNames = isTrack
    ? item.artists?.map((a) => a.name).join(", ") || "Unknown Artist"
    : isEpisode
    ? item.show?.name || albumDetails.publisher || "Unknown Show"
    : "Unknown";

  const formatResetTime = (seconds) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const fetchQuota = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8888/get_lyrics_quota", { withCredentials: true });
      if (res.data) {
        setRequestsLeft(res.data.requests_left);
        setResetInSec(res.data.reset_seconds);
      }
    } catch (e) {
      console.error("Failed to fetch quota", e);
    }
  }, []);

  const fetchExistingTopics = useCallback(async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8888/lyrics_topics/${trackId}`, { withCredentials: true });
      if (res.data?.topics?.length > 0) {
        setTopicsById((prev) => ({ ...prev, [trackId]: res.data.topics }));
      }
    } catch (e) {
      console.error("Failed to fetch existing topics", e);
    }
  }, [trackId]);

  const handleAnalyzeClick = async () => {
    if (!lyrics || lyrics.trim() === "") {
      setInfoTopics("Lyrics not available yet");
      setErrorTopics(null);
      return;
    }

    setLoadingTopics(true);
    setErrorTopics(null);
    setInfoTopics(null);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8888/analyze_lyrics",
        { lyrics, track_id: trackId },
        { withCredentials: true }
      );
      if (res.data.topics) {
        setTopicsById((prev) => ({
          ...prev,
          [trackId]: res.data.topics,
        }));
      }
      await fetchQuota();
    } catch (error) {
      if (error.response?.data?.error) {
        setErrorTopics(error.response.data.error);
      } else {
        setErrorTopics("Failed to fetch key topics");
      }
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    setErrorTopics(null);
    setInfoTopics(null);
    setLoadingTopics(false);

    if (trackId && isTrack) {
      if (!topicsById[trackId]) {
        fetchExistingTopics();
      }
      fetchQuota();
    }
  }, [trackId, lyrics, isTrack, topicsById, fetchExistingTopics, fetchQuota]);

  const showAnalyzeButton = isTrack && lyrics && lyrics.trim() !== "" && !loadingTopics && !topicsById[trackId];

  return (
    <div className="side-panel">
      <button className="close-button" onClick={onClose}>
        ×
      </button>

      {imageUrl && <img src={imageUrl} alt={item.name} className="details-cover" />}

      <div className="track-details">
        <h2>{item.name}</h2>
        <h3>{artistNames}</h3>

        <div className="track-meta">
          {isTrack && (
            <>
              <p>
                <strong>Album:</strong> {albumName}
              </p>
              <p>
                <strong>Release date:</strong> {releaseDate}
              </p>
              <p>
                <strong>Duration:</strong> {Math.floor(item.duration_ms / 60000)}:
                {String(Math.floor((item.duration_ms % 60000) / 1000)).padStart(2, "0")}
              </p>
            </>
          )}

          {isEpisode && (
            <>
              <p>
                <strong>Release date:</strong> {item.release_date}
              </p>
              <p className="episode-description">
                <strong>Description:</strong> {item.description}
              </p>
            </>
          )}
        </div>

        {item.external_urls?.spotify && (
          <a href={item.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="spotify-button">
            <SpotifyIcon />
            Open in Spotify
          </a>
        )}

        {isTrack && (
          <>
            <div className="lyrics-section">
              <h4>Lyrics</h4>
              {isLoadingLyrics ? (
                <div className="lyrics-text">🎵 Loading lyrics...</div>
              ) : lyrics && lyrics.trim() !== "" ? (
                <pre className="lyrics-text">
                  {lyrics.split("\n").map((line, idx) => (
                    <React.Fragment key={idx}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </pre>
              ) : (
                <div className="lyrics-text">Lyrics not available yet</div>
              )}
            </div>

            {showAnalyzeButton && (
              <div style={{ marginTop: "1rem" }}>
                <button
                  onClick={handleAnalyzeClick}
                  disabled={loadingTopics || (requestsLeft !== null && requestsLeft <= 0)}
                  className="analyze-button"
                >
                  {loadingTopics ? "Analyzing..." : "Show Thematic Words"}
                </button>
                {requestsLeft !== null && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: requestsLeft > 0 ? "green" : "red" }}>
                    {requestsLeft > 0
                      ? `Requests left today: ${requestsLeft}`
                      : `Daily limit reached. Next requests available in ${formatResetTime(resetInSec)}`}
                  </div>
                )}
              </div>
            )}

            <div className="lyrics-topics">
              {(loadingTopics || isLoadingLyrics) && null}
              {!loadingTopics && !isLoadingLyrics && infoTopics && <div style={{ color: "gray" }}>{infoTopics}</div>}
              {!loadingTopics && !isLoadingLyrics && errorTopics && <div style={{ color: "red" }}>{errorTopics}</div>}
              {!loadingTopics && !isLoadingLyrics && !errorTopics && !infoTopics && topicsById[trackId]?.length > 0 && (
                <div>
                  <strong>Key topics:</strong>{" "}
                  {topicsById[trackId].map((topic, idx) => (
                    <span key={idx} className="topic-word">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MediaSidePanel;
