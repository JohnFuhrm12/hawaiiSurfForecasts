import './componentStyles/home.css';

import ReactPlayer from 'react-player/lazy';

function Home( {...props} ) {

    return (
      <div id='homePage'>
        <div id='homeImg'>
          <h1 id='homeTitle'>Hawai'i Surf Forecasts</h1>
        </div>
        <div>
          <ReactPlayer url='https://www.youtube.com/watch?v=VI8Wj5EwoRM' playing muted controls/>
        </div>
      </div>
    )
  }
  
  export default Home;