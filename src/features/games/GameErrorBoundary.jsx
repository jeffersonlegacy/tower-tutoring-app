import { Component } from 'react';

/**
 * GameErrorBoundary - Lightweight error boundary for individual games
 * Prevents one game crash from killing the entire arcade
 */
export default class GameErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Game crashed:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6">
                    <span className="text-6xl mb-4">💥</span>
                    <h2 className="text-xl font-bold mb-2">Game Crashed</h2>
                    <p className="text-slate-400 text-sm mb-4">Something went wrong. Try again!</p>
                    <button
                        onClick={this.props.onBack}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-colors"
                    >
                        Back to Arcade
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
