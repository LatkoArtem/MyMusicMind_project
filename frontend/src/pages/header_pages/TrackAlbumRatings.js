import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SearchIcon from "../../icons/SearchIcon";
import "./styles/TrackAlbumRatings.css";

export default function TrackAlbumRatings({ profile }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [ratingsData, setRatingsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:8888/api/ratings", { credentials: "include" });
      if (res.status === 401) {
        setRatingsData([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch ratings");
      const data = await res.json();
      setRatingsData(data);
    } catch (err) {
      console.error(err);
      setRatingsData([]);
    } finally {
      setLoading(false);
    }
  };

  // Watch profile: if null → clear ratings
  useEffect(() => {
    if (profile) {
      fetchRatings();
    } else {
      setRatingsData([]);
      setLoading(false);
    }
  }, [profile]);

  const filtered = ratingsData
    .filter((item) => filter === "all" || item.type === filter)
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleNewRating = () => {
    if (filter === "track") navigate("/TrackAlbumRatings/RateTrackOrAlbum/track");
    else if (filter === "album") navigate("/TrackAlbumRatings/RateTrackOrAlbum/album");
    else navigate("/TrackAlbumRatings/RateTrackOrAlbum");
  };

  if (loading) return <div className="ratings-page">{t("loading_ratings")}</div>;
  if (!profile) return <div className="ratings-page">{t("login_prompt")}</div>;

  return (
    <div className="ratings-page">
      <div className="ratings-container">
        <div className="add-rating">
          <button onClick={handleNewRating}>{t("new_rating")}</button>
        </div>

        <div className="search-wrapper">
          <SearchIcon />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search_placeholder")}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          {["all", "track", "album"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? "active" : ""}>
              {f === "all" ? t("filter_all") : f === "track" ? t("filter_tracks") : t("filter_albums")}
            </button>
          ))}
        </div>

        <div className="ratings-list">
          {filtered.length === 0 && (
            <div className="no-ratings">
              {t("no_ratings", {
                type:
                  filter === "all"
                    ? t("filter_all").toLowerCase() +
                      " " +
                      t("filter_tracks").toLowerCase() +
                      "/" +
                      t("filter_albums").toLowerCase()
                    : filter === "track"
                    ? t("filter_tracks").toLowerCase()
                    : t("filter_albums").toLowerCase(),
              })}
            </div>
          )}

          {filtered.map((item) => {
            const totalScore = item.total_score;
            return (
              <div
                key={item.id}
                className="rating-card-element"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                <div className="rating-left">
                  <div className="rating-cover" style={{ backgroundImage: `url(${item.coverUrl})` }} />
                  <div className="rating-info">
                    <div className="rating-name">{item.name}</div>
                    <div className="rating-artist">{item.artist}</div>
                  </div>
                </div>

                <div className="rating-right">
                  <div
                    className={`rating-score ${totalScore >= 90 ? "highlight" : ""}`}
                    style={{
                      color: totalScore >= 90 ? "#FFD700" : "white",
                      fontWeight: 700,
                      fontSize: "1.7rem",
                    }}
                  >
                    {Math.round(totalScore)}
                  </div>
                  <div className="rating-mini-scores">
                    {item.scores.map((s, i) => (
                      <span
                        key={i}
                        className={i === item.scores.length - 1 ? "mini-score last" : "mini-score"}
                        style={{
                          color: i === item.scores.length - 1 ? "#703587ff" : "#3e50dbff",
                          fontWeight: 600,
                          fontSize: "1.1rem",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
