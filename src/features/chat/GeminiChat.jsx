import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mindHive, parseAIResponse } from '../../services/MindHiveService';
import { captureWhiteboard } from '../../utils/WhiteboardCapture';
import { strokeAnalytics } from '../../utils/StrokeAnalytics';
import ScanningOverlay from '../../components/ScanningOverlay';
import jiLogo from '../../assets/ji_logo.jpg';

// Patterns that suggest the student completed a whiteboard task
const COMPLETION_PATTERNS = [
    /done/i, /finished/i, /i did it/i, /here/i, /look/i, /check/i,
    /okay/i, /ok/i, /ready/i, /what now/i, /next/i, /is this right/i,
    /did i do it/i, /correct\?/i, /how's this/i, /like this/i
];

// Patterns in AI response suggesting it gave a whiteboard instruction
const INSTRUCTION_PATTERNS = [
    /draw/i, /write/i, /on your whiteboard/i, /sketch/i, /circle/i,
    /label/i, /show me/i, /put/i, /add/i, /create/i, /make/i
];

export default function GeminiChat({ mode = 'widget', onHome, externalMessages, setExternalMessages }) {
    const [localMessages, setLocalMessages] = useState([
        { role: 'model', text: 'Welcome to Jefferson Intelligence v3.0. I can see your whiteboard and understand how you\'re working. Just tell me what you need help with!' },
    ]);

    const messages = externalMessages || localMessages;
    const setMessages = setExternalMessages || setLocalMessages;
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentModel, setCurrentModel] = useState(null);
    const [whiteboardImage, setWhiteboardImage] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [autoCapture, setAutoCapture] = useState(true);
    const [emotionalState, setEmotionalState] = useState('neutral');
    const [whiteboardAction, setWhiteboardAction] = useState(null);
    const messagesEndRef = useRef(null);
    const lastAIResponseRef = useRef('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Broadcast whiteboard action to parent for overlay rendering
    useEffect(() => {
        if (whiteboardAction) {
            window.dispatchEvent(new CustomEvent('ai-whiteboard-action', {
                detail: whiteboardAction
            }));
            // Clear after 4 seconds
            const timer = setTimeout(() => setWhiteboardAction(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [whiteboardAction]);

    const silentCapture = useCallback(async () => {
        try {
            const imageData = await captureWhiteboard();
            return imageData;
        } catch (error) {
            console.warn('Silent capture failed:', error);
            return null;
        }
    }, []);

    const shouldAutoCaptureOnSend = useCallback((userText) => {
        if (!autoCapture) return false;
        return COMPLETION_PATTERNS.some(pattern => pattern.test(userText));
    }, [autoCapture]);

    const aiGaveWhiteboardInstruction = useCallback((aiResponse) => {
        return INSTRUCTION_PATTERNS.some(pattern => pattern.test(aiResponse));
    }, []);

    const handleCaptureWhiteboard = async () => {
        setIsCapturing(true);
        try {
            const imageData = await captureWhiteboard();
            if (imageData) {
                setWhiteboardImage(imageData);
                if (!input.trim()) {
                    setInput("Here's my whiteboard. Can you help me with this?");
                }
            } else {
                setMessages(prev => [...prev, {
                    role: 'model',
                    text: "I couldn't capture the whiteboard. Make sure you've drawn something first!"
                }]);
            }
        } catch (error) {
            console.error('Capture error:', error);
        }
        setIsCapturing(false);
    };

    const handleSend = async () => {
        if ((!input.trim() && !whiteboardImage) || isLoading) return;

        const userText = input || "Look at my whiteboard";
        let images = whiteboardImage ? [whiteboardImage] : [];

        // Get stroke analytics context
        const strokeContext = strokeAnalytics.getContextString();
        console.log('[v3.0] Stroke context:', strokeContext);

        // AUTO-CAPTURE LOGIC
        if (!whiteboardImage && shouldAutoCaptureOnSend(userText)) {
            console.log('[AI Vision] Auto-capturing whiteboard (completion detected)');
            setIsScanning(true);
            const autoCaptured = await silentCapture();
            if (autoCaptured) {
                images = [autoCaptured];
            }
        }

        if (!images.length && aiGaveWhiteboardInstruction(lastAIResponseRef.current)) {
            console.log('[AI Vision] Auto-capturing whiteboard (following instruction)');
            setIsScanning(true);
            const autoCaptured = await silentCapture();
            if (autoCaptured) {
                images = [autoCaptured];
            }
        }

        // Show scanning if we have images
        if (images.length > 0) {
            setIsScanning(true);
        }

        const userMessage = {
            role: 'user',
            text: userText,
            hasImage: images.length > 0
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setWhiteboardImage(null);
        setIsLoading(true);
        setCurrentModel(null);

        const placeholderId = Date.now();
        setMessages(prev => [...prev, { role: 'model', text: '', id: placeholderId, isStreaming: true }]);

        let fullResponse = "";

        try {
            await mindHive.streamResponse(
                userText,
                messages,
                (chunk) => {
                    fullResponse += chunk;
                    setMessages(prev => prev.map(msg =>
                        msg.id === placeholderId
                            ? { ...msg, text: fullResponse }
                            : msg
                    ));
                },
                (modelName) => {
                    const simplifiedName = modelName.split('/').pop().toUpperCase().replace(/-/g, ' ');
                    setCurrentModel(simplifiedName);
                },
                images,
                strokeContext
            );

            lastAIResponseRef.current = fullResponse;

            // Parse structured response and display ONLY the text_display (not raw JSON)
            const parsed = parseAIResponse(fullResponse);
            if (parsed.isStructured) {
                console.log('[v3.0] Parsed AI response:', parsed);
                setEmotionalState(parsed.emotionalState);
                if (parsed.whiteboardAction) {
                    setWhiteboardAction(parsed.whiteboardAction);
                }

                // Replace raw JSON with clean text display
                const cleanText = parsed.textDisplay || parsed.voiceResponse || fullResponse;
                setMessages(prev => prev.map(msg =>
                    msg.id === placeholderId
                        ? { ...msg, text: cleanText, nextStep: parsed.nextStep }
                        : msg
                ));
            }

            // Reset stroke analytics after successful exchange
            strokeAnalytics.reset();

        } catch (error) {
            console.error("Mind Hive Error:", error);
            setMessages(prev => prev.map(msg =>
                msg.id === placeholderId
                    ? { ...msg, text: "I'm having trouble connecting right now. Please try again in a moment." }
                    : msg
            ));
        } finally {
            setIsLoading(false);
            setIsScanning(false);
            setMessages(prev => prev.map(msg =>
                msg.id === placeholderId
                    ? { ...msg, isStreaming: false }
                    : msg
            ));
        }
    };

    // Emotional state badge
    const getEmotionBadge = () => {
        const emotions = {
            frustrated: { color: 'bg-red-500/20 text-red-400', icon: '😤' },
            confused: { color: 'bg-yellow-500/20 text-yellow-400', icon: '🤔' },
            curious: { color: 'bg-blue-500/20 text-blue-400', icon: '🧐' },
            confident: { color: 'bg-green-500/20 text-green-400', icon: '😊' },
            bored: { color: 'bg-slate-500/20 text-slate-400', icon: '😐' },
            flow: { color: 'bg-purple-500/20 text-purple-400', icon: '🚀' },
            neutral: { color: 'bg-slate-500/20 text-slate-400', icon: '🎯' },
        };
        return emotions[emotionalState] || emotions.neutral;
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
        : "fixed bottom-4 right-4 md:right-6 w-[95vw] md:w-[400px] h-[80vh] md:h-[650px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-sans ring-1 ring-white/5 animation-slide-up-fade";

    const emotionBadge = getEmotionBadge();

    return (
        <div className={containerClasses}>
            {/* Scanning Overlay */}
            <ScanningOverlay isActive={isScanning} />

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 flex justify-between items-center border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

                <div className="flex flex-col z-10 w-full">
                    <div className="flex items-center gap-3">
                        <img src={jiLogo} alt="JI Logo" className="w-12 h-12 rounded-full border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20" />
                        <div>
                            <span className="font-extrabold text-white text-sm tracking-wide uppercase">Jefferson Intelligence</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
                                <span className="text-[10px] text-slate-400 font-medium tracking-wider">
                                    {currentModel || 'v3.0'} • {autoCapture ? 'VISION' : 'MANUAL'}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${emotionBadge.color}`}>
                                    {emotionBadge.icon}
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

            {/* Messages */}
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
                                {msg.hasImage && (
                                    <div className="text-[10px] text-blue-300 mb-1 flex items-center gap-1">
                                        👁️ Viewing whiteboard
                                    </div>
                                )}
                                <div className="markdown-body">
                                    {msg.role === 'model' ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li>{children}</li>,
                                                strong: ({ children }) => <strong className="font-bold text-cyan-300">{children}</strong>,
                                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
                                                code: ({ children }) => <code className="bg-slate-900/50 px-1 py-0.5 rounded text-xs font-mono text-emerald-400">{children}</code>,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{msg.text}</div>
                                    )}
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
                            {isScanning ? 'Analyzing whiteboard...' : 'Thinking...'}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-white/5 relative z-20">
                {whiteboardImage && (
                    <div className="mb-2 relative">
                        <img src={whiteboardImage} alt="Whiteboard preview" className="h-16 rounded-lg border border-cyan-500/50" />
                        <button
                            onClick={() => setWhiteboardImage(null)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-400"
                        >✕</button>
                    </div>
                )}

                <div className="relative flex gap-2 items-end">
                    <button
                        onClick={handleCaptureWhiteboard}
                        disabled={isLoading || isCapturing}
                        title="Manually capture whiteboard"
                        className={`p-3 rounded-xl border transition-all ${whiteboardImage
                            ? 'bg-cyan-600 border-cyan-500 text-white'
                            : 'bg-slate-800 border-white/10 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50'
                            } disabled:opacity-50`}
                    >
                        {isCapturing ? (
                            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </button>

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
                        placeholder="Tell me what you need help with..."
                        className="flex-1 bg-slate-950/80 text-white text-sm rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 placeholder-slate-600 resize-none min-h-[44px] max-h-[120px] transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && !whiteboardImage)}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <button
                        onClick={() => setAutoCapture(!autoCapture)}
                        className={`text-[9px] uppercase tracking-widest font-semibold transition-colors ${autoCapture ? 'text-emerald-500' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                        {autoCapture ? '👁️ Auto-Vision ON' : '👁️ Auto-Vision OFF'}
                    </button>
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">v3.0 Neuro-Adaptive</span>
                </div>
            </div>
        </div>
    );
}
