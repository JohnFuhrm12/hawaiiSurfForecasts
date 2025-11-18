import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { xml2json } from 'xml-js';
import axios from 'axios';
import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import {
    collection,
    query,
    getDoc,
    getDocs,
    where,
    updateDoc,
    arrayRemove,
    arrayUnion,
    doc
} from "firebase/firestore";
import { getWaveDirection } from '../utils/surfUtils';
import { createSwellEnergyChart, createTideChart, createWaveForecastChart } from '../utils/chartUtils';
import { toast } from 'react-toastify';
import ReactPlayer from 'react-player/lazy';
import './componentStyles/forecastDetails.css';

const app = firebaseInit();
const db = getFirestore(app);

function ForecastDetails({ ...props }) {
    const [currentNDBCData, setCurrentNDBCData] = useState<any>({});

    const [waveHeightFT, setWaveHeightFT] = useState<Number | null>(null);
    const [wavePeriod, setWavePeriod] = useState<String | null>(null);
    const [waveDirDeg, setWaveDirDeg] = useState<Number | null>(null);
    const [waveDirStr, setWaveDirStr] = useState<String | null>(null);
    const [waterTempC, setWaterTempC] = useState<Number | null>(null);
    const [waterTempF, setWaterTempF] = useState<Number | null>(null);

    const [swellCompMajor, setSwellCompMajor] = useState<any>(null);
    const [swellCompMinor, setSwellCompMinor] = useState<any>(null);

    const [swellEnergyData, setSwellEnergyData] = useState<any>(null);
    const [tidePredictions, setTidePredictions] = useState<any>(null);
    const [waveForecastData, setWaveForecastData] = useState<any>(null);
    const [compressedWaveForecastData, setCompressedWaveForecastData] = useState<any[]>([]);

    const [buoy, setBuoy] = useState<string | null>(null);
    const [tideStation, setTideStation] = useState<string | null>(null);

    const [localWeather, setLocalWeather] = useState<any>(null);
    const [currentRating, setCurrentRating] = useState('Fair');

    const [favoritesStatus, setFavoritesStatus] = useState('Favorite');

    const [location, setLocation] = useState<any>(null);
    const params = useParams();
    const locationSlug = params.id;

    const getLocationDetails = async () => {
        if (!locationSlug) return;

        const locationRef = query(collection(db, "surfSpots"), where("slug", "==", locationSlug));
        const locationQuerySnapshot = await getDocs(locationRef);

        if (locationQuerySnapshot.empty) {
            console.error("No surf spot found for slug:", locationSlug);
            return;
        }

        const first = locationQuerySnapshot.docs[0];
        const data = { ...first.data(), id: first.id };

        setLocation(data);
        setTideStation(data.tideStation || null);
        setBuoy(data.buoy || null);
    };

    const getLocalWeather = async () => {
        if (!location?.coordinates) return;

        // const openWeatherKey = process.env.REACT_APP_OPEN_WEATHER_API_KEY;
        const openWeatherKey = '73a95bf4ecd5b065a38ec246784e64ee';
        const [lat, lon] = location.coordinates;

        const endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}`;

        try {
            const res = await axios.get(endpoint);
            setLocalWeather(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    function getCurrentDate() {
        let today = new Date();
        let year = today.getFullYear();
        let month = (today.getMonth() + 1).toString().padStart(2, '0');
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
    if (!buoy || !tideStation) return;

    const modelDate = getCurrentDate();
    const modelYDate = getYesterdayDate();
    const modelY2Date = getDayBeforeYesterdayDate();
    const flaskAPIBase = "https://ndbc-buoy-data.onrender.com";

    /* ----------------------------------------
       1. TIDES (XML → JSON)
    ---------------------------------------- */
    const tidesEndpoint = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${tideStation}&product=predictions&datum=MLLW&time_zone=gmt&units=english&application=DataAPI_Sample&format=xml`;

    try {
        const res = await axios.get(tidesEndpoint);
        const noaaTidesXML = res.data;
        const jsonData = xml2json(noaaTidesXML, { compact: false, spaces: 4 });
        const jsonRes = JSON.parse(jsonData);

        const predictions = jsonRes.elements?.[0]?.elements || [];
        const dataArr: any[] = [];

        for (let i = 0; i < predictions.length; i += 3) {
            dataArr.push(predictions[i]);
        }

        setTidePredictions(dataArr);
    } catch (err) {
        console.error("TIDE API ERROR:", err);
    }

    /* ----------------------------------------
       Utility: get MOST RECENT valid number
    ---------------------------------------- */
    const getLatestValid = (rows: any[], key: string) => {
        for (const r of rows) {
            const val = r[key];
            if (val !== undefined && val !== null && !isNaN(Number(val))) {
                return Number(val);
            }
        }
        return null;
    };

    /* ----------------------------------------
       2. NDBC MAIN (Wave Height, Period, Temp)
    ---------------------------------------- */
    const mainEndpoint = `${flaskAPIBase}/buoy/${buoy}`;

    try {
        const res = await axios.get(mainEndpoint);
        const rows = res.data || [];

        console.log("NDBC Current Data:", rows);

        const WVHT = getLatestValid(rows, "WVHT");
        const DPD  = getLatestValid(rows, "DPD");
        const MWD  = getLatestValid(rows, "MWD");
        const WTMP = getLatestValid(rows, "WTMP");

        if (WVHT === null) {
            console.warn("No valid WVHT found");
            return;
        }

        // Wave height meters → feet
        const waveFt = Math.round(WVHT * 3.281 * 10) / 10;
        setWaveHeightFT(waveFt);

        if (DPD !== null) setWavePeriod(DPD);
        if (MWD !== null) {
            setWaveDirDeg(MWD);
            setWaveDirStr(getWaveDirection(MWD));
        }

        if (WTMP !== null) {
            setWaterTempC(WTMP);
            setWaterTempF(Number((WTMP * 9/5 + 32).toFixed(1)));
        }
    } catch (err) {
        console.error("NDBC MAIN ERROR:", err);
    }

    /* ----------------------------------------
       3. NDBC SPECTRAL SUMMARY
    ---------------------------------------- */
    const spectralSummaryEndpoint = `${flaskAPIBase}/buoy/${buoy}/spectral`;

    try {
        const res = await axios.get(spectralSummaryEndpoint);
        const rows = res.data || [];

        // Get newest valid swell components
        const SwH  = getLatestValid(rows, "SwH");
        const SwP  = getLatestValid(rows, "SwP");
        const SwD  = getLatestValid(rows, "SwD");

        const WWH = getLatestValid(rows, "WWH");
        const WWP = getLatestValid(rows, "WWP");
        const WWD = getLatestValid(rows, "WWD");

        setSwellCompMajor({
            wvht: SwH || 0,
            period: SwP || 0,
            dir: SwD || 0
        });

        setSwellCompMinor({
            wvht: WWH || 0,
            period: WWP || 0,
            dir: WWD || 0
        });
    } catch (err) {
        console.error("SPECTRAL SUMMARY ERROR:", err);
    }

    /* ----------------------------------------
       4. SWELL ENERGY (RAW PAIRS)
    ---------------------------------------- */
    const spectralRawPairsEndpoint = `${flaskAPIBase}/buoy/${buoy}/spectral/raw/pairs`;

    try {
        const res = await axios.get(spectralRawPairsEndpoint);
        setSwellEnergyData(res.data);
    } catch (err) {
        console.error("RAW SPECTRAL PAIRS ERROR:", err);
    }

    /* ----------------------------------------
       5. WW3 MODEL (Today → Yesterday → 2 Days)
    ---------------------------------------- */
    const ww3Endpoints = [
        `${flaskAPIBase}/ww3/${modelDate}/buoy/${buoy}`,
        `${flaskAPIBase}/ww3/${modelYDate}/buoy/${buoy}`,
        `${flaskAPIBase}/ww3/${modelY2Date}/buoy/${buoy}`
    ];

    for (const url of ww3Endpoints) {
        try {
            const res = await axios.get(url);
            setWaveForecastData(res.data);
            break;
        } catch (err) {
            console.warn("WW3 fetch failed:", url);
        }
    }
};


    const getFavoritesStatus = async () => {
        const currentUserDetails = props.currentUserDetails;

        if (!currentUserDetails) {
            setFavoritesStatus('Favorite');
            return;
        }

        if (!location?.name) return;

        const spotName = location.name;

        try {
            const userRef = doc(db, "users", currentUserDetails.email);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                console.warn("User doc does not exist");
                return;
            }

            const favoriteSpots = docSnap.data().favorites || [];

            if (favoriteSpots.includes(spotName)) {
                setFavoritesStatus('Un-Favorite');
            } else {
                setFavoritesStatus('Favorite');
            }
        } catch (e) {
            console.error("Error in getFavoritesStatus:", e);
        }
    };

    const addToFavorites = async () => {
        const currentUserDetails = props.currentUserDetails;
        if (!currentUserDetails || !location?.name) return;

        const spotName = location.name;

        const userRef = doc(db, "users", currentUserDetails.email);
        const docSnap = await getDoc(userRef);

        let favoriteSpots: string[] = [];

        if (docSnap.exists()) {
            favoriteSpots = docSnap.data().favorites || [];
        }

        if (favoriteSpots.includes(spotName)) {
            await updateDoc(userRef, {
                favorites: arrayRemove(spotName)
            });
            setFavoritesStatus('Favorite');
            return toast.success(`Removed ${spotName} from Favorites`);
        } else {
            await updateDoc(userRef, {
                favorites: arrayUnion(spotName)
            });
            setFavoritesStatus('Un-Favorite');
            return toast.success(`Added ${spotName} to Favorites`);
        }
    };

    function formatForecastData(data: any[]) {
        const map = new Map<number, any>();

        data.forEach((entry: any) => {
            if (!entry || entry.day == null || entry.sWVHT == null) return;

            if (!map.has(entry.day)) {
                map.set(entry.day, {
                    entry,
                    minWVHT: entry.sWVHT,
                    maxWVHT: entry.sWVHT
                });
            } else {
                const dayData = map.get(entry.day);
                dayData.minWVHT = Math.min(dayData.minWVHT, entry.sWVHT);
                dayData.maxWVHT = Math.max(dayData.maxWVHT, entry.sWVHT);
                if (entry.sWVHT > dayData.entry.sWVHT) {
                    dayData.entry = entry;
                }
            }
        });

        const compressed = Array.from(map.values()).map((dayData: any) => ({
            ...dayData.entry,
            minWVHT: dayData.minWVHT,
            maxWVHT: dayData.maxWVHT
        }));

        setCompressedWaveForecastData(compressed);
        return compressed;
    }

    useEffect(() => {
        getLocationDetails();
    }, [locationSlug]);

    useEffect(() => {
        if (buoy && tideStation) {
            getNDBCData();
        }
    }, [buoy, tideStation]);

    useEffect(() => {
        if (location) {
            getLocalWeather();
        }
    }, [location]);

    useEffect(() => {
        if (swellEnergyData) createSwellEnergyChart(swellEnergyData);
        if (tidePredictions) createTideChart(tidePredictions, tideStation);
        if (waveForecastData) createWaveForecastChart(waveForecastData);
    }, [swellEnergyData, tidePredictions, waveForecastData, tideStation]);

    useEffect(() => {
        if (Array.isArray(waveForecastData) && waveForecastData.length > 0) {
            formatForecastData(waveForecastData);
        }
    }, [waveForecastData]);

    useEffect(() => {
        if (location && props.currentUserDetails) {
            getFavoritesStatus();
        }
    }, [location, props.currentUserDetails]);

    useEffect(() => {
        if (!localWeather || waveHeightFT == null) return;

        const bubble = document.getElementById("surfHeightBubble");
        if (!bubble) return;

        const windSpeed = localWeather.wind?.speed;

        if (windSpeed < 8) {
            bubble.style.backgroundColor = 'orange';
            setCurrentRating('Good');
        } else if (windSpeed < 15) {
            bubble.style.backgroundColor = 'lime';
            setCurrentRating('Fair');
        } else {
            bubble.style.backgroundColor = 'blue';
            setCurrentRating('Poor');
        }

        if ((waveHeightFT as number) < 1) {
            bubble.style.backgroundColor = 'gray';
            setCurrentRating('Flat');
        }
    }, [localWeather, waveHeightFT]);

    const displayWaveHeightMin =
        waveHeightFT != null ? Math.floor(Number(waveHeightFT)) : 0;
    const displayWaveHeightMax =
        waveHeightFT != null ? Math.ceil(Number(waveHeightFT)) : 0;

    const airTempF =
        localWeather?.main?.temp != null
            ? (((localWeather.main.temp * 9) / 5) - 459.67).toFixed(1)
            : '--';

    return (
        <div id='forecastDetailsContainer'>
            <h1 id='forecastDetailsTitle'>{location?.name} Surf Report</h1>
            <div id='forecastDetailsTop'>
                {location?.hasCam ?
                    <div id='forecastDetailsTopLeftCam'>
                        <ReactPlayer
                            width={'550px'}
                            height={'310px'}
                            id="forecastDetailsLiveCam"
                            url={location.camLink}
                            playing
                            muted
                            controls
                        />
                    </div>
                    :
                    <div id='forecastDetailsTopLeft'>
                        <img
                            id='forecastDetailsMainImg'
                            src={location?.imgLink}
                            alt={location?.name}
                        />
                    </div>
                }
                <div id='forecastDetailsTopRight'>
                    <div id='surfHeightBubble'>
                        <h2 id='surfBubbleText'>
                            {displayWaveHeightMin}-{displayWaveHeightMax} ft. - {currentRating}
                        </h2>
                    </div>
                    {props.currentUser !== null ?
                        <button className='favoriteButton' onClick={addToFavorites}>
                            {favoritesStatus}
                        </button>
                        : null}
                    <p id='locationDesc'>{location?.desc}</p>
                </div>
            </div>
            <div id='forecastDetailsSwell'>
                <div id='forecastDetailsInfoRow'>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitle'>Waves and Swell - {buoy}</h2>
                        <p className='forecastInfoBox'>
                            {waveHeightFT ?? '--'} ft. @ {wavePeriod ?? '--'}s {waveDirStr ?? '--'} {waveDirDeg ?? '--'}°
                        </p>
                    </div>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitle'>Swell Components</h2>
                        {swellCompMajor ?
                            <>
                                <p className='forecastInfoBox'>
                                    {swellCompMajor.wvht} ft. @ {swellCompMajor.period}s {swellCompMajor.dir}
                                </p>
                                {swellCompMinor &&
                                    <p className='forecastInfoBox'>
                                        {swellCompMinor.wvht} ft. @ {swellCompMinor.period}s {swellCompMinor.dir}
                                    </p>
                                }
                            </>
                            : null}
                    </div>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitle'>Local Wind</h2>
                        <p className='forecastInfoBox'>
                            {localWeather?.wind?.speed ?? '--'} mph{' '}
                            {localWeather?.wind?.deg != null ? getWaveDirection(localWeather.wind.deg) : '--'}{' '}
                            {localWeather?.wind?.deg ?? '--'}°
                        </p>
                    </div>
                    <div className='forecastDetailsBox'>
                        <h2 className='forecastInfoBoxTitleSmall'>Air Temperature</h2>
                        <p className='forecastInfoBox'>{airTempF}°F</p>
                        <h2 className='forecastInfoBoxTitleSmall'>Water Temperature</h2>
                        <p className='forecastInfoBox'>
                            {waterTempF != null ? `${waterTempF}°F` : '--'}
                        </p>
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
                    {compressedWaveForecastData?.map((day: any, idx: number) => {
                        const waveHeightMin = Math.floor(Number((day.minWVHT * 3.281).toFixed(2)));
                        const waveHeightMax = Math.ceil(Number((day.maxWVHT * 3.281).toFixed(2)));
                        let quality = 'lime';

                        if (waveHeightMax < 5) {
                            quality = 'red';
                        }

                        return (
                            <div className='forecastDayBox' key={idx}>
                                <p className='forecastDayText'>Day: {day.day}</p>
                                <p className='forecastDayText'>{waveHeightMin} - {waveHeightMax} ft.</p>
                                <div className='dayQuality' style={{ backgroundColor: quality }} />
                            </div>
                        );
                    })}
                </div>
                <div id='ww3ForecastChartContainer'>
                    <canvas className='forecastDetailsChart' id="forecastChart"></canvas>
                </div>
            </div>
        </div>
    );
}

export default ForecastDetails;
