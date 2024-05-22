import { useParams } from 'react-router';
import axios from 'axios';
import './componentStyles/forecastDetails.css';

import firebaseInit from './firebaseConfig';
import { getFirestore } from "firebase/firestore";
import { collection, query, getDocs, where } from "firebase/firestore";
import { useEffect, useState } from 'react';

firebaseInit();
const app = firebaseInit();
const db = getFirestore(app);

function ForecastDetails( {...props} ) {
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
        const endpoint = `https://www.ndbc.noaa.gov/data/realtime2/${northShoreBuoy}.txt`;

        try {
            await axios.get(endpoint).then((res) => {
                console.log(res);
            });
        } catch(e) {
            console.log(e);
        }

    }

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
                        <h2 id='surfBubbleText'>4-5 ft. - Fair</h2>
                    </div>
                    <p id='locationDesc'>The Banzai Pipeline is a reef break located in Hawaii, off Ehukai Beach Park in Pupukea on O'ahu's North Shore. Pipeline is known for huge waves that break in shallow water just above a sharp and cavernous reef, forming large, hollow, thick curls of water that surfers can tube ride. There are three reefs at Pipeline in progressively deeper water that activate according to the increasing size of swell.</p>
                </div>
            </div>
        </div>
    )
}

export default ForecastDetails;