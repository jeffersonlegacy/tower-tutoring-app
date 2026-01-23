import { Outlet, useParams } from 'react-router-dom';
import ji_logo from '../assets/ji_logo.jpg';

export default function SessionLayout() {
    const { sessionId } = useParams();

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 relative">
            {/* Animated Logo Background */}
            <div className="absolute inset-0 bg-logo-pattern animate-slide z-0"></div>

            {/* Global Header */}
            <header className="p-4 text-center text-xl font-bold bg-slate-800/90 backdrop-blur-md text-white shadow flex justify-between items-center z-10 border-b border-slate-700 shrink-0 w-full relative">
                <div className="flex items-center gap-3">
                    <img src={ji_logo} alt="Logo" className="w-10 h-10 rounded-full border border-cyan-500/30 shadow-sm object-cover" />
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Jefferson Tutoring</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-mono text-slate-300">
                        ID: {sessionId}
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative w-full h-full z-10">
                <Outlet />
            </div>
        </div>
    );
}
