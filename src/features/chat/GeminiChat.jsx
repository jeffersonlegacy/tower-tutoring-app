import React, { useState } from 'react';


export default function GeminiChat() {
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hello! I am Jefferson, your AI tutor. How can I help you today?' },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Direct REST API call to match the working curl command
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `You are "Jefferson", a helpful, encouraging, and knowledgeable AI tutor for Jefferson Tutoring. 
      Your goal is to help students understand concepts clearly. Keep responses concise and friendly.
      Current conversation history: ${JSON.stringify(messages.slice(-5))}
      User: ${userMessage.text}`
                                    }
                                ]
                            }
                        ]
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

            setMessages((prev) => [...prev, { role: 'model', text }]);
        } catch (error) {
            console.error("Gemini Error:", error);
            setMessages((prev) => [...prev, { role: 'model', text: `Error: ${error.message || "Something went wrong."}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-cyan-400 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform z-50 flex items-center gap-2"
            >
                <span className="text-xl">🤖</span>
                <span className="font-bold">AI Tutor</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-80 h-[500px] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <span className="font-bold text-white">Jefferson AI</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 backdrop-blur">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-slate-700 text-slate-200 rounded-bl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 text-slate-400 p-2 rounded-lg text-xs animate-pulse">Thinking...</div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-slate-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
