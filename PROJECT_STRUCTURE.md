# Pixel Resto - Project Structure

A simple React app to save and rate restaurants with friends, featuring a retro pixel-art UI and Google Maps integration.

## 📁 Project Structure

```
pixel-resto/
├── src/
│   ├── components/           # React components
│   │   ├── Map/             # Map-related components
│   │   │   ├── RestaurantMap.jsx    # Main map with markers
│   │   │   ├── MapEvents.jsx        # Map instance handler
│   │   │   └── createPixelPin.js    # Custom pin creator
│   │   ├── Modals/          # Modal dialogs
│   │   │   ├── SearchModal.jsx           # Search restaurants
│   │   │   ├── PreviewModal.jsx          # Preview before adding
│   │   │   ├── AddRestaurantModal.jsx    # Add new restaurant
│   │   │   └── RatingModal.jsx           # Add rating
│   │   ├── ErrorToast.jsx        # Error notifications
│   │   ├── RestaurantSearch.jsx  # Google Places search
│   │   ├── SidePanel.jsx         # Restaurant details panel
│   │   └── ControlPanel.jsx      # Action buttons
│   ├── hooks/               # Custom React hooks
│   │   └── useRestaurants.js     # Restaurant CRUD operations
│   ├── utils/               # Utilities & helpers
│   │   ├── constants.js          # App constants
│   │   └── helpers.js            # Helper functions
│   ├── App.jsx              # Main app (now ~215 lines!)
│   ├── firebase.js          # Firebase configuration
│   └── index.css            # Styles
```

## 🎯 Key Files

### App.jsx (Main Entry Point)
- **Purpose**: Orchestrates all components and manages UI state
- **What it does**:
  - Manages modal visibility
  - Handles user interactions (clicks, selections)
  - Coordinates data flow between components

### hooks/useRestaurants.js (Business Logic)
- **Purpose**: All restaurant data management
- **Features**:
  - Fetches restaurants from Firebase
  - Saves new restaurants
  - Adds ratings to existing restaurants
  - Error handling and logging
  - Loading states

### utils/constants.js
- Map configuration (zoom levels, Paris center coordinates)
- UI settings (timeouts, debounce delays)
- Cuisine types and emoji mappings
- Google Places API type mappings

### utils/helpers.js
- `getPriceDisplay()` - Converts price levels to € symbols
- `extractCuisineType()` - Maps Google types to cuisine categories
- `calculateAverageRating()` - Calculates average from user ratings
- `isValidRating()` - Validates rating values (1-5)

## 🧩 Component Breakdown

### Map Components
- **RestaurantMap**: Displays Leaflet map with all restaurant markers
- **MapEvents**: Provides map instance to parent component
- **createPixelPin**: Creates custom pixel-art pins with emojis

### Modal Components
All modals handle their own form state and pass actions via callbacks:
- **SearchModal**: Google Places restaurant search
- **PreviewModal**: Shows restaurant info before adding
- **AddRestaurantModal**: Form to add restaurant with initial rating
- **RatingModal**: Form to add rating to existing restaurant

### Other Components
- **ErrorToast**: Auto-dismissing error notifications
- **RestaurantSearch**: Google Places autocomplete search
- **SidePanel**: Displays full restaurant details
- **ControlPanel**: Bottom-left action buttons

## 🔄 Data Flow

1. **Fetching Data**: `useRestaurants` hook loads restaurants from Firebase on mount
2. **Adding Restaurant**:
   - User searches → SearchModal → PreviewModal → AddRestaurantModal
   - Form submission → `saveRestaurant()` in hook → Firebase → Refresh list
3. **Adding Rating**:
   - User clicks restaurant → SidePanel → RatingModal
   - Form submission → `addRating()` in hook → Firebase → Refresh list

## 🛠️ Adding New Features

### To add a new modal:
1. Create component in `components/Modals/`
2. Import in `App.jsx`
3. Add state for modal visibility
4. Add modal to JSX with conditional rendering

### To add a new utility function:
1. Add to `utils/helpers.js`
2. Export the function
3. Import where needed

### To modify constants:
1. Edit `utils/constants.js`
2. Changes will propagate automatically

### To add new restaurant operations:
1. Add function to `hooks/useRestaurants.js`
2. Return it from the hook
3. Use in components via `const { yourNewFunction } = useRestaurants()`

## 📝 Development Tips

- Each component folder has a README explaining what's inside
- Components are designed to be self-contained
- Props are passed explicitly (no global state besides the hook)
- Business logic is in the hook, UI logic in components
- Constants are centralized for easy modification

## 🎨 Styling

- Uses NES.css for retro pixel-art styling
- Responsive design with `isMobile` prop
- Custom CSS in `index.css`

## 🔥 Firebase

- Configuration in `firebase.js`
- All Firebase operations in `useRestaurants` hook
- Error logging collection: `error_logs`
- Main collection: `restaurants`

