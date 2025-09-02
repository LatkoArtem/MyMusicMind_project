export const fetchRecommendations = async (userId, topTracks, topArtists, spotifyAccessToken) => {
  try {
    const limitedTopTracks = (topTracks || []).slice(0, 25).filter((t) => t && t.id);
    const limitedTopArtists = (topArtists || []).slice(0, 10).filter((a) => a && a.id);

    const res = await fetch("http://127.0.0.1:8888/spotify/recommendations", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        topTracks: limitedTopTracks,
        topArtists: limitedTopArtists,
        spotifyAccessToken,
      }),
    });

    if (!res.ok) throw new Error("Failed to fetch recommendations");

    const data = await res.json();
    console.log("Recommendations fetched:", data);

    return {
      tracks: data.tracks || [],
      artists: data.artists || [],
    };
  } catch (err) {
    console.error("Error in fetchRecommendations:", err);
    return { tracks: [], artists: [] };
  }
};
