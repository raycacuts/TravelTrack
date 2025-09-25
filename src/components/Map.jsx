// components/Map.jsx
import styles from "./Map.module.css"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Pane,
  useMap,
  useMapEvents,
} from "react-leaflet"
import L from "leaflet"
import { useState, useEffect, useMemo } from "react"
import { useCities } from "../contexts/CitiesContext"
import { usePlans } from "../contexts/PlansContext"

import { useGeolocation } from "../hooks/useGeolocation"
import Button from "./Button"

import { useUrlPosition } from "../hooks/useUrlPosition"

const toNum = v => {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

const blueIcon = new L.Icon({

  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],

  shadowSize: [41, 41],
})

const orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],

  shadowSize: [41, 41],
})

export default function Map() {
  const nav = useNavigate()

  const { cities } = useCities()

  const { plans } = usePlans()

  const [center, setCenter] = useState([40, 0])
  const [qp] = useSearchParams()
  const { isLoading: geoLoading, position: geoPos, getPosition } = useGeolocation()
  const [lat, lng] = useUrlPosition()




  useEffect(() => {
    if (lat && lng) setCenter([lat, lng])
  }, [lat, lng])


  useEffect(() => {

    if   (geoPos) setCenter([geoPos.lat, geoPos.lng])
  }, [geoPos])

  const visited = useMemo(() => {

    const list = Array.isArray(cities) ? cities : []

    return [...list].sort((a, b) => {

      const da = Date.parse(a?.date)
      const db = Date.parse(b?.date)
      return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity)
    })
  }, [cities])

  const planned = useMemo(() => {

    const list = Array.isArray(plans) ? plans : []
    return [...list].sort((a, b) => {
      const da = Date.parse(a?.date)
      const db = Date.parse(b?.date)
      return (Number.isFinite(da) ? da : Infinity) - (Number.isFinite(db) ? db : Infinity)
    })
  }, [plans])

  const vCoords = useMemo(
    () =>
      visited
        .map(c => {
          const a = toNum(c?.position?.lat)
          const b = toNum(c?.position?.lng)
          return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null
        })
        .filter(Boolean),
    [visited]
  )

  const pCoords = useMemo(
    () =>
      planned
        .map(p => {
          const a = toNum(p?.position?.lat)
          const b = toNum(p?.position?.lng)
          return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null
        })
        .filter(Boolean),
    [planned]
  )

  const connect = useMemo(() => {

    if (vCoords.length < 1 || pCoords.length < 1) return []

    const a = vCoords[vCoords.length - 1]
    const b = pCoords[0]

    if (!a || !b) return []
    if (a[0] === b[0] && a[1] === b[1]) return []

    return [a, b]
  }, [vCoords, pCoords])

  return (
    <div className={styles.mapContainer}>
      {!geoPos && (
        <Button type="position" onClick={getPosition}>

          {geoLoading ? "Loading..." : "Use your position"}
        </Button>
      )}

      <MapContainer center={center} zoom={6} scrollWheelZoom className={styles.map} style={{ height: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        />

        {visited.map((c, i) => {

          const a = toNum(c?.position?.lat)
          const b = toNum(c?.position?.lng)

          if (!Number.isFinite(a) || !Number.isFinite(b)) return null
          const k = c.id || c._id || `${c.cityName ?? "v"}-${i}`
          return (

            <Marker position={[a, b]} key={`v-${k}`} icon={blueIcon}>
              <Popup>

                <strong>{c.cityName}</strong>
                {c.country ? <div>{c.country}</div> : null}
              </Popup>
            </Marker>
          )
        })}

        {planned.map((p, i) => {

          const a = toNum(p?.position?.lat)
          const b = toNum(p?.position?.lng)

          if (!Number.isFinite(a) || !Number.isFinite(b)) return null
          const k = p.id || p._id || `${p.cityName ?? "p"}-${i}`
          return (

            <Marker position={[a, b]} key={`p-${k}`} icon={orangeIcon}>
              <Popup>
                <strong>(Planned) {p.cityName}</strong>
                {p.country ? <div>{p.country}</div> : null}
              </Popup>
            </Marker>
          )
        })}

        {vCoords.length >= 2 && (
          <>

            <Pane name="arrows" style={{ zIndex: 650 }} />

            <Polyline positions={vCoords} pathOptions={{ weight: 3, opacity: 0.9 }} />
            <Arrows coords={vCoords} color="#2ecc71" />
          </>
        )}

        {pCoords.length >= 2 && (
          <>

            <Pane name="arrows-planned" style={{ zIndex: 651 }} />
            <Polyline positions={pCoords} pathOptions={{ weight: 3, opacity: 0.9, color: "#ff9800" }} />
            <Arrows coords={pCoords} color="#ff3b30" pane="arrows-planned" />
          </>
        )}

        {connect.length === 2 && (

          <>
            <Pane name="arrows-connector" style={{ zIndex: 652 }} />
            <Polyline positions={connect} pathOptions={{ weight: 3, opacity: 0.9, dashArray: "6 6", color: "#ff9800" }} />
            <Arrows coords={connect} color="#ff3b30" pane="arrows-connector" />
          </>
        )}


        <ChangeCenter position={center} />

        <DetectClick onPick={pos => nav(`form?lat=${pos[0]}&lng=${pos[1]}`)} />
      </MapContainer>
    </div>
  )
}

function ChangeCenter({ position }) {
  const map = useMap()
  map.setView(position)

  return null
}

function DetectClick({ onPick }) {
  const nav = useNavigate()

  useMapEvents({

    click: e => {
      const v = [e.latlng.lat, e.latlng.lng]
      if (onPick) onPick(v)

      else nav(`form?lat=${v[0]}&lng=${v[1]}`)
    },
  })
  return null
}

function Arrows({ coords, color = "#4dabf7", pane = "arrows" }) {
  const map = useMap()

  const [, setN] = useState(0)

  useEffect(() => {
    const up = () => setN(v => v + 1)
    map.on("zoomend moveend", up)

    return () => {

      map.off("zoomend", up)
      map.off("moveend", up)
    }
  }, [map])

  const items = useMemo(() => {
    const out = []
    for (let i = 0; i < coords.length - 1; i++) {

      const a = coords[i]
      const b = coords[i + 1]

      const p1 = map.latLngToLayerPoint(L.latLng(a[0], a[1]))
      const p2 = map.latLngToLayerPoint(L.latLng(b[0], b[1]))

      const dx = p2.x - p1.x
      const dy = -(p2.y - p1.y)

      const ang = -(Math.atan2(dy, dx) * 180) / Math.PI
      const mid = [a[0] + (b[0] - a[0]) * 0.6, a[1] + (b[1] - a[1]) * 0.6]
     
      const html = `<div style="
        transform: rotate(${ang}deg);
        transform-origin: center center;
        font-size: 24px;
        line-height: 24px;
        pointer-events: none;
        color: ${color};
        text-shadow:-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000;
      ">➤</div>`
      const icon = L.divIcon({
        className: styles.arrow ?? "",
        html,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      out.push(

        <Marker
          key={`arrow-${pane}-${i}`}
          position={mid}
          icon={icon}
          
          interactive={false}
          keyboard={false}
          pane={pane}
        />
      )
    }
    return out
  }, [coords, map, color, pane])

  return <>{items}</>
}
