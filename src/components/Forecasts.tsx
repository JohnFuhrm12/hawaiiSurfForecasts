import './componentStyles/forecasts.css';
import 'leaflet/dist/leaflet.css';

import { MapContainer, TileLayer, useMap, LayersControl, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import firebaseInit from './firebaseConfig';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs } from "firebase/firestore";
import { useEffect, useState } from 'react';

firebaseInit();
const app = firebaseInit();
const db = getFirestore(app);

function Forecasts( {...props} ) {
    const [surfSpots, setSurfSpots] = useState([]);
    const [geoMarkers, setGeoMarkers] = useState([]);

    const getSurfSpots = async () => {
        const spotsRef = query(collection(db, "surfSpots"));
        const querySnapshot = await getDocs(spotsRef);
        setSurfSpots(querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));
        // console.log(surfSpots)
    }

    const getGeoMarkers = async () => {
        const markersRef = query(collection(db, "geoMarkers"));
        const querySnapshot = await getDocs(markersRef);
        setGeoMarkers(querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));
        // console.log(surfSpots)
    }

    useEffect(() => {
        getSurfSpots();
        getGeoMarkers();
    }, [])

    return (
        <div id='forecastsContainer'>
            <div id='forecastsSelectionContainer'>
                <h1 id='forecastsTitle'>Surf Forecasts</h1>
                {surfSpots.map((location:any) => {
                    return (
                        <div className='locationCard' key={location.id}>
                            <img className='locationCardImg' src={location.imgLink} alt={location.name} />
                            <h2 className='locationCardName'>{location.name}</h2>
                        </div>
                    )
                })}
            </div>
            <div id='forecastsMapContainer'>
                <MapContainer center={[20.200, -156.800]} zoom={8}>
                    <TileLayer attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community" url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
                    <LayersControl position="topright">
                    </LayersControl>
                    <MarkerClusterGroup>
                    {geoMarkers.map((marker:any) => {
                        return (
                            <Marker position={marker.coordinates}>
                                <Popup>
                                    <h3 className='geoMarkerPopup'>{marker.popup}</h3>
                                </Popup>
                            </Marker>
                        )
                    })}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </div>
    )
}

export default Forecasts;