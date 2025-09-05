import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import useViewMode from "./hooks/useGridListToggle";
import { useTranslation } from "react-i18next";
import "./styles/LikedSongsPage.css";
import axios from "axios";

const ArtistsPage = () => {
  const { t } = useTranslation();

  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const { viewMode, changeViewMode } = useViewMode();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/artists", { withCredentials: true })
      .then((res) => setArtists(res.data.items || []))
      .catch((err) => setError(err.response?.data || t("errorFetchingArtists")))
      .finally(() => setIsLoading(false));
  }, [t]);

  const filteredArtists = artists.filter((a) => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (error)
    return (
      <div>
        {t("error")}: {JSON.stringify(error)}
      </div>
    );

  return (
    <div className="page-container">
      <h1>{t("artists")}</h1>
      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder={t("searchArtists")}
      />
      {isLoading ? (
        <div>{t("loadingArtists")}</div>
      ) : (
        <MediaList
          items={filteredArtists}
          viewMode={viewMode}
          onItemClick={(artist) => navigate(`/artists/${artist.id}`)}
          getTitle={(artist) => artist.name}
          getSubtitle={(artist) => `${t("followers")}: ${artist.followers?.total?.toLocaleString() || "0"}`}
          getImage={(artist) => artist.images?.[0]?.url}
          type="artist"
        />
      )}
    </div>
  );
};

export default ArtistsPage;
