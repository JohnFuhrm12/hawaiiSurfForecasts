import './componentStyles/favorites.css';

function Favorites( {...props} ) {
    const currentUser = props.currentUser;
    const currentUserDetails = props.currentUserDetails;

    console.log(props.currentUserDetails)
    return (
        <div id='favoritesContainer'>
            {currentUser === null ? 
            <h1 id='favoritesTitle'>Your Favorites</h1>
            :         
            <h1 id='favoritesTitle'>{`${currentUserDetails.name}'s`} Favorites</h1>}
        </div>
    )
}

export default Favorites;