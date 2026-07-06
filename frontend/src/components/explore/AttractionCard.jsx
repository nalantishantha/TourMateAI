// One attraction card in the Explore grid: image with category badge + like
// heart, then name / stars / description snippet. The whole card links to the
// detail page; the heart intercepts the click and logs a `like` interaction.

import { Link } from 'react-router-dom'
import AttractionImage from './AttractionImage'
import StarRating from './StarRating'

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.7 10.55 19.4C5.4 14.76 2 11.7 2 7.95 2 4.9 4.42 2.5 7.5 2.5c1.74 0 3.41.81 4.5 2.09A5.99 5.99 0 0 1 16.5 2.5c3.08 0 5.5 2.4 5.5 5.45 0 3.75-3.4 6.81-8.55 11.46L12 20.7Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AttractionCard({ attraction, liked, onToggleLike, index = 0 }) {
  const handleLike = (event) => {
    // The card itself is a link — keep the heart from navigating.
    event.preventDefault()
    event.stopPropagation()
    onToggleLike(attraction.id)
  }

  return (
    <Link
      to={`/explore/${attraction.id}`}
      className="attraction-card"
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
    >
      <div className="attraction-card-media">
        <AttractionImage attraction={attraction} className="attraction-card-img" />
        <span className="media-badge">{attraction.category}</span>
        <button
          type="button"
          className={`like-btn${liked ? ' liked' : ''}`}
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? `Unlike ${attraction.name}` : `Like ${attraction.name}`}
        >
          <HeartIcon filled={liked} />
        </button>
      </div>

      <div className="attraction-card-body">
        <h3 className="attraction-card-name">{attraction.name}</h3>
        <div className="rating-line">
          <StarRating value={attraction.avg_rating} />
          <span className="rating-value">
            {attraction.avg_rating ? attraction.avg_rating.toFixed(1) : 'New'}
          </span>
        </div>
        <p className="attraction-card-desc">{attraction.description}</p>
        <span className="attraction-card-cta" aria-hidden="true">
          View details
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14m0 0-6-6m6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </Link>
  )
}

// Shimmer stand-in matching the card's layout, shown while the grid loads.
export function AttractionCardSkeleton() {
  return (
    <div className="attraction-card skeleton-card" aria-hidden="true">
      <div className="skeleton attraction-card-media" />
      <div className="attraction-card-body">
        <div className="skeleton skeleton-line" style={{ width: '70%', height: '1.1rem' }} />
        <div className="skeleton skeleton-line" style={{ width: '40%' }} />
        <div className="skeleton skeleton-line" style={{ width: '100%' }} />
        <div className="skeleton skeleton-line" style={{ width: '85%' }} />
      </div>
    </div>
  )
}
