# Les Dejeunuistes 🌾

A Halal restaurant discovery and rating app made for Les Dejeunuistes.

## Features

- 🗺️ Interactive map view of previously added restaurants
- 🔍 Search new restaurants from Google Maps (via Google Places API)
- ⭐ Review restaurants with personal notes
- 🎲 Don't know where to eat? Get a random restaurant suggestion
- ✅ Halal certification tracking

## How to Use

1. **Add**: Use the search box to find restaurants in google maps and add them, or manually add a restaurant by clicking the "+ Ajouter" button and filling the details
3. **Explore**: Click on a restaurant marker to see its info and reviews in a side panel
4. **Rate**: Add you personal ratings and reviews to any restaurant
5. **Random**: Use the 🎲 button to get a random restaurant suggestion

## Tech Stack
- **Frontend**: React + Vite
- **Maps**: Leaflet (with React-Leaflet)
- **Search & Restaurant Data**: Google Places API
- **UI**: NES.css (retro styling)
- **Data Storage**: Firebase

## Deployment

Deployed on Google Cloud using Firebase Hosting.

```bash
npm run build && firebase deploy
```