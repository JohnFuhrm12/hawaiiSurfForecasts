import './componentStyles/home.css';

import { MapContainer } from 'react-leaflet/MapContainer';
import { TileLayer } from 'react-leaflet/TileLayer';
import 'leaflet/dist/leaflet.css';

import ReactPlayer from 'react-player/lazy';

function Home( {...props} ) {

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
            </MapContainer>
          </div>
        </div>
      </div>
    )
  }
  
  export default Home;