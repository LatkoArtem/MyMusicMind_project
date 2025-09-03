import axios from "axios";
import { useEffect, useState } from "react";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import MediaSidePanel from "./components/MediaSidePanel";
import { fetchLyrics } from "./utils/fetchLyrics";
import { useTranslation } from "react-i18next";
import "./styles/LikedSongsPage.css";

const LikedSongsPage = () => {
  const { t } = useTranslation();
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
      .get("https://mymusicmind-backend.onrender.com/liked-songs", { withCredentials: true })
      .then((res) => setLikedSongs(res.data))
      .catch((err) => setError(err.response?.data || t("errorFetchingLikedSongs")))
      .finally(() => setIsLoading(false));
  }, [t]);

  if (error)
    return (
      <div>
        {t("error")}: {JSON.stringify(error)}
      </div>
    );

  const filteredSongs =
    likedSongs?.items.filter(
      ({ track }) =>
        track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artists.some((artist) => artist.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  return (
    <div className="page-container">
      <h1>{t("likedSongs")}</h1>

      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder={t("searchTracksOrArtists")}
      />

      {isLoading ? (
        <div className="loading-message">{t("loadingLikedSongs")}...</div>
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
