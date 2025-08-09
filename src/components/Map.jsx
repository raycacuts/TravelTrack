import styles from './Map.module.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect } from "react";
import { useCities } from '../contexts/CitiesContext';
import { useMap, useMapEvents } from 'react-leaflet';
import { useGeolocation } from '../hooks/useGeolocation';
import Button from './Button';
import { useUrlPosition } from '../hooks/useUrlPosition';

function Map() {
    const navigate = useNavigate();
    const {cities} = useCities();

    const [mapPosition, setMapPosition] = useState([40, 0]);

    const [searchParams] = useSearchParams();
    const {isLoading: isLoadingPosition, position: geoLocationPostion, getPosition} = useGeolocation();
    const [mapLat, mapLng] = useUrlPosition();

    // const latParam = searchParams.get('lat');
    // const lngParam = searchParams.get('lng');

    // const mapLat = latParam !== null ? parseFloat(latParam) : 40;
    // const mapLng = lngParam !== null ? parseFloat(lngParam) : 0;


    useEffect(function() {
        if(mapLat && mapLng) setMapPosition([mapLat, mapLng]);
    }, [mapLat, mapLng]);

    useEffect(function() {
        if(geoLocationPostion) setMapPosition([geoLocationPostion.lat, geoLocationPostion.lng]);
    }, [geoLocationPostion]);

    return (
        <div className={styles.mapContainer}>
            {!geoLocationPostion && (<Button type='position' onClick={getPosition}>
                {isLoadingPosition ? 'Loading...' : 'Use your position'}
            </Button>)}
            <MapContainer 
                    center={mapPosition} 
                    zoom={6} 
                    scrollWheelZoom={true} 
                    className={styles.map}>
                <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                />
                {cities.map((city) => (
                    <Marker position={[city.position.lat, city.position.lng]} key={city.id}>
                        <Popup>
                           {/* <span>{city.emoji}</span> */}
                           <span>{city.cityName}</span>
                        </Popup>
                    </Marker>
                ))}
                <ChangeCenter position={mapPosition}/>
                <DetectClick/>
                {/* <Marker position={mapPosition}>
                <Popup>
                    A pretty CSS3 popup. <br /> Easily customizable.
                </Popup>
                </Marker> */}
            </MapContainer>
        </div>
    )
}
function ChangeCenter({position}){
    const map = useMap();
    map.setView(position);
    return null;
}
function DetectClick(){
    const navigate = useNavigate();

    useMapEvents({
        click: e => navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`),
    })
}
export default Map
