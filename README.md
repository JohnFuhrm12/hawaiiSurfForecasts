# Hawaii Surf Forecasts

Surf forecast site for Hawaiian Islands. Built with React/TypeScript and using my Flask API (NDBC Buoy Data) to get raw NOAA buoy data.

# Features
1. Home page with Pipeline surf camera, regional wind map, and local surf news
2. Interacive surf map and dashboard with best surfing beaches to choose from
3. Detailed surf forecast with local swell and weather information
4. Interacive charts for swell energy, tides, and 2 week surf forecasts
5. Secure sign up and login with Firebase Auth
6. Favorites page to quickly add and access chosen surf spots

# API & Data Information

The site pulls data from various different sources to get a full picture view of the current surf conditions. The primary source is NOAA - Primarily from NDBC buoys.

The NDBC Buoy Data Flask API facilitates NOAA CSV and .Bull document parsing, giving current buoy datasets, raw spectral data providing the swell energy and frequency of different swell groups, and Wave Watcher 3 forecast data from NOAAs GFS model providing future swell predictions.

This information provides the site with swell energy, frequency, period, significant wave heights and direction, and more. 

Tidal data is drawn from NOAA tidal stations from their Tides And Currents API.

Local weather conditions, temperatures, and wind for beaches are drawn from the OpenWeather API using beach coordinates.

Local Hawaii news articles are fetcheed from the News API.

Spot information to use for each API call is stored in a Firebase database.
