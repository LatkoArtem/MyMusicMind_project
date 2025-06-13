import axios from "axios";
import { useEffect, useState } from "react";
import "./LikedSongsPage.css";

const PodcastsPage = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [showPodcasts, setShowPodcasts] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [podcastDetails, setPodcastDetails] = useState(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/podcasts", { withCredentials: true })
      .then((res) => setPodcasts(res.data.items || []))
      .catch((err) => setError(err.response?.data || "Error fetching podcasts"))
      .finally(() => setIsLoading(false));

    axios
      .get("http://127.0.0.1:8888/profile", { withCredentials: true })
      .then((res) => {
        const mode = res.data.viewMode;
        if (["grid", "list"].includes(mode)) setViewMode(mode);
      })
      .catch(console.warn);
  }, []);

  const changeViewMode = (mode) => {
    setViewMode(mode);
    axios.post("http://127.0.0.1:8888/viewmode", { viewMode: mode }, { withCredentials: true }).catch(console.warn);
  };

  const fetchPodcast = (podcast) => {
    setShowPodcasts(true);
    setSelectedPodcast(podcast);
    setSearchTerm("");
    axios
      .get(`http://127.0.0.1:8888/podcasts/${podcast.id}/episodes`, { withCredentials: true })
      .then((res) => setEpisodes(res.data.items))
      .catch((err) => setError(err.response?.data || "Error fetching episodes"));
    axios
      .get(`http://127.0.0.1:8888/podcasts/${podcast.id}`, { withCredentials: true })
      .then((res) => setPodcastDetails(res.data))
      .catch(console.warn);
  };

  const handleBack = () => {
    setSelectedPodcast(null);
    setEpisodes(null);
    setShowPodcasts(false);
    setSelectedEpisode(null);
    setPodcastDetails(null);
    setSearchTerm("");
  };

  if (error) return <div>Error: {JSON.stringify(error)}</div>;

  const filteredPodcasts = podcasts.filter((p) => {
    const name = p.name?.toLowerCase() || "";
    const publisher = p.publisher?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || publisher.includes(term);
  });

  const filteredEpisodes =
    episodes?.filter((ep) => {
      const epName = ep.name?.toLowerCase() || "";
      const showName = selectedPodcast.name.toLowerCase() || "";
      const publisher = selectedPodcast.publisher.toLowerCase() || "";
      const term = searchTerm.toLowerCase();
      return epName.includes(term) || showName.includes(term) || publisher.includes(term);
    }) || [];

  return (
    <div className="page-container">
      {!showPodcasts ? (
        <>
          <h1>Podcasts</h1>
          <div className="top-bar">
            <div className="search-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="white"
                className="search-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search podcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="view-toggle">
              <button onClick={() => changeViewMode("grid")} className={viewMode === "grid" ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="1.5"
                  className="icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                  />
                </svg>
              </button>
              <button onClick={() => changeViewMode("list")} className={viewMode === "list" ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="1.5"
                  className="icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </button>
            </div>
          </div>
          {isLoading ? (
            <div>Loading podcasts...</div>
          ) : (
            <div className={viewMode === "grid" ? "songs-grid" : "songs-list"}>
              {filteredPodcasts.map((pod) => (
                <div
                  key={pod.id}
                  className={viewMode === "grid" ? "song-card" : "song-row"}
                  onClick={() => fetchPodcast(pod)}
                >
                  <img
                    src={pod.images?.reduce((largest, img) => (img.width > (largest?.width ?? 0) ? img : largest))?.url}
                    alt={pod.name}
                    className="album-cover"
                  />
                  <div className="track-info">
                    <div className="track-name">{pod.name}</div>
                    <div className="track-artists">{pod.publisher}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="playlist-overview">
            <button className="back-button" onClick={handleBack}>
              ⬅ Back to podcasts
            </button>
            <div className="playlist-header">
              <div className="playlist-left">
                <img
                  src={
                    selectedPodcast.images?.reduce((largest, img) =>
                      img.width > (largest?.width ?? 0) ? img : largest
                    )?.url
                  }
                  alt={selectedPodcast.name}
                  className="album-cover"
                />
                {podcastDetails && (
                  <div className="playlist-badges">
                    <div className="badge">
                      <span className="badge-label">Publisher</span>
                      <p>{podcastDetails.publisher}</p>
                    </div>
                    <div className="badge">
                      <span className="badge-label">Total episodes</span>
                      <p>{podcastDetails.total_episodes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="playlist-right">
                <h2 className="playlist-info-title">{podcastDetails?.name}</h2>
                <p className="playlist-analysis">Podcast Analysis</p>
              </div>
            </div>
          </div>

          <div className="top-bar">
            <div className="search-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="white"
                className="search-icon"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search episodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="view-toggle">
              <button onClick={() => changeViewMode("grid")} className={viewMode === "grid" ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="1.5"
                  className="icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                  />
                </svg>
              </button>
              <button onClick={() => changeViewMode("list")} className={viewMode === "list" ? "active" : ""}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  strokeWidth="1.5"
                  className="icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className={viewMode === "grid" ? "songs-grid" : "songs-list"}>
            {filteredEpisodes.map((ep, idx) => (
              <div
                key={`${ep.id}-${idx}`}
                className={viewMode === "grid" ? "song-card" : "song-row"}
                onClick={() => setSelectedEpisode(ep)}
              >
                <img
                  src={podcastDetails?.images?.[0]?.url || selectedPodcast.images?.[0]?.url}
                  alt={ep.name}
                  className="album-cover"
                />
                <div className="track-info">
                  <div className="track-name">{ep.name}</div>
                  <div className="track-artists">{selectedPodcast.publisher}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedEpisode && (
        <div className="side-panel">
          <button className="close-button" onClick={() => setSelectedEpisode(null)}>
            ×
          </button>
          <img src={podcastDetails?.images?.[0]?.url} alt={selectedEpisode.name} className="details-cover" />
          <div className="track-details">
            <h2>{selectedEpisode.name}</h2>
            <h3>{selectedPodcast.publisher}</h3>
            <div className="track-meta">
              <p>
                <strong>Release date:</strong> {selectedEpisode.release_date}
              </p>
              <p>
                <strong>Duration:</strong> {Math.floor(selectedEpisode.duration_ms / 60000)}:
                {String(Math.floor((selectedEpisode.duration_ms % 60000) / 1000)).padStart(2, "0")}
              </p>
              <p className="episode-description">
                <strong>Description: </strong>
                {selectedEpisode.description}
              </p>
            </div>
            {selectedEpisode.external_urls?.spotify && (
              <a
                href={selectedEpisode.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="spotify-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 168 168" fill="white">
                  <path d="M84 0C37.7 0 0 37.7 0 84s37.7 84 84 84 84-37.7 84-84S130.3 0 84 0zm38.6 120.1c-1.3 2.1-4 2.8-6.1 1.5-16.8-10.2-38-12.5-63-6.8-2.4.5-4.8-1-5.3-3.4-.5-2.4 1-4.8 3.4-5.3 28-6.2 52.3-3.6 71.1 8 2 1.3 2.7 4 1.5 6zm8.7-20.6c-1.6 2.6-5.1 3.4-7.7 1.8-19.2-11.8-48.4-15.2-71.1-8.2-3 .9-6.2-.8-7.1-3.8-.9-3 .8-6.2 3.8-7.1 27.1-8 60.2-4.1 83 10.1 2.6 1.6 3.4 5.1 1.8 7.2zm.2-22.2c-23-13.7-61.2-15-83.5-8.1-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 26.5-8 69.1-6.5 96.9 9.6 3.1 1.8 4.1 5.8 2.3 8.9-1.7 2.8-5.5 3.9-8.3 2.3z" />
                </svg>
                Open in Spotify
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastsPage;
