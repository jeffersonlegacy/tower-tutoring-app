import React, { useState, useRef, useEffect } from 'react';
import { mindHive } from '../../services/MindHiveService';


export default function GeminiChat() {
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hello! I am Jefferson, your AI tutor. I am powered by a swarm of intelligent models. How can I help?' },
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

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50 flex items-center gap-2"
            >
                <span className="text-xl">🐝</span>
                <span className="font-bold">AI Swarm</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🐝</span>
                        <span className="font-bold text-white">Jefferson AI Swarm</span>
                    </div>
                    {currentModel && (
                        <div className="text-[10px] text-cyan-400 animate-pulse ml-7">
                            Powered by: {currentModel}
                        </div>
                    )}
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/95 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                            }`}>
                            {msg.text}
                            {msg.isStreaming && <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse" />}
                        </div>
                    </div>
                ))}
                {isLoading && !currentModel && (
                    <div className="flex justify-start">
                        <div className="text-slate-500 text-xs italic ml-2">Connecting to Hive...</div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask the swarm..."
                    className="flex-1 bg-slate-800 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50 transition-colors"
                >
                    {isLoading ? '...' : 'Send'}
                </button>
            </div>
        </div>
    );
}
