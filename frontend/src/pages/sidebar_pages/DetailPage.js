import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import useViewMode from "./hooks/useGridListToggle";
import TopBar from "./components/TopBar";
import MediaList from "./components/MediaList";
import MediaSidePanel from "./components/MediaSidePanel";
import ItemOverview from "./components/ItemOverview";
import { fetchLyrics } from "./utils/fetchLyrics";
import StarRating from "./components/StarRaiting";

const DetailPage = () => {
  const { type, id } = useParams(); // "albums" | "artists" | "playlists" | "podcasts"
  const navigate = useNavigate();

  const [details, setDetails] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const { viewMode, changeViewMode } = useViewMode();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const detailsRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}`, { withCredentials: true });
        setDetails(detailsRes.data);

        let tracksRes;
        if (type === "albums") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/tracks`, { withCredentials: true });
          setItems(tracksRes.data.items);
        } else if (type === "artists") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/top-tracks`, { withCredentials: true });
          setItems(tracksRes.data.tracks);
        } else if (type === "playlists") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/tracks`, { withCredentials: true });
          setItems(tracksRes.data.items.map(({ track }) => track).filter((track) => track && track.name));
        } else if (type === "podcasts") {
          tracksRes = await axios.get(`http://127.0.0.1:8888/${type}/${id}/episodes`, { withCredentials: true });
          setItems(tracksRes.data.items);
        }
      } catch (error) {
        console.error("Error loading detail page:", error);
      }
    };

    fetchDetails();
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
    if (details.images) {
      return details.images[0]?.url || "";
    }
    if (details.album?.images?.length) {
      return details.album.images[0]?.url;
    }
    return "";
  };

  return (
    <div className="page-container">
      <ItemOverview
        image={getImage()}
        title={details.name}
        analysisLabel={`${type.slice(0, -1)} Analysis`}
        backLabel={type}
        onBack={() => navigate(`/${type.charAt(0).toUpperCase() + type.slice(1)}Page`)}
        badges={renderBadges()}
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
          if (type === "podcasts") {
            return item.show?.publisher || details?.publisher || "";
          }
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
