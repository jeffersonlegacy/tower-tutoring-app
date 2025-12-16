import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './features/dashboard/Landing';
import SessionPage from './pages/SessionPage';

import SessionLayout from './layouts/SessionLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        {/* Session Routes wrapped in Layout */}
        <Route element={<SessionLayout />}>
          <Route path="/session/:sessionId" element={<SessionPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
