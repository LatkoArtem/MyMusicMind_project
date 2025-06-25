import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import "./styles/LikedSongsPage.css";

const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { viewMode, changeViewMode } = useViewMode();

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/albums", { withCredentials: true })
      .then((res) => setAlbums(res.data.items || []))
      .catch((err) => setError(err.response?.data || "Error fetching albums"))
      .finally(() => setIsLoading(false));
  }, []);

  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  const filteredAlbums = albums.filter(
    (album) =>
      album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album.artists?.some((artist) => artist.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <h1>Albums</h1>
      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder="Search albums or artists..."
      />
      {isLoading ? (
        <div>Loading albums...</div>
      ) : (
        <MediaList
          items={filteredAlbums}
          viewMode={viewMode}
          onItemClick={(album) => navigate(`/albums/${album.id}`)}
          getTitle={(album) => album.name}
          getSubtitle={(album) => album.artists?.map((a) => a.name).join(", ")}
          getImage={(album) => album.images?.[0]?.url}
        />
      )}
    </div>
  );
};

export default AlbumsPage;
