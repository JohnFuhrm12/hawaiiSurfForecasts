import { useRef } from 'react';
import { Link } from 'react-router-dom';
import './componentStyles/home.css';
import 'leaflet/dist/leaflet.css';

import ReactPlayer from 'react-player/lazy';
import { MapContainer, TileLayer, useMap, LayersControl } from 'react-leaflet';
import LeafletVelocity from "./LeafletVelocity";

function Home( {...props} ) {
  const layerControlRef = useRef();

    return (
      <div id='homePage'>
        <div id='homeImg'>
          <h1 id='homeTitle'>Hawai'i Surf Forecasts</h1>
        </div>
        <div className='homeSectionSplit'>
          <div>
            <ReactPlayer className="liveCam" url='https://www.youtube.com/watch?v=VI8Wj5EwoRM' playing muted controls/>
            <h2 className='sectionTitle sectionTitleLeft'>Pipeline Live Cam</h2>
            <Link className="sectionLink" to='/'>View Cams</Link>
          </div>
          <div>
            <MapContainer center={[20.200, -157.290]} zoom={6.5}>
            <TileLayer attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community" url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
              <LayersControl position="topright" ref={layerControlRef}>
              </LayersControl>
              <LeafletVelocity ref={layerControlRef} />
            </MapContainer>
            <h2 className='sectionTitle sectionTitleLeft'>Current Winds</h2>
          </div>
        </div>
      </div>
    )
  }
  
  export default Home;