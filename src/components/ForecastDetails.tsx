import { useParams } from 'react-router';
import axios from 'axios';
import './componentStyles/forecastDetails.css';

import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { useEffect, useState } from 'react';

import getWaveDirection from './surfUtils';

import Chart from 'chart.js/auto';

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
        const mainEndpoint = `https://johnfuhrm12.pythonanywhere.com/buoy/${northShoreBuoy}`;

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
                setWaterTempF(currentWaterTempF);

                console.log(NDBC_Current)
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

                console.log(NDBC_Current)
            });
        } catch(e) {
            console.log(e);
        }

        const spectralRawPairsEndpoint = `https://johnfuhrm12.pythonanywhere.com/buoy/${northShoreBuoy}/spectral/raw/pairs`;

        try {
            await axios.get(spectralRawPairsEndpoint).then((res) => {
                const NDBC_Current = res.data;
                setSwellEnergyData(NDBC_Current);
                console.log(NDBC_Current)
            });
        } catch(e) {
            console.log(e);
        }

    }

    (async function() {
        const data = swellEnergyData;
    
        // Find the index of the maximum spectral energy - Top 2 peaks
        const peakIndices = data.map((point, index) => ({ index, spec: point.spec })).sort((a, b) => b.spec - a.spec).slice(0, 2);
        const swellPeriods = peakIndices.map(peak => 1 / data[peak.index].freq);
        console.log(swellPeriods)
    
        new Chart(
            document.getElementById('swellEnergy'),
            {
                type: 'line',
                data: {
                    labels: data.map(row => row.freq),
                    datasets: [
                        {
                            label: 'Swell Energy (m^2/Hz) vs. Frequency (Hz)',
                            data: data.map(row => row.spec)
                        }
                    ]
                },
                options: {
                    responsive: true, 
                }
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
        </div>
    )
}

export default ForecastDetails;