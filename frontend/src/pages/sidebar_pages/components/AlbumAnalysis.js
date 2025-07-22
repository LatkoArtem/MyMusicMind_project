import { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import Select from "react-select";
import "../styles/AlbumAnalysis.css";

const featureLabels = [
  "acousticness",
  "danceability",
  "energy",
  "instrumentalness",
  "liveness",
  "loudness",
  "speechiness",
  "tempo",
  "valence",
];

const normalizeFeatures = (featuresArray) => {
  const loudnessNorm = Math.min(Math.max((featuresArray[5] + 60) / 60, 0), 1);
  const tempoNorm = Math.min(Math.max((featuresArray[7] - 40) / 210, 0), 1);

  return featureLabels.map((label, idx) => {
    let value = featuresArray[idx];
    if (label === "loudness") value = loudnessNorm;
    else if (label === "tempo") value = tempoNorm;
    return { feature: label, value };
  });
};

const AlbumAnalysis = ({ albumMeanFeatures, consistencyScore, trackFeatures = [], trackNames = [] }) => {
  const [viewMode, setViewMode] = useState("album");
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);

  if ((!albumMeanFeatures || albumMeanFeatures.length === 0) && trackFeatures.length === 0)
    return <p>No analysis data available.</p>;

  const albumFeaturesArr = typeof albumMeanFeatures === "string" ? JSON.parse(albumMeanFeatures) : albumMeanFeatures;

  let data = [];
  if (viewMode === "album") {
    data = normalizeFeatures(albumFeaturesArr);
  } else {
    if (trackFeatures[selectedTrackIndex]) {
      const tf =
        typeof trackFeatures[selectedTrackIndex] === "string"
          ? JSON.parse(trackFeatures[selectedTrackIndex])
          : trackFeatures[selectedTrackIndex];
      const featuresArray = Array.isArray(tf.features) ? tf.features : tf;
      data = normalizeFeatures(featuresArray);
    }
  }

  const score = Math.min(Math.max(consistencyScore || 0, 0), 10);
  const scorePercent = (score * 100).toFixed(2);

  return (
    <div className="album-analysis-container">
      <div className="album-analysis-header">
        <h3 className="album-analysis-title">Audio Features</h3>

        <div className="album-analysis-toggle-buttons">
          <button
            onClick={() => setViewMode("album")}
            className={`album-analysis-button ${viewMode === "album" ? "active" : ""}`}
          >
            Album
          </button>
          <button
            onClick={() => setViewMode("track")}
            className={`album-analysis-button ${viewMode === "track" ? "active" : ""}`}
          >
            Track
          </button>
        </div>
      </div>

      {viewMode === "track" && trackFeatures.length > 0 && (
        <Select
          options={trackNames.map((name, idx) => ({ value: idx, label: name }))}
          value={{ value: selectedTrackIndex, label: trackNames[selectedTrackIndex] }}
          onChange={(selected) => setSelectedTrackIndex(selected.value)}
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: "#1e253a",
              borderColor: "#8c9eff",
              borderRadius: 6,
              color: "#fff",
              boxShadow: "0 0 4px rgba(140, 158, 255, 0.4)",
            }),
            singleValue: (base) => ({
              ...base,
              color: "#ffffff",
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: "#1e253a",
              borderRadius: 6,
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? "#8c9eff" : "#1e253a",
              color: "#ffffff",
              cursor: "pointer",
            }),
            menuList: (base) => ({
              ...base,
              maxHeight: 350,
              overflowY: "auto",
            }),
          }}
        />
      )}

      <div style={{ pointerEvents: "none" }}>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart cx="50%" cy="50%" outerRadius="85%" data={data}>
            <PolarGrid stroke="#c5cae9" />
            <PolarAngleAxis dataKey="feature" tick={{ fill: "#ffffff", fontWeight: 600, fontSize: 13 }} />
            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} tickCount={5} />
            <Radar
              name={viewMode === "album" ? "Album Mean Features" : "Track Features"}
              dataKey="value"
              stroke="#8c9eff"
              fill="#8c9eff"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="album-analysis-consistency">
        <div>Album Consistency</div>
        <div>{scorePercent}%</div>
      </div>

      <div className="album-analysis-progress-container">
        <div className="album-analysis-progress-bar" style={{ width: `${scorePercent}%` }} />
      </div>

      <p className="album-analysis-label">Score (from CHAOS to STYLE)</p>
    </div>
  );
};

export default AlbumAnalysis;
