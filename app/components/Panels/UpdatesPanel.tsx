'use client';

import { useState } from 'react';
import { X, Bell, Send, Users, Shield, Loader2, CheckCircle2, Building, Flag, Clock } from 'lucide-react';
import { GovernmentUpdate } from '@/app/types';
import { Button } from '@/components/ui/button';

interface Props {
    updates: GovernmentUpdate[];
    availableWards: string[];
    onClose: () => void;
    onSendUpdate: (update: { message: string; target_type: 'ward' | 'issue'; target_ward?: string; target_issue_id?: string }) => Promise<any>;
}

export default function UpdatesPanel({ updates, availableWards, onClose, onSendUpdate }: Props) {
    const [message, setMessage] = useState('');
    const [targetType, setTargetType] = useState<'ward' | 'issue'>('ward');
    const [targetWard, setTargetWard] = useState(availableWards[0] || '');
    const [targetIssueId, setTargetIssueId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSubmitting(true);
        try {
            const res = await onSendUpdate({
                message: message.trim(),
                target_type: targetType,
                target_ward: targetType === 'ward' ? targetWard : undefined,
                target_issue_id: targetType === 'issue' ? targetIssueId : undefined,
            });
            setResult(res);
            setMessage('');
        } catch (err) {
            console.error(err);
        }
        setSubmitting(false);
    };

    return (
        <div className="absolute inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex justify-end">
            <div className="w-[450px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Government Updates</h2>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Broadcast & Notifications</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* New Update Form */}
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center mb-4">
                            <Send className="w-4 h-4 mr-2 text-indigo-500" />
                            Send New Update
                        </h3>

                        {result ? (
                            <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-5 text-center mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <h4 className="font-bold text-emerald-800">Update Broadcasted</h4>
                                <p className="text-xs text-emerald-600 mt-1">
                                    Successfully sent to {result.emails_sent} subscribed citizens.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4 border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 w-full"
                                    onClick={() => setResult(null)}
                                >
                                    Send Another
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setTargetType('ward')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center ${targetType === 'ward' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Building className="w-3 h-3 mr-1.5" /> Ward Level
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTargetType('issue')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center justify-center ${targetType === 'issue' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Flag className="w-3 h-3 mr-1.5" /> Specific Issue
                                    </button>
                                </div>

                                {targetType === 'ward' ? (
                                    <select
                                        value={targetWard}
                                        onChange={(e) => setTargetWard(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="" disabled>Select Ward...</option>
                                        {availableWards.map(w => <option key={w} value={w}>{w}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={targetIssueId}
                                        onChange={(e) => setTargetIssueId(e.target.value)}
                                        placeholder="e.g. GRV-0001"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                )}

                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your official update message..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />

                                <Button
                                    type="submit"
                                    disabled={submitting || !message.trim() || (targetType === 'ward' && !targetWard) || (targetType === 'issue' && !targetIssueId)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Broadcast Update
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Previous Updates Timeline */}
                    <div className="p-6">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center mb-6">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                            Recent Broadcasts
                        </h3>

                        <div className="space-y-6">
                            {updates.length === 0 ? (
                                <p className="text-sm text-slate-400 italic text-center py-4">No updates have been broadcasted yet.</p>
                            ) : (
                                updates.map(u => (
                                    <div key={u.id} className={`relative pl-4 border-l-2 ${u.read ? 'border-slate-200' : 'border-indigo-400'}`}>
                                        <div className={`absolute -ml-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${u.read ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                                        
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                                {u.target_type === 'ward' ? `WARD: ${u.target_ward}` : `ISSUE: ${u.target_issue_id}`}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {new Date(u.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className={`text-sm mt-2 leading-relaxed ${u.read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                                            {u.message}
                                        </p>

                                        <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                                            <div className="flex items-center">
                                                <Shield className="w-3 h-3 mr-1 text-slate-400" />
                                                {u.officer_name}
                                            </div>
                                            {u.emails_sent !== undefined && (
                                                <div className="flex items-center" title="Emails Sent">
                                                    <Users className="w-3 h-3 mr-1 text-slate-400" />
                                                    {u.emails_sent}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
