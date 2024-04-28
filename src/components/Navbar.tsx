import { Link } from 'react-router-dom';
import { getAuth, signOut } from "firebase/auth";
import { toast } from 'react-toastify';
import firebaseInit from './firebaseConfig';
import './componentStyles/navbar.css';

firebaseInit();
const auth = getAuth(); 

function Navbar( {...props} ) {
    const user = props.currentUser;

    function logout() {
      signOut(auth).then(() => {
        props.setCurrentUser(null);
        toast.success('Logged out.')
      }).catch((error) => {
        console.log(error)
      });
    }

    return (
      <nav id='navbar'>
        <ol id='navTitleContainer'>
            <li className="navLink"><Link className="navLinkText" to='/'>Hawai'i Surf</Link></li>
        </ol>
        <ol id='navLinksContainer'>
            <li className="navLink"><Link className="navLinkText" to='/forecasts'>Forecasts</Link></li>
            <li className="navLink"><Link className="navLinkText" to='/favorites'>Favorites</Link></li>
            {user ? 
              <li onClick={logout} className="navLink"><Link className="navLinkText" to='/'>Logout</Link></li>
          :
          <>
            <li className="navLink"><Link className="navLinkText" to='/login'>Login</Link></li>
            <li className="navLink"><Link className="navLinkText" to='/signup'>Sign Up</Link></li>
        </>
          }
        </ol>
      </nav>
    )
  }
  
  export default Navbar;