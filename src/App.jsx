import { useState, useEffect } from "react";
import { useRestaurants } from "./hooks/useRestaurants";
import { MAP_ZOOM_LEVEL_DETAIL } from "./utils/constants";
import ErrorToast from "./components/ErrorToast";
import ControlPanel from "./components/ControlPanel";
import RestaurantMap from "./components/Map/RestaurantMap";
import SidePanel from "./components/SidePanel";
import SearchModal from "./components/Modals/SearchModal";
import PreviewModal from "./components/Modals/PreviewModal";
import AddRestaurantModal from "./components/Modals/AddRestaurantModal";
import RatingModal from "./components/Modals/RatingModal";
import "./index.css";

export default function App() {
  // Custom hook for restaurant data management
  const { restos, loading, error, setError, saveRestaurant, addRating } = useRestaurants();

  // UI State
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedResto, setSelectedResto] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [mapRef, setMapRef] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Confirm and prepare data for adding a restaurant
   */
  const confirmAddRestaurant = () => {
    if (previewData) {
      const formData = {
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
      };

      setShowPreview(false);
      setShowSearchModal(false);
      setShowModal(true);
      // Pass formData to modal via state
      setPreviewData(formData);
    }
  };

  /**
   * Pick a random restaurant and display it
   */
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

  /**
   * Handle marker click on map
   */
  const handleMarkerClick = (resto) => {
    setSelectedResto(resto);
    setShowSidePanel(true);
  };

  /**
   * Handle adding restaurant
   */
  const handleAddRestaurant = async (formData) => {
    const success = await saveRestaurant(formData);
    if (success) {
      setShowModal(false);
      setPreviewData(null);
    }
    return success;
  };

  /**
   * Handle adding rating
   */
  const handleAddRating = async (ratingData) => {
    const success = await addRating(selectedResto.id, selectedResto.userRatings, ratingData);
    if (success) {
      setShowRatingModal(false);
      // Update selected resto with fresh data
      const updatedResto = restos.find(r => r.id === selectedResto.id);
      if (updatedResto) {
        setSelectedResto(updatedResto);
      }
    }
    return success;
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

      {/* Control Panel (Bottom Left) */}
      <ControlPanel
        isMobile={isMobile}
        onAddClick={() => setShowSearchModal(true)}
        onRandomClick={pickRandomRestaurant}
      />

      {/* Side Panel (Restaurant Details) */}
      {showSidePanel && selectedResto && (
        <SidePanel
          restaurant={selectedResto}
          isMobile={isMobile}
          onClose={() => setShowSidePanel(false)}
          onAddRating={() => setShowRatingModal(true)}
        />
      )}

      {/* Main Map */}
      <RestaurantMap
        restos={restos}
        isMobile={isMobile}
        showSidePanel={showSidePanel}
        selectedResto={selectedResto}
        onMarkerClick={handleMarkerClick}
        setMapInstance={setMapRef}
      />

      {/* Search Modal */}
      {showSearchModal && (
        <SearchModal
          isMobile={isMobile}
          onClose={() => setShowSearchModal(false)}
          setShowPreview={setShowPreview}
          setPreviewData={setPreviewData}
        />
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <PreviewModal
          previewData={previewData}
          isMobile={isMobile}
          onConfirm={confirmAddRestaurant}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Add Restaurant Modal */}
      {showModal && (
        <AddRestaurantModal
          initialData={previewData}
          isMobile={isMobile}
          onSubmit={handleAddRestaurant}
          onClose={() => setShowModal(false)}
          loading={loading}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedResto && (
        <RatingModal
          restaurant={selectedResto}
          isMobile={isMobile}
          onSubmit={handleAddRating}
          onClose={() => setShowRatingModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
