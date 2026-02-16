import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, Tooltip } from "react-leaflet";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import L from "leaflet";

import "./index.css";

// === CONSTANTS ===
const SEARCH_RADIUS_METERS = 15000;
const MAP_ZOOM_LEVEL_DETAIL = 17;
const ERROR_TOAST_DURATION = 5000;
const SEARCH_DEBOUNCE_MS = 300;
const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };
const MAP_ZOOM_DEFAULT_MOBILE = 11;
const MAP_ZOOM_DEFAULT_DESKTOP = 12;

// Common cuisine types for dropdown
const CUISINE_TYPES = [
  "Italien",
  "Libanais",
  "Turque",
  "Kebab",
  "Fast Food",
  "Pizza",
  "Japonais",
  "Chinois",
  "Thaï",
  "Vietnamien",
  "Coréen",
  "Indien",
  "Mexicain",
  "Américain",
  "Burger",
  "Steakhouse",
  "Méditerranéen",  
  "Café",
  "Boulangerie",
  "Autre"
];

// --- ERROR TOAST COMPONENT ---
function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, ERROR_TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      left: '20px',
      zIndex: 9999,
      maxWidth: '400px',
      margin: '0 auto',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div className="nes-container is-rounded is-dark" style={{
        backgroundColor: '#d95941',
        color: 'white',
        padding: '15px'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
          <div style={{flex: 1, fontSize: '11px', lineHeight: '1.4'}}>
            <strong style={{fontSize: '12px'}}>❌ Erreur</strong>
            <div style={{marginTop: '5px'}}>{message}</div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// --- MAP EVENTS COMPONENT ---
// This component accesses the map instance and passes it to parent
function MapEvents({ setMapInstance }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);
  
  return null;
}

// --- CUSTOM PIXEL PIN ---
const createPixelPin = (restaurantType) => {
  // Map restaurant types to emojis
  const iconMap = {
    'Italien': '🇮🇹',
    'Pizza': '🍕',
    'Libanais': '🇱🇧',
    'Turque': '🇹🇷',
    'Kebab': '🥙',
    'Fast Food': '🍔',
    'Burger': '🍔',
    'Japonais': '🍱',
    'Sushi': '🍣',
    'Chinois': '🥡',
    'Thaï': '🍜',
    'Vietnamien': '🍜',
    'Coréen': '🍜',
    'Indien': '🍛',
    'Mexicain': '🌮',
    'Américain': '🍔',
    'Steakhouse': '🥩',
    'Méditerranéen': '🫒',
    'Café': '☕',
    'Boulangerie': '🥐',
    'Autre': '🍽️'
  };

  const emoji = iconMap[restaurantType] || '🍽️';

  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #e76e55;
        border: 3px solid #000;
        box-shadow: 
          inset -3px -3px 0 #d95941,
          inset 3px 3px 0 #ff9580,
          4px 4px 0 rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        position: relative;
        image-rendering: pixelated;
      ">${emoji}</div>
    `,
    className: 'pixel-marker-block',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};


// --- RESTAURANT SEARCH COMPONENT (GOOGLE PLACES API) ---
function RestaurantSearch({ setShowPreview, setPreviewData, inModal = false }) {
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

  // Helper function to extract cuisine type from Google place types
  const extractCuisineType = (types) => {
    if (!types) return '';
    
    const cuisineMap = {
      'chinese_restaurant': 'Chinois',
      'japanese_restaurant': 'Japonais',
      'italian_restaurant': 'Italien',
      'french_restaurant': 'Français',
      'indian_restaurant': 'Indien',
      'thai_restaurant': 'Thaï',
      'vietnamese_restaurant': 'Vietnamien',
      'korean_restaurant': 'Coréen',
      'mexican_restaurant': 'Mexicain',
      'american_restaurant': 'Américain',
      'mediterranean_restaurant': 'Méditerranéen',
      'seafood_restaurant': 'Fruits de mer',
      'steak_house': 'Steakhouse',
      'sushi_restaurant': 'Sushi',
      'pizza_restaurant': 'Pizza',
      'hamburger_restaurant': 'Burger',
      'fast_food_restaurant': 'Fast Food',
      'cafe': 'Café',
      'bakery': 'Boulangerie'
    };

    for (let type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }
    return ''; // Return empty string instead of 'Restaurant'
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
            <div style={{padding: '20px', textAlign: 'center'}}>
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
            <p style={{fontSize: '11px', padding: '20px', textAlign: 'center'}}>
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
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <strong style={{fontSize: '12px', flex: 1}}>{resto.name}</strong>
                {resto.rating && (
                  <span style={{fontSize: '10px', marginLeft: '10px', whiteSpace: 'nowrap'}}>
                    ⭐ {resto.rating.toFixed(1)} ({resto.ratingCount})
                  </span>
                )}
              </div>
              {resto.cuisine && (
                <div style={{fontSize: '10px', color: '#666', marginTop: '4px'}}>
                  🍴 {resto.cuisine}
                </div>
              )}
              <div style={{fontSize: '9px', color: '#999', marginTop: '2px', lineHeight: '1.3'}}>
                📍 {resto.address}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [restos, setRestos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedResto, setSelectedResto] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapRef, setMapRef] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", 
    type: "", 
    customType: "",
    halal: "", 
    customHalal: "", 
    googleRating: null,
    googleRatingCount: 0,
    googleAddress: "",
    googlePhone: "",
    googleWebsite: "",
    googlePriceLevel: null,
    googleOpeningHours: null,
    userRatings: [],
    coords: null, 
    gmaps: "",
    // Initial rating fields - NOW REQUIRED
    initialUserName: "",
    initialRating: "",
    initialRatingComment: ""
  });

  // Rating form state
  const [ratingData, setRatingData] = useState({
    userName: "",
    rating: "",
    comment: ""
  });

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Error logging function with improved user-friendly messages
  const logError = useCallback(async (errorMessage, errorDetails = {}) => {
    console.error('Error:', errorMessage, errorDetails);
    
    // Show user-friendly error message
    let userMessage = errorMessage;
    
    // Check for common Firebase error codes
    if (errorDetails.error) {
      const errorCode = errorDetails.error;
      
      if (errorCode.includes('permission-denied')) {
        userMessage = "❌ Vous n'avez pas la permission d'effectuer cette action. Vérifiez vos droits d'accès.";
      } else if (errorCode.includes('unavailable')) {
        userMessage = "❌ Connexion perdue. Vérifiez votre connexion internet et réessayez.";
      } else if (errorCode.includes('not-found')) {
        userMessage = "❌ Élément introuvable. Il a peut-être été supprimé.";
      } else if (errorCode.includes('already-exists')) {
        userMessage = "❌ Cet élément existe déjà dans la base de données.";
      } else if (errorCode.includes('invalid-argument')) {
        userMessage = "❌ Données invalides. Vérifiez les informations saisies.";
      } else if (errorCode.includes('deadline-exceeded') || errorCode.includes('timeout')) {
        userMessage = "❌ La requête a pris trop de temps. Veuillez réessayer.";
      }
    }
    
    // Show toast to user
    setError(userMessage);

    // Log to Firebase (optional)
    try {
      await addDoc(collection(db, "error_logs"), {
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }, []);

  // === EXTRACTED FUNCTION: Refresh Restaurants ===
  const refreshRestaurants = useCallback(async () => {
    try {
      const q = query(collection(db, "restaurants"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      setRestos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      logError("Erreur lors du chargement des restaurants", { 
        context: 'refreshRestaurants', 
        error: err.message 
      });
    }
  }, [logError]);

  useEffect(() => {
    refreshRestaurants();
  }, [refreshRestaurants]);

  // Helper to get price level display
  const getPriceDisplay = (priceLevel) => {
    if (!priceLevel) return null;
    const levels = {
      'PRICE_LEVEL_FREE': 'Gratuit',
      'PRICE_LEVEL_INEXPENSIVE': '€',
      'PRICE_LEVEL_MODERATE': '€€',
      'PRICE_LEVEL_EXPENSIVE': '€€€',
      'PRICE_LEVEL_VERY_EXPENSIVE': '€€€€'
    };
    return levels[priceLevel] || null;
  };

  const saveResto = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.halal || formData.halal === "") {
        throw new Error("Veuillez sélectionner une certification halal");
      }

      if (!formData.type || formData.type === "") {
        throw new Error("Veuillez sélectionner un type de cuisine");
      }

      if (formData.type === "Autre" && (!formData.customType || formData.customType.trim() === "")) {
        throw new Error("Veuillez préciser le type de cuisine");
      }

      if (!formData.coords || !Array.isArray(formData.coords) || formData.coords.length !== 2) {
        throw new Error("Coordonnées manquantes. Veuillez sélectionner un restaurant depuis la recherche.");
      }

      // VALIDATION: Initial rating is now required
      if (!formData.initialUserName || formData.initialUserName.trim() === "") {
        throw new Error("Veuillez entrer votre nom pour la note initiale");
      }

      if (!formData.initialRating || formData.initialRating === "") {
        throw new Error("Veuillez donner une note initiale au restaurant");
      }

      // VALIDATION: Check rating range (1-5)
      const rating = parseFloat(formData.initialRating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error("La note doit être comprise entre 1 et 5");
      }
      
      setLoading(true);
      const finalHalal = formData.halal === "Autre" ? formData.customHalal : formData.halal;
      const finalType = formData.type === "Autre" ? formData.customType : formData.type;
      
      // Build initial user ratings array - now always includes at least one rating
      const initialUserRatings = [{
        userName: formData.initialUserName,
        rating: rating,
        comment: formData.initialRatingComment || "",
        date: new Date().toISOString()
      }];
      
      await addDoc(collection(db, "restaurants"), { 
        name: formData.name,
        type: finalType,
        halal: finalHalal,
        googleRating: formData.googleRating,
        googleRatingCount: formData.googleRatingCount,
        googleAddress: formData.googleAddress,
        googlePhone: formData.googlePhone,
        googleWebsite: formData.googleWebsite,
        googlePriceLevel: formData.googlePriceLevel,
        googleOpeningHours: formData.googleOpeningHours,
        userRatings: initialUserRatings,
        coords: formData.coords,
        gmaps: formData.gmaps
      });
      
      // Reset form to default values after successful save
      setFormData({
        name: "", 
        type: "", 
        customType: "",
        halal: "", 
        customHalal: "", 
        googleRating: null,
        googleRatingCount: 0,
        googleAddress: "",
        googlePhone: "",
        googleWebsite: "",
        googlePriceLevel: null,
        googleOpeningHours: null,
        userRatings: [],
        coords: null, 
        gmaps: "",
        initialUserName: "",
        initialRating: "",
        initialRatingComment: ""
      });
      
      setShowModal(false);
      
      // Refresh the restaurant list using extracted function
      await refreshRestaurants();
      
    } catch (err) {
      logError(err.message, { 
        context: 'saveResto',
        formData: formData
      });
    } finally {
      setLoading(false);
    }
  };

  const addUserRating = async (e) => {
    e.preventDefault();
    
    try {
      if (!ratingData.userName || ratingData.userName.trim() === "") {
        throw new Error("Veuillez entrer votre nom");
      }

      if (!ratingData.rating || ratingData.rating === "") {
        throw new Error("Veuillez donner une note");
      }

      // VALIDATION: Check rating range (1-5)
      const rating = parseFloat(ratingData.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        throw new Error("La note doit être comprise entre 1 et 5");
      }
      
      setLoading(true);
      
      const newRating = {
        userName: ratingData.userName,
        rating: rating,
        comment: ratingData.comment,
        date: new Date().toISOString()
      };
      
      const updatedRatings = [...(selectedResto.userRatings || []), newRating];
      
      const restoRef = doc(db, "restaurants", selectedResto.id);
      await updateDoc(restoRef, {
        userRatings: updatedRatings
      });
      
      // Reset rating form
      setRatingData({
        userName: "",
        rating: 5,
        comment: ""
      });
      
      setShowRatingModal(false);
      
      // Refresh the restaurant list using extracted function
      await refreshRestaurants();
      
      // Update selected resto
      const updatedResto = restos.find(r => r.id === selectedResto.id);
      if (updatedResto) {
        setSelectedResto(updatedResto);
      }
      
    } catch (err) {
      logError(err.message, {
        context: 'addUserRating',
        restoId: selectedResto?.id,
        ratingData: ratingData
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmAddRestaurant = () => {
    if (previewData) {
      setFormData({
        name: previewData.name,
        type: previewData.cuisine || "",
        customType: "",
        halal: "",
        customHalal: "",
        googleRating: previewData.rating || null,
        googleRatingCount: previewData.ratingCount || 0,
        googleAddress: previewData.address || "",
        googlePhone: previewData.phone || "",
        googleWebsite: previewData.website || "",
        googlePriceLevel: previewData.priceLevel || null,
        googleOpeningHours: previewData.openingHours || null,
        userRatings: [],
        coords: [previewData.lat, previewData.lon],
        gmaps: previewData.gmapsUri || `https://www.google.com/maps?q=${previewData.lat},${previewData.lon}`,
        initialUserName: "",
        initialRating: "",
        initialRatingComment: ""
      });
      setShowPreview(false);
      setShowSearchModal(false);
      setShowModal(true);
    }
  };

  const pickRandomRestaurant = () => {
    if (restos.length === 0) {
      setError("Aucun restaurant dans la liste!");
      return;
    }

    // Pick a random restaurant
    const randomResto = restos[Math.floor(Math.random() * restos.length)];
    
    // Show in side panel
    setSelectedResto(randomResto);
    setShowSidePanel(true);
    
    if (mapRef) {
      // Fly to the marker location with animation
      mapRef.flyTo(randomResto.coords, MAP_ZOOM_LEVEL_DETAIL, {
        duration: 1.5
      });
    }
  };

  const handleMarkerClick = (resto) => {
    setSelectedResto(resto);
    setShowSidePanel(true);
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      
      {/* Error Toast */}
      {error && (
        <ErrorToast 
          message={error} 
          onClose={() => setError(null)} 
        />
      )}

      {/* UI BAS GAUCHE - Responsive */}
      <div className="ui-overlay" style={{
        top: 'auto', 
        bottom: isMobile ? '10px' : '20px', 
        left: isMobile ? '10px' : '20px', 
        right: isMobile ? '10px' : 'auto',
        zIndex: 900
      }}>
        <div className="nes-container is-rounded is-dark" style={{
          padding: isMobile ? '10px' : '16px',
          position: 'relative'
        }}>
          <p style={{
            fontSize: isMobile ? '10px' : '12px',
            marginBottom: isMobile ? '8px' : '12px',
            textAlign: 'center',
            margin: '0 0 ' + (isMobile ? '8px' : '12px') + ' 0',
            padding: isMobile ? '4px 8px' : '6px 12px'
          }}>🌾 Les Dejeunuistes 🌾</p>
          <div style={{
            display: 'flex',
            gap: isMobile ? '5px' : '10px',
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%'
          }}>
            <button 
              className="nes-btn is-primary" 
              onClick={() => setShowSearchModal(true)}
              style={{
                fontSize: isMobile ? '10px' : '11px',
                padding: isMobile ? '8px 12px' : '10px 16px',
                flex: 1
              }}
            >
              + Ajouter
            </button>
            <button 
              className="nes-btn is-warning" 
              onClick={pickRandomRestaurant}
              style={{
                fontSize: isMobile ? '10px' : '11px',
                padding: isMobile ? '8px 12px' : '10px 16px',
                flex: 1
              }}
            >
              🎲 Au hasard
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH MODAL - Responsive */}
      {showSearchModal && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{
            maxWidth: isMobile ? '95vw' : '600px',
            minHeight: isMobile ? 'auto' : '500px',
            maxHeight: '85vh',
            overflow: 'visible',
            margin: isMobile ? '10px' : '20px',
            padding: isMobile ? '12px' : '20px'
          }}>
            <h3 style={{
              textAlign: 'center', 
              fontSize: isMobile ? '14px' : '16px', 
              marginBottom: '15px'
            }}>
              🔍 Rechercher un restaurant
            </h3>
            
            <div style={{marginBottom: '20px', minHeight: isMobile ? '250px' : '350px'}}>
              <RestaurantSearch
                setShowPreview={setShowPreview}
                setPreviewData={setPreviewData}
                inModal={true}
              />
            </div>

            <div style={{textAlign: 'center', marginTop: 'auto'}}>
              <button 
                className="nes-btn is-error" 
                onClick={() => setShowSearchModal(false)}
                style={{fontSize: isMobile ? '10px' : '11px'}}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDE PANEL - Google Maps Style - Responsive */}
      {showSidePanel && selectedResto && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: isMobile ? '100vw' : '400px',
          maxWidth: '100vw',
          height: '100vh',
          backgroundColor: 'white',
          zIndex: 1000,
          boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with close button */}
          <div style={{
            padding: isMobile ? '10px 12px' : '12px 16px',
            borderBottom: '3px solid #212529',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f7f7f7',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <h2 style={{
              fontSize: isMobile ? '12px' : '14px', 
              margin: 0, 
              fontWeight: 'bold'
            }}>
              Détails du Restaurant
            </h2>
            <button 
              onClick={() => setShowSidePanel(false)}
              className="nes-btn is-error"
              style={{
                fontSize: isMobile ? '9px' : '10px', 
                padding: isMobile ? '3px 8px' : '4px 10px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{padding: isMobile ? '12px' : '16px', flex: 1}}>
            {/* Restaurant Name */}
            <h1 style={{
              fontSize: isMobile ? '16px' : '18px',
              marginBottom: '12px',
              fontWeight: 'bold',
              color: '#212529',
              lineHeight: '1.2'
            }}>
              {selectedResto.name}
            </h1>

            {/* Google Maps Info Section */}
            {(selectedResto.googleRating || selectedResto.googleAddress || selectedResto.googlePriceLevel) && (
              <div style={{
                marginBottom: '16px',
                padding: isMobile ? '10px' : '12px',
                backgroundColor: '#f0f8ff',
                border: '2px solid #4a90e2',
                borderRadius: '4px'
              }}>
                <div style={{
                  fontSize: isMobile ? '8px' : '9px', 
                  color: '#666', 
                  marginBottom: '8px', 
                  fontWeight: 'bold'
                }}>
                  📍 INFOS GOOGLE MAPS
                </div>

                {/* Google Rating */}
                {selectedResto.googleRating && (
                  <div style={{marginBottom: '6px', fontSize: isMobile ? '10px' : '11px'}}>
                    ⭐ <strong>{selectedResto.googleRating.toFixed(1)}/5</strong>
                    {selectedResto.googleRatingCount > 0 && (
                      <span style={{color: '#666', fontSize: isMobile ? '9px' : '10px'}}>
                        {' '}({selectedResto.googleRatingCount} avis)
                      </span>
                    )}
                  </div>
                )}

                {/* Price Level */}
                {selectedResto.googlePriceLevel && (
                  <div style={{marginBottom: '6px', fontSize: isMobile ? '10px' : '11px'}}>
                    💰 <strong>{getPriceDisplay(selectedResto.googlePriceLevel)}</strong>
                  </div>
                )}

                {/* Address */}
                {selectedResto.googleAddress && (
                  <div style={{
                    marginBottom: '6px', 
                    fontSize: isMobile ? '9px' : '10px', 
                    lineHeight: '1.3'
                  }}>
                    📍 {selectedResto.googleAddress}
                  </div>
                )}

                {/* Phone */}
                {selectedResto.googlePhone && (
                  <div style={{marginBottom: '6px', fontSize: isMobile ? '9px' : '10px'}}>
                    📞 {selectedResto.googlePhone}
                  </div>
                )}

                {/* Website */}
                {selectedResto.googleWebsite && (
                  <div style={{marginBottom: '6px', fontSize: isMobile ? '9px' : '10px'}}>
                    🌐 <a href={selectedResto.googleWebsite} target="_blank" rel="noopener noreferrer">
                      Site web
                    </a>
                  </div>
                )}

                {/* Opening Hours */}
                {selectedResto.googleOpeningHours && selectedResto.googleOpeningHours.length > 0 && (
                  <div style={{marginTop: '8px'}}>
                    <details style={{fontSize: isMobile ? '9px' : '10px'}}>
                      <summary style={{cursor: 'pointer', fontWeight: 'bold'}}>
                        🕒 Horaires d'ouverture
                      </summary>
                      <div style={{marginTop: '4px', paddingLeft: '8px', lineHeight: '1.4'}}>
                        {selectedResto.googleOpeningHours.map((hour, idx) => (
                          <div key={idx}>{hour}</div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}

            {/* User Ratings Section */}
            <div style={{marginBottom: '16px'}}>
              <div style={{
                fontSize: isMobile ? '8px' : '9px', 
                color: '#666', 
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold'
              }}>
                <span>⭐ NOS NOTES ({selectedResto.userRatings?.length || 0})</span>
                <button 
                  className="nes-btn is-success"
                  style={{
                    fontSize: isMobile ? '7px' : '8px', 
                    padding: isMobile ? '2px 6px' : '2px 8px'
                  }}
                  onClick={() => setShowRatingModal(true)}
                >
                  + Ajouter
                </button>
              </div>

              {selectedResto.userRatings && selectedResto.userRatings.length > 0 ? (
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedResto.userRatings.map((rating, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        padding: isMobile ? '6px' : '8px',
                        marginBottom: '6px',
                        backgroundColor: '#fff9e6',
                        border: '2px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{
                        fontSize: isMobile ? '10px' : '11px', 
                        fontWeight: 'bold', 
                        marginBottom: '3px'
                      }}>
                        {rating.userName} - ⭐ {rating.rating}/5
                      </div>
                      {rating.comment && (
                        <div style={{
                          fontSize: isMobile ? '9px' : '10px', 
                          fontStyle: 'italic', 
                          color: '#555', 
                          lineHeight: '1.3'
                        }}>
                          "{rating.comment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: isMobile ? '9px' : '10px', 
                  color: '#999', 
                  fontStyle: 'italic',
                  padding: isMobile ? '6px' : '8px',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  border: '2px dashed #ddd',
                  borderRadius: '4px'
                }}>
                  Aucune note ajoutée
                </div>
              )}
            </div>

            {/* Restaurant Info */}
            <div style={{
              marginBottom: '14px',
              padding: isMobile ? '8px' : '10px',
              backgroundColor: '#f7f7f7',
              border: '2px solid #e0e0e0',
              borderRadius: '4px'
            }}>
              <div style={{
                fontSize: isMobile ? '8px' : '9px', 
                color: '#666', 
                marginBottom: '8px', 
                fontWeight: 'bold'
              }}>
                ℹ️ INFORMATIONS
              </div>

              {/* Type */}
              <div style={{marginBottom: '8px'}}>
                <div style={{
                  fontSize: isMobile ? '8px' : '9px', 
                  color: '#666', 
                  marginBottom: '2px'
                }}>
                  TYPE DE CUISINE
                </div>
                <div style={{fontSize: isMobile ? '10px' : '11px'}}>
                  🍴 {selectedResto.type || 'Non spécifié'}
                </div>
              </div>

              {/* Halal Certification */}
              <div>
                <div style={{
                  fontSize: isMobile ? '8px' : '9px', 
                  color: '#666', 
                  marginBottom: '2px'
                }}>
                  CERTIFICATION HALAL
                </div>
                <div style={{fontSize: isMobile ? '10px' : '11px'}}>
                  ✅ {selectedResto.halal}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{marginTop: '16px'}}>
              <a 
                href={selectedResto.gmaps} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="nes-btn is-primary"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  display: 'block',
                  fontSize: isMobile ? '9px' : '10px',
                  padding: isMobile ? '6px' : '8px'
                }}
              >
                📍 Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      <MapContainer 
        center={[PARIS_CENTER.lat, PARIS_CENTER.lng]} 
        zoom={isMobile ? MAP_ZOOM_DEFAULT_MOBILE : MAP_ZOOM_DEFAULT_DESKTOP} 
        className="map-container"
        style={{
          width: (showSidePanel && !isMobile) ? 'calc(100% - 400px)' : '100%',
          transition: 'width 0.3s ease'
        }}
      >
        <MapEvents setMapInstance={setMapRef} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
{restos
  .filter(r => r.coords && Array.isArray(r.coords) && r.coords.length === 2)
  .map((r) => {
    const isSelected = showSidePanel && selectedResto && selectedResto.id === r.id;
    return (
      <Marker 
        key={r.id} 
        position={r.coords} 
        icon={createPixelPin(r.type)}
        eventHandlers={{
          click: () => handleMarkerClick(r)
        }}
      >
        {/* Tooltip showing restaurant name - permanent on mobile or when selected and side panel is open */}
        <Tooltip 
          key={`tooltip-${r.id}-${isSelected ? 'selected' : 'unselected'}`}
          permanent={isMobile || isSelected}
          direction={isMobile ? "bottom" : "top"} 
          offset={isMobile ? [0, 0] : [0, -20]}
          opacity={0.95}
          className="restaurant-label"
        >
          <div style={{
            fontSize: isMobile ? '7px' : '10px',
            fontWeight: 'bold',
            padding: isMobile ? '2px 4px' : '3px 6px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            backgroundColor: 'white',
            border: '2px solid #000',
            borderRadius: '2px',
            boxShadow: '2px 2px 0 rgba(0,0,0,0.25)',
            maxWidth: isMobile ? '80px' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {r.name}
          </div>
        </Tooltip>
      </Marker>
    );
  })
}
      </MapContainer>

      {/* ADD RATING MODAL - Responsive */}
      {showRatingModal && selectedResto && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{
            maxWidth: isMobile ? '95vw' : '450px',
            padding: isMobile ? '12px' : '20px'
          }}>
            <h3 style={{
              textAlign: 'center', 
              fontSize: isMobile ? '14px' : '16px', 
              marginBottom: '12px'
            }}>
              Ajouter ta note pour {selectedResto.name}
            </h3>
            
            <form onSubmit={addUserRating}>
              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                  Ton nom <span style={{color: 'red'}}>*</span>
                </label>
                <input 
                  type="text" 
                  className="nes-input" 
                  placeholder="ex: John, Marie..." 
                  value={ratingData.userName}
                  required
                  onChange={e => setRatingData({...ratingData, userName: e.target.value})} 
                  style={{fontSize: isMobile ? '11px' : '12px'}}
                />
              </div>

              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                  Ta note (1-5) <span style={{color: 'red'}}>*</span>
                </label>
                <input 
                  type="number" 
                  max="5" 
                  min="1" 
                  step="0.1"
                  className="nes-input" 
                  value={ratingData.rating}
                  onChange={e => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 5) {
                      setRatingData({...ratingData, rating: value});
                    }
                  }}
                  style={{fontSize: isMobile ? '11px' : '12px'}}
                />
                <small style={{fontSize: isMobile ? '8px' : '9px', color: '#666'}}>
                  Ex: 4.2, 3.7, 5.0
                </small>
              </div>

              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>Ton avis</label>
                <textarea 
                  className="nes-textarea" 
                  placeholder="Qu'as-tu pensé de ce resto?"
                  value={ratingData.comment}
                  onChange={e => setRatingData({...ratingData, comment: e.target.value})}
                  style={{fontSize: isMobile ? '10px' : '11px'}}
                ></textarea>
              </div>

              <div style={{
                marginTop: '15px', 
                display: 'flex', 
                gap: isMobile ? '5px' : '10px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  type="submit" 
                  className={`nes-btn is-success ${loading ? 'is-disabled' : ''}`}
                  style={{
                    fontSize: isMobile ? '10px' : '11px',
                    flex: 1
                  }}
                >
                  Ajouter ma note
                </button>
                <button 
                  type="button" 
                  className="nes-btn is-error" 
                  onClick={() => setShowRatingModal(false)}
                  style={{
                    fontSize: isMobile ? '10px' : '11px',
                    flex: 1
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL - Responsive */}
      {showPreview && previewData && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{
            maxWidth: isMobile ? '95vw' : '500px',
            padding: isMobile ? '12px' : '20px'
          }}>
            <h3 style={{
              textAlign: 'center', 
              fontSize: isMobile ? '16px' : '18px', 
              marginBottom: '15px'
            }}>
              Info Restaurant
            </h3>
            
            <div className="nes-container is-rounded" style={{
              marginTop: '15px', 
              backgroundColor: '#f7f7f7', 
              padding: isMobile ? '12px' : '15px'
            }}>
              <h4 style={{
                fontSize: isMobile ? '12px' : '14px', 
                marginBottom: '12px', 
                fontWeight: 'bold'
              }}>
                {previewData.name}
              </h4>
              
              {previewData.rating && (
                <div style={{
                  marginBottom: '8px', 
                  fontSize: isMobile ? '10px' : '11px'
                }}>
                  <strong>⭐ Note Google:</strong> {previewData.rating.toFixed(1)}/5 ({previewData.ratingCount} avis)
                </div>
              )}

              {previewData.priceLevel && (
                <div style={{
                  marginBottom: '8px', 
                  fontSize: isMobile ? '10px' : '11px'
                }}>
                  <strong>💰 Prix:</strong> {getPriceDisplay(previewData.priceLevel)}
                </div>
              )}
              
              {previewData.cuisine && (
                <div style={{
                  marginBottom: '8px', 
                  fontSize: isMobile ? '10px' : '11px'
                }}>
                  <strong>🍴 Type:</strong> {previewData.cuisine}
                </div>
              )}
              
              <div style={{
                marginBottom: '8px', 
                fontSize: isMobile ? '9px' : '10px', 
                lineHeight: '1.4'
              }}>
                <strong>📍 Adresse:</strong> {previewData.address}
              </div>
              
              {previewData.phone && (
                <div style={{
                  marginBottom: '8px', 
                  fontSize: isMobile ? '10px' : '11px'
                }}>
                  <strong>📞 Téléphone:</strong> {previewData.phone}
                </div>
              )}
              
              {previewData.website && (
                <div style={{
                  marginBottom: '8px', 
                  fontSize: isMobile ? '10px' : '11px'
                }}>
                  <strong>🌐 Site web:</strong>{' '}
                  <a href={previewData.website} target="_blank" rel="noopener noreferrer">
                    Visiter
                  </a>
                </div>
              )}
              
              <div style={{marginTop: '12px'}}>
                <a 
                  href={previewData.gmapsUri || `https://www.google.com/maps?q=${previewData.lat},${previewData.lon}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="nes-btn is-primary is-small"
                  style={{fontSize: isMobile ? '9px' : '10px'}}
                >
                  Voir sur Google Maps
                </a>
              </div>
            </div>

            <div style={{
              marginTop: '15px', 
              display: 'flex', 
              gap: isMobile ? '5px' : '10px', 
              justifyContent: 'center',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <button 
                className="nes-btn is-success" 
                onClick={confirmAddRestaurant} 
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  flex: 1
                }}
              >
                ✓ Ajouter ce resto
              </button>
              <button 
                className="nes-btn is-error" 
                onClick={() => setShowPreview(false)} 
                style={{
                  fontSize: isMobile ? '10px' : '11px',
                  flex: 1
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD RESTAURANT MODAL - Responsive */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{
            maxHeight: '90vh', 
            overflowY: 'auto',
            maxWidth: isMobile ? '95vw' : '500px',
            padding: isMobile ? '12px' : '20px'
          }}>
            <h3 style={{
              textAlign: 'center',
              fontSize: isMobile ? '14px' : '16px'
            }}>
              Nouveau Resto
            </h3>
            
            <form onSubmit={saveResto}>
              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                  Nom <span style={{color: 'red'}}>*</span>
                </label>
                <input 
                  type="text" 
                  className="nes-input" 
                  value={formData.name} 
                  required 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{fontSize: isMobile ? '11px' : '12px'}}
                />
              </div>

              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                  Type de cuisine <span style={{color: 'red'}}>*</span>
                </label>
                <div className="nes-select">
                  <select 
                    value={formData.type} 
                    required
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    style={{fontSize: isMobile ? '11px' : '12px'}}
                  >
                    <option value="">-- Sélectionner --</option>
                    {CUISINE_TYPES.map(cuisine => (
                      <option key={cuisine} value={cuisine}>{cuisine}</option>
                    ))}
                  </select>
                </div>
                {formData.type === "Autre" && (
                  <input 
                    type="text" 
                    className="nes-input" 
                    placeholder="Précisez le type de cuisine..." 
                    value={formData.customType}
                    required
                    onChange={e => setFormData({...formData, customType: e.target.value})}
                    style={{
                      marginTop: '8px',
                      fontSize: isMobile ? '11px' : '12px'
                    }}
                  />
                )}
              </div>

              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                  Certification Halal <span style={{color: 'red'}}>*</span>
                </label>
                <div className="nes-select">
                  <select 
                    value={formData.halal} 
                    required
                    onChange={e => setFormData({...formData, halal: e.target.value})}
                    style={{fontSize: isMobile ? '11px' : '12px'}}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="AVS-Achahada..">Certif de confiance (AVS-Achahada..)</option>
                    <option value="Autre certif">Autre certif</option>
                    <option value="Musulmans">Musulmans</option>
                    <option value="PAS Halal">PAS Halal</option>
                    <option value="Autre">Autre (Préciser...)</option>
                  </select>
                </div>
                {formData.halal === "Autre" && (
                  <input 
                    type="text" 
                    className="nes-input" 
                    placeholder="Précisez ici..." 
                    value={formData.customHalal}
                    required
                    onChange={e => setFormData({...formData, customHalal: e.target.value})}
                    style={{
                      marginTop: '8px',
                      fontSize: isMobile ? '11px' : '12px'
                    }}
                  />
                )}
              </div>

              <div className="nes-field">
                <label style={{fontSize: isMobile ? '10px' : '11px'}}>Lien Google Maps</label>
                <input 
                  type="url" 
                  className="nes-input" 
                  placeholder="https://goo.gl/maps/..." 
                  value={formData.gmaps}
                  onChange={e => setFormData({...formData, gmaps: e.target.value})}
                  style={{fontSize: isMobile ? '11px' : '12px'}}
                />
              </div>

              {/* Initial Rating Section - NOW REQUIRED */}
              <div style={{
                marginTop: '20px',
                padding: isMobile ? '12px' : '15px',
                backgroundColor: '#fff9e6',
                border: '3px solid #ffc107',
                borderRadius: '4px'
              }}>
                <h4 style={{
                  fontSize: isMobile ? '11px' : '12px', 
                  marginBottom: '10px', 
                  fontWeight: 'bold',
                  color: '#d95941'
                }}>
                  ⭐ Ta note personnelle <span style={{color: 'red'}}>*</span>
                </h4>
                <p style={{
                  fontSize: isMobile ? '9px' : '10px',
                  color: '#666',
                  marginBottom: '10px',
                  fontStyle: 'italic'
                }}>
                  Une note initiale est obligatoire pour ajouter un restaurant
                </p>

                <div className="nes-field">
                  <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                    Ton nom <span style={{color: 'red'}}>*</span>
                  </label>
                  <input 
                    type="text" 
                    className="nes-input" 
                    placeholder="ex: John, Marie..." 
                    value={formData.initialUserName}
                    required
                    onChange={e => setFormData({...formData, initialUserName: e.target.value})}
                    style={{fontSize: isMobile ? '11px' : '12px'}}
                  />
                </div>

                <div className="nes-field">
                  <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                    Ta note (1-5) <span style={{color: 'red'}}>*</span>
                  </label>
                  <input 
                    type="number" 
                    max="5" 
                    min="1" 
                    step="0.1"
                    className="nes-input" 
                    placeholder="ex: 4.5"
                    value={formData.initialRating}
                    required
                    onChange={e => {
                      const value = e.target.value;
                      // Allow empty string for user to clear field
                      if (value === '') {
                        setRatingData({...ratingData, rating: ''});
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
                        setRatingData({...ratingData, rating: value});
                      }
                    }}
                    style={{fontSize: isMobile ? '11px' : '12px'}}
                  />
                  <small style={{
                    fontSize: isMobile ? '8px' : '9px', 
                    color: '#666'
                  }}>
                    Ex: 4.2, 3.7, 5.0
                  </small>
                </div>

                <div className="nes-field">
                  <label style={{fontSize: isMobile ? '10px' : '11px'}}>
                    Commentaire sur ta note
                  </label>
                  <textarea 
                    className="nes-textarea" 
                    placeholder="Qu'as-tu pensé de ce resto?"
                    value={formData.initialRatingComment}
                    onChange={e => setFormData({...formData, initialRatingComment: e.target.value})}
                    style={{fontSize: isMobile ? '10px' : '11px'}}
                  ></textarea>
                </div>
              </div>

              <div style={{
                marginTop: '20px', 
                display: 'flex', 
                gap: isMobile ? '5px' : '10px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  type="submit" 
                  className={`nes-btn is-success ${loading ? 'is-disabled' : ''}`}
                  style={{
                    fontSize: isMobile ? '10px' : '11px',
                    flex: 1
                  }}
                >
                  Sauvegarder
                </button>
                <button 
                  type="button" 
                  className="nes-btn is-error" 
                  onClick={() => setShowModal(false)}
                  style={{
                    fontSize: isMobile ? '10px' : '11px',
                    flex: 1
                  }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}