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
import { usePlans } from "../contexts/PlansContext";
import { useGeolocation } from "../hooks/useGeolocation";
import Button from "./Button";
import { useUrlPosition } from "../hooks/useUrlPosition";

// IMPORTANT: ensure once globally (e.g., in main.jsx):
// import 'leaflet/dist/leaflet.css';

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// Custom ORANGE icon for planned cities
const orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function Map() {
  const navigate = useNavigate();
  const { cities } = useCities();
  const { plans } = usePlans();

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

  // ---------- Sort (oldest → newest) ----------
  const sortedVisited = useMemo(() => {
    const safe = Array.isArray(cities) ? cities : [];
    return [...safe].sort((a, b) => {
      const da = Date.parse(a?.date);
      const db = Date.parse(b?.date);
      const va = Number.isFinite(da) ? da : Infinity;
      const vb = Number.isFinite(db) ? db : Infinity;
      return va - vb;
    });
  }, [cities]);

  const sortedPlanned = useMemo(() => {
    const safe = Array.isArray(plans) ? plans : [];
    return [...safe].sort((a, b) => {
      const da = Date.parse(a?.date);
      const db = Date.parse(b?.date);
      const va = Number.isFinite(da) ? da : Infinity;
      const vb = Number.isFinite(db) ? db : Infinity;
      return va - vb;
    });
  }, [plans]);

  // ---------- Build coords ----------
  const visitedCoords = useMemo(
    () =>
      sortedVisited
        .map((c) => {
          const lat = toNum(c?.position?.lat);
          const lng = toNum(c?.position?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lat, lng];
        })
        .filter(Boolean),
    [sortedVisited]
  );

  const plannedCoords = useMemo(
    () =>
      sortedPlanned
        .map((p) => {
          const lat = toNum(p?.position?.lat);
          const lng = toNum(p?.position?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return [lat, lng];
        })
        .filter(Boolean),
    [sortedPlanned]
  );

  // ---------- Connector: last visited -> first planned ----------
  const connectorCoords = useMemo(() => {
    if (visitedCoords.length < 1 || plannedCoords.length < 1) return [];
    const lastVisited = visitedCoords[visitedCoords.length - 1];
    const firstPlanned = plannedCoords[0];
    if (!lastVisited || !firstPlanned) return [];
    if (lastVisited[0] === firstPlanned[0] && lastVisited[1] === firstPlanned[1]) return [];
    return [lastVisited, firstPlanned];
  }, [visitedCoords, plannedCoords]);

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

        {/* ---------- Markers: Visited ---------- */}
        {sortedVisited.map((city) => {
          const lat = toNum(city?.position?.lat);
          const lng = toNum(city?.position?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return (
            <Marker position={[lat, lng]} key={`v-${city.id}`}>
              <Popup>
                <span>{city.cityName}</span>
              </Popup>
            </Marker>
          );
        })}

        {/* ---------- Markers: Planned (orange pins) ---------- */}
        {sortedPlanned.map((plan) => {
          const lat = toNum(plan?.position?.lat);
          const lng = toNum(plan?.position?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          return (
            <Marker position={[lat, lng]} key={`p-${plan.id}`} icon={orangeIcon}>
              <Popup>
                <span>(Planned) {plan.cityName}</span>
              </Popup>
            </Marker>
          );
        })}

        {/* ---------- Paths & Arrows ---------- */}
        {/* Visited path: default polyline + green arrows */}
        {visitedCoords.length >= 2 && (
          <>
            <Pane name="arrows" style={{ zIndex: 650 }} />
            <Polyline positions={visitedCoords} pathOptions={{ weight: 3, opacity: 0.9 }} />
            <Arrows coords={visitedCoords} color="#2ecc71" /> {/* green */}
          </>
        )}

        {/* Planned path: ORANGE polyline + RED arrows */}
        {plannedCoords.length >= 2 && (
          <>
            <Pane name="arrows-planned" style={{ zIndex: 651 }} />
            <Polyline
              positions={plannedCoords}
              pathOptions={{ weight: 3, opacity: 0.9, color: "#ff9800" }} // orange
            />
            <Arrows coords={plannedCoords} color="#ff3b30" pane="arrows-planned" /> {/* red */}
          </>
        )}

        {/* Connector: last visited -> first planned (orange + red arrow) */}
        {connectorCoords.length === 2 && (
          <>
            <Pane name="arrows-connector" style={{ zIndex: 652 }} />
            <Polyline
              positions={connectorCoords}
              pathOptions={{ weight: 3, opacity: 0.9, dashArray: "6 6", color: "#ff9800" }}
            />
            <Arrows coords={connectorCoords} color="#ff3b30" pane="arrows-connector" />
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
function Arrows({ coords, color = "#4dabf7", pane = "arrows" }) {
  const map = useMap();
  const [, force] = useState(0);

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
        color: ${color};
        text-shadow:
          -1px -1px 0 #000,
           1px -1px 0 #000,
          -1px  1px 0 #000,
           1px  1px 0 #000;
      ">➤</div>`;

      const icon = L.divIcon({
        className: styles.arrow ?? "",
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      items.push(
        <Marker
          key={`arrow-${pane}-${i}`}
          position={mid}
          icon={icon}
          interactive={false}
          keyboard={false}
          pane={pane}
        />
      );
    }
    return items;
  }, [coords, map, styles.arrow, color, pane]);

  return <>{markers}</>;
}

export default Map;
