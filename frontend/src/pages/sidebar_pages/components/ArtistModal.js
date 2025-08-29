import SpotifyIcon from "../../../icons/SpotifyIcon";
import ModalPortal from "./ModalPortal";
import { useTranslation } from "react-i18next";

const ArtistModal = ({ artistInfo, onClose }) => {
  const { t } = useTranslation();

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
                {t("openInSpotify")}
              </a>
            )}
          </div>

          {artistInfo.followers && (
            <p className="artist-modal-followers">
              {t("followers")}: {artistInfo.followers.toLocaleString()}
            </p>
          )}

          {artistInfo.bio && <p className="artist-modal-bio">{artistInfo.bio}</p>}
        </div>
      </div>
    </ModalPortal>
  );
};

export default ArtistModal;
