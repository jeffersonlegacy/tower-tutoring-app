import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMastery } from '../../context/MasteryContext';
import { CURRICULUM_DATA, getNodesByTrack } from '../../data/CurriculumData';
import AvatarCanvas from '../profile/AvatarCanvas';
import { Lock, Gamepad2, Zap, Cpu } from 'lucide-react';
import QuantumIntercept from './QuantumIntercept';

/**
 * TOWER NEXUS: THE NEURAL CARTOGRAPHY
 * An interactive, pannable star map of the user's learning journey.
 */
export default function TowerNexus() {
    const { studentProfile, getNodeStatus, cognitiveState } = useMastery();
    const navigate = useNavigate();
    const constraintsRef = useRef(null);

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Initial Center (Basecamp)
    const [center, setCenter] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    
    // [NEW] Intercept State
    const [activeIntercept, setActiveIntercept] = useState(null); 

    // Node Types
    const tracks = ['number_ops', 'algebra', 'geometry', 'test_prep', 'speed_math'];

    // Handle viewport resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Helper: Determine if we should trigger a "Quantum Gate"
    const shouldTriggerIntercept = (node) => {
        if (getNodeStatus(node.id) === 'locked') return false;
        const rand = Math.random();
        if (rand > 0.85) return true; // 15% random chance
        const trackMastery = cognitiveState.conceptualMastery?.[node.track] || 0;
        if (trackMastery < 0.1) return true; // First time in sector
        return false;
    };

    const handleNodeClick = (node) => {
        if (getNodeStatus(node.id) === 'locked') return;
        if (shouldTriggerIntercept(node)) {
            setActiveIntercept({ trackId: node.track, nodeId: node.id });
        } else {
            navigate(`/session/${node.id}`);
        }
    };

    const getNodeVisuals = (nodeId) => {
        const status = getNodeStatus(nodeId);
        if (status === 'completed') return 'bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-yellow-200';
        if (status === 'unlocked') return 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)] border-cyan-300 animate-pulse';
        return 'bg-slate-800 border-slate-700 opacity-50';
    };

    return (
        <div className="w-screen h-screen bg-[#020617] overflow-hidden relative cursor-grab active:cursor-grabbing touch-pan-y md:touch-none">
            
            {/* --- QUANTUM INTERCEPT OVERLAY --- */}
            {activeIntercept && (
                <QuantumIntercept 
                    trackId={activeIntercept.trackId} 
                    onComplete={() => {
                        const targetId = activeIntercept.nodeId;
                        setActiveIntercept(null);
                        navigate(`/session/${targetId}`);
                    }} 
                />
            )}
            
            {/* --- BACKGROUND LAYERS --- */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0)_0%,#020617_100%)] z-10" />
                <div className="absolute w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse-slow" />
                <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px]" />
            </div>

            {/* --- UI HUD --- */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-3 md:gap-4">
                <div className="flex flex-col">
                    <h1 className="text-lg md:text-2xl font-black text-white tracking-widest uppercase italic">
                        MATH<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">NEXUS</span>
                    </h1>
                    <div className="text-[9px] md:text-[10px] font-mono text-slate-500 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="hidden sm:inline">ONLINE // </span>{studentProfile.towerTag || 'GUEST'}
                    </div>
                </div>
            </div>

             <div 
                onClick={() => navigate('/session/hub')}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-50 flex items-center gap-2 md:gap-3 bg-slate-900/50 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition-all min-h-[44px]"
            >
                <div className="text-right">
                    <div className="text-xs md:text-sm font-bold text-white uppercase">{studentProfile.level} <span className="text-slate-500">LVL</span></div>
                    <div className="text-[10px] md:text-xs font-mono text-cyan-400">{studentProfile.pv} PV</div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl overflow-hidden border border-white/20">
                     {studentProfile.avatarConfig ? (
                        <AvatarCanvas config={studentProfile.avatarConfig} size={isMobile ? 40 : 48} />
                    ) : ( 
                        <div className="w-full h-full bg-slate-800" />
                    )}
                </div>
            </div>

            <div 
                onClick={() => navigate('/arcade')}
                className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-50 group cursor-pointer"
                aria-label="Navigate to Arcade"
            >
                <div className="absolute inset-0 bg-purple-600 rounded-full blur-[20px] opacity-20 group-hover:opacity-50 transition-opacity" />
                <div className="relative w-14 h-14 md:w-16 md:h-16 bg-slate-900 border-2 border-purple-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] active:scale-95 md:group-hover:scale-110 transition-transform">
                    <Gamepad2 className="text-purple-400 w-7 h-7 md:w-8 md:h-8 group-hover:text-white transition-colors" />
                </div>
                <div className="hidden md:block absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Arcade
                </div>
            </div>


            {/* --- THE INTERACTIVE MAP --- */}
            <div ref={constraintsRef} className="w-full h-full flex items-center justify-center">
                <motion.div 
                    drag 
                    dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
                    initial={{ x: 0, y: 0, scale: 0.8, opacity: 0 }}
                    animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 1.5, type: 'spring' }}
                    className="relative"
                >
                    
                    {/* BASECAMP */}
                    <div className="absolute left-0 top-0 w-0 h-0 flex items-center justify-center z-40">
                         <div className="absolute w-[200px] h-[200px] md:w-[300px] md:h-[300px] border border-white/5 rounded-full animate-pulse-slow pointer-events-none" />
                         <motion.div 
                            whileTap={{ scale: 0.95 }}
                            whileHover={!isMobile ? { scale: 1.2 } : {}}
                            className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 border-2 border-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] z-50 cursor-pointer min-h-[44px] min-w-[44px]"
                            onClick={() => navigate('/session/hub')}
                            aria-label="Basecamp - Return to hub"
                         >
                            <span className="text-2xl md:text-3xl">⛺</span>
                         </motion.div>
                         <div className="absolute top-12 md:top-14 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Basecamp</div>
                    </div>

                    <svg className="absolute top-[-1500px] left-[-1500px] w-[3000px] h-[3000px] pointer-events-none z-0 opacity-30">
                        {Object.values(CURRICULUM_DATA.nodes).map(node => {
                            if (!node.x || !node.y) return null;
                            return node.prerequisites.map(preId => {
                                const preNode = CURRICULUM_DATA.nodes[preId];
                                if (!preNode || !preNode.x || !preNode.y) return null;
                                return (
                                    <line 
                                        key={`${node.id}-${preId}`}
                                        x1={1500 + preNode.x} y1={1500 + preNode.y} 
                                        x2={1500 + node.x} y2={1500 + node.y} 
                                        stroke="white" strokeWidth="2" strokeDasharray="4 4"
                                    />
                                );
                            });
                        })}
                    </svg>

                    {Object.values(CURRICULUM_DATA.nodes).map(node => {
                        if (node.x === undefined || node.y === undefined) return null;
                        const status = getNodeStatus(node.id);
                        const isLocked = status === 'locked';
                        
                        return (
                            <motion.div
                                key={node.id}
                                className="absolute flex flex-col items-center justify-center"
                                style={{ x: node.x, y: node.y }}
                                whileTap={!isLocked ? { scale: 0.95 } : {}}
                                whileHover={!isLocked && !isMobile ? { scale: 1.2, zIndex: 100 } : {}}
                            >
                                <div 
                                    onClick={() => handleNodeClick(node)}
                                    className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} rounded-full border-2 flex items-center justify-center transition-all duration-500 cursor-pointer relative min-h-[44px] min-w-[44px]
                                        ${getNodeVisuals(node.id)}
                                        ${isLocked ? 'cursor-not-allowed grayscale' : 'active:scale-95 md:hover:scale-110'}
                                    `}
                                    aria-label={`${node.title} - ${isLocked ? 'Locked' : status}`}
                                >
                                    {isLocked ? <Lock size={isMobile ? 18 : 14} className="text-slate-500" /> : <span className={`${isMobile ? 'text-lg' : 'text-sm'} shadow-black drop-shadow-md`}>{node.icon}</span>}
                                    {status === 'unlocked' && (
                                        <div className="absolute inset-0 w-full h-full animate-spin-slow border-t-2 border-cyan-200 rounded-full opacity-50" />
                                    )}
                                </div>
                                <div className={`mt-2 md:mt-3 px-2 md:px-3 py-1 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-full transition-all pointer-events-none max-w-[120px] md:max-w-none z-20
                                    ${isLocked ? 'opacity-30 scale-75' : 'opacity-100'}
                                `}>
                                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-300 truncate block">{node.title}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
