import { Component } from 'react';

/**
 * ErrorBoundary - Graceful error handling for React components
 * Prevents white screen of death with a premium fallback UI
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[150px] pointer-events-none" />

                    <div className="max-w-md w-full text-center relative z-10 animate-spring">
                        {/* Icon */}
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.2)] animate-pulse-slow">
                            <span className="text-5xl">⚠️</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-black text-white mb-2">
                            Something Went Wrong
                        </h1>

                        {/* Message */}
                        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                            Don&apos;t worry, your work is safe. The system encountered an unexpected issue.
                        </p>

                        {/* Error Details (dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-slate-900/80 border border-red-500/20 rounded-xl text-left overflow-auto max-h-32 backdrop-blur-sm">
                                <code className="text-xs text-red-400 font-mono">
                                    {this.state.error.toString()}
                                </code>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 text-sm uppercase tracking-wider active:scale-95"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-wider border border-white/10 active:scale-95"
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Footer */}
                        <p className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest">
                            Tower Tutoring // Error Recovery System
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

