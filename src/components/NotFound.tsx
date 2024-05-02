import { Link } from 'react-router-dom';
import './componentStyles/notFound.css';

function NotFound( {...props} ) {
    return (
        <div id='notFoundContainer'>
            <h1 id='notFoundTitle'>404 Page Not Found</h1>
            <h2 className='notFoundSubTitle'>This link may be broken or the page may have been removed.</h2>
            <h2 className='notFoundSubTitle'>You can find visit our <Link className="notFoundLink" to='/'>homepage</Link> or browse <Link className="notFoundLink" to='/forecasts'>forecasts</Link>.</h2>
        </div>
    )
}

export default NotFound;