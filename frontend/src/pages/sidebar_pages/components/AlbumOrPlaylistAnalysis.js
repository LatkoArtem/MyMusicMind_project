import { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Select from "react-select";
import "../styles/AlbumOrPlaylistAnalysis.css";

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

const clusterColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff6f61",
  "#6a5acd",
  "#ffb347",
  "#40e0d0",
  "#ff69b4",
  "#8fbc8f",
];

const AlbumOrPlaylistAnalysis = ({
  analysisLabel,
  MeanFeatures,
  consistencyScore,
  trackFeatures = [],
  trackNames = [],
  trackClusters = [],
}) => {
  const [viewMode, setViewMode] = useState("album");
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [scatterData, setScatterData] = useState([]);

  // Стейти для автоматичного домену осей
  const [xDomain, setXDomain] = useState([0, 1]);
  const [yDomain, setYDomain] = useState([0, 1]);

  useEffect(() => {
    if (trackFeatures.length > 0 && trackClusters.length > 0) {
      const data = trackFeatures.map((tf, idx) => {
        let features = tf;
        if (typeof tf === "string") features = JSON.parse(tf);
        if (features.features) features = features.features;

        const tags = tf.tags || [];

        return {
          x: features[1],
          y: features[2],
          cluster: trackClusters[idx],
          index: idx,
          name: trackNames[idx] || `Track ${idx + 1}`,
          tags,
        };
      });

      setScatterData(data);

      if (data.length > 0) {
        const xValues = data.map((d) => d.x);
        const yValues = data.map((d) => d.y);

        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);

        const paddingX = (xMax - xMin) * 0.1 || 0.05;
        const paddingY = (yMax - yMin) * 0.1 || 0.05;

        setXDomain([Math.max(0, xMin - paddingX), Math.min(1, xMax + paddingX)]);
        setYDomain([Math.max(0, yMin - paddingY), Math.min(1, yMax + paddingY)]);
      } else {
        setXDomain([0, 1]);
        setYDomain([0, 1]);
      }
    }
  }, [trackFeatures, trackClusters, trackNames]);

  const label = analysisLabel === "playlists" ? "Playlist" : "Album";

  if ((!MeanFeatures || MeanFeatures.length === 0) && trackFeatures.length === 0)
    return <p>No analysis data available.</p>;

  const albumFeaturesArr = typeof MeanFeatures === "string" ? JSON.parse(MeanFeatures) : MeanFeatures;

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

  const renderCustomPoint = (props) => {
    const { cx, cy, payload } = props;
    const radius = 8;
    const fillColor = clusterColors[payload.cluster] || "#8884d8";
    return <circle cx={cx} cy={cy} r={radius} fill={fillColor} />;
  };

  return (
    <div className="album-analysis-container">
      <div className="audio-features">
        <div className="album-analysis-header">
          <h3 className="album-analysis-title">Audio Features</h3>

          <div className="album-analysis-toggle-buttons">
            <button
              onClick={() => setViewMode("album")}
              className={`album-analysis-button ${viewMode === "album" ? "active" : ""}`}
            >
              {label}
            </button>
            <button
              onClick={() => setViewMode("track")}
              className={`album-analysis-button ${viewMode === "track" ? "active" : ""}`}
            >
              {analysisLabel === "playlist" && trackFeatures.length > 50 ? "Track (Top 50)" : "Track"}
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
          <div>{label} Consistency</div>
          <div>{scorePercent}%</div>
        </div>

        <div className="album-analysis-progress-container">
          <div className="album-analysis-progress-bar" style={{ width: `${scorePercent}%` }} />
        </div>

        <p className="album-analysis-label">Score (from CHAOS to STYLE)</p>
      </div>

      <div className="tracks-clusters">
        {scatterData.length > 0 && (
          <>
            <div className="album-analysis-header">
              <h3 className="album-analysis-title">Tracks Clusters Visualization</h3>
            </div>
            <div className="scatter-chart-container">
              <ResponsiveContainer width="100%" height={470}>
                <ScatterChart
                  onClick={(e) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      const idx = e.activePayload[0].payload.index;
                      setSelectedTrackIndex(idx);
                      setViewMode("track");
                    }
                  }}
                >
                  <XAxis type="number" dataKey="x" domain={xDomain} axisLine={false} tickLine={false} tick={false} />
                  <YAxis type="number" dataKey="y" domain={yDomain} axisLine={false} tickLine={false} tick={false} />
                  <Tooltip
                    cursor={false}
                    isAnimationActive={false}
                    formatter={(value, name) => [value.toFixed(3), name]}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        return (
                          <div className={`tooltip-box ${active ? "active" : ""}`}>
                            <div
                              style={{
                                background: "#222",
                                padding: 10,
                                borderRadius: 6,
                                color: "#fff",
                                maxWidth: 250,
                              }}
                            >
                              <strong>{p.name}</strong>
                              <br />
                              Cluster: {p.cluster}
                              <br />
                              {p.tags && p.tags.length > 0 && (
                                <>
                                  Tags:
                                  <ul style={{ fontStyle: "italic" }}>
                                    {p.tags.map((tag, i) => (
                                      <li key={i}>{tag}</li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Tracks" data={scatterData} shape={renderCustomPoint} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlbumOrPlaylistAnalysis;
