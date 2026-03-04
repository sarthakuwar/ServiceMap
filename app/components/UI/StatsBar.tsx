import { GridCell } from '@/app/types';

interface StatsBarProps {
    cells: GridCell[];
    impactSummary?: { populationAffected: number; zonesImproved: number; avgScoreIncrease: number } | null;
}

export default function StatsBar({ cells, impactSummary }: StatsBarProps) {
    if (!cells || cells.length === 0) return null;

    const avgScore = Math.round(cells.reduce((sum, c) => sum + c.accessibility_score, 0) / cells.length);
    const deserts = cells.filter(c => c.accessibility_score < 40 && c.population_estimate > 10000);
    const underservedPop = deserts.reduce((sum, c) => sum + c.population_estimate, 0);

    const formatNumber = (num: number) => {
        return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/80 backdrop-blur-md border border-white/40 shadow-xl rounded-full px-8 py-3 flex items-center divide-x divide-slate-200 space-x-8">
            <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Avg Score</span>
                <span className="text-lg font-bold text-emerald-600">
                    {avgScore}
                    {impactSummary && impactSummary.zonesImproved > 0 && <span className="text-sm text-emerald-500 ml-1">+{impactSummary.avgScoreIncrease.toFixed(1)}</span>}
                    <span className="text-xs text-slate-400 font-normal opacity-50">/100</span>
                </span>
            </div>

            <div className="flex flex-col items-center pl-8">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Service Deserts</span>
                <span className="text-lg font-bold text-orange-500">
                    {deserts.length}
                    {impactSummary && impactSummary.zonesImproved > 0 && <span className="text-sm text-emerald-500 ml-1">-{impactSummary.zonesImproved}</span>}
                </span>
            </div>

            <div className="flex flex-col items-center pl-8">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pop. Underserved</span>
                <span className="text-lg font-bold text-red-500">
                    {formatNumber(underservedPop)}
                    {impactSummary && impactSummary.populationAffected > 0 && <span className="text-sm text-emerald-500 ml-1">-{formatNumber(impactSummary.populationAffected)}</span>}
                </span>
            </div>
        </div>
    );
}
