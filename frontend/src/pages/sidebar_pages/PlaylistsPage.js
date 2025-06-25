import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import "./styles/LikedSongsPage.css";

const PlaylistsPage = () => {
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
      .catch((err) => setError(err.response?.data || "Error fetching playlists"))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  return (
    <div className="page-container">
      <h1>Playlists</h1>
      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder="Search playlists..."
      />
      {isLoading ? (
        <div>Loading playlists...</div>
      ) : (
        <MediaList
          items={filteredPlaylists}
          viewMode={viewMode}
          onItemClick={(playlist) => navigate(`/playlists/${playlist.id}`)}
          getTitle={(playlist) => playlist.name}
          getSubtitle={(playlist) => `${playlist.tracks.total} tracks`}
          getImage={(playlist) => playlist.images?.[0]?.url}
        />
      )}
    </div>
  );
};

export default PlaylistsPage;
