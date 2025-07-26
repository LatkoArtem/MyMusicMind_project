import AlbumOrPlaylistAnalysis from "./AlbumOrPlaylistAnalysis";
import SpotifyIcon from "../../../icons/SpotifyIcon";

const ItemOverview = ({
  image,
  title,
  analysisLabel,
  onBack,
  badges,
  backLabel,
  imageClassName = "",
  meanFeatures,
  consistencyScore,
  spotifyUrl,
  trackFeatures = [],
  trackNames = [],
  trackClusters = [],
  isLoading = false,
}) => {
  return (
    <div className="playlist-overview">
      <button className="back-button" onClick={onBack}>
        ⬅ Back to {backLabel}
      </button>

      {isLoading ? (
        <div className="loading-analysis">
          <p>Analyzing {analysisLabel === "albums" ? "album" : "playlist"}...</p>
        </div>
      ) : (
        <div className="playlist-header">
          <div className="playlist-left">
            {image && <img src={image} alt={title} className={`album-cover ${imageClassName}`} />}
            <div className="playlist-badges">
              {badges.map(({ label, value }) => (
                <div className="badge" key={label}>
                  <span className="badge-label">{label}</span>
                  <p>{value}</p>
                </div>
              ))}
            </div>
            {spotifyUrl && (
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="spotify-button">
                <SpotifyIcon />
                Open in Spotify
              </a>
            )}
          </div>

          <div className="playlist-right">
            <h2 className="playlist-info-title">{title}</h2>
            {analysisLabel === "albums" || analysisLabel === "playlists" ? (
              meanFeatures ? (
                <AlbumOrPlaylistAnalysis
                  analysisLabel="album"
                  MeanFeatures={meanFeatures}
                  consistencyScore={consistencyScore}
                  trackFeatures={trackFeatures}
                  trackNames={trackNames}
                  trackClusters={trackClusters}
                />
              ) : (
                <p></p>
              )
            ) : (
              <p className="playlist-analysis">{analysisLabel}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemOverview;
