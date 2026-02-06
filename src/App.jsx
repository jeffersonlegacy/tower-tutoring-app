import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './features/dashboard/Landing';
import Checkers from './features/games/Checkers';
import SystemStabilizer from './components/SystemStabilizer';

// Lazy load heavy routes
const SessionPage = lazy(() => import('./pages/SessionPage'));
const SessionLayout = lazy(() => import('./layouts/SessionLayout'));
const SkillTree = lazy(() => import('./features/dashboard/SkillTree'));
// const MathCamp = lazy(() => import('./features/dashboard/MathCamp')); // LEGACY - NOW TOWERNEXUS
const SpeedMathPractice = lazy(() => import('./features/dashboard/SpeedMathPractice'));
const ParentDashboard = lazy(() => import('./features/dashboard/ParentDashboard'));
const TowerNexus = lazy(() => import('./features/dashboard/TowerNexus'));
const Battleship = lazy(() => import('./features/games/Battleship'));
const AirHockey = lazy(() => import('./features/games/AirHockey'));
const AssessmentCenter = lazy(() => import('./features/dashboard/AssessmentCenter'));
const BrainBreak = lazy(() => import('./features/games/BrainBreak'));
const Connect4 = lazy(() => import('./features/games/Connect4'));
const SwipeFight = lazy(() => import('./features/games/SwipeFight'));

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
        <SystemStabilizer>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<TowerNexus />} />
            <Route path="/math-camp" element={<TowerNexus />} /> {/* Legacy Route */}
            <Route path="/curriculum" element={<SkillTree />} />
            <Route path="/speed-math/practice/:methodId" element={<SpeedMathPractice />} />
            <Route path="/assessment" element={<AssessmentCenter />} />
            <Route path="/arcade" element={<BrainBreak onBack={() => window.location.href = '/dashboard'} />} />

            {/* Game Routes */}
            <Route path="/game/battleship" element={<Battleship onBack={() => window.history.back()} />} />
            <Route path="/game/air-hockey" element={<AirHockey onBack={() => window.history.back()} />} />
            <Route path="/checkers" element={<Checkers onBack={() => window.location.href = '/dashboard'} />} />
            <Route path="/game/connect4" element={<Connect4 onBack={() => window.history.back()} />} />
            <Route path="/game/swipe-fight" element={<SwipeFight />} />

            {/* Session Routes wrapped in Layout */}
            <Route element={<SessionLayout />}>
              <Route path="/session/:sessionId" element={<SessionPage />} />
            </Route>
          </Routes>
        </SystemStabilizer>
      </Suspense>
    </BrowserRouter>
  );
}
