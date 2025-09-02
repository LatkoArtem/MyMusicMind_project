import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AlbumOrPlaylistAnalysis from "./AlbumOrPlaylistAnalysis";
import ArtistAnalysis from "./ArtistAnalysis";
import SpotifyIcon from "../../../icons/SpotifyIcon";
import ArtistModal from "./ArtistModal";
import GenreEvolutionChart from "./GenreEvolutionChart";

const ItemOverview = ({
  image,
  title,
  analysisLabel,
  onBack,
  badges,
  backLabel,
  description,
  imageClassName = "",
  meanFeatures,
  consistencyScore,
  spotifyUrl,
  trackFeatures = [],
  trackNames = [],
  trackClusters = [],
  similarArtists = null,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [artistInfo, setArtistInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [latestRelease, setLatestRelease] = useState(null);
  const [loadingRelease, setLoadingRelease] = useState(false);
  const [genreEvolution, setGenreEvolution] = useState(null);
  const [loadingGenres, setLoadingGenres] = useState(false);

  const fetchArtistBio = async (artistName) => {
    try {
      const response = await fetch(
        `https://mymusicmind.netlify.app/artist_info/name/${encodeURIComponent(artistName)}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch artist info");
      const data = await response.json();
      setArtistInfo(data);
    } catch (error) {
      console.error("❌ Error fetching artist bio:", error);
    }
  };

  const openModal = async (artistName) => {
    await fetchArtistBio(artistName);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const renderSimilarArtists = () => {
    if (similarArtists === null) {
      return <p className="playlist-analysis">{t("searchingSimilarArtists")}</p>;
    }

    if (Array.isArray(similarArtists) && similarArtists.length === 0) {
      return <p className="playlist-analysis">{t("noSimilarArtists")}</p>;
    }

    return <ArtistAnalysis similarArtists={similarArtists} isSimilarLoading={false} />;
  };

  useEffect(() => {
    console.log("🎯 useEffect triggered with:", { title, analysisLabel });

    if (analysisLabel !== "artists") {
      console.log("Skipping fetch because analysisLabel is not 'artists'");
      return;
    }

    const fetchData = async () => {
      setLoadingRelease(true);
      setLoadingGenres(true);

      try {
        console.log("⏳ Fetching latest release...");
        const releaseRes = await fetch(
          `https://mymusicmind.netlify.app/artist_latest_release/${encodeURIComponent(title)}`,
          {
            credentials: "include",
          }
        );
        if (!releaseRes.ok) throw new Error("Failed to fetch latest release");
        const releaseData = await releaseRes.json();
        console.log("✅ Latest release data:", releaseData);
        setLatestRelease(releaseData);
      } catch (err) {
        console.error("❌ Error fetching latest release:", err);
        setLatestRelease(null);
      } finally {
        setLoadingRelease(false);
        console.log("⏳ Finished loading latest release:", false);
      }

      try {
        console.log("⏳ Fetching genre evolution...");
        const genreRes = await fetch(`https://mymusicmind.netlify.app/genre_evolution/${encodeURIComponent(title)}`, {
          credentials: "include",
        });
        if (!genreRes.ok) throw new Error("Failed to fetch genre evolution");
        const genreData = await genreRes.json();
        console.log("✅ Genre evolution data:", genreData);
        setGenreEvolution(genreData.evolution || genreData);
      } catch (err) {
        console.error("❌ Error fetching genre evolution:", err);
        setGenreEvolution(null);
      } finally {
        setLoadingGenres(false);
        console.log("⏳ Finished loading genre evolution:", false);
      }
    };

    fetchData();
  }, [title, analysisLabel]);

  console.log("🔄 Render with states:", {
    loadingRelease,
    latestRelease,
    loadingGenres,
    genreEvolution,
  });

  return (
    <div className="playlist-overview">
      <button className="back-button" onClick={onBack}>
        ⬅ {t("backTo")} {backLabel}
      </button>

      {isLoading ? (
        <div className="loading-analysis">
          <p>
            {t("analyzing")}{" "}
            {analysisLabel === "albums" ? t("album") : analysisLabel === "playlists" ? t("playlist") : ""}
            ...
          </p>
        </div>
      ) : (
        <div className="playlist-header">
          <div className="playlist-left">
            {image && <img src={image} alt={title} className={`album-cover ${imageClassName}`} />}
            <div className="playlist-badges">
              {badges.map(({ label, value }) => (
                <div className="badge" key={label}>
                  <span className="badge-label">{label}</span>
                  <p>{value}</p>
                </div>
              ))}
            </div>
            {spotifyUrl && (
              <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="spotify-button">
                <SpotifyIcon />
                {t("openInSpotify")}
              </a>
            )}
          </div>

          <div className="playlist-right">
            <h2 className="playlist-info-title">{title}</h2>

            {analysisLabel === "artists" && (
              <button className="artist-info-button" onClick={() => openModal(title)}>
                {t("aboutArtist")}
              </button>
            )}

            {(analysisLabel === "albums" || analysisLabel === "playlists") && meanFeatures ? (
              <AlbumOrPlaylistAnalysis
                analysisLabel={backLabel}
                MeanFeatures={meanFeatures}
                consistencyScore={consistencyScore}
                trackFeatures={trackFeatures}
                trackNames={trackNames}
                trackClusters={trackClusters}
              />
            ) : (
              analysisLabel !== "artists" &&
              analysisLabel !== "podcasts" && <p className="playlist-analysis">{analysisLabel}</p>
            )}

            {analysisLabel === "podcasts" && description && <p className="podcast-description">{description}</p>}

            {analysisLabel === "artists" && (
              <div className="similar-artists-section">
                <h3 className="section-title">{t("lastRelease")}</h3>
                {loadingRelease ? (
                  <p className="playlist-analysis">{t("loadingLatestRelease")}</p>
                ) : latestRelease ? (
                  <div className="latest-release">
                    <img src={latestRelease.image} alt={latestRelease.name} className="latest-release-image" />
                    <div className="latest-release-info">
                      <p className="latest-release-name">{latestRelease.name}</p>
                      <p className="latest-release-date">
                        {latestRelease.release_type} • {latestRelease.release_date}
                      </p>
                      <a
                        href={latestRelease.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="spotify-button"
                      >
                        <SpotifyIcon />
                        {t("openInSpotify")}
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="playlist-analysis">{t("noReleaseData")}</p>
                )}
                <h3 className="section-title">{t("similarArtists")}</h3>
                {renderSimilarArtists()}
                <h3 className="section-title">{t("genreEvolution")}</h3>
                {loadingGenres ? (
                  <p className="playlist-analysis">{t("loadingGenreEvolution")}</p>
                ) : genreEvolution ? (
                  <GenreEvolutionChart data={genreEvolution} />
                ) : (
                  <p className="playlist-analysis">{t("noGenreData")}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && artistInfo && <ArtistModal artistInfo={artistInfo} onClose={closeModal} />}
    </div>
  );
};

export default ItemOverview;
