'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import { GridCell, Facility, Recommendation } from '@/app/types';
import { chatWithGemini } from '@/app/utils/geminiApi';

interface AIChatbotProps {
    cells: GridCell[];
    facilities?: Facility[];
    recommendations?: Recommendation[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

const SUGGESTED_QUERIES = [
    'Which ward has the worst score?',
    'Where are the biggest healthcare gaps?',
    'Top 3 wards by population?',
    'What are the service deserts?',
];

export default function AIChatbot({ cells, facilities, recommendations }: AIChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = {
            id: `user_${Date.now()}`,
            role: 'user',
            text: text.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setShowSuggestions(false);

        const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));

        try {
            const response = await chatWithGemini(text.trim(), cells, facilities, recommendations, history);

            const assistantMsg: Message = {
                id: `assistant_${Date.now()}`,
                role: 'assistant',
                text: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch {
            setMessages(prev => [...prev, {
                id: `error_${Date.now()}`,
                role: 'assistant',
                text: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }]);
        }

        setIsLoading(false);
    };

    const formatMessage = (text: string) => {
        // Handle bold text **text**
        return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group ${isOpen
                        ? 'bg-slate-900 hover:bg-slate-800 rotate-0'
                        : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6 text-white" />
                        {/* Pulse ring */}
                        <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20 group-hover:opacity-0"></span>
                    </>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[9998] w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 flex items-center space-x-3 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">ServiceMap AI Assistant</h3>
                            <p className="text-orange-100 text-xs">Powered by Gemini • Ask anything about the data</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
                        {messages.length === 0 && (
                            <div className="text-center pt-6 pb-2">
                                <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                                    <Bot className="w-7 h-7 text-orange-500" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">Hi! I'm your city analyst.</h4>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                                    Ask me about ward scores, service gaps, population data, or any infrastructure insights.
                                </p>
                            </div>
                        )}

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start space-x-2.5 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user'
                                        ? 'bg-slate-800'
                                        : 'bg-orange-100'
                                    }`}>
                                    {msg.role === 'user'
                                        ? <User className="w-3.5 h-3.5 text-white" />
                                        : <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                    }
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                        ? 'bg-slate-800 text-white rounded-br-md'
                                        : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-bl-md'
                                    }`}>
                                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                                        {msg.role === 'assistant' ? formatMessage(msg.text) : msg.text}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {isLoading && (
                            <div className="flex items-start space-x-2.5">
                                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                </div>
                                <div className="bg-white text-slate-500 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                                    <div className="flex items-center space-x-1.5">
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Queries */}
                    {showSuggestions && messages.length === 0 && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0 bg-white border-t border-slate-100 pt-3">
                            {SUGGESTED_QUERIES.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(q)}
                                    className="text-[11px] bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-full px-3 py-1.5 transition-colors font-medium"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
                        <div className="flex items-center space-x-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(input); }}
                                placeholder="Ask about wards, scores, services..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => sendMessage(input)}
                                disabled={isLoading || !input.trim()}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isLoading || !input.trim()
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                                    }`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mt-2">Gemini AI • Responses use live platform data</p>
                    </div>
                </div>
            )}
        </>
    );
}
