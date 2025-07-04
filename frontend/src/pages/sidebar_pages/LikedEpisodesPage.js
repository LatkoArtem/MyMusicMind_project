import axios from "axios";
import { useEffect, useState } from "react";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import MediaSidePanel from "./components/MediaSidePanel";
import "./styles/LikedSongsPage.css";

const LikedEpisodesPage = () => {
  const [likedEpisodes, setLikedEpisodes] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { viewMode, changeViewMode } = useViewMode();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/my-episodes", { withCredentials: true })
      .then((res) => setLikedEpisodes(res.data))
      .catch((err) => setError(err.response?.data || "Error fetching liked episodes"));
  }, []);

  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  const filteredEpisodes =
    likedEpisodes?.items
      ?.filter((episode) => episode && episode.name && episode.show && episode.images?.length > 0)
      .filter((episode) => {
        const episodeName = episode.name.toLowerCase();
        const showName = episode.show.name.toLowerCase();
        return episodeName.includes(searchTerm.toLowerCase()) || showName.includes(searchTerm.toLowerCase());
      }) || [];

  return (
    <div className="page-container">
      <h1>Liked Episodes</h1>

      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder="Search episodes or shows..."
      />

      {!likedEpisodes ? (
        <div>Loading liked episodes...</div>
      ) : (
        <MediaList
          items={filteredEpisodes}
          viewMode={viewMode}
          onItemClick={setSelectedEpisode}
          getImage={(ep) => ep.images?.[0]?.url}
          getTitle={(ep) => ep.name}
          getSubtitle={(ep) => ep.show.name}
        />
      )}

      {selectedEpisode && (
        <MediaSidePanel item={selectedEpisode} type="episode" onClose={() => setSelectedEpisode(null)} />
      )}
    </div>
  );
};

export default LikedEpisodesPage;
