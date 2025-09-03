import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DiscIcon from "../../images/DiscIcon.png";
import InfoIcon from "../../images/InfoIcon.png";
import SearchIcon from "../../icons/SearchIcon";
import "./styles/RateTrackOrAlbum.css";

export default function RateTrackOrAlbum() {
  const { t } = useTranslation();
  const { type: paramType, id } = useParams();
  const [type, setType] = useState(paramType || "track");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [itemInfo, setItemInfo] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  const [scores, setScores] = useState([5, 5, 5, 5, 5]);
  const [showTypeSelect, setShowTypeSelect] = useState(false);

  const vibeMultiplier = {
    1: 1.0,
    2: 1.0675,
    3: 1.1349,
    4: 1.2024,
    5: 1.2699,
    6: 1.3373,
    7: 1.4048,
    8: 1.4723,
    9: 1.5397,
    10: 1.6072,
  };

  const handleSliderChange = (index, value) => {
    const newScores = [...scores];
    newScores[index] = Number(value);
    setScores(newScores);
  };

  const handleSubmitRating = async () => {
    if (!itemInfo) return;

    const baseSum = scores[0] + scores[1] + scores[2] + scores[3];
    const baseScore = baseSum * 1.4;
    const finalScore = Math.round(baseScore * vibeMultiplier[scores[4]]);

    const payload = {
      name: itemInfo.name,
      type,
      artist: itemInfo.artist,
      scores,
      finalScore,
      spotify_id: itemInfo.id,
    };

    if (existingRating) {
      await fetch(`https://mymusicmind.onrender.com/api/ratings/${existingRating.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ scores, totalScore: finalScore }),
      });
    } else {
      await fetch("https://mymusicmind.onrender.com/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
    }

    navigate("/TrackAlbumRatings");
  };

  useEffect(() => {
    setScores([5, 5, 5, 5, 5]);
    setExistingRating(null);
    setItemInfo(null);
  }, [id, type]);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const resp = await fetch(`https://mymusicmind.onrender.com/api/${type}/${id}`, {
          credentials: "include",
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setItemInfo(data);
      } catch (e) {
        console.error("Failed to fetch item:", e);
      }
    })();
  }, [id, type]);

  useEffect(() => {
    if (!itemInfo) return;

    (async () => {
      try {
        const resp = await fetch(`https://mymusicmind.onrender.com/api/ratings`, {
          credentials: "include",
        });
        if (!resp.ok) return;
        const allRatings = await resp.json();
        const rating = allRatings.find((r) => r.spotify_id === itemInfo.id);
        if (rating) {
          setExistingRating(rating);
          setScores(rating.scores);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [itemInfo]);

  useEffect(() => {
    if (!id && query.trim() !== "") {
      const timeout = setTimeout(async () => {
        const resp = await fetch(`https://mymusicmind.onrender.com/api/search?type=${type || "track"}&query=${query}`, {
          credentials: "include",
        });
        const data = await resp.json();
        setResults(data[`${type || "track"}s`] || []);
      }, 400);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
    }
  }, [query, type, id]);

  if (!id) {
    return (
      <div className="ratings-page">
        <div className="ratings-container">
          <div className="top-panel">
            <div className="top-icon">
              {type === "track" ? (
                <div className="top-icon-note">♪</div>
              ) : (
                <img
                  src={DiscIcon}
                  alt="Album"
                  style={{ width: "38px", height: "38px", filter: "invert(100%) brightness(200%)" }}
                />
              )}
            </div>
            <div
              className={`selectbox ${showTypeSelect ? "open" : ""}`}
              onClick={() => setShowTypeSelect(!showTypeSelect)}
            >
              <div className="selectbox-text">{type === "track" ? t("track") : t("album")}</div>
              <div className="selectbox-caret">▾</div>
              {showTypeSelect && (
                <div className="type-dropdown">
                  <div
                    onClick={() => {
                      setType("track");
                      setShowTypeSelect(false);
                    }}
                  >
                    {t("track")}
                  </div>
                  <div
                    onClick={() => {
                      setType("album");
                      setShowTypeSelect(false);
                    }}
                  >
                    {t("album")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2>
            {t("search")} {type === "album" ? t("album1") : t("track1")}
          </h2>
          <div className="search-wrapper">
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("enter_name", { type: type === "album" ? t("album1") : t("track1") })}
              className="search-input"
            />
          </div>

          <div className="ratings-list" style={{ marginTop: "30px" }}>
            {results.map((item) => (
              <div
                key={item.id}
                className="rating-item"
                onClick={() => navigate(`/TrackAlbumRatings/RateTrackOrAlbum/${type}/${item.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="rating-item-info">
                  <div className="track-cover" style={{ backgroundImage: `url(${item.coverUrl})` }} />
                  <div>
                    <div className="track-title">{item.name}</div>
                    <div className="track-sub">{item.artist}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const baseSum = scores[0] + scores[1] + scores[2] + scores[3];
  const baseScore = baseSum * 1.4;
  const finalScore = baseScore * vibeMultiplier[scores[4]];
  const isHighScore = finalScore >= 90;
  const criteria = [
    { key: "rhymes", label: t("rhymes") },
    { key: "structure", label: t("structure") },
    { key: "style", label: t("style") },
    { key: "individuality", label: t("individuality") },
    { key: "vibe", label: t("vibe") },
  ];
  const firstFour = criteria.slice(0, 4);

  return (
    <div className="ratings-page">
      <div className="ratings-container">
        <div className="top-panel">
          <div className="top-icon">
            {type === "track" ? (
              <div className="top-icon-note">♪</div>
            ) : (
              <img
                src={DiscIcon}
                alt="Album"
                style={{ width: "38px", height: "38px", filter: "invert(100%) brightness(200%)" }}
              />
            )}
          </div>
          <div className="selectbox">
            <div className="selectbox-item">
              {itemInfo && (itemInfo.coverUrl || itemInfo.image) && (
                <img src={itemInfo.coverUrl || itemInfo.image} alt={itemInfo.name} className="selectbox-cover" />
              )}
              <div className="selectbox-text">{itemInfo ? `${itemInfo.name} — ${itemInfo.artist}` : `#${id}`}</div>
            </div>
          </div>
        </div>

        <div className="rating-card rating-card--blue">
          <div className="rating-grid">
            {firstFour.map((r, i) => {
              const min = 1;
              const max = 10;
              const pct = ((scores[i] - min) / (max - min)) * 100;
              return (
                <div key={r.key} className="rating-row">
                  <div className="rating-row-head">
                    <div className="rating-label">{r.label}</div>
                    <div className="rating-value">{scores[i]}</div>
                  </div>
                  <div className="rating-bar">
                    <div className="rating-fill" style={{ width: `${pct}%` }} />
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={scores[i]}
                      onChange={(e) => handleSliderChange(i, e.target.value)}
                      className="rating-slider"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rating-card rating-card--purple">
          <div className="rating-row rating-row--full">
            <div className="rating-row-head">
              <div className="rating-label">{criteria[4].label}</div>
              <div className="rating-value">{scores[4]}</div>
            </div>
            <div className="rating-bar rating-bar--purple">
              <div className="rating-fill rating-fill--purple" style={{ width: `${((scores[4] - 1) / 9) * 100}%` }} />
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores[4]}
                onChange={(e) => handleSliderChange(4, e.target.value)}
                className="rating-slider"
              />
            </div>
          </div>
        </div>

        <div className="score-footer">
          <div className="score-left">
            <div className="check-circle" style={{ backgroundColor: isHighScore ? "#FFD700" : "white" }}>
              <div className="check">✓</div>
            </div>
            <div className="score-big-wrap">
              <div className="score-big" style={{ color: isHighScore ? "#FFD700" : "white" }}>
                {Math.round(finalScore)}
              </div>
              <div className="score-max">/ 90</div>
            </div>
          </div>
          <div className="score-mini">
            {scores.map((v, i) => (
              <span key={i} style={{ color: i === scores.length - 1 ? "#703587ff" : "#3e50dbff" }}>
                {v}
              </span>
            ))}
          </div>
        </div>

        <div className="save-wrap">
          {existingRating && (
            <div className="already-rated">
              <img src={InfoIcon} alt="Info" className="info-icon" />
              <span>{t("already_rated", { type: type === "album" ? t("album2") : t("track2") })}</span>
            </div>
          )}
          <button className="save-btn" onClick={handleSubmitRating}>
            {existingRating ? t("update_rating") : t("save_rating")}
          </button>
        </div>
      </div>
    </div>
  );
}
