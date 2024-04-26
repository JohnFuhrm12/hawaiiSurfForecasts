import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './componentStyles/home.css';
import 'leaflet/dist/leaflet.css';

import ReactPlayer from 'react-player/lazy';
import { MapContainer, TileLayer, useMap, LayersControl } from 'react-leaflet';
import LeafletVelocity from "./LeafletVelocity";

import axios from 'axios';

function Home( {...props} ) {
  const [topArticles, setTopArticles] = useState([]);
  const layerControlRef = useRef();

  const newsAPIKey = process.env.REACT_APP_NEWS_API_KEY;

  useEffect(() => {
    const articleQuery = 'surf OR surfing OR wsl OR surfer OR stoked OR surfboard OR pointbreak OR slab';
    const domains = 'surfline.com,worldsurfleague.com,si.com,surfer.com,surfnewsnetwork.com,theinertia.com,surfertoday.com,carvemag.com,bbc.com,hawaiinewsnow.com,khon2.com,bigislandnow.com';

    const articlesRes = axios.get(`https://newsapi.org/v2/everything?q=${articleQuery}&domains=${domains}&sortBy=publishedAt&language=en&apiKey=${newsAPIKey}`)
    .then((res) => {
      console.log(res)
      const articles = res.data.articles;

      setTopArticles(articles.slice(0, 3));
    });
  }, [])

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
        <div id='articlesSection' className='homeSection'>
          <h2 id='articlesSectionTitle' className='sectionTitle sectionTitleLeft'>Latest News</h2>
          <div id='articlesContainer'>
            {topArticles?.map((article:any) => {
              return (
                <div className='articleContainer' key={article?.publishedAt}>
                  <img className='articleImg' src={article?.urlToImage} alt={article.title}/>
                  <h2 className='articleTitle'>{article?.title}</h2>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  
  export default Home;