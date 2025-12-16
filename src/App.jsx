import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import Session from './components/Session';
import Whiteboard from './components/Whiteboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId" element={<Session />} />
      </Routes>
    </BrowserRouter>
  );
}
