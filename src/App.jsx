import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Landing from './features/dashboard/Landing';
import Checkers from './features/games/Checkers';
import SystemStabilizer from './components/SystemStabilizer';
import ToastHost from './components/ToastHost';

// Lazy load heavy routes
const SessionPage = lazy(() => import('./pages/SessionPage'));
const SessionLayout = lazy(() => import('./layouts/SessionLayout'));
const SkillTree = lazy(() => import('./features/dashboard/SkillTree'));
// const MathCamp = lazy(() => import('./features/dashboard/MathCamp')); // LEGACY - NOW TOWERNEXUS
const SpeedMathPractice = lazy(() => import('./features/dashboard/SpeedMathPractice'));
const TowerNexus = lazy(() => import('./features/dashboard/TowerNexus'));
const Battleship = lazy(() => import('./features/games/Battleship'));
const AirHockey = lazy(() => import('./features/games/AirHockey'));
const AssessmentCenter = lazy(() => import('./features/dashboard/AssessmentCenter'));
const BrainBreak = lazy(() => import('./features/games/BrainBreak'));
const Connect4 = lazy(() => import('./features/games/Connect4'));
const SwipeFight = lazy(() => import('./features/games/SwipeFight'));

function RoutedBrainBreak() {
  const navigate = useNavigate();
  return <BrainBreak onBack={() => navigate('/dashboard')} />;
}

function RoutedBattleship() {
  const navigate = useNavigate();
  return <Battleship onBack={() => navigate(-1)} />;
}

function RoutedAirHockey() {
  const navigate = useNavigate();
  return <AirHockey onBack={() => navigate(-1)} />;
}

function RoutedCheckers() {
  const navigate = useNavigate();
  return <Checkers onBack={() => navigate('/dashboard')} />;
}

function RoutedConnect4() {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const fallbackSessionId = localStorage.getItem('last_tower_session') || 'global';
  return <Connect4 sessionId={sessionId || fallbackSessionId} onBack={() => navigate(-1)} />;
}

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center space-y-6 animate-pulse">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 bg-cyan-500/20 rounded-full border-2 border-cyan-500/30" />
        <div className="absolute inset-2 bg-cyan-500/10 rounded-full animate-ping" />
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-slate-800 rounded-lg w-48 mx-auto" />
        <div className="h-4 bg-slate-800/50 rounded w-32 mx-auto" />
      </div>
      <p className="text-cyan-400 font-mono text-sm tracking-widest">INITIALIZING...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <SystemStabilizer>
          <ToastHost />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<TowerNexus />} />
            <Route path="/math-camp" element={<TowerNexus />} /> {/* Legacy Route */}
            <Route path="/curriculum" element={<SkillTree />} />
            <Route path="/speed-math/practice/:methodId" element={<SpeedMathPractice />} />
            <Route path="/assessment" element={<AssessmentCenter />} />
            <Route path="/arcade" element={<RoutedBrainBreak />} />

            {/* Game Routes */}
            <Route path="/game/battleship" element={<RoutedBattleship />} />
            <Route path="/game/air-hockey" element={<RoutedAirHockey />} />
            <Route path="/checkers" element={<RoutedCheckers />} />
            <Route path="/game/connect4" element={<RoutedConnect4 />} />
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
