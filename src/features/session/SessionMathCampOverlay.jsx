import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';


// Lazy load sub-components to prevent circular dependency cycles
const TowerNexus = React.lazy(() => import('../dashboard/TowerNexus'));
const SpeedMathPractice = React.lazy(() => import('../dashboard/SpeedMathPractice'));
const EquationExplorer = React.lazy(() => import('../games/EquationExplorer'));

// Internal Back Button Handler for child components (optional override)
const BackHandler = ({ children }) => {
    // This component helps ensure components that use 'window.history' or similar 
    // might need adjustment, but standard 'useNavigate' / -1 works in MemoryRouter
    return children;
};

export default function SessionMathCampOverlay({ onClose }) {
    // State-based routing to avoid "Router inside Router" crash
    const [currentRoute, setCurrentRoute] = useState('/math-camp');

    const handleNavigate = (path) => {
        setCurrentRoute(path);
    };

    const renderContent = () => {
        return (
            <React.Suspense fallback={<div className="p-12 text-center text-cyan-400 animate-pulse">Loading Nexus...</div>}>
                {(() => {
                    if (currentRoute === '/math-camp') {
                        return <TowerNexus onNavigate={handleNavigate} />;
                    }
                    if (currentRoute === '/speed-math') {
                        return <TowerNexus onNavigate={handleNavigate} />; 
                    }
                    if (currentRoute.startsWith('/speed-math/practice/')) {
                        const methodId = currentRoute.split('/').pop();
                        return <SpeedMathPractice methodId={methodId} onBack={() => handleNavigate('/math-camp')} />;
                    }
                    if (currentRoute === '/game/equation-explorer') {
                        return <EquationExplorer onBack={() => handleNavigate('/math-camp')} />;
                    }
                    return <TowerNexus onNavigate={handleNavigate} />;
                })()}
            </React.Suspense>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Window Frame */}
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Header Bar */}
                <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                            <span className="text-emerald-400 text-lg">⛺</span>
                        </div>
                        <h2 className="font-bold text-white tracking-widest uppercase">Math Camp OS</h2>
                        {/* Breadcrumbs / Debug Path */}
                        <span className="ml-4 text-xs font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded">
                            {currentRoute}
                        </span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area (State Router) */}
                <div className="flex-1 overflow-auto bg-slate-900 relative">
                    {renderContent()}
                </div>
            </div>
        </div>,
        document.body
    );
}
