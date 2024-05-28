import { useParams } from 'react-router';
import axios from 'axios';
import './componentStyles/forecastDetails.css';

import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { useEffect, useState } from 'react';

import getWaveDirection from './surfUtils';

import Chart from 'chart.js/auto';

import { xml2js, xml2json } from 'xml-js';
import { point } from 'leaflet';
import { beforeAuthStateChanged } from 'firebase/auth';

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

    const [location, setLocation] = useState(null);
    const params = useParams();
    const locationSlug = params.id;

    const getLocationDetails = async () => {
        const locationRef = query(collection(db, "surfSpots"), where("slug", "==", locationSlug));
        const locationQuerySnapshot = await getDocs(locationRef);
        const validLocations = locationQuerySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id}));
        setLocation(validLocations[0]);
    }

    const getNDBCData = async () => {
        const northShoreBuoy = '51201';
        const northShoreTideStation = '1611400';
        const mainEndpoint = `https://johnfuhrm12.pythonanywhere.com/buoy/${northShoreBuoy}`;
        const tidesEnpoint = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${northShoreTideStation}&product=predictions&datum=MLLW&time_zone=gmt&units=english&application=DataAPI_Sample&format=xml`;

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
                console.log(dataArr)
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

        const spectralSummaryEndpoint = `https://johnfuhrm12.pythonanywhere.com/buoy/${northShoreBuoy}/spectral`;

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

        const spectralRawPairsEndpoint = `https://johnfuhrm12.pythonanywhere.com/buoy/${northShoreBuoy}/spectral/raw/pairs`;

        try {
            await axios.get(spectralRawPairsEndpoint).then((res) => {
                const NDBC_Current = res.data;
                setSwellEnergyData(NDBC_Current);
            });
        } catch(e) {
            console.log(e);
        }

    }

    const verticalHover = {
        id: 'verticalHoverLine',
        afterDraw: function(chart) {
            if (chart.tooltip._active && chart.tooltip._active.length) {
                const { ctx, tooltip } = chart;
                const activePoint = chart.tooltip._active[0];
                const x = activePoint.element.x;
    
                ctx.save();
    
                ctx.beginPath();
                ctx.strokeStyle = 'rgb(0, 136, 255)';
                ctx.lineWidth = 2;
                ctx.moveTo(x, chart.chartArea.top);
                ctx.lineTo(x, chart.chartArea.bottom);
                ctx.stroke();
    
                ctx.restore();
            }
        }
    };

    (async function() {
        const data = swellEnergyData;

        new Chart(
            document.getElementById('swellEnergy'),
            {
                type: 'line',
                data: {
                    labels: data.map(row => (1 / row.freq).toFixed(2)),
                    datasets: [
                        {
                            label: 'Swell Energy (m^2/Hz) vs. Period (Seconds)',
                            data: data.map(row => row.spec.toFixed(2))
                        }
                    ]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 20
                            }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                },
                plugins: [verticalHover]
            }
        );
    })();

    (async function() {
        const data = tidePredictions;

        new Chart(
            document.getElementById('tideChart'),
            {
                type: 'line',
                data: {
                    labels: data.map(row => row.attributes.t),
                    datasets: [
                        {
                            label: 'Tide Chart',
                            data: data.map(row => Number(row.attributes.v).toFixed(2))
                        }
                    ]
                },
                options: {
                    scales: {
                        x: {
                            ticks: {
                                maxTicksLimit: 8
                            }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                },
                plugins: [verticalHover]
            }
        );
    })();

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
                <h2>Swell Info</h2>
                <h2>{waveHeightFT} ft. @ {wavePeriod}s {waveDirStr} {waveDirDeg}°</h2>
                <h2>Swell Components</h2>
                {swellCompMajor ? 
                    <>
                    <h2>{swellCompMajor.wvht} ft. @ {swellCompMajor.period}s {swellCompMajor.dir}</h2>
                    <h2>{swellCompMinor.wvht} ft. @ {swellCompMinor.period}s {swellCompMinor.dir}</h2>
                    </>
                : <></>}
                <h2>Water Temperature</h2>
                <h2>{waterTempF}°F</h2>
            </div>
            <div><canvas id="swellEnergy"></canvas></div>
            <div><canvas id="tideChart"></canvas></div>
        </div>
    )
}

export default ForecastDetails;