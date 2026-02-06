import React from 'react';

/**
 * SystemStabilizer (Error Boundary)
 * Capsulates the entire application or major sub-trees.
 * If a crash occurs, it shows a "Sci-Fi Reboot" screen instead of a white page.
 */
class SystemStabilizer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("⚠️ SYSTEM INSTABILITY DETECTED ⚠️", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReboot = () => {
        // Attempt a soft recovery first by clearing the error state
        // If that fails, the user can hard refresh via browser
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/dashboard'; // Force return to safe zone
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-mono relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,#ef4444_1px,#ef4444_2px)] opacity-5 pointer-events-none"></div>
                    
                    <div className="z-10 bg-slate-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-md shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-300">
                        <div className="text-6xl mb-6 animate-pulse">☣️</div>
                        
                        <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">
                            SYSTEM MALFUNCTION
                        </h1>
                        
                        <div className="h-px w-full bg-red-500/30 my-4"></div>
                        
                        <p className="text-red-400 text-xs mb-6 uppercase tracking-wider">
                            Neural Sync Interrupted
                        </p>
                        
                        <div className="bg-black/50 rounded p-4 mb-6 text-left border border-white/5 overflow-auto max-h-32">
                            <code className="text-[10px] text-slate-400 block font-mono">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>

                        <button 
                            onClick={this.handleReboot}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase tracking-[0.2em] transition-all shadow-lg shadow-red-600/20"
                        >
                            INITIATE REBOOT
                        </button>
                    </div>

                    <div className="absolute bottom-6 text-[10px] text-slate-600 uppercase">
                        Protocol: Failsafe_v2.0
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default SystemStabilizer;
