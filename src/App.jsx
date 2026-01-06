import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './features/dashboard/Landing';

// Lazy load heavy routes
const SessionPage = lazy(() => import('./pages/SessionPage'));
const SessionLayout = lazy(() => import('./layouts/SessionLayout'));
const SkillTree = lazy(() => import('./features/dashboard/SkillTree'));
const MathCamp = lazy(() => import('./features/dashboard/MathCamp'));
const ParentDashboard = lazy(() => import('./features/dashboard/ParentDashboard'));
const EquationExplorer = lazy(() => import('./features/games/EquationExplorer'));

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-cyan-400 font-mono tracking-widest animate-pulse">INITIALIZING...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<SkillTree />} />
          <Route path="/math-camp" element={<MathCamp />} />
          <Route path="/parent" element={<ParentDashboard />} />

          {/* Game Routes */}
          <Route path="/game/equation-explorer" element={<EquationExplorer onBack={() => window.history.back()} />} />

          {/* Session Routes wrapped in Layout */}
          <Route element={<SessionLayout />}>
            <Route path="/session/:sessionId" element={<SessionPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
