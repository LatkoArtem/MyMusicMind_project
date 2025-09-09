import { useState } from "react";
import axios from "axios";
import ArtistModal from "./ArtistModal";
import { useTranslation } from "react-i18next";
import "../styles/ArtistAnalysis.css";

const ArtistAnalysis = ({ similarArtists, isSimilarLoading }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [artistInfo, setArtistInfo] = useState(null);

  const openModal = async (artistId) => {
    try {
      const res = await axios.get(`https://mymusicmind-9gke.onrender.com/artist_info/id/${artistId}`, {
        withCredentials: true,
      });
      setArtistInfo(res.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("❌ Error fetching artist info:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setArtistInfo(null);
  };

  if (isSimilarLoading || similarArtists === null || similarArtists === undefined) {
    return <p className="loading-text">{t("loadingSimilarArtists")}</p>;
  }

  if (Array.isArray(similarArtists) && similarArtists.length === 0) {
    return <p>{t("noSimilarArtists")}</p>;
  }

  return (
    <>
      <div className="similar-artists-grid">
        {similarArtists.map((artist) => (
          <div key={artist.id} className="artist-card">
            <img src={artist.image || "/placeholder.jpg"} alt={artist.name} className="artist-image" />
            <p className="artist-name">{artist.name}</p>
            <button className="artist-info-button" onClick={() => openModal(artist.id)}>
              {t("aboutArtist")}
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && artistInfo && <ArtistModal artistInfo={artistInfo} onClose={closeModal} />}
    </>
  );
};

export default ArtistAnalysis;
