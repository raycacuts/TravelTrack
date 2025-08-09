import styles from "./Map.module.css";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Pane,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useState, useEffect, useMemo } from "react";
import { useCities } from "../contexts/CitiesContext";
import { useGeolocation } from "../hooks/useGeolocation";
import Button from "./Button";
import { useUrlPosition } from "../hooks/useUrlPosition";

// IMPORTANT: ensure once globally (e.g., in main.jsx):
// import 'leaflet/dist/leaflet.css';

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function Map() {
  const navigate = useNavigate();
  const { cities } = useCities();

  const [mapPosition, setMapPosition] = useState([40, 0]);
  const [searchParams] = useSearchParams();
  const { isLoading: isLoadingPosition, position: geoLocationPosition, getPosition } =
    useGeolocation();
  const [mapLat, mapLng] = useUrlPosition();

  useEffect(() => {
    if (mapLat && mapLng) setMapPosition([mapLat, mapLng]);
  }, [mapLat, mapLng]);

  useEffect(() => {
    if (geoLocationPosition) setMapPosition([geoLocationPosition.lat, geoLocationPosition.lng]);
  }, [geoLocationPosition]);

  // Sort by time (oldest -> newest); invalid dates go last
  const sortedCities = useMemo(() => {
    const safe = Array.isArray(cities) ? cities : [];
    return [...safe].sort((a, b) => {
      const da = Date.parse(a?.date);
      const db = Date.parse(b?.date);
      const va = Number.isFinite(da) ? da : Infinity;
      const vb = Number.isFinite(db) ? db : Infinity;
      return va - vb;
    });
  }, [cities]);

  // Build path coords (numbers only)
  const pathCoords = useMemo(() => {
    return sortedCities
      .map((c) => {
        const lat = toNum(c?.position?.lat);
        const lng = toNum(c?.position?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return [lat, lng];
      })
      .filter(Boolean);
  }, [sortedCities]);

  return (
    <div className={styles.mapContainer}>
      {!geoLocationPosition && (
        <Button type="position" onClick={getPosition}>
          {isLoadingPosition ? "Loading..." : "Use your position"}
        </Button>
      )}

      <MapContainer
        center={mapPosition}
        zoom={6}
        scrollWheelZoom
        className={styles.map}
        style={{ height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        {/* City markers */}
        {sortedCities.map((city) => {
          const lat = toNum(city?.position?.lat);
          const lng = toNum(city?.position?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return (
            <Marker position={[lat, lng]} key={city.id}>
              <Popup>
                {/* <span>{city.emoji}</span> */}
                <span>{city.cityName}</span>
              </Popup>
            </Marker>
          );
        })}

        {/* Path + arrows */}
        {pathCoords.length >= 2 && (
          <>
            <Pane name="arrows" style={{ zIndex: 650 }} />
            <Polyline positions={pathCoords} pathOptions={{ weight: 3, opacity: 0.9 }} />
            <Arrows coords={pathCoords} />
          </>
        )}

        <ChangeCenter position={mapPosition} />
        <DetectClick />
      </MapContainer>
    </div>
  );
}

function ChangeCenter({ position }) {
  const map = useMap();
  map.setView(position);
  return null;
}

function DetectClick() {
  const navigate = useNavigate();
  useMapEvents({
    click: (e) => navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`),
  });
  return null;
}

/** Arrows rendered using SCREEN-space angles so direction is always correct */
function Arrows({ coords }) {
  const map = useMap();
  const [, force] = useState(0);

  // Recompute angles when map moves/zooms so arrows keep pointing correctly
  useEffect(() => {
    const onUpdate = () => force((v) => v + 1);
    map.on("zoomend moveend", onUpdate);
    return () => {
      map.off("zoomend", onUpdate);
      map.off("moveend", onUpdate);
    };
  }, [map]);

  const markers = useMemo(() => {
    const items = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];

      // Convert to pixel space in current view
      const p1 = map.latLngToLayerPoint(L.latLng(a[0], a[1]));
      const p2 = map.latLngToLayerPoint(L.latLng(b[0], b[1]));
      const dx = p2.x - p1.x;
      const dy = -(p2.y - p1.y); // invert Y so up is positive

      // angle from +x (east), CCW; convert to CSS (clockwise)
      const angleRad = Math.atan2(dy, dx);
      const cssDeg = -(angleRad * 180) / Math.PI;

      // Place arrow ~60% along the segment
      const mid = [a[0] + (b[0] - a[0]) * 0.6, a[1] + (b[1] - a[1]) * 0.6];

      const html = `<div style="
        transform: rotate(${cssDeg}deg);
        transform-origin: center center;
        font-size: 24px;
        line-height: 24px;
        pointer-events: none;
        color: #61f74dff;
        text-shadow: 0 0 2px rgba(0,0,0,.65);
      ">➤</div>`;

      const icon = L.divIcon({
        className: styles.arrow ?? "",
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      items.push(
        <Marker
          key={`arrow-${i}`}
          position={mid}
          icon={icon}
          interactive={false}
          keyboard={false}
          pane="arrows"
        />
      );
    }
    return items;
  }, [coords, map, styles.arrow]);

  return <>{markers}</>;
}

export default Map;
