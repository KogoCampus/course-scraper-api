import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreateEntryPage from './pages/CreateEntryPage';
import CreateTaskPage from './pages/CreateTaskPage';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateEntryPage />} />
            <Route path="/tasks" element={<CreateTaskPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App; 