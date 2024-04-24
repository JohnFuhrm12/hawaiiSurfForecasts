import { Link } from 'react-router-dom';
import './componentStyles/navbar.css';

function Navbar( {...props} ) {

    return (
      <nav id='navbar'>
        <ol id='navTitleContainer'>
            <li className="navLink"><Link className="navLinkText" to='/'>Hawai'i Surf</Link></li>
        </ol>
        <ol id='navLinksContainer'>
            <li className="navLink"><Link className="navLinkText" to='/forecasts'>Forecasts</Link></li>
            <li className="navLink"><Link className="navLinkText" to='/favorites'>Favorites</Link></li>
            <li className="navLink"><Link className="navLinkText" to='/login'>Login</Link></li>
            <li className="navLink"><Link className="navLinkText" to='/signup'>Sign Up</Link></li>
        </ol>
      </nav>
    )
  }
  
  export default Navbar;