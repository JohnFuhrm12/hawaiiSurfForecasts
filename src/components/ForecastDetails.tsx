import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { xml2json } from 'xml-js';
import axios from 'axios';
import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { getWaveDirection } from '../utils/surfUtils';
import { createSwellEnergyChart, createTideChart, createWaveForecastChart } from '../utils/chartUtils';
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

    const [buoy, setBuoy] = useState<String>();
    const [tideStation, setTideStation] = useState<String>();

    const [localWeather, setLocalWeather] = useState();

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
                        <h2 id='surfBubbleText'>{Math.floor(waveHeightFT)}-{Math.ceil(waveHeightFT)} ft. - Fair</h2>
                    </div>
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
            <div id='ww3ForecastChartContainer'>
                <canvas className='forecastDetailsChart' id="forecastChart"></canvas>
            </div>
        </div>
    )
}

export default ForecastDetails;