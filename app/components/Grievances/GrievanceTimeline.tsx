'use client';

import { GrievanceTimelineEntry } from '@/app/types';
import { CheckCircle2, Clock, AlertTriangle, User, Shield, Bot } from 'lucide-react';

interface Props {
    timeline: GrievanceTimelineEntry[];
    compact?: boolean;
}

export default function GrievanceTimeline({ timeline, compact = false }: Props) {
    const getIcon = (entry: GrievanceTimelineEntry) => {
        if (entry.action.includes('ESCALATED')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
        if (entry.actor_type === 'system') return <Bot className="w-4 h-4 text-slate-400" />;
        if (entry.actor_type === 'officer') return <Shield className="w-4 h-4 text-blue-500" />;
        return <User className="w-4 h-4 text-emerald-500" />;
    };

    const getColor = (entry: GrievanceTimelineEntry) => {
        if (entry.action.includes('ESCALATED')) return 'border-red-400 bg-red-50';
        if (entry.action.includes('Resolved') || entry.action.includes('Verified')) return 'border-emerald-400 bg-emerald-50';
        if (entry.action.includes('Acknowledged')) return 'border-blue-400 bg-blue-50';
        if (entry.action.includes('Submitted')) return 'border-amber-400 bg-amber-50';
        return 'border-slate-300 bg-slate-50';
    };

    const formatDate = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
    };

    const formatTime = (ts: string) => {
        return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-0">
            {timeline.map((entry, idx) => (
                <div key={entry.id} className="flex gap-3">
                    {/* Vertical line */}
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${getColor(entry)}`}>
                            {getIcon(entry)}
                        </div>
                        {idx < timeline.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-200 min-h-[24px]" />
                        )}
                    </div>

                    {/* Content */}
                    <div className={`pb-4 flex-1 ${compact ? 'pb-3' : 'pb-5'}`}>
                        <div className="flex items-center justify-between">
                            <p className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{entry.action}</p>
                            <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                {formatDate(entry.timestamp)} {formatTime(entry.timestamp)}
                            </span>
                        </div>
                        <p className={`text-slate-500 mt-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                            by {entry.actor_name}
                        </p>
                        {entry.notes && (
                            <p className={`text-slate-600 mt-1 bg-white/80 rounded-lg px-2.5 py-1.5 border border-slate-100 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                                {entry.notes}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
