import { useEffect, useState } from 'react';
import './componentStyles/favorites.css';

import app from "./firebaseConfig";
import { getFirestore } from "firebase/firestore";
const db = getFirestore(app);

import { collection, query, getDoc, getDocs, where, doc } from "firebase/firestore";
import { useNavigate } from 'react-router';


function Favorites( {...props} ) {
    const currentUser = props.currentUser;
    const currentUserDetails = props.currentUserDetails;

    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser === null) {
            navigate('/login');
        }

    }, [currentUser])

    const [surfSpots, setSurfSpots] = useState([]);

    const getFavorites = async () => {
        const userRef = doc(db, "users", currentUserDetails.email);
        const docSnap = await getDoc(userRef);
    
        if (docSnap.exists()) {
            let favoriteSpots = docSnap.data().favorites;
            if (favoriteSpots.length > 0) {
                getSurfSpots(favoriteSpots);
            }
        }
    }

    const getSurfSpots = async (favoriteSpots:Array<String>) => {
        const spotsRef = collection(db, "surfSpots");
        const favoritesQuery = query(spotsRef, where("name", "in", favoriteSpots));
        const querySnapshot = await getDocs(favoritesQuery);
        setSurfSpots(querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id})));
    }
    
    useEffect(() => {
        getFavorites();
    }, [])

    console.log(props.currentUserDetails)

    return (
        <div id='favoritesContainer'>
            {currentUser === null ? 
            <h1 id='favoritesTitle'>Your Favorites</h1>
            :         
            <h1 id='favoritesTitle'>{`${currentUserDetails.name}'s`} Favorites</h1>}
            {surfSpots.length === 0 ? 
            <h2 id='favoritesNoneTitle'>No Favorites Yet!</h2>
            :
            <></>
            }
            <div id='forecastsGridFavorites'>
                {surfSpots.map((location:any) => {
                    function showForecastDetails() {
                        navigate(`/forecasts/${location.slug}`);
                    }

                    return (
                        <div className='locationCard' onClick={showForecastDetails} key={location.id}>
                            <img className='locationCardImg' src={location.imgLink} alt={location.name} />
                            <h2 className='locationCardName'>{location.name}</h2>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Favorites;