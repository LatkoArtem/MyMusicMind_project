import React from "react";
import SpotifyIcon from "../../../icons/SpotifyIcon";

const MediaSidePanel = ({ item, type, onClose, lyrics, isLoadingLyrics, albumDetails }) => {
  if (!item) return null;

  const isTrack = type === "track";
  const isEpisode = type === "episode";

  const imageUrl = item.images?.[0]?.url || item.album?.images?.[0]?.url || albumDetails?.images?.[0]?.url;

  const albumName = item.album?.name || albumDetails?.name || "Unknown Album";
  const releaseDate = item.album?.release_date || albumDetails?.release_date || "Unknown";
  const artistNames = isTrack
    ? item.artists?.map((a) => a.name).join(", ") || "Unknown Artist"
    : isEpisode
    ? item.show?.name || albumDetails.publisher || "Unknown Show"
    : "Unknown";

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
          <div className="lyrics-section">
            <h4>Lyrics</h4>
            {isLoadingLyrics ? (
              <div className="lyrics-text">🎵 Loading lyrics...</div>
            ) : (
              <pre className="lyrics-text">
                {lyrics?.split("\n").map((line, idx) => (
                  <React.Fragment key={idx}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaSidePanel;
