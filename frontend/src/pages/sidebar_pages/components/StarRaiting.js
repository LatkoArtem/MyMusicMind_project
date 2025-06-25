const StarRating = ({ popularity }) => {
  const totalStars = 5;
  const halfStarsCount = Math.round(popularity / 10);
  const stars = [];

  for (let i = 1; i <= totalStars; i++) {
    const starHalfIndex = i * 2;

    if (starHalfIndex <= halfStarsCount) {
      stars.push(
        <span key={i} className="star full">
          ★
        </span>
      );
    } else if (starHalfIndex - 1 === halfStarsCount) {
      stars.push(
        <span key={i} className="star half">
          ★
        </span>
      );
    } else {
      stars.push(
        <span key={i} className="star empty">
          ★
        </span>
      );
    }
  }

  return <div className="stars">{stars}</div>;
};

export default StarRating;
