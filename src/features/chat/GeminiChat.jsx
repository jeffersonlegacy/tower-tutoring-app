import React, { useState, useRef, useEffect } from 'react';
import { mindHive } from '../../services/MindHiveService';
import jiLogo from '../../assets/ji_logo.jpg';


export default function GeminiChat({ mode = 'widget', onHome }) {
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Welcome to Jefferson Intelligence. I am your premium AI tutor. How can I assist your learning journey today?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentModel, setCurrentModel] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input;
        const userMessage = { role: 'user', text: userText };

        // Optimistic UI update
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setCurrentModel(null);

        // Placeholder for streaming response
        const placeholderId = Date.now();
        setMessages(prev => [...prev, { role: 'model', text: '', id: placeholderId, isStreaming: true }]);

        let fullResponse = "";

        try {
            await mindHive.streamResponse(
                userText,
                messages, // Pass history
                (chunk) => {
                    fullResponse += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === placeholderId
                            ? { ...msg, text: fullResponse }
                            : msg
                    ));
                },
                (modelName) => {
                    // Update active model indicator
                    const simplifiedName = modelName.split('/').pop().toUpperCase().replace(/-/g, ' ');
                    setCurrentModel(simplifiedName);
                }
            );
        } catch (error) {
            console.error("Mind Hive Error:", error);
            setMessages(prev => prev.map(msg =>
                msg.id === placeholderId
                    ? { ...msg, text: "The Swarm is currently unreachable. Please check your connection." }
                    : msg
            ));
        } finally {
            setIsLoading(false);
            setMessages(prev => prev.map(msg =>
                msg.id === placeholderId
                    ? { ...msg, isStreaming: false }
                    : msg
            ));
        }
    };

    if (!isOpen && mode === 'widget') {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105 transition-all z-50 flex items-center gap-3 border border-white/20"
            >
                <img src={jiLogo} alt="JI Logo" className="w-14 h-14 rounded-full border-2 border-white/30" />
                <span className="font-bold tracking-wide text-sm font-sans">Jefferson Intelligence</span>
            </button>
        );
    }

    const containerClasses = mode === 'fullscreen'
        ? "w-full h-full flex flex-col bg-slate-950"
        : "w-[400px] h-[650px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans ring-1 ring-white/5 animation-slide-up-fade";

    return (
        <div className={containerClasses}>
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 flex justify-between items-center border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                <div className="flex flex-col z-10 w-full">
                    <div className="flex items-center gap-3">
                        <img src={jiLogo} alt="JI Logo" className="w-14 h-14 rounded-full border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20" />

                        <div>
                            <span className="font-extrabold text-white text-sm tracking-wide uppercase">Jefferson Intelligence</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wider">
                                    {currentModel ? `CONNECTED: ${currentModel}` : 'ONLINE'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {mode === 'widget' && (
                    <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">✕</button>
                )}
                {mode === 'fullscreen' && onHome && (
                    <button onClick={onHome} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-slate-300 font-bold uppercase tracking-widest transition-all">
                        Exit
                    </button>
                )}
            </div>

            {/* Premium Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] relative group`}>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm border border-white/10'
                                : 'bg-slate-800/80 text-slate-200 rounded-bl-sm border border-white/5'
                                }`}>
                                {msg.role === 'model' && (
                                    <div className="text-[10px] font-bold text-cyan-400/80 mb-1 tracking-widest uppercase flex items-center gap-2">
                                        Jefferson AI {currentModel && idx === messages.length - 1 && <span className="text-[8px] px-1 bg-cyan-900/50 rounded text-cyan-300">{currentModel}</span>}
                                    </div>
                                )}
                                <div className="markdown-body">
                                    {msg.text}
                                    {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-cyan-400 animate-pulse rounded-full" />}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && !currentModel && (
                    <div className="flex justify-center py-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-full border border-white/5 text-xs text-cyan-400 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            Establishing Secure Connection...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Premium Input Area */}
            <div className="p-4 bg-slate-900 border-t border-white/5 relative z-20">
                <div className="relative flex gap-2 items-end">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        rows={1}
                        placeholder="Ask anything..."
                        className="flex-1 bg-slate-950/80 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-600 resize-none min-h-[44px] max-h-[120px] transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">Jefferson Intelligence System v2.0</span>
                </div>
            </div>
        </div>
    );
}
