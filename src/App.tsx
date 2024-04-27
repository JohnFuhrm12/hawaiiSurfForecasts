import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Article from './components/Article';

import ScrollToTop from './components/SrollToTop';

function App() {
  const [article, setArticle] = useState();

  const props = {
    article,
    setArticle
  }

  return (
    <>
      <Navbar {...props}/>
      <ScrollToTop/>
      <Routes>
        <Route path='/' element={ <Home {...props}/> }/>
        <Route path='/news' element={ <Article {...props}/> }/>
      </Routes>
    </>
  )
}

export default App;
