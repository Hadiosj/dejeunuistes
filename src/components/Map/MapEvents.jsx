import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Component that accesses the Leaflet map instance and passes it to parent
 * This is needed because useMap() can only be called inside MapContainer
 */
export default function MapEvents({ setMapInstance }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      setMapInstance(map);
    }
  }, [map, setMapInstance]);

  return null;
}
