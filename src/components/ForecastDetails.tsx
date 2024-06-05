import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { xml2json } from 'xml-js';
import axios from 'axios';
import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { getWaveDirection } from '../utils/surfUtils';
import { createSwellEnergyChart, createTideChart, createWaveForecastChart } from '../utils/chartUtils';
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

    const [location, setLocation] = useState(null);
    const params = useParams();
    const locationSlug = params.id;

    const getLocationDetails = async () => {
        const locationRef = query(collection(db, "surfSpots"), where("slug", "==", locationSlug));
        const locationQuerySnapshot = await getDocs(locationRef);
        const validLocations = locationQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id}));
        setLocation(validLocations[0]);
    }

    function getCurrentDate() {
        let today = new Date();
        let year = today.getFullYear();
        let month = (today.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 because January is 0
        let day = today.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }

    const getNDBCData = async () => {
        const northShoreBuoy = '51201';
        const northShoreTideStation = '1611400';
        const modelDate = getCurrentDate(); // yyyymmdd
        console.log(getCurrentDate())
        const buoyID = northShoreBuoy;
        const tideStationID = northShoreTideStation;
        const flaskAPIBase = 'https://johnfuhrm12.pythonanywhere.com';
        const mainEndpoint = `${flaskAPIBase}/buoy/${northShoreBuoy}`;
        const tidesEnpoint = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${tideStationID}&product=predictions&datum=MLLW&time_zone=gmt&units=english&application=DataAPI_Sample&format=xml`;

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
            console.log(e);
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
            console.log(e);
        }

        const spectralSummaryEndpoint = `${flaskAPIBase}/buoy/${buoyID}/spectral`;

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
            console.log(e);
        }

        const spectralRawPairsEndpoint = `${flaskAPIBase}/buoy/${buoyID}/spectral/raw/pairs`;

        try {
            await axios.get(spectralRawPairsEndpoint).then((res) => {
                const NDBC_Current = res.data;
                setSwellEnergyData(NDBC_Current);
            });
        } catch(e) {
            console.log(e);
        }

        const waveWatcher3Endpoint = `${flaskAPIBase}/ww3/${modelDate}/buoy/${buoyID}`;

        try {
            await axios.get(waveWatcher3Endpoint).then((res) => {
                const GFS_Current = res.data;
                console.log(GFS_Current);
                setWaveForecastData(GFS_Current);
            });
        } catch(e) {
            console.log(e);
        }

    }

    useEffect(() => {
        createSwellEnergyChart(swellEnergyData);
        createTideChart(tidePredictions);
        createWaveForecastChart(waveForecastData);
    }, [swellEnergyData, tidePredictions, waveForecastData])

    useEffect(() => {
        getLocationDetails();
        getNDBCData();
    }, [])

    return (
        <div id='forecastDetailsContainer'>
            <h1 id='forecastDetailsTitle'>{location?.name} Surf Report</h1>
            <div id='forecastDetailsTop'>
                <div id='forecastDetailsTopLeft'>
                    <img id='forecastDetailsMainImg' src={location?.imgLink} alt={location?.name} />
                </div>
                <div id='forecastDetailsTopRight'>
                    <div id='surfHeightBubble'>
                        <h2 id='surfBubbleText'>{Math.floor(waveHeightFT)}-{Math.ceil(waveHeightFT)} ft. - Fair</h2>
                    </div>
                    <p id='locationDesc'>The Banzai Pipeline is a reef break located in Hawaii, off Ehukai Beach Park in Pupukea on O'ahu's North Shore. Pipeline is known for huge waves that break in shallow water just above a sharp and cavernous reef, forming large, hollow, thick curls of water that surfers can tube ride. There are three reefs at Pipeline in progressively deeper water that activate according to the increasing size of swell.</p>
                </div>
            </div>
            <div id='forecastDetailsSwell'>
                <div className='forecastInfoChartContainer'>
                    <div className='forecastInfoContainer'>
                        <h2 className='forecastInfoTitle'>Waves and Swell</h2>
                        <p className='forecastInfoComp'>{waveHeightFT} ft. @ {wavePeriod}s {waveDirStr} {waveDirDeg}°</p>
                        <h2 className='forecastInfoSubtitle'>Swell Components</h2>
                        {swellCompMajor ? 
                            <>
                            <p className='forecastInfoComp'>{swellCompMajor.wvht} ft. @ {swellCompMajor.period}s {swellCompMajor.dir}</p>
                            <p className='forecastInfoComp'>{swellCompMinor.wvht} ft. @ {swellCompMinor.period}s {swellCompMinor.dir}</p>
                            </>
                        : <></>}
                    </div>
                    <div className='forecastChartContainer'>
                        <canvas id="swellEnergy"></canvas>
                    </div>
                </div>
                <div className='forecastInfoChartContainer'>
                    <div className='forecastInfoContainer'>
                        <h2 className='forecastInfoTitle'>Weather</h2>
                        <h2 className='forecastInfoSubtitle'>Water Temperature</h2>
                        <p className='forecastInfoComp'>{waterTempF}°F</p> 
                    </div>
                    <div className='forecastChartContainer'>
                        <canvas id="tideChart"></canvas>
                    </div>
                </div>
            </div>
            <div id='ww3ForeacastChartContainer'>
                <canvas id="forecastChart"></canvas>
            </div>
        </div>
    )
}

export default ForecastDetails;