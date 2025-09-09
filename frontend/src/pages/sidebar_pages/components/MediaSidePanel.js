import React, { useState, useEffect, useCallback } from "react";
import "../styles/MediaSidePanel.css";
import axios from "axios";
import SpotifyIcon from "../../../icons/SpotifyIcon";
import { useTranslation } from "react-i18next";

const MediaSidePanel = ({ item, type, onClose, lyrics, isLoadingLyrics, albumDetails }) => {
  const { t } = useTranslation();

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
  const albumName = item.album?.name || albumDetails?.name || t("unknownAlbum");
  const releaseDate = item.album?.release_date || albumDetails?.release_date || t("unknown");
  const artistNames = isTrack
    ? item.artists?.map((a) => a.name).join(", ") || t("unknownArtist")
    : isEpisode
    ? item.show?.name || albumDetails.publisher || t("unknownShow")
    : t("unknown");

  const formatResetTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (num) => String(num).padStart(2, "0");

    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const fetchQuota = useCallback(async () => {
    try {
      const res = await axios.get("https://mymusicmind-9gke.onrender.com/get_lyrics_quota", {
        withCredentials: true,
      });
      if (res.data) {
        setRequestsLeft(res.data.requests_left);
        setResetInSec(res.data.reset_seconds);
      }
    } catch (e) {
      console.error("Failed to fetch quota", e);
    }
  }, []);

  const fetchExistingTopics = useCallback(async () => {
    setLoadingTopics(true);
    try {
      const res = await axios.get(`https://mymusicmind-9gke.onrender.com/lyrics_topics/${trackId}`, {
        withCredentials: true,
      });

      if (res.data?.topics?.length > 0) {
        setTopicsById((prev) => ({ ...prev, [trackId]: res.data.topics }));
      } else if (res.data?.cached === true) {
        setTopicsById((prev) => ({ ...prev, [trackId]: [] }));
      }
    } catch (e) {
      console.error("Failed to fetch existing topics", e);
    } finally {
      setLoadingTopics(false);
    }
  }, [trackId]);

  const handleAnalyzeClick = async () => {
    if (!lyrics || lyrics.trim() === "") {
      setInfoTopics(t("lyricsNotAvailable"));
      setErrorTopics(null);
      return;
    }

    setLoadingTopics(true);
    setErrorTopics(null);
    setInfoTopics(null);

    try {
      const res = await axios.post(
        "https://mymusicmind-9gke.onrender.com/analyze_lyrics",
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
        setErrorTopics(t("failedFetchKeyTopics"));
      }
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    const hasTopics = topicsById[trackId]?.length > 0;
    const topicsNotLoaded = topicsById[trackId] === undefined || topicsById[trackId] === null;

    const run = async () => {
      setErrorTopics(null);
      setInfoTopics(null);

      if (trackId && isTrack && topicsNotLoaded && lyrics?.trim()) {
        await fetchExistingTopics();

        if (!hasTopics) {
          await fetchQuota();
        }
      }
    };

    run();
  }, [trackId, isTrack, lyrics, fetchExistingTopics, fetchQuota, topicsById]);

  useEffect(() => {
    const topicsMissing = !topicsById[trackId] || topicsById[trackId].length === 0;

    if (!isTrack || !trackId || !topicsMissing) return;

    fetchQuota();

    const interval = setInterval(() => {
      fetchQuota();
    }, 30000);

    return () => clearInterval(interval);
  }, [isTrack, trackId, topicsById, fetchQuota]);

  useEffect(() => {
    if (resetInSec === null || resetInSec <= 0) return;

    const timer = setInterval(() => {
      setResetInSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resetInSec]);

  const showAnalyzeButton =
    isTrack &&
    lyrics &&
    lyrics.trim() !== "" &&
    !loadingTopics &&
    (!topicsById[trackId] || topicsById[trackId].length === 0) &&
    requestsLeft !== null &&
    requestsLeft > 0;

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
                <strong>{t("album")}:</strong> {albumName}
              </p>
              <p>
                <strong>{t("releaseDate")}:</strong> {releaseDate}
              </p>
              <p>
                <strong>{t("duration")}:</strong> {Math.floor(item.duration_ms / 60000)}:
                {String(Math.floor((item.duration_ms % 60000) / 1000)).padStart(2, "0")}
              </p>
            </>
          )}

          {isEpisode && (
            <>
              <p>
                <strong>{t("releaseDate")}:</strong> {item.release_date}
              </p>
              <p className="episode-description">
                <strong>{t("description")}:</strong> {item.description}
              </p>
            </>
          )}
        </div>

        {item.external_urls?.spotify && (
          <a href={item.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="spotify-button">
            <SpotifyIcon />
            {t("openInSpotify")}
          </a>
        )}

        {isTrack && (
          <>
            <div className="lyrics-section">
              <h4>{t("lyrics")}</h4>
              {isLoadingLyrics ? (
                <div className="lyrics-text">🎵 {t("loadingLyrics")}</div>
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
                <div className="lyrics-text">{t("lyricsNotAvailable")}</div>
              )}
            </div>

            {showAnalyzeButton && (
              <>
                <button onClick={handleAnalyzeClick} disabled={loadingTopics} className="analyze-button">
                  {loadingTopics ? t("analyzing-dots") : t("showKeyTopics")}
                </button>
                <div style={{ marginTop: "0.5rem", paddingBottom: "2rem", fontSize: "0.9rem", color: "green" }}>
                  {t("requestsLeftToday")}: {requestsLeft}
                </div>
              </>
            )}

            {isTrack &&
              lyrics &&
              lyrics.trim() !== "" &&
              requestsLeft !== null &&
              requestsLeft <= 0 &&
              !loadingTopics &&
              !isLoadingLyrics &&
              (!topicsById[trackId] || topicsById[trackId].length === 0) && (
                <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "red" }}>
                  {t("dailyLimitExceeded")}: {formatResetTime(resetInSec)}
                </div>
              )}

            <div className="lyrics-topics">
              {(loadingTopics || isLoadingLyrics) && null}
              {!loadingTopics && !isLoadingLyrics && infoTopics && <div style={{ color: "gray" }}>{infoTopics}</div>}
              {!loadingTopics && !isLoadingLyrics && errorTopics && <div style={{ color: "red" }}>{errorTopics}</div>}
              {!loadingTopics && !isLoadingLyrics && !errorTopics && !infoTopics && topicsById[trackId]?.length > 0 && (
                <div>
                  <strong>{t("keyTopics")}:</strong>{" "}
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
