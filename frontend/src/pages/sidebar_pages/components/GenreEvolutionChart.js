import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

const GenreEvolutionChart = ({ data }) => {
  const chartData = useMemo(() => {
    const years = Object.keys(data).sort();
    return years.map((year) => ({
      year,
      total: data[year].totalTracks,
      genres: data[year].genres,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      const yearData = payload[0].payload;
      const genreEntries = Object.entries(yearData.genres).filter(([, count]) => count > 0);

      return (
        <div style={{ background: "#2a2a2a", padding: 10 }}>
          <strong>{label}</strong>
          <div>Total tracks: {yearData.total}</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {genreEntries.map(([genre, count]) => (
              <li key={genre}>
                {genre}: {count}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: 400 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total" fill="#4caf50" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GenreEvolutionChart;
