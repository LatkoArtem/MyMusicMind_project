import axios from "axios";
import { useEffect, useState } from "react";
import "./LikedSongsPage.css";

const PlaylistsPage = () => {
  const [playlists, setPlaylists] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState(null);
  const [showTracks, setShowTracks] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8888/playlists", { withCredentials: true })
      .then((res) => {
        setPlaylists(res.data.items || []);
      })
      .catch((err) => setError(err.response?.data || "Error fetching playlists"));
  }, []);

  const fetchPlaylistTracks = (playlist) => {
    setShowTracks(true);
    setSelectedPlaylist(playlist);
    axios
      .get(`http://127.0.0.1:8888/playlists/${playlist.id}/tracks`, { withCredentials: true })
      .then((res) => setPlaylistTracks(res.data.items))
      .catch((err) => setError(err.response?.data || "Error fetching tracks"));
  };

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    setPlaylistTracks(null);
    setShowTracks(false);
    setSelectedTrack(null);
  };

  if (error) return <div>Error: {JSON.stringify(error)}</div>;
  if (!playlists) return <div>Loading playlists...</div>;

  return (
    <div className="liked-songs-page">
      {!showTracks ? (
        <>
          <h1 className="page-title">Playlists</h1>
          <div className="songs-grid">
            {playlists.map((playlist) => (
              <div key={playlist.id} className="song-card" onClick={() => fetchPlaylistTracks(playlist)}>
                <img src={playlist.images?.[0]?.url} alt={playlist.name} className="album-cover" />
                <div className="track-info">
                  <div className="track-name">{playlist.name}</div>
                  <div className="track-artists">{playlist.tracks.total} songs</div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="playlist-overview">
            <button className="back-button" onClick={handleBackToPlaylists}>
              ⬅ Back to playlists
            </button>

            <div className="playlist-header">
              <img src={selectedPlaylist.images?.[0]?.url} alt={selectedPlaylist.name} className="album-cover" />
              <div className="playlist-details">
                <h2 className="track-name">{selectedPlaylist.name}</h2>
                <p className="track-description">{selectedPlaylist.description}</p>
                <p className="track-artists">{selectedPlaylist.tracks.total} tracks</p>
              </div>
            </div>
          </div>

          <div className="songs-list">
            {playlistTracks ? (
              playlistTracks.map(({ track }) => (
                <div key={track.id} className="song-row" onClick={() => setSelectedTrack(track)}>
                  <img src={track.album.images?.[0]?.url} alt={track.name} className="album-cover" />
                  <div className="track-info">
                    <div className="track-name">{track.name}</div>
                    <div className="track-artists">{track.artists.map((a) => a.name).join(", ")}</div>
                  </div>
                </div>
              ))
            ) : (
              <p>Loading tracks...</p>
            )}
          </div>
        </>
      )}

      {selectedTrack && (
        <div className="side-panel">
          <button className="close-button" onClick={() => setSelectedTrack(null)}>
            ×
          </button>
          <img src={selectedTrack.album.images?.[0]?.url} alt={selectedTrack.name} className="details-cover" />
          <h2>{selectedTrack.name}</h2>
          <h3>{selectedTrack.artists.map((a) => a.name).join(", ")}</h3>
          <p>
            <strong>Album:</strong> {selectedTrack.album.name}
          </p>
          <p>
            <strong>Release date:</strong> {selectedTrack.album.release_date}
          </p>
          <p>
            <strong>Duration:</strong>
            {Math.floor(selectedTrack.duration_ms / 60000)}:
            {String(Math.floor((selectedTrack.duration_ms % 60000) / 1000)).padStart(2, "0")}
          </p>
          <a
            href={selectedTrack.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 168 168" fill="white">
              <path d="M84 0C37.7 0 0 37.7 0 84s37.7 84 84 84 84-37.7 84-84S130.3 0 84 0zm38.6 120.1c-1.3 2.1-4 2.8-6.1 1.5-16.8-10.2-38-12.5-63-6.8-2.4.5-4.8-1-5.3-3.4-.5-2.4 1-4.8 3.4-5.3 28-6.2 52.3-3.6 71.1 8 2 1.3 2.7 4 1.5 6zm8.7-20.6c-1.6 2.6-5.1 3.4-7.7 1.8-19.2-11.8-48.4-15.2-71.1-8.2-3 .9-6.2-.8-7.1-3.8-.9-3 .8-6.2 3.8-7.1 27.1-8 60.2-4.1 83 10.1 2.6 1.6 3.4 5.1 1.8 7.2zm.2-22.2c-23-13.7-61.2-15-83.5-8.1-3.5 1.1-7.2-.9-8.3-4.4-1.1-3.5.9-7.2 4.4-8.3 26.5-8 69.1-6.5 96.9 9.6 3.1 1.8 4.1 5.8 2.3 8.9-1.7 2.8-5.5 3.9-8.3 2.3z" />
            </svg>
            Open in Spotify
          </a>
          <div className="lyrics-section">
            <h4>Lyrics (sample)</h4>
            <pre className="lyrics-text">We don't have the lyrics API yet, but you can imagine them here 🎵</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
