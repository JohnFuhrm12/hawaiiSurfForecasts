import './componentStyles/home.css';

import { MapContainer, TileLayer, useMap, LayersControl } from 'react-leaflet';
import LeafletVelocity from "./LeafletVelocity";

import 'leaflet/dist/leaflet.css';

import ReactPlayer from 'react-player/lazy';
import { useRef } from 'react';

function Home( {...props} ) {
  const layerControlRef = useRef();

    return (
      <div id='homePage'>
        <div id='homeImg'>
          <h1 id='homeTitle'>Hawai'i Surf Forecasts</h1>
        </div>
        <div className='homeSectionSplit'>
          <ReactPlayer className="liveCam" url='https://www.youtube.com/watch?v=VI8Wj5EwoRM' playing muted controls/>
          <div>
            <MapContainer center={[20.600, -157.390]} zoom={6.5}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <LayersControl position="topright" ref={layerControlRef}>
                <LayersControl.Overlay name="Satellite">
                  <TileLayer
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS
                    AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    url="http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.Overlay>
              </LayersControl>
              <LeafletVelocity ref={layerControlRef} />
            </MapContainer>
          </div>
        </div>
      </div>
    )
  }
  
  export default Home;