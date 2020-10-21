import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppNavbar from './components/AppNavbar';
import Evangelist from './components/Evangelist';
import './App.css';

function App() {
  return (
    <div className="App">
      <AppNavbar />
      <Evangelist />
    </div>
  );
}

export default App;
