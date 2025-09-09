import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import { useTranslation } from "react-i18next";
import "./styles/LikedSongsPage.css";

const PodcastsPage = () => {
  const { t } = useTranslation();
  const [podcasts, setPodcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { viewMode, changeViewMode } = useViewMode();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://mymusicmind-9gke.onrender.com/podcasts", { withCredentials: true })
      .then((res) => setPodcasts(res.data.items || []))
      .catch((err) => setError(err.response?.data || t("errorFetchingPodcasts")))
      .finally(() => setIsLoading(false));
  }, [t]);

  if (error)
    return (
      <div>
        {t("error")}: {JSON.stringify(error)}
      </div>
    );

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
      <h1>{t("podcasts")}</h1>
      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder={t("searchPodcasts")}
      />
      {isLoading ? (
        <div>{t("loadingPodcasts")}...</div>
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
