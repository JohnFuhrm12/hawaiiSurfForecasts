import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Forecasts from './components/Forecasts';
import ForecastDetails from './components/ForecastDetails';
import Favorites from './components/Favorites';
import Article from './components/Article';
import Signup from './components/Signup';
import Login from './components/Login';

import ScrollToTop from './components/ScrollToTop';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserDetails, setCurrentUserDetails] = useState(null);
  const [currentSurfLocation, setCurrentSurfLocation] = useState(null);
  const [article, setArticle] = useState();

  const props = {
    article,
    setArticle,
    currentUser,
    setCurrentUser,
    currentUserDetails,
    setCurrentUserDetails,
    currentSurfLocation,
    setCurrentSurfLocation
  }

  return (
    <>
      <Navbar {...props}/>
      <ScrollToTop/>
      <Routes>
        <Route path='/' element={ <Home {...props} /> }/>
        <Route path='/forecasts' element={ <Forecasts {...props} /> }/>
        <Route path='/forecasts/:id' element={ <ForecastDetails {...props} /> }/>
        <Route path='/favorites' element={ <Favorites {...props} /> }/>
        <Route path='/signup' element={ <Signup {...props} /> }/>
        <Route path='/login' element={ <Login {...props} /> }/>
        <Route path='/news' element={ <Article {...props} /> }/>
        <Route path='*' element={ <Home {...props} /> }/>
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App;
