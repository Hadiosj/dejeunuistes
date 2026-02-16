# Utils

Utility functions, constants, and helper functions.

## Files

- **constants.js** - All app constants
  - Map configuration (zoom levels, center coordinates, radius)
  - UI configuration (timeouts, debounce delays)
  - Cuisine types list for dropdowns

- **helpers.js** - Helper/utility functions
  - `getPriceDisplay()` - Converts Google price level to Euro symbols
  - `extractCuisineType()` - Maps Google place types to cuisine categories
  - `calculateAverageRating()` - Calculates average from user ratings

These utilities are pure functions with no side effects.
