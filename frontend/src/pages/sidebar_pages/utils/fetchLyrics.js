import axios from "axios";

export const fetchLyrics = async (track, setLyrics, setIsLoadingLyrics) => {
  setIsLoadingLyrics(true);
  setLyrics(null);
  try {
    const response = await axios.get("http://127.0.0.1:8888/get_lyrics", {
      params: {
        song: track.name,
        artist: track.artists[0].name,
        track_id: track.id,
      },
    });

    const lyrics = response.data.lyrics;
    if (!lyrics || lyrics.trim() === "") {
      setLyrics(null);
    } else {
      setLyrics(lyrics);
    }
  } catch (err) {
    console.error("Failed to fetch lyrics", err);
    setLyrics(null);
  } finally {
    setIsLoadingLyrics(false);
  }
};
