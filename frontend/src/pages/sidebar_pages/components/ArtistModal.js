import SpotifyIcon from "../../../icons/SpotifyIcon";
import ModalPortal from "./ModalPortal";

const ArtistModal = ({ artistInfo, onClose }) => {
  if (!artistInfo) return null;

  return (
    <ModalPortal>
      <div className="artist-modal-overlay">
        <div className="artist-modal">
          <button className="close-button" onClick={onClose}>
            ×
          </button>
          {artistInfo.image && <img src={artistInfo.image} alt={artistInfo.name} className="artist-modal-image" />}
          <div className="artist-info-header">
            <h2 className="artist-modal-name">{artistInfo.name}</h2>
            {artistInfo.spotify_url && (
              <a href={artistInfo.spotify_url} target="_blank" rel="noopener noreferrer" className="spotify-button">
                <SpotifyIcon />
                Open in Spotify
              </a>
            )}
          </div>

          {artistInfo.followers && (
            <p className="artist-modal-followers">Followers: {artistInfo.followers.toLocaleString()}</p>
          )}
          {artistInfo.bio && <p className="artist-modal-bio">{artistInfo.bio}</p>}
        </div>
      </div>
    </ModalPortal>
  );
};

export default ArtistModal;
