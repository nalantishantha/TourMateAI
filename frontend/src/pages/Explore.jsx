// Explore — the main discovery page. A full-width photo hero with live search
// and photo-thumbnail category chips sits over a responsive grid of attraction
// cards, with skeleton loading, an empty state, and load-more pagination.
//
// Data: GET /api/attractions (search/category/sort/page). Category chips are
// derived once from the first unfiltered load so they cover whatever is seeded.

import { useEffect, useState } from 'react'
import PageContainer from '../components/layout/PageContainer'
import AttractionCard, { AttractionCardSkeleton } from '../components/explore/AttractionCard'
import HotelCard, { HotelCardSkeleton } from '../components/explore/HotelCard'
import useLikes from '../hooks/useLikes'
import { fetchAttractions } from '../services/attractions'
import { fetchHotels } from '../services/hotels'
import { categoryScene, scenes } from '../assets/photos'
import '../styles/explore.css'

const PER_PAGE = 8
const SEARCH_DEBOUNCE_MS = 300
const SKELETON_COUNT = 8

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function Explore() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('') // debounced value actually sent to the API
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const [attractions, setAttractions] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  
  const [hotels, setHotels] = useState([])
  const [hotelPagination, setHotelPagination] = useState(null)
  const [hotelPage, setHotelPage] = useState(1)
  const [loadingHotels, setLoadingHotels] = useState(true)
  const [loadingMoreHotels, setLoadingMoreHotels] = useState(false)
  const [hotelError, setHotelError] = useState(null)

  const [reloadKey, setReloadKey] = useState(0) // bump to refetch after an error

  const { liked, toggleLike } = useLikes()

  // Debounce keystrokes into the `search` param.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
      setHotelPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    if (page === 1) setLoading(true)
    else setLoadingMore(true)
    setError(null)

    fetchAttractions({ search, category, page, perPage: PER_PAGE })
      .then((data) => {
        if (cancelled) return
        setAttractions((prev) =>
          page === 1 ? data.attractions : [...prev, ...data.attractions]
        )
        setPagination(data.pagination)
        // Build the chip list once, from the first unfiltered result set.
        if (!search && !category) {
          setCategories((prev) =>
            prev.length
              ? prev
              : [...new Set(data.attractions.map((a) => a.category).filter(Boolean))].sort()
          )
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load attractions. Please try again.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setLoadingMore(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [search, category, page, reloadKey])

  useEffect(() => {
    let cancelled = false
    if (hotelPage === 1) setLoadingHotels(true)
    else setLoadingMoreHotels(true)
    setHotelError(null)

    fetchHotels({ search, page: hotelPage, perPage: PER_PAGE })
      .then((data) => {
        if (cancelled) return
        setHotels((prev) =>
          hotelPage === 1 ? data.hotels : [...prev, ...data.hotels]
        )
        setHotelPagination({
          page: data.current_page,
          total_pages: data.pages,
          total: data.total
        })
      })
      .catch(() => {
        if (!cancelled) setHotelError('Could not load hotels.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingHotels(false)
          setLoadingMoreHotels(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [search, hotelPage, reloadKey])

  const pickCategory = (value) => {
    setCategory(value)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setCategory('')
    setPage(1)
    setHotelPage(1)
  }

  const hasFilters = Boolean(search || category)
  const hasMore = pagination && pagination.page < pagination.total_pages
  const showSkeletons = loading && page === 1

  const hasMoreHotels = hotelPagination && hotelPagination.page < hotelPagination.total_pages
  const showHotelSkeletons = loadingHotels && hotelPage === 1

  return (
    <PageContainer>
      <section className="explore-hero">
        {/* Wider crop than the shared scene position: keep the summit in frame. */}
        <img
          className="explore-hero-photo"
          src={scenes.sigiriyaAerial.src}
          style={{ objectPosition: '50% 32%' }}
          alt=""
          aria-hidden="true"
        />
        <div className="explore-hero-scrim" aria-hidden="true" />
        <span className="explore-hero-kicker">Discover Sri Lanka</span>
        <h1 className="explore-hero-title">Where will the island take you?</h1>
        <p className="explore-hero-sub">
          Ancient fortresses, misty tea country, leopard trails, and quiet
          crescent bays — search them all, or browse by mood.
        </p>

        <div className="explore-search">
          <span className="explore-search-icon">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search attractions — try “temple” or “beach”…"
            aria-label="Search attractions"
          />
          {searchInput && (
            <button
              type="button"
              className="explore-search-clear"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="explore-chips" role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`chip${category === '' ? ' chip-active' : ''}`}
            onClick={() => pickCategory('')}
          >
            All
          </button>
          {categories.map((c) => {
            const thumb = categoryScene(c)
            return (
              <button
                key={c}
                type="button"
                className={`chip${category === c ? ' chip-active' : ''}`}
                onClick={() => pickCategory(c)}
              >
                {thumb && (
                  <img
                    className="chip-thumb"
                    src={thumb.src}
                    style={{ objectPosition: thumb.position }}
                    alt=""
                    aria-hidden="true"
                  />
                )}
                {c}
              </button>
            )
          })}
        </div>
      </section>

      <div className="explore-toolbar" aria-live="polite" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
        <h2>Visiting Places</h2>
        {!showSkeletons && !error && pagination && (
          <p className="explore-count">
            Showing <strong>{attractions.length}</strong> of{' '}
            <strong>{pagination.total}</strong> places
            {category && (
              <>
                {' '}in <strong>{category}</strong>
              </>
            )}
            {search && (
              <>
                {' '}matching “<strong>{search}</strong>”
              </>
            )}
          </p>
        )}
      </div>

      {error ? (
        <div className="explore-empty card">
          <span className="explore-empty-icon" aria-hidden="true">
            ⚠️
          </span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setPage(1)
              setReloadKey((k) => k + 1)
            }}
          >
            Try again
          </button>
        </div>
      ) : showSkeletons ? (
        <div className="attraction-grid" aria-busy="true" aria-label="Loading attractions">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <AttractionCardSkeleton key={i} />
          ))}
        </div>
      ) : attractions.length === 0 ? (
        <div className="explore-empty card">
          <span className="explore-empty-icon" aria-hidden="true">
            🧭
          </span>
          <h3>No places match that</h3>
          <p>
            We couldn't find any attractions
            {search && <> for “{search}”</>}
            {category && <> in {category}</>}. Try a different word or browse
            everything.
          </p>
          {hasFilters && (
            <button type="button" className="btn btn-primary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="attraction-grid">
            {attractions.map((attraction, i) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                index={i}
                liked={liked.has(attraction.id)}
                onToggleLike={toggleLike}
              />
            ))}
          </div>

          {hasMore && (
            <div className="explore-more">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPage((p) => p + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more places'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Hotels Section */}
      <div className="explore-toolbar" aria-live="polite" style={{ marginTop: '4rem', marginBottom: '1rem' }}>
        <h2>Places to Stay</h2>
        {!showHotelSkeletons && !hotelError && hotelPagination && (
          <p className="explore-count">
            Showing <strong>{hotels.length}</strong> of{' '}
            <strong>{hotelPagination.total}</strong> hotels
            {search && (
              <>
                {' '}matching “<strong>{search}</strong>”
              </>
            )}
          </p>
        )}
      </div>

      {hotelError ? (
        <div className="explore-empty card">
          <span className="explore-empty-icon" aria-hidden="true">
            ⚠️
          </span>
          <h3>Something went wrong</h3>
          <p>{hotelError}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setHotelPage(1)
              setReloadKey((k) => k + 1)
            }}
          >
            Try again
          </button>
        </div>
      ) : showHotelSkeletons ? (
        <div className="attraction-grid" aria-busy="true" aria-label="Loading hotels">
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <HotelCardSkeleton key={`hotel-skeleton-${i}`} />
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div className="explore-empty card">
          <span className="explore-empty-icon" aria-hidden="true">
            🛏️
          </span>
          <h3>No hotels found</h3>
          <p>
            We couldn't find any accommodations
            {search && <> for “{search}”</>}.
          </p>
          {hasFilters && (
            <button type="button" className="btn btn-primary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="attraction-grid">
            {hotels.map((hotel, i) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                index={i}
              />
            ))}
          </div>

          {hasMoreHotels && (
            <div className="explore-more">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHotelPage((p) => p + 1)}
                disabled={loadingMoreHotels}
              >
                {loadingMoreHotels ? 'Loading…' : 'Load more hotels'}
              </button>
            </div>
          )}
        </>
      )}

    </PageContainer>
  )
}
