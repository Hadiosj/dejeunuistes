import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import MapEvents from './MapEvents';
import { createPixelPin } from './createPixelPin';
import { PARIS_CENTER, MAP_ZOOM_DEFAULT_MOBILE, MAP_ZOOM_DEFAULT_DESKTOP } from '../../utils/constants';

/**
 * Main map component displaying all restaurant markers
 */
export default function RestaurantMap({
  restos,
  isMobile,
  showSidePanel,
  selectedResto,
  onMarkerClick,
  setMapInstance
}) {
  return (
    <MapContainer
      center={[PARIS_CENTER.lat, PARIS_CENTER.lng]}
      zoom={isMobile ? MAP_ZOOM_DEFAULT_MOBILE : MAP_ZOOM_DEFAULT_DESKTOP}
      className="map-container"
      style={{
        width: (showSidePanel && !isMobile) ? 'calc(100% - 400px)' : '100%',
        transition: 'width 0.3s ease'
      }}
    >
      <MapEvents setMapInstance={setMapInstance} />
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
                click: () => onMarkerClick(r)
              }}
            >
              {/* Tooltip showing restaurant name - permanent on mobile or when selected */}
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
  );
}
