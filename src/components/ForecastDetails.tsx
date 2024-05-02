import './componentStyles/forecastDetails.css';

function ForecastDetails( {...props} ) {
    const location = props.currentSurfLocation;

    return (
        <div id='forecastDetailsContainer'>
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