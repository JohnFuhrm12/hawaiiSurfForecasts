import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Article from './components/Article';
import Signup from './components/Signup';
import Login from './components/Login';

import ScrollToTop from './components/ScrollToTop';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [article, setArticle] = useState();

  const props = {
    article,
    setArticle,
    currentUser,
    setCurrentUser
  }

  return (
    <>
      <Navbar {...props}/>
      <ScrollToTop/>
      <Routes>
        <Route path='/' element={ <Home {...props} /> }/>
        <Route path='/signup' element={ <Signup {...props} /> }/>
        <Route path='/login' element={ <Login {...props} /> }/>
        <Route path='/news' element={ <Article {...props} /> }/>
      </Routes>
      <ToastContainer />
    </>
  )
}

export default App;
