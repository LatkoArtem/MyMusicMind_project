import axios from "axios";

export const fetchLyrics = async (track, setLyrics, setIsLoadingLyrics) => {
  setIsLoadingLyrics(true);
  setLyrics(null);
  try {
    const response = await axios.get("http://127.0.0.1:8888/get_lyrics", {
      params: {
        song: track.name,
        artist: track.artists[0].name,
      },
    });
    setLyrics(response.data.lyrics);
  } catch (err) {
    setLyrics("Lyrics not available 😢");
    console.error("Failed to fetch lyrics", err);
  } finally {
    setIsLoadingLyrics(false);
  }
};
