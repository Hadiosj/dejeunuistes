// === MAP CONFIGURATION ===
export const SEARCH_RADIUS_METERS = 15000;
export const MAP_ZOOM_LEVEL_DETAIL = 17;
export const MAP_ZOOM_DEFAULT_MOBILE = 11;
export const MAP_ZOOM_DEFAULT_DESKTOP = 12;
export const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };

// === UI CONFIGURATION ===
export const ERROR_TOAST_DURATION = 5000;
export const SEARCH_DEBOUNCE_MS = 300;

// === CUISINE TYPES ===
export const CUISINE_TYPES = [
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
  "Africain",
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

// === EMOJI ICON MAPPING ===
export const CUISINE_EMOJI_MAP = {
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
  'Africain': '🥘',
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

// === GOOGLE PLACES CUISINE MAPPING ===
export const GOOGLE_CUISINE_MAP = {
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
