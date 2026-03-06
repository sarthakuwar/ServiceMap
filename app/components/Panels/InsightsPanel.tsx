'use client';

import { useState, useEffect } from 'react';
import { Insight } from '@/app/types';
import { GridCell, Recommendation } from '@/app/types';
import { AlertCircle, Target, TrendingUp, Anchor, Sparkles, RefreshCw, Loader2, BarChart3 } from 'lucide-react';
import { generateAIInsights } from '@/app/utils/geminiApi';
import { generateWardInsights } from '@/app/utils/insightEngine';

interface InsightsPanelProps {
    insights: Insight[];
    cells?: GridCell[];
    recommendations?: Recommendation[];
    wardName?: string; // If provided, generate ward-level insights
}

export default function InsightsPanel({ insights: fallbackInsights, cells, recommendations, wardName }: InsightsPanelProps) {
    const [aiInsights, setAiInsights] = useState<Insight[] | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [hasTriedAI, setHasTriedAI] = useState(false);
    const [aiFailed, setAiFailed] = useState(false);

    // Ward-level deterministic insights (computed, no API needed)
    const wardInsights = cells && wardName ? generateWardInsights(cells, wardName) : [];

    // Determine which insights to show
    const displayInsights = (() => {
        if (!useAI || aiFailed) {
            // Prefer ward-level if available, else city-wide fallback
            return wardInsights.length > 0 ? wardInsights : fallbackInsights;
        }
        if (aiInsights && aiInsights.length > 0) return aiInsights;
        return wardInsights.length > 0 ? wardInsights : fallbackInsights;
    })();

    const isAIPowered = useAI && aiInsights && aiInsights.length > 0 && !aiFailed;

    useEffect(() => {
        if (useAI && cells && cells.length > 0 && !hasTriedAI) {
            fetchAIInsights();
        }
    }, [useAI, cells]);

    const fetchAIInsights = async () => {
        if (!cells || cells.length === 0) return;
        setIsLoadingAI(true);
        setHasTriedAI(true);
        setAiFailed(false);

        try {
            const raw = await generateAIInsights(cells, recommendations);
            if (!raw) {
                setAiFailed(true);
                setIsLoadingAI(false);
                return;
            }

            // Clean response - remove markdown code blocks if present
            let cleaned = raw.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }

            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const formatted: Insight[] = parsed
                    .sort((a: any, b: any) => (a.priority || 5) - (b.priority || 5))
                    .map((item: any, idx: number) => ({
                        id: item.id || `ai_${idx}`,
                        title: item.title,
                        description: item.description,
                        type: item.type as 'negative' | 'positive' | 'city-wide',
                        ward_name: item.ward_name || undefined,
                        priority: item.priority || idx + 1,
                    }));
                setAiInsights(formatted);
            } else {
                setAiFailed(true);
            }
        } catch (err) {
            console.warn('Failed to parse AI insights, using deterministic fallback:', err);
            setAiFailed(true);
        }

        setIsLoadingAI(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'negative': return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'positive': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
            case 'city-wide': return <Target className="w-5 h-5 text-blue-500" />;
            default: return <Anchor className="w-5 h-5 text-slate-400" />;
        }
    };

    const getBorderColor = (type: string) => {
        switch (type) {
            case 'negative': return 'border-l-red-500';
            case 'positive': return 'border-l-emerald-500';
            case 'city-wide': return 'border-l-blue-500';
            default: return 'border-l-slate-300';
        }
    };

    const getPriorityBadge = (priority?: number) => {
        if (!priority) return null;
        const colors = priority <= 2 ? 'bg-red-100 text-red-600' : priority <= 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500';
        return (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${colors} uppercase tracking-wider`}>
                P{priority}
            </span>
        );
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    {isAIPowered ? (
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                        <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                        {isAIPowered ? 'AI Insights' : 'Data-Driven Insights'}
                    </h2>
                    {isAIPowered && (
                        <span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">Gemini</span>
                    )}
                    {!isAIPowered && !isLoadingAI && (
                        <span className="text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">Deterministic</span>
                    )}
                </div>

                <div className="flex items-center space-x-1">
                    {/* Toggle AI/Deterministic */}
                    <button
                        onClick={() => {
                            setUseAI(!useAI);
                            if (!useAI) {
                                setHasTriedAI(false);
                                setAiInsights(null);
                                setAiFailed(false);
                            }
                        }}
                        className={`text-[9px] font-bold px-2 py-1 rounded-md transition-colors ${useAI ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        title={useAI ? 'Switch to deterministic insights' : 'Switch to AI insights'}
                    >
                        {useAI ? '🤖 AI' : '📊 Data'}
                    </button>

                    {cells && cells.length > 0 && useAI && (
                        <button
                            onClick={() => { setHasTriedAI(false); setAiInsights(null); setAiFailed(false); fetchAIInsights(); }}
                            disabled={isLoadingAI}
                            className="text-slate-400 hover:text-orange-500 transition-colors p-1 rounded-lg hover:bg-white/50"
                            title="Refresh AI Insights"
                        >
                            {isLoadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* AI Failed Notice */}
            {aiFailed && useAI && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start space-x-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                        AI unavailable — showing deterministic insights computed from real-time data.
                    </p>
                </div>
            )}

            {/* Loading State */}
            {isLoadingAI && displayInsights.length === 0 && (
                <div className="bg-white/90 backdrop-blur p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-700">Analyzing city data...</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Gemini is generating priority insights</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Insight Cards */}
            <div className="space-y-2.5">
                {displayInsights.map((insight, idx) => (
                    <div key={insight.id} className={`bg-white/90 backdrop-blur p-3 rounded-xl border-l-4 ${getBorderColor(insight.type)} shadow-sm transition-all hover:shadow-md`}>
                        <div className="flex items-start space-x-3">
                            <div className="mt-0.5 shrink-0">
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <div className="flex items-center space-x-1.5">
                                        <h3 className="text-xs font-bold text-slate-800">{insight.title}</h3>
                                        {(insight as any).priority && getPriorityBadge((insight as any).priority)}
                                    </div>
                                    {insight.ward_name && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2 shrink-0">
                                            {insight.ward_name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
