import { useState, useEffect, useRef } from 'react';
import { PARIS_CENTER, SEARCH_RADIUS_METERS, SEARCH_DEBOUNCE_MS } from '../utils/constants';
import { extractCuisineType } from '../utils/helpers';

/**
 * Restaurant search component using Google Places API
 * Provides autocomplete search functionality with debouncing
 */
export default function RestaurantSearch({ setShowPreview, setPreviewData, inModal = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const searchRestaurants = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setShowSuggestions(true);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

        if (!API_KEY) {
          console.error('API Key not found! Make sure your .env file is set up correctly.');
          alert('Clé API Google manquante. Vérifiez votre fichier .env');
          setLoading(false);
          return;
        }

        // Use Google Places API Text Search with more fields
        const response = await fetch(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.priceLevel,places.regularOpeningHours'
            },
            body: JSON.stringify({
              textQuery: `${query} restaurant`,
              locationBias: {
                circle: {
                  center: {
                    latitude: PARIS_CENTER.lat,
                    longitude: PARIS_CENTER.lng
                  },
                  radius: SEARCH_RADIUS_METERS
                }
              },
              maxResultCount: 15,
              languageCode: 'fr'
            }),
            signal: abortControllerRef.current.signal
          }
        );

        const data = await response.json();

        if (data.places) {
          const results = data.places.map((place) => ({
            id: place.id,
            name: place.displayName?.text || 'Unknown',
            address: place.formattedAddress || 'Adresse non disponible',
            lat: place.location?.latitude || 0,
            lon: place.location?.longitude || 0,
            rating: place.rating || null,
            ratingCount: place.userRatingCount || 0,
            phone: place.internationalPhoneNumber || '',
            website: place.websiteUri || '',
            gmapsUri: place.googleMapsUri || '',
            priceLevel: place.priceLevel || null,
            openingHours: place.regularOpeningHours?.weekdayDescriptions || null,
            cuisine: extractCuisineType(place.types)
          }));
          setSuggestions(results);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // Request was cancelled, this is expected
          console.log('Search request cancelled');
        } else {
          console.error('Search error:', error);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const selectRestaurant = (resto) => {
    setPreviewData(resto);
    setShowPreview(true);
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div style={{
      position: 'relative',
      width: inModal ? '100%' : '100%',
      maxWidth: inModal ? '100%' : '500px'
    }}>
      <input
        type="text"
        className="nes-input"
        placeholder="🔍 Chercher un resto..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          searchRestaurants(e.target.value);
        }}
        style={{ width: '100%', fontSize: '12px' }}
      />

      {showSuggestions && searchQuery.length >= 3 && (
        <div
          className="nes-container is-rounded"
          style={{
            position: inModal ? 'relative' : 'absolute',
            top: inModal ? '10px' : '60px',
            left: '0',
            right: '0',
            maxHeight: inModal ? '350px' : '400px',
            overflowY: 'auto',
            zIndex: 1001,
            backgroundColor: 'white'
          }}
          onMouseEnter={() => {
            if (!inModal) {
              // Disable map scrolling when hovering over results
              const map = document.querySelector('.leaflet-container');
              if (map) map.style.pointerEvents = 'none';
            }
          }}
          onMouseLeave={() => {
            if (!inModal) {
              // Re-enable map scrolling
              const map = document.querySelector('.leaflet-container');
              if (map) map.style.pointerEvents = 'auto';
            }
          }}
        >
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                gap: '8px',
                alignItems: 'flex-end'
              }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: '#209cee',
                      border: '2px solid #000',
                      imageRendering: 'pixelated',
                      animation: `pixelBounce 0.6s ease-in-out ${i * 0.15}s infinite`
                    }}
                  />
                ))}
              </div>
              <style>{`
                @keyframes pixelBounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-12px); }
                }
              `}</style>
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <p style={{ fontSize: '11px', padding: '20px', textAlign: 'center' }}>
              😕 Aucun restaurant trouvé
            </p>
          )}
          {!loading && suggestions.map((resto) => (
            <div
              key={resto.id}
              onClick={() => selectRestaurant(resto)}
              className="nes-container"
              style={{
                padding: '12px',
                margin: '8px 0',
                cursor: 'pointer',
                fontSize: '11px',
                backgroundColor: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <strong style={{ fontSize: '12px', flex: 1 }}>{resto.name}</strong>
                {resto.rating && (
                  <span style={{ fontSize: '10px', marginLeft: '10px', whiteSpace: 'nowrap' }}>
                    ⭐ {resto.rating.toFixed(1)} ({resto.ratingCount})
                  </span>
                )}
              </div>
              {resto.cuisine && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                  🍴 {resto.cuisine}
                </div>
              )}
              <div style={{ fontSize: '9px', color: '#999', marginTop: '2px', lineHeight: '1.3' }}>
                📍 {resto.address}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
