import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { xml2json } from 'xml-js';
import axios from 'axios';
import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDoc, getDocs, where, updateDoc, arrayRemove, arrayUnion, doc } from "firebase/firestore";
import { getWaveDirection } from '../utils/surfUtils';
import { createSwellEnergyChart, createTideChart, createWaveForecastChart } from '../utils/chartUtils';
import { toast } from 'react-toastify';
import ReactPlayer from 'react-player/lazy';
import './componentStyles/forecastDetails.css';

firebaseInit();
const app = firebaseInit();
const db = getFirestore(app);

function ForecastDetails( {...props} ) {
    const [currentNDBCData, setCurrentNDBCData] = useState({});

    const [waveHeightFT, setWaveHeightFT] = useState<Number>();
    const [wavePeriod, setWavePeriod] = useState<String>();
    const [waveDirDeg, setWaveDirDeg] = useState<Number>();
    const [waveDirStr, setWaveDirStr] = useState<String>();
    const [waterTempC, setWaterTempC] = useState<Number>();
    const [waterTempF, setWaterTempF] = useState<Number>();

    const [swellCompMajor, setSwellCompMajor] = useState();
    const [swellCompMinor, setSwellCompMinor] = useState();

    const [swellEnergyData, setSwellEnergyData] = useState();
    const [tidePredictions, setTidePredictions] = useState();
    const [waveForecastData, setWaveForecastData] = useState();
    const [compressedWaveForecastData, setCompressedWaveForecastData] = useState([]);

    const [buoy, setBuoy] = useState<String>();
    const [tideStation, setTideStation] = useState<String>();

    const [localWeather, setLocalWeather] = useState();
    const [currentRating, setCurrentRating] = useState('Fair');

    const [favoritesStatus, setFavoritesStatus] = useState('Favorite');

    const [location, setLocation] = useState(null);
    const params = useParams();
    const locationSlug = params.id;

    const getLocationDetails = async () => {
        const locationRef = query(collection(db, "surfSpots"), where("slug", "==", locationSlug));
        const locationQuerySnapshot = await getDocs(locationRef);
        const validLocations = locationQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id}));
        setLocation(validLocations[0]);
        setTideStation(validLocations[0].tideStation);
        setBuoy(validLocations[0].buoy);
    }

    const getLocalWeather = async () => {
        const openWeatherKey = process.env.REACT_APP_OPEN_WEATHER_API_KEY;
        const lat = location.coordinates[0];
        const lon = location.coordinates[1];

        const endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}`;

        try {
            await axios.get(endpoint).then((res) => {
                const weather = res.data;
                setLocalWeather(weather)
            })
        } catch(e) {
            console.error(e);
        }
    }

    function getCurrentDate() {
        let today = new Date();
        let year = today.getFullYear();
        let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because January is 0
        let day = today.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    function getYesterdayDate() {
        let today = new Date();
        let yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
    
        let year = yesterday.getFullYear();
        let month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
        let day = yesterday.getDate().toString().padStart(2, '0');
    
        return `${year}${month}${day}`;
    }

    function getDayBeforeYesterdayDate() {
        let today = new Date();
        let yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 2);
    
        let year = yesterday.getFullYear();
        let month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
        let day = yesterday.getDate().toString().padStart(2, '0');
    
        return `${year}${month}${day}`;
    }

    const getNDBCData = async () => {
        const modelDate = getCurrentDate(); // yyyymmdd
        const modelYDate = getYesterdayDate();
        const modelY2Date = getDayBeforeYesterdayDate();
        const flaskAPIBase = 'https://johnfuhrm12.pythonanywhere.com';
        const mainEndpoint = `${flaskAPIBase}/buoy/${buoy}`;
        const tidesEnpoint = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${tideStation}&product=predictions&datum=MLLW&time_zone=gmt&units=english&application=DataAPI_Sample&format=xml`;

        try {
            await axios.get(tidesEnpoint).then((res) => {
                const noaaTidesXML = res.data;
                const jsonData = xml2json(noaaTidesXML, { compact: false, spaces: 4 });
                const jsonRes = JSON.parse(jsonData);
                const predictions = jsonRes.elements[0].elements;
                let dataArr = [];

                for (let i = 0; i < predictions.length; i+=3) {
                    dataArr.push(predictions[i]);
                }

                setTidePredictions(dataArr);
            });
        } catch(e) {
            console.error(e);
        }

        try {
            await axios.get(mainEndpoint).then((res) => {
                const NDBC_Current = res.data[1];
                setCurrentNDBCData(NDBC_Current);

                const currentWaveHeightM = NDBC_Current.WVHT;
                const currentWaveHeightF = Math.round(currentWaveHeightM * 3.281 * 10) / 10;

                setWaveHeightFT(currentWaveHeightF);
                setWavePeriod(NDBC_Current.DPD);

                const waveDirDegrees = NDBC_Current.MWD;
                const waveDirStr = getWaveDirection(waveDirDegrees);

                setWaveDirDeg(waveDirDegrees);
                setWaveDirStr(waveDirStr);

                const currentWaterTempC = NDBC_Current.WTMP;
                const currentWaterTempF = currentWaterTempC * (9/5) + 32;


                setWaterTempC(NDBC_Current.WTMP);
                setWaterTempF(currentWaterTempF.toFixed(1));
            });
        } catch(e) {
            console.error(e);
        }

        const spectralSummaryEndpoint = `${flaskAPIBase}/buoy/${buoy}/spectral`;

        try {
            await axios.get(spectralSummaryEndpoint).then((res) => {
                const NDBC_Current = res.data[1];

                const compMajor = {
                    'wvht': NDBC_Current.SwH, 
                    'period': NDBC_Current.SwP, 
                    'dir': NDBC_Current.SwD,
                }

                const compMinor = {
                    'wvht': NDBC_Current.WWH, 
                    'period': NDBC_Current.WWP, 
                    'dir': NDBC_Current.WWD,
                }

                setSwellCompMajor(compMajor);
                setSwellCompMinor(compMinor);
            });
        } catch(e) {
            console.error(e);
        }

        const spectralRawPairsEndpoint = `${flaskAPIBase}/buoy/${buoy}/spectral/raw/pairs`;

        try {
            await axios.get(spectralRawPairsEndpoint).then((res) => {
                const NDBC_Current = res.data;
                setSwellEnergyData(NDBC_Current);
            });
        } catch(e) {
            console.log(e);
        }

        const waveWatcher3Endpoint = `${flaskAPIBase}/ww3/${modelDate}/buoy/${buoy}`;
        const waveWatcher3BackupEndpoint = `${flaskAPIBase}/ww3/${modelYDate}/buoy/${buoy}`;
        const waveWatcher3BackupEndpoint2 = `${flaskAPIBase}/ww3/${modelY2Date}/buoy/${buoy}`;

        try {
            await axios.get(waveWatcher3Endpoint).then((res) => {
                const GFS_Current = res.data;
                setWaveForecastData(GFS_Current);
            });
        } catch(e) {
            console.error(e);
            console.error('Failed to get model run from today, attempting to fetch yesterdays.')
            // If the run fails, possibly because it has not yet been created, get the previous run
            try {
                await axios.get(waveWatcher3BackupEndpoint).then((res) => {
                    const GFS_Current = res.data;
                    setWaveForecastData(GFS_Current);
                });
            } catch(e) {
                console.error('Failed to get backup model run, attempting to fetch from 2 days ago.')
                try {
                    await axios.get(waveWatcher3BackupEndpoint2).then((res) => {
                        const GFS_Current = res.data;
                        setWaveForecastData(GFS_Current);
                    });
                } catch(e) {
                    console.error(e)
                }
            }
        }

    }

    useEffect(() => {
        getLocationDetails();
    }, [])

    useEffect(() => {
        createSwellEnergyChart(swellEnergyData);
        createTideChart(tidePredictions, tideStation);
        createWaveForecastChart(waveForecastData);
    }, [swellEnergyData, tidePredictions, waveForecastData])

    useEffect(() => {
        getNDBCData();
    }, [buoy])

    useEffect(() => {
        getLocalWeather();
    }, [location])

    if (waveHeightFT === undefined) {
        getLocationDetails();
    }

    useEffect(() => {
        const bubble = document.getElementById("surfHeightBubble");

        // Current Rating Depends ONLY on wind right now
        // Future rating should take wave height and wind direction into account

        if (localWeather?.wind.speed < 8) {
            bubble.style.backgroundColor = 'orange';
            setCurrentRating('Good');
        }

        if (localWeather?.wind.speed < 15 && localWeather?.wind.speed > 10) {
            bubble.style.backgroundColor = 'lime';
            setCurrentRating('Fair');
        }

        if (localWeather?.wind.speed >= 15) {
            bubble.style.backgroundColor = 'blue';
            setCurrentRating('Poor');
        }

        if (waveHeightFT < 1) {
            bubble.style.backgroundColor = 'gray';
            setCurrentRating('Flat');
        }
    })  

    const getFavoritesStatus = async () => {
        const currentUserDetails = props.currentUserDetails;
        // let favoriteSpots = currentUserDetails?.favorites || [];
        const spotName = location.name;

        const userRef = doc(db, "users", currentUserDetails.email);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            let favoriteSpots = docSnap.data().favorites;

            if (favoriteSpots.includes(spotName)) {
                console.log('INCLUDES')
                setFavoritesStatus('Un-Favorite');
            } else {
                setFavoritesStatus('Favorite')
            }
        }
    }

    const addToFavorites = async () => {
        // get from firebase favorites list
        // if not in favorite add it, otherwise remove it
        const currentUserDetails = props.currentUserDetails;
        let favoriteSpots = currentUserDetails?.favorites || [];
        const spotName = location.name;

        const userRef = doc(db, "users", currentUserDetails.email);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            favoriteSpots = docSnap.data().favorites;
        }

        if (favoriteSpots.includes(spotName)) {
            await updateDoc(doc(db, "users", currentUserDetails.email), {
                favorites: arrayRemove(spotName)
              });
              setFavoritesStatus('Favorite');
              return toast.success(`Removed ${spotName} from Favorites`);
        } else {
            await updateDoc(doc(db, "users", currentUserDetails.email), {
                favorites: arrayUnion(spotName)
              });
              setFavoritesStatus('Un-Favorite');
              return toast.success(`Added ${spotName} to Favorites`);
        }
    }

    useEffect(() => {
        getFavoritesStatus();
    }, [location])

    // Compress data into 1 day each and add smallest and largest found wave heights to get a range for the day
    function formatForecastData(data:any) {
        const map = new Map();

        data.forEach(entry => {
            if (!map.has(entry.day)) {
              // Initialize with current entry's values
              map.set(entry.day, {
                entry,
                minWVHT: entry.sWVHT,
                maxWVHT: entry.sWVHT
              });
            } else {
              const dayData = map.get(entry.day);
        
              // Update minWVHT and maxWVHT
              dayData.minWVHT = Math.min(dayData.minWVHT, entry.sWVHT);
              dayData.maxWVHT = Math.max(dayData.maxWVHT, entry.sWVHT);
        
              // Update the entry with the highest sWVHT
              if (entry.sWVHT > dayData.entry.sWVHT) {
                dayData.entry = entry;
              }
            }
          });

          setCompressedWaveForecastData(Array.from(map.values()).map(dayData => ({
            ...dayData.entry,
            minWVHT: dayData.minWVHT,
            maxWVHT: dayData.maxWVHT
          })))
        
          // Extract the final entries from the map and add minWVHT and maxWVHT
          return Array.from(map.values()).map(dayData => ({
            ...dayData.entry,
            minWVHT: dayData.minWVHT,
            maxWVHT: dayData.maxWVHT
          }));
    }

    useEffect(() => {
        console.log(waveForecastData)
        // get data for each day, compress data to 1 for each day and make boxes for each day with wave height and quality
        if (waveForecastData) {
            if (waveForecastData.length > 0) {
            formatForecastData(waveForecastData);
            console.log(formatForecastData(waveForecastData))
            }
        }
    }, [waveForecastData])

    return (
        <div id='forecastDetailsContainer'>
            <h1 id='forecastDetailsTitle'>{location?.name} Surf Report</h1>
            <div id='forecastDetailsTop'>
                {location?.hasCam ? 
                <div id='forecastDetailsTopLeftCam'>
                    <ReactPlayer width={'550px'} height={'310px'} id="forecastDetailsLiveCam" url={location.camLink} playing muted controls/> 
                </div>
                : 
                <div id='forecastDetailsTopLeft'>
                    <img id='forecastDetailsMainImg' src={location?.imgLink} alt={location?.name} />
                </div>
                }
                <div id='forecastDetailsTopRight'>
                    <div id='surfHeightBubble'>
                        <h2 id='surfBubbleText'>{Math.floor(waveHeightFT)}-{Math.ceil(waveHeightFT)} ft. - {currentRating}</h2>
                    </div>
                    {props.currentUser !== null ? 
                    <button className='favoriteButton' onClick={addToFavorites}>{favoritesStatus}</button>
                    :
                    <></>
                    }
                    <p id='locationDesc'>{location?.desc}</p>
                </div>
            </div>
            <div id='forecastDetailsSwell'>
                <div id='forecastDetailsInfoRow'>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitle'>Waves and Swell - {buoy}</h2>
                        <p className='forecastInfoBox'>{waveHeightFT} ft. @ {wavePeriod}s {waveDirStr} {waveDirDeg}°</p>
                    </div>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitle'>Swell Components</h2>
                        {swellCompMajor ? 
                            <>
                            <p className='forecastInfoBox'>{swellCompMajor.wvht} ft. @ {swellCompMajor.period}s {swellCompMajor.dir}</p>
                            <p className='forecastInfoBox'>{swellCompMinor.wvht} ft. @ {swellCompMinor.period}s {swellCompMinor.dir}</p>
                            </>
                        : <></>}
                    </div>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitle'>Local Wind</h2>
                        <p className='forecastInfoBox'>{localWeather?.wind.speed} mph {getWaveDirection(localWeather?.wind.deg)} {localWeather?.wind.deg}°</p> 
                    </div>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitleSmall'>Air Temperature</h2>
                        <p className='forecastInfoBox'>{(((localWeather?.main.temp * 9) / 5) - 459.67).toFixed(1)}°F</p> 
                        <h2 className='forecastInfoBoxTitleSmall'>Water Temperature</h2>
                        <p className='forecastInfoBox'>{waterTempF}°F</p> 
                    </div>
                </div>
                <div className='forecastInfoChartContainer'>
                    <div className='forecastChartContainer'>
                        <canvas className='forecastDetailsChart' id="swellEnergy"></canvas>
                    </div>
                    <div className='forecastChartContainer'>
                        <canvas className='forecastDetailsChart' id="tideChart"></canvas>
                    </div>
                </div>
            </div>
            <div id='forecastSection'>
                <h2 id='forecastSectionTitle'>Surf Forecast</h2>
                <div id='forecastDaysContainer'>
                    {compressedWaveForecastData?.map((day:any) => {
                        const waveHeightMin = Math.floor(Number((day.minWVHT * 3.281).toFixed(2)));
                        const waveHeightMax = Math.ceil(Number((day.maxWVHT * 3.281).toFixed(2)));
                        let quality = 'lime';

                        if (waveHeightMax < 5) {
                            quality = 'red';
                        }

                        return (
                            <div className='forecastDayBox'>
                                <p className='forecastDayText'>Day: {day.day}</p>
                                <p className='forecastDayText'>{waveHeightMin} - {waveHeightMax} ft.</p>
                                <div className='dayQuality' style={{ backgroundColor: quality}}/>
                            </div>
                        )
                    })}
                </div>
                <div id='ww3ForecastChartContainer'>
                    <canvas className='forecastDetailsChart' id="forecastChart"></canvas>
                </div>
            </div>
        </div>
    )
}

export default ForecastDetails;