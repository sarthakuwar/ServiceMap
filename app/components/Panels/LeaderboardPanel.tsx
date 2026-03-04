import { GridCell, Recommendation } from '@/app/types';
import { Badge } from '@/components/ui/badge';
import { getScoreColor } from '@/app/utils/scoring';

interface LeaderboardPanelProps {
    cells: GridCell[];
    recommendations: Recommendation[];
}

export default function LeaderboardPanel({ cells, recommendations }: LeaderboardPanelProps) {
    // Aggregate cells by ward
    const wardStats = cells.reduce((acc, cell) => {
        if (!acc[cell.ward_name]) {
            acc[cell.ward_name] = { score: 0, count: 0, pop: 0 };
        }
        acc[cell.ward_name].score += cell.accessibility_score;
        acc[cell.ward_name].count += 1;
        acc[cell.ward_name].pop += cell.population_estimate;
        return acc;
    }, {} as Record<string, { score: number; count: number; pop: number }>);

    const leaderboard = Object.entries(wardStats)
        .map(([name, data]) => {
            const avgScore = Math.round(data.score / data.count);
            const rec = recommendations.find(r => r.ward_name === name);

            let status = 'Steady';
            let statusColor = 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            if (avgScore > 75) { status = 'On the Rise'; statusColor = 'text-amber-400 bg-amber-400/10 border-amber-400/20'; }
            else if (avgScore < 45) { status = 'Critical'; statusColor = 'text-red-400 bg-red-400/10 border-red-400/20'; }
            else if (avgScore < 60) { status = 'At Risk'; statusColor = 'text-orange-400 bg-orange-400/10 border-orange-400/20'; }

            return {
                name,
                score: avgScore,
                pop: data.pop,
                status,
                statusColor,
                needs: rec ? `${rec.missing_service.replace('_', ' ')} needed urgently` : 'All essential services within reach'
            };
        })
        .sort((a, b) => b.score - a.score);

    return (
        <div className="p-8 h-full overflow-y-auto bg-[#0f172a]">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Neighborhood Progress Leaderboard</h2>
                <p className="text-slate-400">Identify critical local needs and track progress across neighborhoods.</p>
            </div>

            <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-4 pl-4">Neighborhood</div>
                    <div className="col-span-3">Progress Score</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-3">Community Needs</div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-800">
                    {leaderboard.map((item, idx) => (
                        <div key={item.name} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/30 transition-colors">
                            <div className="col-span-4 pl-4 flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                    #{idx + 1}
                                </div>
                                <span className="font-semibold text-slate-200">{item.name}</span>
                            </div>

                            <div className="col-span-3 flex items-center space-x-3">
                                <span className={`font-bold ${item.score >= 80 ? 'text-emerald-400' : item.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{item.score}</span>
                                <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, backgroundColor: getScoreColor(item.score) }}></div>
                                </div>
                            </div>

                            <div className="col-span-2 flex justify-center">
                                <Badge variant="outline" className={`px-3 py-1 ${item.statusColor}`}>
                                    {item.status}
                                </Badge>
                            </div>

                            <div className="col-span-3">
                                <span className={`text-sm ${item.score > 75 ? 'text-emerald-400/80' : 'text-slate-400'}`}>{item.needs}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
