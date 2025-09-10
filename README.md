# 🎵 MyMusicMind

**MyMusicMind** is an innovative music web application that combines
Spotify, AI, and analytics to give deeper insights into music,
favorite tracks, and listener preferences.

Video demo of my site: https://youtu.be/nrMMoIYKEvk  
---

## ✨ Features

### 🔑 Authentication & Profile
- Login & logout via **Spotify OAuth**
- Persistent login state (with loading state)
- User profile with avatar, description, email, and account type
- Multilingual support (**i18n**, language stored in DB) EN/UA
- Dropdown menu with Profile, Settings, Help & Support

### 🎨 Interface
- **Home** page with hero section and quick actions
- Header, Footer, responsive sidebar with navigation
- Pages:
  - Liked tracks, albums, playlists, artists, podcasts, episodes
  - Playlist & album pages with track navigation
  - Album/Playlist/Artist details
  - Top Tracks & Recommendations (with SidePanel for details + lyrics)
  - Ratings (rate tracks/albums)
  - About + Help & Support (FAQ + contact form)

### 🎼 Lyrics
- Fetch lyrics (via Genius API)
- Parser that removes section labels (clean lyrics)
- Display lyrics in the SidePanel
- Cache lyrics temporarily

### 🧠 AI Analysis
- Thematic lyrics analysis with LLM (Groq)
- Extracts 3 key topics per track
- Results stored in PostgreSQL DB

### 📊 Album & Playlist Analysis
- Download track audio files via YouTube
- Extract audio features (high-level + low-level) using **librosa / Essentia**
- Visualize high-level audio features in a **spider (radar) chart**
- Calculate **consistency score** (stylistic coherence of album)
- Cache results in DB
- Toggle between album/playlist-level and track-level analysis

### 🎯 Track Clustering
- Automatic clustering (KMeans) of album/playlist tracks
- Dynamic number of clusters (square root rule)
- Interactive scatter plot:
  - each track = a point, colored by cluster
  - click/hover → track details + tags (style, mood, use cases)

### 🎤 Artist Analysis
- Detailed artist information
- Latest releases & similar artists
- Genre Evolution Chart: year-by-year genre dynamics

---

## 🛠 Tech Stack

**Frontend:**
- React
- TailwindCSS + shadcn/ui
- Recharts & interactive charts
- i18n (EN/UA)

**Backend:**
- Flask (Python)
- SQLAlchemy + PostgreSQL
- Flask-Session
- Gunicorn (prod)
- Docker + Render (prod)

**Integrations:**
- Spotify Web API
- Genius (lyrics)
- Groq (LLM analysis)
- YouTube-dlp (track downloads)
- Essentia / librosa (audio analysis)

---

## ⚙️ Local Setup

### 1. Clone repository
```bash
git clone https://github.com/LatkoArtem/MyMusicMind_project.git
cd MyMusicMind_project
```

### 2. Configure .env (inside backend/)
```env
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REDIRECT_URI=http://localhost:5000/callback
DATABASE_URL=postgresql://user:password@localhost:5432/mymusicmind
GENIUS_API_TOKEN=xxx
GROQ_API_KEY=xxx
```

### 3. Run backend
```bash
cd backend
venv\Scripts\activate   # (for Windows, if using venv)
python app.py           # or flask run
```

### 4. Run frontend
```bash
cd frontend
npm start
```

Now:
- API → `http://127.0.0.1:8888`  
- UI → `http://127.0.0.1:3000`

---

## 🌍 Deployment recommendation for Render

- Create a Web Service on Render
- Create and provide Dockerfile
- Add required ENV variables
- Deploy

## 📈 Usage

- Log in with Spotify
- Explore tracks, playlists, albums, artists, podcasts
- View lyrics and AI-extracted topics
- Analyze albums (spider chart + consistency score)
- Explore clusters of tracks (scatter plot)
- View artist genre evolution
- Rate music in the Ratings tab
- Switch languages (EN / UA)

---

## 🗺 Roadmap

- [ ] Recommendations based on extracted topics
- [ ] Artist style comparison
- [ ] New visualizations (heatmap, timelines)
- [ ] Public API access

---

## 📜 License

MIT License © 2025 Artem Latko
