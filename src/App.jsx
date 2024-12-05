
import "./App.css"
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ItemMaster from "./components/ItemMaster";
import BomMaster from "./components/BomMaster";
import HomePage from "./components/HomePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/item" element={<ItemMaster />} />
        <Route path="/bom" element={<BomMaster/>} />
      </Routes>
    </Router>
  );
}

export default App;
