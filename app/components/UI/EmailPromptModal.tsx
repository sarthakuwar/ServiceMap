'use client';

import { useState } from 'react';
import { X, Mail, Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmailPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => Promise<void>;
    title: string;
    description: string;
    entityName: string;
}

export default function EmailPromptModal({ isOpen, onClose, onSubmit, title, description, entityName }: EmailPromptModalProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) return;
        
        setIsSubmitting(true);
        try {
            await onSubmit(email);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
                setIsSuccess(false);
                setEmail('');
            }, 2000);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[6000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
                
                <div className="p-6 text-center text-slate-500">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        {isSuccess ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <Bell className="w-8 h-8" />}
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 mb-2">{isSuccess ? "Subscribed Successfully!" : title}</h2>
                    <p className="text-sm mb-6 max-w-sm mx-auto">
                        {isSuccess ? `You will now receive updates about ${entityName}.` : description}
                    </p>
                    
                    {!isSuccess && (
                        <form onSubmit={handleSubmit} className="text-left">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Your Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="citizen@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !email}
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-bold"
                            >
                                {isSubmitting ? "Subscribing..." : "Get Email Updates"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
