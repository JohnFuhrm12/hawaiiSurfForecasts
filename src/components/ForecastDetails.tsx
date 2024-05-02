import { useParams } from 'react-router';
import './componentStyles/forecastDetails.css';

function ForecastDetails( {...props} ) {
    //const location = props.currentSurfLocation;
    const params = useParams();
    const locationSlug = params.id;

    // make slugs for all surf spots, (use that instead of slugify), than get location by slug from firebase to get details

    return (
        <div id='forecastDetailsContainer'>
            <h1>SDF</h1>
            <h1 id='forecastDetailsTitle'>{location.name} Surf Report</h1>
            <div id='forecastDetailsTop'>
                <div id='forecastDetailsTopLeft'>
                    <img id='forecastDetailsMainImg' src={location.imgLink} alt={location} />
                </div>
                <div id='forecastDetailsTopRight'>
                    
                </div>
            </div>
        </div>
    )
}

export default ForecastDetails;