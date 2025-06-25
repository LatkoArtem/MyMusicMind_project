const ItemOverview = ({ image, title, analysisLabel, onBack, badges, backLabel, imageClassName = "" }) => {
  return (
    <div className="playlist-overview">
      <button className="back-button" onClick={onBack}>
        ⬅ Back to {backLabel}
      </button>

      <div className="playlist-header">
        <div className="playlist-left">
          {image && <img src={image} alt={title} className={`album-cover ${imageClassName}`} />}
          <div className="playlist-badges">
            {badges.map(({ label, value }) => (
              <div className="badge" key={label}>
                <span className="badge-label">{label}</span>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="playlist-right">
          <h2 className="playlist-info-title">{title}</h2>
          <p className="playlist-analysis">{analysisLabel}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemOverview;
