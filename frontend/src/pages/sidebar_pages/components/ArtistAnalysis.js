import { useState } from "react";
import axios from "axios";
import ArtistModal from "./ArtistModal";
import "../styles/ArtistAnalysis.css";

const ArtistAnalysis = ({ similarArtists, isSimilarLoading }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [artistInfo, setArtistInfo] = useState(null);

  const openModal = async (artistId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8888/artist_info/id/${artistId}`, {
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
    return <p className="loading-text">Loading similar artists...</p>;
  }

  if (Array.isArray(similarArtists) && similarArtists.length === 0) {
    return <p>No similar artists found.</p>;
  }

  return (
    <>
      <div className="similar-artists-grid">
        {similarArtists.map((artist) => (
          <div key={artist.id} className="artist-card">
            <img src={artist.image || "/placeholder.jpg"} alt={artist.name} className="artist-image" />
            <p className="artist-name">{artist.name}</p>
            <button className="artist-info-button" onClick={() => openModal(artist.id)}>
              About the artist
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && artistInfo && <ArtistModal artistInfo={artistInfo} onClose={closeModal} />}
    </>
  );
};

export default ArtistAnalysis;
