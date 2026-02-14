import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import L from "leaflet";

import "./index.css";

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
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '400px',
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

  const searchRestaurants = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setShowSuggestions(true);
    
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
                  latitude: 48.8566,  // Paris center
                  longitude: 2.3522
                },
                radius: 15000.0  // 15km radius
              }
            },
            maxResultCount: 15,
            languageCode: 'fr'
          })
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
      console.error('Search error:', error);
      setSuggestions([]);
    }
    setLoading(false);
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
      width: inModal ? '100%' : '500px',
      maxWidth: '90vw'
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
        style={{ width: '100%' }}
      />
      
      {showSuggestions && searchQuery.length >= 3 && (
        <div 
          className="nes-container is-rounded" 
          style={{
            position: inModal ? 'relative' : 'absolute',
            top: inModal ? '10px' : '60px',
            left: '0',
            right: '0',
            maxHeight: inModal ? '350px' : '600px',
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
    // Initial rating fields
    initialUserName: "",
    initialRating: "",
    initialRatingComment: ""
  });

  // Rating form state
  const [ratingData, setRatingData] = useState({
    userName: "",
    rating: 5,
    comment: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "restaurants"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        setRestos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        logError("Erreur lors du chargement des restaurants", { context: 'fetchData', error: err.message });
      }
    };
    fetchData();
  }, []);

  // Error logging function
  const logError = async (errorMessage, errorDetails = {}) => {
    console.error('Error:', errorMessage, errorDetails);
    
    // Show toast to user
    setError(errorMessage);

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
  };

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
      
      setLoading(true);
      const finalHalal = formData.halal === "Autre" ? formData.customHalal : formData.halal;
      const finalType = formData.type === "Autre" ? formData.customType : formData.type;
      
      // Build initial user ratings array
      const initialUserRatings = [];
      if (formData.initialUserName && formData.initialRating) {
        initialUserRatings.push({
          userName: formData.initialUserName,
          rating: parseFloat(formData.initialRating),
          comment: formData.initialRatingComment || "",
          date: new Date().toISOString()
        });
      }
      
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
      
      // Refresh the restaurant list
      const q = query(collection(db, "restaurants"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      setRestos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
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
      
      setLoading(true);
      
      const newRating = {
        userName: ratingData.userName,
        rating: parseFloat(ratingData.rating),
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
      
      // Refresh the restaurant list
      const q = query(collection(db, "restaurants"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const updatedRestos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestos(updatedRestos);
      
      // Update selected resto
      const updatedResto = updatedRestos.find(r => r.id === selectedResto.id);
      setSelectedResto(updatedResto);
      
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
      mapRef.flyTo(randomResto.coords, 17, {
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

      {/* UI BAS GAUCHE */}
      <div className="ui-overlay" style={{top: 'auto', bottom: '20px', left: '20px', zIndex: 900}}>
        <div className="nes-container is-rounded is-dark with-title">
          <p className="title">🌾 Les Dejeunuistes 🌾</p>
          <button className="nes-btn is-primary" onClick={() => setShowSearchModal(true)}>
            + Ajouter
          </button>
          <button className="nes-btn is-warning" style={{marginLeft: '10px'}} 
            onClick={pickRandomRestaurant}>🎲 Au hasard</button>
        </div>
      </div>
{/* SEARCH MODAL */}
{showSearchModal && (
  <div className="modal-overlay">
    <div className="modal-content nes-container is-rounded" style={{
      maxWidth: '600px', 
      minHeight: '500px',
      maxHeight: '80vh',
      overflow: 'visible',
      margin: '20px'
    }}>
      <h3 style={{textAlign: 'center', fontSize: '16px', marginBottom: '15px'}}>
        🔍 Rechercher un restaurant
      </h3>
      <p style={{fontSize: '11px', textAlign: 'center', marginBottom: '20px', color: '#666'}}>
        Utilisez la barre de recherche pour trouver le restaurant que vous souhaitez ajouter
      </p>
      
      <div style={{marginBottom: '20px', minHeight: '350px'}}>
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
          style={{fontSize: '11px'}}
        >
          Annuler
        </button>
      </div>
    </div>
  </div>
)}

      {/* SIDE PANEL - Google Maps Style */}
      {showSidePanel && selectedResto && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          maxWidth: '90vw',
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
            padding: '12px 16px',
            borderBottom: '3px solid #212529',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f7f7f7',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <h2 style={{fontSize: '14px', margin: 0, fontWeight: 'bold'}}>
              Détails du Restaurant
            </h2>
            <button 
              onClick={() => setShowSidePanel(false)}
              className="nes-btn is-error"
              style={{fontSize: '10px', padding: '4px 10px'}}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{padding: '16px', flex: 1}}>
            {/* Restaurant Name */}
            <h1 style={{
              fontSize: '18px',
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
                padding: '12px',
                backgroundColor: '#f0f8ff',
                border: '2px solid #4a90e2',
                borderRadius: '4px'
              }}>
                <div style={{fontSize: '9px', color: '#666', marginBottom: '8px', fontWeight: 'bold'}}>
                  📍 INFOS GOOGLE MAPS
                </div>

                {/* Google Rating */}
                {selectedResto.googleRating && (
                  <div style={{marginBottom: '6px', fontSize: '11px'}}>
                    ⭐ <strong>{selectedResto.googleRating.toFixed(1)}/5</strong>
                    {selectedResto.googleRatingCount > 0 && (
                      <span style={{color: '#666', fontSize: '10px'}}>
                        {' '}({selectedResto.googleRatingCount} avis)
                      </span>
                    )}
                  </div>
                )}

                {/* Price Level */}
                {selectedResto.googlePriceLevel && (
                  <div style={{marginBottom: '6px', fontSize: '11px'}}>
                    💰 <strong>{getPriceDisplay(selectedResto.googlePriceLevel)}</strong>
                  </div>
                )}

                {/* Address */}
                {selectedResto.googleAddress && (
                  <div style={{marginBottom: '6px', fontSize: '10px', lineHeight: '1.3'}}>
                    📍 {selectedResto.googleAddress}
                  </div>
                )}

                {/* Phone */}
                {selectedResto.googlePhone && (
                  <div style={{marginBottom: '6px', fontSize: '10px'}}>
                    📞 {selectedResto.googlePhone}
                  </div>
                )}

                {/* Website */}
                {selectedResto.googleWebsite && (
                  <div style={{marginBottom: '6px', fontSize: '10px'}}>
                    🌐 <a href={selectedResto.googleWebsite} target="_blank" rel="noopener noreferrer">
                      Site web
                    </a>
                  </div>
                )}

                {/* Opening Hours */}
                {selectedResto.googleOpeningHours && selectedResto.googleOpeningHours.length > 0 && (
                  <div style={{marginTop: '8px'}}>
                    <details style={{fontSize: '10px'}}>
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
                fontSize: '9px', 
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
                  style={{fontSize: '8px', padding: '2px 8px'}}
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
                        padding: '8px',
                        marginBottom: '6px',
                        backgroundColor: '#fff9e6',
                        border: '2px solid #e0e0e0',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{fontSize: '11px', fontWeight: 'bold', marginBottom: '3px'}}>
                        {rating.userName} - ⭐ {rating.rating}/5
                      </div>
                      {rating.comment && (
                        <div style={{fontSize: '10px', fontStyle: 'italic', color: '#555', lineHeight: '1.3'}}>
                          "{rating.comment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: '10px', 
                  color: '#999', 
                  fontStyle: 'italic',
                  padding: '8px',
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
              padding: '10px',
              backgroundColor: '#f7f7f7',
              border: '2px solid #e0e0e0',
              borderRadius: '4px'
            }}>
              <div style={{fontSize: '9px', color: '#666', marginBottom: '8px', fontWeight: 'bold'}}>
                ℹ️ INFORMATIONS
              </div>

              {/* Type */}
              <div style={{marginBottom: '8px'}}>
                <div style={{fontSize: '9px', color: '#666', marginBottom: '2px'}}>
                  TYPE DE CUISINE
                </div>
                <div style={{fontSize: '11px'}}>
                  🍴 {selectedResto.type || 'Non spécifié'}
                </div>
              </div>

              {/* Halal Certification */}
              <div>
                <div style={{fontSize: '9px', color: '#666', marginBottom: '2px'}}>
                  CERTIFICATION HALAL
                </div>
                <div style={{fontSize: '11px'}}>
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
                  fontSize: '10px',
                  padding: '8px'
                }}
              >
                📍 Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      <MapContainer 
        center={[48.8566, 2.3522]} 
        zoom={12} 
        className="map-container"
        style={{
          width: showSidePanel ? 'calc(100% - 400px)' : '100%',
          transition: 'width 0.3s ease'
        }}
      >
        <MapEvents setMapInstance={setMapRef} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <RestaurantSearch
            setShowPreview={setShowPreview}
            setPreviewData={setPreviewData}
          />
        </div>

        {restos
          .filter(r => r.coords && Array.isArray(r.coords) && r.coords.length === 2)
          .map((r) => (
            <Marker 
              key={r.id} 
              position={r.coords} 
              icon={createPixelPin(r.type)}
              eventHandlers={{
                click: () => handleMarkerClick(r)
              }}
            >
              <Popup>
                <div style={{textAlign: 'center', fontSize: '11px', padding: '4px'}}>
                  <strong>{r.name}</strong>
                </div>
              </Popup>
            </Marker>
          ))
        }
      </MapContainer>

      {/* ADD RATING MODAL */}
      {showRatingModal && selectedResto && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{maxWidth: '450px'}}>
            <h3 style={{textAlign: 'center', fontSize: '16px', marginBottom: '12px'}}>
              Ajouter ta note pour {selectedResto.name}
            </h3>
            
            <form onSubmit={addUserRating}>
              <div className="nes-field">
                <label style={{fontSize: '11px'}}>Ton nom <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="text" 
                  className="nes-input" 
                  placeholder="ex: John, Marie..." 
                  value={ratingData.userName}
                  required
                  onChange={e => setRatingData({...ratingData, userName: e.target.value})} 
                />
              </div>

              <div className="nes-field">
                <label style={{fontSize: '11px'}}>Ta note (1-5) <span style={{color: 'red'}}>*</span></label>
                <input 
                  type="number" 
                  max="5" 
                  min="1" 
                  step="0.1"
                  className="nes-input" 
                  value={ratingData.rating}
                  onChange={e => setRatingData({...ratingData, rating: parseFloat(e.target.value) || 1})} 
                />
                <small style={{fontSize: '9px', color: '#666'}}>Ex: 4.2, 3.7, 5.0</small>
              </div>

              <div className="nes-field">
                <label style={{fontSize: '11px'}}>Ton avis</label>
                <textarea 
                  className="nes-textarea" 
                  placeholder="Qu'as-tu pensé de ce resto?"
                  value={ratingData.comment}
                  onChange={e => setRatingData({...ratingData, comment: e.target.value})}
                  style={{fontSize: '11px'}}
                ></textarea>
              </div>

              <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                <button 
                  type="submit" 
                  className={`nes-btn is-success ${loading ? 'is-disabled' : ''}`}
                  style={{fontSize: '11px'}}
                >
                  Ajouter ma note
                </button>
                <button 
                  type="button" 
                  className="nes-btn is-error" 
                  onClick={() => setShowRatingModal(false)}
                  style={{fontSize: '11px'}}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && previewData && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{maxWidth: '500px'}}>
            <h3 style={{textAlign: 'center', fontSize: '18px', marginBottom: '15px'}}>Info Restaurant</h3>
            
            <div className="nes-container is-rounded" style={{marginTop: '15px', backgroundColor: '#f7f7f7', padding: '15px'}}>
              <h4 style={{fontSize: '14px', marginBottom: '12px', fontWeight: 'bold'}}>{previewData.name}</h4>
              
              {previewData.rating && (
                <div style={{marginBottom: '8px', fontSize: '11px'}}>
                  <strong>⭐ Note Google:</strong> {previewData.rating.toFixed(1)}/5 ({previewData.ratingCount} avis)
                </div>
              )}

              {previewData.priceLevel && (
                <div style={{marginBottom: '8px', fontSize: '11px'}}>
                  <strong>💰 Prix:</strong> {getPriceDisplay(previewData.priceLevel)}
                </div>
              )}
              
              {previewData.cuisine && (
                <div style={{marginBottom: '8px', fontSize: '11px'}}>
                  <strong>🍴 Type:</strong> {previewData.cuisine}
                </div>
              )}
              
              <div style={{marginBottom: '8px', fontSize: '10px', lineHeight: '1.4'}}>
                <strong>📍 Adresse:</strong> {previewData.address}
              </div>
              
              {previewData.phone && (
                <div style={{marginBottom: '8px', fontSize: '11px'}}>
                  <strong>📞 Téléphone:</strong> {previewData.phone}
                </div>
              )}
              
              {previewData.website && (
                <div style={{marginBottom: '8px', fontSize: '11px'}}>
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
                  style={{fontSize: '10px'}}
                >
                  Voir sur Google Maps
                </a>
              </div>
            </div>

            <div style={{marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button className="nes-btn is-success" onClick={confirmAddRestaurant} style={{fontSize: '11px'}}>
                ✓ Ajouter ce resto
              </button>
              <button className="nes-btn is-error" onClick={() => setShowPreview(false)} style={{fontSize: '11px'}}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD RESTAURANT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content nes-container is-rounded" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <h3 style={{textAlign: 'center'}}>Nouveau Resto</h3>
            
            <form onSubmit={saveResto}>
              <div className="nes-field">
                <label>Nom <span style={{color: 'red'}}>*</span></label>
                <input type="text" className="nes-input" value={formData.name} required 
                  onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="nes-field">
                <label>Type de cuisine <span style={{color: 'red'}}>*</span></label>
                <div className="nes-select">
                  <select 
                    value={formData.type} 
                    required
                    onChange={e => setFormData({...formData, type: e.target.value})}
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
                    style={{marginTop: '8px'}}
                  />
                )}
              </div>

              <div className="nes-field">
                <label>Certification Halal <span style={{color: 'red'}}>*</span></label>
                <div className="nes-select">
                  <select 
                    value={formData.halal} 
                    required
                    onChange={e => setFormData({...formData, halal: e.target.value})}
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
                  <input type="text" className="nes-input" placeholder="Précisez ici..." 
                    value={formData.customHalal}
                    required
                    onChange={e => setFormData({...formData, customHalal: e.target.value})}
                    style={{marginTop: '8px'}}
                  />
                )}
              </div>

              <div className="nes-field">
                <label>Lien Google Maps</label>
                <input type="url" className="nes-input" placeholder="https://goo.gl/maps/..." 
                  value={formData.gmaps}
                  onChange={e => setFormData({...formData, gmaps: e.target.value})} />
              </div>

              {/* Initial Rating Section */}
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f0f8ff',
                border: '2px solid #4a90e2',
                borderRadius: '4px'
              }}>
                <h4 style={{fontSize: '12px', marginBottom: '10px', fontWeight: 'bold'}}>
                  ⭐ Ta note personnelle
                </h4>

                <div className="nes-field">
                  <label style={{fontSize: '11px'}}>Ton nom</label>
                  <input 
                    type="text" 
                    className="nes-input" 
                    placeholder="ex: John, Marie..." 
                    value={formData.initialUserName}
                    onChange={e => setFormData({...formData, initialUserName: e.target.value})} 
                  />
                </div>

                <div className="nes-field">
                  <label style={{fontSize: '11px'}}>Ta note (1-5)</label>
                  <input 
                    type="number" 
                    max="5" 
                    min="1" 
                    step="0.1"
                    className="nes-input" 
                    placeholder="ex: 4.5"
                    value={formData.initialRating}
                    onChange={e => setFormData({...formData, initialRating: e.target.value})} 
                  />
                  <small style={{fontSize: '9px', color: '#666'}}>Ex: 4.2, 3.7, 5.0</small>
                </div>

                <div className="nes-field">
                  <label style={{fontSize: '11px'}}>Commentaire sur ta note</label>
                  <textarea 
                    className="nes-textarea" 
                    placeholder="Qu'as-tu pensé de ce resto?"
                    value={formData.initialRatingComment}
                    onChange={e => setFormData({...formData, initialRatingComment: e.target.value})}
                    style={{fontSize: '11px'}}
                  ></textarea>
                </div>
              </div>

              <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                <button type="submit" className={`nes-btn is-success ${loading ? 'is-disabled' : ''}`}>Sauvegarder</button>
                <button type="button" className="nes-btn is-error" onClick={() => setShowModal(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}