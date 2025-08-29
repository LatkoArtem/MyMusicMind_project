import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import { useTranslation } from "react-i18next";
import "./styles/LikedSongsPage.css";

const PlaylistsPage = () => {
  const { t } = useTranslation();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { viewMode, changeViewMode } = useViewMode();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/playlists", { withCredentials: true })
      .then((res) => setPlaylists(res.data.items || []))
      .catch((err) => setError(err.response?.data || t("errorFetchingPlaylists")))
      .finally(() => setIsLoading(false));
  }, [t]);

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error)
    return (
      <div>
        {t("error")}: {JSON.stringify(error)}
      </div>
    );

  return (
    <div className="page-container">
      <h1>{t("playlists")}</h1>
      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder={t("searchPlaylists")}
      />
      {isLoading ? (
        <div>{t("loadingPlaylists")}...</div>
      ) : (
        <MediaList
          items={filteredPlaylists}
          viewMode={viewMode}
          onItemClick={(playlist) => navigate(`/playlists/${playlist.id}`)}
          getTitle={(playlist) => playlist.name}
          getSubtitle={(playlist) => `${playlist.tracks.total} ${t("tracks-m")}`}
          getImage={(playlist) => playlist.images?.[0]?.url}
        />
      )}
    </div>
  );
};

export default PlaylistsPage;
