import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Home from './components/Home';

function App() {
  const testProp = 'test';

  const props = {
    testProp
  }

  return (
    <>
      <Navbar {...props}/>
      <Routes>
        <Route path='/' element={ <Home {...props}/> }/>
      </Routes>
    </>
  )
}

export default App;
