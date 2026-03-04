import { Insight } from '@/app/types';
import { Card } from '@/components/ui/card';
import { AlertCircle, Target, TrendingUp, Anchor } from 'lucide-react';

interface InsightsPanelProps {
    insights: Insight[];
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'negative': return <AlertCircle className="w-5 h-5 text-red-400" />;
            case 'positive': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
            case 'city-wide': return <Target className="w-5 h-5 text-blue-400" />;
            default: return <Anchor className="w-5 h-5 text-slate-400" />;
        }
    };

    const getStyle = (type: string) => {
        switch (type) {
            case 'negative': return 'border-red-500/20 bg-red-500/5';
            case 'positive': return 'border-emerald-500/20 bg-emerald-500/5';
            case 'city-wide': return 'border-blue-500/20 bg-blue-500/5';
            default: return 'border-slate-700 bg-slate-800/50';
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto bg-[#0a0f1c]">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Automated Insights</h2>
                <p className="text-slate-400">AI-generated deterministic analysis of current geospatial infrastructure gaps.</p>
            </div>

            <div className="space-y-4">
                {insights.map(insight => (
                    <Card key={insight.id} className={`p-5 rounded-xl border ${getStyle(insight.type)} transition-all hover:bg-opacity-80`}>
                        <div className="flex items-start space-x-4">
                            <div className={`mt-0.5 p-2 rounded-lg ${getStyle(insight.type).replace('border-', 'bg-')}`}>
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-white">{insight.title}</h3>
                                    {insight.ward_name && (
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-800/80 px-2 py-1 rounded">
                                            {insight.ward_name}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
