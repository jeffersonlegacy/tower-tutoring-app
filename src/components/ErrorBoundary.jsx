import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
                    <div className="glass-panel max-w-md w-full p-8 rounded-2xl text-center border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold mb-2 text-white">System Malfunction</h1>
                        <p className="text-slate-400 mb-6 text-sm">
                            Our neural metrics detected a critical syncing error.
                            Your progress is safe.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-950/50 p-3 rounded-lg text-left text-[10px] font-mono text-rose-300 mb-6 overflow-auto max-h-24 border border-rose-500/20">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20"
                        >
                            Reload Interface
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
