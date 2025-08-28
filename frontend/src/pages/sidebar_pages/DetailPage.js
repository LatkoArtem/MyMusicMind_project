import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import MediaSidePanel from "./components/MediaSidePanel";
import ItemOverview from "./components/ItemOverview";
import { fetchLyrics } from "./utils/fetchLyrics";
import StarRating from "./components/StarRating";

const DetailPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [meanFeatures, setMeanFeatures] = useState(null);
  const [trackFeatures, setTrackFeatures] = useState([]);
  const [trackNames, setTrackNames] = useState([]);
  const [consistencyScore, setConsistencyScore] = useState(null);
  const [trackClusters, setTrackClusters] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarArtists, setSimilarArtists] = useState(null);
  const { viewMode, changeViewMode } = useViewMode();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const resetState = () => {
      setDetails(null);
      setItems([]);
      setFilteredItems([]);
      setSelectedTrack(null);
      setSelectedEpisode(null);
      setLyrics(null);
      setMeanFeatures(null);
      setTrackFeatures([]);
      setTrackNames([]);
      setConsistencyScore(null);
      setIsAnalyzing(false);
    };

    const fetchAllData = async () => {
      try {
        resetState();
        const detailsRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}`, {
          withCredentials: true,
          signal: controller.signal,
        });
        if (!isMounted) return;
        setDetails(detailsRes.data);

        let tracksRes;

        if (type === "albums") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/tracks`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          const albumTracks = tracksRes.data.items;
          setItems(albumTracks);

          setIsAnalyzing(true);
          const analysisRes = await axios.get(`http://127.0.0.1:8888/analyze_album/${id}`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          setMeanFeatures(analysisRes.data.feature_vector);
          setConsistencyScore(analysisRes.data.consistency_score);
          setTrackFeatures(analysisRes.data.track_features || []);
          setTrackNames(analysisRes.data.track_names || []);
          setTrackClusters(analysisRes.data.track_clusters || []);
          setIsAnalyzing(false);
        } else if (type === "playlists") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/tracks`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          const playlistTracks = tracksRes.data.items
            .map(({ track }) => track)
            .filter(Boolean)
            .slice(0, 50);
          setItems(playlistTracks);

          setIsAnalyzing(true);
          const analysisRes = await axios.get(`http://127.0.0.1:8888/analyze_playlist/${id}`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          setMeanFeatures(analysisRes.data.feature_vector);
          setConsistencyScore(analysisRes.data.consistency_score);
          setTrackFeatures(analysisRes.data.track_features || []);
          setTrackNames(analysisRes.data.track_names || []);
          setTrackClusters(analysisRes.data.track_clusters || []);
          setIsAnalyzing(false);
        } else if (type === "artists") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/top-tracks`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          setItems(tracksRes.data.tracks);

          const similarRes = await axios.get(`http://127.0.0.1:8888/similar_artists/${detailsRes.data.name}`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          setSimilarArtists(Array.isArray(similarRes.data) ? similarRes.data : []);
        } else if (type === "podcasts") {
          // 1. Отримуємо деталі подкасту
          const detailsResPodcast = await axios.get(`http://127.0.0.1:8888/podcasts/${id}`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;
          const podcastDetails = detailsResPodcast.data;

          // 2. Отримуємо епізоди подкасту
          tracksRes = await axios.get(`http://127.0.0.1:8888/podcasts/${id}/episodes`, {
            withCredentials: true,
            signal: controller.signal,
          });
          if (!isMounted) return;

          const episodesData = tracksRes.data;

          setItems(episodesData.items || []);
          setDetails(podcastDetails);
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("❌ Error loading detail page:", error);
        }
        if (isMounted) setIsAnalyzing(false);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [type, id]);

  useEffect(() => {
    if (!items) return setFilteredItems([]);
    const filtered = items.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
      if (type === "podcasts") {
        const publisherMatch =
          item.show?.publisher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          details?.publisher?.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch || publisherMatch;
      } else {
        const artistsMatch = item.artists?.some((artist) =>
          artist.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return nameMatch || artistsMatch;
      }
    });
    setFilteredItems(filtered);
  }, [searchTerm, items, type, details?.publisher]);

  if (!details) return <div>Loading...</div>;

  const renderBadges = () => {
    switch (type) {
      case "albums":
        return [
          { label: "Artist(s)", value: details.artists.map((a) => a.name).join(", ") },
          { label: "Release Date", value: details.release_date },
          { label: "Total Tracks", value: details.total_tracks },
          { label: "Label", value: details.label || "N/A" },
        ];
      case "artists":
        return [
          { label: "Genres", value: details.genres.join(", ") || "N/A" },
          {
            label: "Popularity",
            value: (
              <div className="popularity-container">
                <StarRating popularity={details.popularity} />
                <span className="popularity-score">{details.popularity}/100</span>
              </div>
            ),
          },
        ];
      case "playlists":
        return [
          { label: "Owner", value: details.owner.display_name },
          { label: "Public", value: details.public ? "Yes" : "No" },
          { label: "Collaborative", value: details.collaborative ? "Yes" : "No" },
          { label: "Tracks", value: details.tracks.total },
        ];
      case "podcasts":
        return [
          { label: "Publisher", value: details.publisher },
          { label: "Total episodes", value: details.total_episodes },
        ];
      default:
        return [];
    }
  };

  const getImage = () => {
    if (details.images) return details.images[0]?.url || "";
    if (details.album?.images?.length) return details.album.images[0]?.url;
    return "";
  };

  return (
    <div className="page-container">
      <ItemOverview
        image={getImage()}
        title={details.name}
        analysisLabel={isAnalyzing ? "Analysis in progress... Do not leave the page" : type}
        backLabel={type}
        description={details.description}
        onBack={() => navigate(`/${type.charAt(0).toUpperCase() + type.slice(1)}Page`)}
        badges={renderBadges()}
        meanFeatures={meanFeatures}
        consistencyScore={consistencyScore}
        spotifyUrl={details.external_urls?.spotify}
        trackFeatures={trackFeatures}
        trackNames={trackNames}
        trackClusters={trackClusters}
        similarArtists={similarArtists}
        {...(type === "artists" && { imageClassName: "artist-cover" })}
      />

      {type === "artists" && <h1>Top tracks</h1>}

      <TopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        changeViewMode={changeViewMode}
        placeholder="Search tracks or artists..."
      />

      <MediaList
        items={filteredItems}
        viewMode={viewMode}
        onItemClick={(item) => {
          if (type === "podcasts") {
            setSelectedEpisode(item);
            setSelectedTrack(null);
            setLyrics(null);
          } else {
            setSelectedTrack(item);
            fetchLyrics(item, setLyrics, setIsLoadingLyrics);
            setSelectedEpisode(null);
          }
        }}
        getImage={(track) => track.album?.images?.[0]?.url || getImage()}
        getTitle={(track) => track.name}
        getSubtitle={(item) => {
          if (type === "podcasts") return item.show?.publisher || details?.publisher || "";
          return item.artists?.map((a) => a.name).join(", ") || "";
        }}
        itemKey={(track, idx) => `${track.id}-${idx}`}
      />

      {type === "podcasts" && selectedEpisode ? (
        <MediaSidePanel
          item={selectedEpisode}
          type="episode"
          onClose={() => setSelectedEpisode(null)}
          albumDetails={details}
        />
      ) : selectedTrack ? (
        <MediaSidePanel
          item={selectedTrack}
          type="track"
          onClose={() => {
            setSelectedTrack(null);
            setLyrics(null);
          }}
          lyrics={lyrics}
          isLoadingLyrics={isLoadingLyrics}
          albumDetails={details}
        />
      ) : null}
    </div>
  );
};

export default DetailPage;
