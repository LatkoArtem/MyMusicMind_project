import axios from "axios";
import { useEffect, useState } from "react";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import MediaSidePanel from "./components/MediaSidePanel";
import { fetchLyrics } from "./utils/fetchLyrics";
import "./styles/LikedSongsPage.css";

const LikedSongsPage = () => {
  const [likedSongs, setLikedSongs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const { viewMode, changeViewMode } = useViewMode();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/liked-songs", { withCredentials: true })
      .then((res) => setLikedSongs(res.data))
      .catch((err) => setError(err.response?.data || "Error fetching liked songs"))
      .finally(() => setIsLoading(false));
  }, []);

  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  const filteredSongs =
    likedSongs?.items.filter(
      ({ track }) =>
        track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artists.some((artist) => artist.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  return (
    <div className="page-container">
      <h1>Liked Songs</h1>

      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder="Search tracks or artists..."
      />

      {isLoading ? (
        <div className="loading-message">Loading liked songs...</div>
      ) : (
        <MediaList
          items={filteredSongs.map(({ track }) => track)}
          viewMode={viewMode}
          onItemClick={(track) => {
            setSelectedTrack(track);
            fetchLyrics(track, setLyrics, setIsLoadingLyrics);
          }}
          getImage={(track) => track.album.images?.[0]?.url}
          getTitle={(track) => track.name}
          getSubtitle={(track) => track.artists.map((a) => a.name).join(", ")}
        />
      )}

      {selectedTrack && (
        <MediaSidePanel
          item={selectedTrack}
          type="track"
          onClose={() => {
            setSelectedTrack(null);
            setLyrics(null);
          }}
          lyrics={lyrics}
          isLoadingLyrics={isLoadingLyrics}
        />
      )}
    </div>
  );
};

export default LikedSongsPage;
