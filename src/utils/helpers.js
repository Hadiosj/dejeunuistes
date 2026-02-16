import { GOOGLE_CUISINE_MAP } from './constants';

/**
 * Converts Google Places price level to Euro symbol display
 * @param {string} priceLevel - Google Places price level (e.g., 'PRICE_LEVEL_MODERATE')
 * @returns {string|null} - Euro symbols (€, €€, etc.) or null
 */
export const getPriceDisplay = (priceLevel) => {
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

/**
 * Extracts cuisine type from Google Places types array
 * @param {Array<string>} types - Array of Google place types
 * @returns {string} - Mapped cuisine type or empty string
 */
export const extractCuisineType = (types) => {
  if (!types) return '';

  for (let type of types) {
    if (GOOGLE_CUISINE_MAP[type]) {
      return GOOGLE_CUISINE_MAP[type];
    }
  }
  return ''; // Return empty string instead of 'Restaurant'
};

/**
 * Calculates average rating from user ratings array
 * @param {Array<{rating: number}>} ratings - Array of user rating objects
 * @returns {number|null} - Average rating or null if no ratings
 */
export const calculateAverageRating = (ratings) => {
  if (!ratings || ratings.length === 0) return null;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  return (sum / ratings.length).toFixed(1);
};

/**
 * Validates rating value (must be between 1-5)
 * @param {string|number} rating - Rating value to validate
 * @returns {boolean} - True if valid
 */
export const isValidRating = (rating) => {
  const num = parseFloat(rating);
  return !isNaN(num) && num >= 1 && num <= 5;
};
