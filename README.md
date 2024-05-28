# Hawaii Surf Forecasts

Surf forecast site for Hawaiian Islands. Built with React/TypeScript and using my Flask API to get raw NOAA buoy data.

Need to access NOAA Wave Watcher 3 model data for future forecasts.
Need to split raw buoy data and solve for wave height as a function of frequency and power to get individual swell components.

Can put buoys with buoy info on Leaflet map as an extra.

https://medium.com/@surf.lazy/reading-surf-forecasts-swell-height-911970022082

Investigate Fourier Transform and wave direcional spectrum graphs
Wave Energy (m^2/Hz)

1. Wind + Weather info
2. WW3 Model + chart for wave height (transparent + color coded) 1 week https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.20240527/00/wave/station/bulls.t00z/gfswave.51201.bull
3. Tide info + chart
4. Wave direction spectral chart
   


https://polar.ncep.noaa.gov/waves/WEB/multi_1.latest_run/plots/multi_1.51201.bull

https://www.weather.gov/documentation/services-web-api
