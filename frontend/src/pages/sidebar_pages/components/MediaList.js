const MediaList = ({
  items,
  viewMode = "grid",
  onItemClick,
  getImage,
  getTitle,
  getSubtitle,
  itemKey = (item, index) => item.id || index,
  type,
}) => {
  return (
    <div className={viewMode === "grid" ? "songs-grid" : "songs-list"}>
      {items.map((item, index) => (
        <div
          className={viewMode === "grid" ? "song-card" : "song-row"}
          key={itemKey(item, index)}
          onClick={() => onItemClick(item)}
        >
          <img
            src={getImage(item)}
            alt={getTitle(item)}
            className={`album-cover ${type === "artist" ? "artist-cover" : ""}`}
          />
          <div className="songs-info">
            <div className="track-name">{getTitle(item)}</div>
            <div className="track-artists">{getSubtitle(item)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaList;
