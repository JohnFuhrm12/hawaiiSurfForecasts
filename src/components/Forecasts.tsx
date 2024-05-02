import './componentStyles/forecasts.css';
import 'leaflet/dist/leaflet.css';

import { MapContainer, TileLayer, useMap, LayersControl, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

firebaseInit();
const app = firebaseInit();
const db = getFirestore(app);

function Forecasts( {...props} ) {
    const [surfSpots, setSurfSpots] = useState([]);
    const [geoMarkersNorthShore, setGeoMarkersNorthShore] = useState([]);
    const [geoMarkersSouthShore, setGeoMarkersSouthShore] = useState([]);
    const [geoMarkersMaui, setGeoMarkersMaui] = useState([]);

    const [loaded, setLoaded] = useState(false);

    const surfSpotsSkeleton = [1, 2, 3, 4, 5, 6];

    const navigate = useNavigate();

    const getSurfSpots = async () => {
        const spotsRef = query(collection(db, "surfSpots"));
        const querySnapshot = await getDocs(spotsRef);
        setSurfSpots(querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));
    }

    const getGeoMarkers = async () => {
        const northShoreMarkersRef = query(collection(db, "geoMarkers"), where("cluster", "==", "NorthShore"));
        const northShoreQuerySnapshot = await getDocs(northShoreMarkersRef);
        setGeoMarkersNorthShore(northShoreQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));

        const southShoreMarkersRef = query(collection(db, "geoMarkers"), where("cluster", "==", "SouthShore"));
        const southShoreQuerySnapshot = await getDocs(southShoreMarkersRef);
        setGeoMarkersSouthShore(southShoreQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));

        const MauiMarkersRef = query(collection(db, "geoMarkers"), where("cluster", "==", "Maui"));
        const MauiQuerySnapshot = await getDocs(MauiMarkersRef);
        setGeoMarkersMaui(MauiQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));
    }

    useEffect(() => {
        getSurfSpots();
        getGeoMarkers();
    }, [])

    return (
        <div id='forecastsContainer'>
            <div id='forecastsSelectionContainer'>
                <h1 id='forecastsTitle'>Surf Forecasts</h1>
                <div id='forecastsGrid'>
                {surfSpots.length < 1 ?
                <>
                {surfSpotsSkeleton.map((location:any) => {
                    return (
                        <div className='locationCardSkeleton' key={location}>
                            <div className='locationCardSkeletonImg'/>
                            <div className='locationCardSkeletonText'/>
                        </div>
                    )
                })}
                </>
                : <></>}
                {surfSpots.map((location:any) => {
                    function showForecastDetails() {
                        navigate(`/forecasts/${location.slug}`);
                    }

                    return (
                        <div className='locationCard' onClick={showForecastDetails} key={location.id}>
                            {!loaded ? <div className='locationCardSkeletonImg'/> : <></>}
                            <img style={loaded ? {} : { display: 'none' }} className='locationCardImg' src={location.imgLink} onLoad={() => setLoaded(true)} alt={location.name} />
                            <h2 className='locationCardName'>{location.name}</h2>
                        </div>
                    )
                })}
                </div>
            </div>
            <div id='forecastsMapContainer'>
                <MapContainer center={[20.200, -156.800]} zoom={8} minZoom={3}>
                    <TileLayer attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community" url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
                    <LayersControl position="topright">
                    </LayersControl>
                    <MarkerClusterGroup>
                    {geoMarkersNorthShore.map((marker:any) => {
                        return (
                            <Marker position={marker.coordinates}>
                                <Popup>
                                    <h3 className='geoMarkerPopup'>{marker.popup}</h3>
                                </Popup>
                            </Marker>
                        )
                    })}
                    </MarkerClusterGroup>
                    <MarkerClusterGroup>
                    {geoMarkersSouthShore.map((marker:any) => {
                        return (
                            <Marker position={marker.coordinates}>
                                <Popup>
                                    <h3 className='geoMarkerPopup'>{marker.popup}</h3>
                                </Popup>
                            </Marker>
                        )
                    })}
                    </MarkerClusterGroup>
                    <MarkerClusterGroup>
                    {geoMarkersMaui.map((marker:any) => {
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