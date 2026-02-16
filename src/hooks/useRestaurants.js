import { useState, useCallback, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isValidRating } from '../utils/helpers';

/**
 * Custom hook for managing restaurant data and operations
 * Handles all Firebase/Firestore interactions for restaurants
 */
export const useRestaurants = () => {
  const [restos, setRestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Log error to Firebase and show user-friendly message
   */
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

  /**
   * Fetch all restaurants from Firebase
   */
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

  /**
   * Save a new restaurant to Firebase
   * @param {Object} formData - Restaurant form data
   * @returns {Promise<boolean>} - Success status
   */
  const saveRestaurant = async (formData) => {
    try {
      // Validation
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

      // Validate initial rating
      if (!formData.initialUserName || formData.initialUserName.trim() === "") {
        throw new Error("Veuillez entrer votre nom pour la note initiale");
      }

      if (!formData.initialRating || formData.initialRating === "") {
        throw new Error("Veuillez donner une note initiale au restaurant");
      }

      if (!isValidRating(formData.initialRating)) {
        throw new Error("La note doit être comprise entre 1 et 5");
      }

      setLoading(true);
      const finalHalal = formData.halal === "Autre" ? formData.customHalal : formData.halal;
      const finalType = formData.type === "Autre" ? formData.customType : formData.type;

      // Build initial user ratings array
      const initialUserRatings = [{
        userName: formData.initialUserName,
        rating: parseFloat(formData.initialRating),
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

      await refreshRestaurants();
      return true;

    } catch (err) {
      logError(err.message, {
        context: 'saveRestaurant',
        formData: formData
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a user rating to an existing restaurant
   * @param {string} restoId - Restaurant ID
   * @param {Array} currentRatings - Current ratings array
   * @param {Object} ratingData - New rating data
   * @returns {Promise<boolean>} - Success status
   */
  const addRating = async (restoId, currentRatings, ratingData) => {
    try {
      // Validation
      if (!ratingData.userName || ratingData.userName.trim() === "") {
        throw new Error("Veuillez entrer votre nom");
      }

      if (!ratingData.rating || ratingData.rating === "") {
        throw new Error("Veuillez donner une note");
      }

      if (!isValidRating(ratingData.rating)) {
        throw new Error("La note doit être comprise entre 1 et 5");
      }

      setLoading(true);

      const newRating = {
        userName: ratingData.userName,
        rating: parseFloat(ratingData.rating),
        comment: ratingData.comment,
        date: new Date().toISOString()
      };

      const updatedRatings = [...(currentRatings || []), newRating];

      const restoRef = doc(db, "restaurants", restoId);
      await updateDoc(restoRef, {
        userRatings: updatedRatings
      });

      await refreshRestaurants();
      return true;

    } catch (err) {
      logError(err.message, {
        context: 'addRating',
        restoId: restoId,
        ratingData: ratingData
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load restaurants on mount
  useEffect(() => {
    refreshRestaurants();
  }, [refreshRestaurants]);

  return {
    restos,
    loading,
    error,
    setError,
    saveRestaurant,
    addRating,
    refreshRestaurants
  };
};
