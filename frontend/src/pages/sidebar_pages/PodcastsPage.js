import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import "./styles/LikedSongsPage.css";

const PodcastsPage = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { viewMode, changeViewMode } = useViewMode();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/podcasts", { withCredentials: true })
      .then((res) => setPodcasts(res.data.items || []))
      .catch((err) => setError(err.response?.data || "Error fetching podcasts"))
      .finally(() => setIsLoading(false));
  }, []);

  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  const filteredPodcasts = podcasts.filter((p) => {
    const name = p.name?.toLowerCase() || "";
    const publisher = p.publisher?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || publisher.includes(term);
  });

  const getLargestImage = (images) =>
    images?.reduce((largest, img) => (img.width > (largest?.width ?? 0) ? img : largest), null)?.url || "";

  return (
    <div className="page-container">
      <h1>Podcasts</h1>
      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder="Search podcasts..."
      />
      {isLoading ? (
        <div>Loading podcasts...</div>
      ) : (
        <MediaList
          items={filteredPodcasts}
          viewMode={viewMode}
          onItemClick={(podcast) => navigate(`/podcasts/${podcast.id}`)}
          getTitle={(pod) => pod.name}
          getSubtitle={(pod) => pod.publisher}
          getImage={(pod) => getLargestImage(pod.images)}
        />
      )}
    </div>
  );
};

export default PodcastsPage;
