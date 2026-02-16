import L from 'leaflet';
import { CUISINE_EMOJI_MAP } from '../../utils/constants';

/**
 * Creates a custom pixel-art map pin with emoji based on restaurant type
 * @param {string} restaurantType - Type of cuisine
 * @returns {L.DivIcon} - Leaflet div icon
 */
export const createPixelPin = (restaurantType) => {
  const emoji = CUISINE_EMOJI_MAP[restaurantType] || '🍽️';

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
