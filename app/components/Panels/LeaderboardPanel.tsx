import { GridCell, Recommendation } from '@/app/types';

interface LeaderboardPanelProps {
    cells: GridCell[];
    recommendations?: Recommendation[];
}

interface WardSummary {
    ward_name: string;
    avgScore: number;
    population: number;
    status: string;
    need: string;
}

function getWardSummaries(cells: GridCell[], recs: Recommendation[]): WardSummary[] {
    const wards: Record<string, { scores: number[]; pop: number }> = {};

    cells.forEach(c => {
        if (!wards[c.ward_name]) wards[c.ward_name] = { scores: [], pop: 0 };
        wards[c.ward_name].scores.push(c.accessibility_score);
        wards[c.ward_name].pop += c.population_estimate;
    });

    return Object.entries(wards).map(([name, data]) => {
        const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        const rec = recs.find(r => r.ward_name === name);

        return {
            ward_name: name,
            avgScore: avg,
            population: data.pop,
            status: avg >= 80 ? 'On the Rise' : avg >= 60 ? 'Steady' : avg >= 40 ? 'At Risk' : 'Critical',
            need: rec ? rec.missing_service.replace('_', ' ') : 'All essential services within reach'
        };
    }).sort((a, b) => b.avgScore - a.avgScore);
}

export default function LeaderboardPanel({ cells, recommendations = [] }: LeaderboardPanelProps) {
    const summaries = getWardSummaries(cells, recommendations);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'On the Rise': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Steady': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'At Risk': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-yellow-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Neighborhood Progress Leaderboard</h2>
                    <p className="text-sm text-slate-400 mt-1">Identify critical local needs and track progress across neighborhoods.</p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">Live Updates</span>
            </div>

            <table className="w-full">
                <thead>
                    <tr className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <th className="text-left pb-4 pr-2">Rank</th>
                        <th className="text-left pb-4 pr-2">Ward Name</th>
                        <th className="text-left pb-4 pr-2">Progress Score</th>
                        <th className="text-left pb-4">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {summaries.map((ward, idx) => (
                        <tr key={ward.ward_name} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="py-4 pr-2">
                                <span className="text-lg font-bold text-slate-600">#{idx + 1}</span>
                            </td>
                            <td className="py-4 pr-2">
                                <div className="text-sm font-bold text-slate-800">{ward.ward_name}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">ID: W{idx + 1}</div>
                            </td>
                            <td className="py-4 pr-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-24 h-2 bg-slate-100 rounded-full">
                                        <div className={`h-full rounded-full ${getScoreBarColor(ward.avgScore)}`} style={{ width: `${ward.avgScore}%` }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{ward.avgScore}</span>
                                </div>
                            </td>
                            <td className="py-4">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(ward.status)}`}>
                                    {ward.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-6 text-center">
                <button className="text-sm text-blue-600 font-medium hover:underline">View All {summaries.length} Wards</button>
            </div>

            {/* Bottom stats */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
                <span>Avg City Progress: <span className="text-emerald-600 text-slate-600">{summaries.length > 0 ? Math.round(summaries.reduce((s, w) => s + w.avgScore, 0) / summaries.length) : 0}%</span></span>
                <span>Active Wards: <span className="text-slate-600">{summaries.length}</span></span>
            </div>
        </div>
    );
}
