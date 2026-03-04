import { WardHistory } from '@/app/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGovernanceBadgeColor } from '@/app/utils/scoring';
import { TrendingUp, TrendingDown, Diamond } from 'lucide-react';

interface GovernancePanelProps {
    history: WardHistory[];
}

export default function GovernancePanel({ history }: GovernancePanelProps) {
    const getIcon = (badge: string) => {
        switch (badge) {
            case 'Improving': return <TrendingUp className="w-4 h-4 mr-2" />;
            case 'Declining': return <TrendingDown className="w-4 h-4 mr-2" />;
            default: return <Diamond className="w-4 h-4 mr-2" />;
        }
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-[#0a0f1c]">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Governance Accountability</h2>
                <p className="text-slate-400">Track 3-month accessibility score trends across local wards to evaluate municipal intervention effectiveness.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {history.map(ward => {
                    const months = Object.keys(ward.history);
                    const scores = Object.values(ward.history);

                    return (
                        <Card key={ward.ward_id} className="p-6 bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">{ward.ward_name}</h3>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ward {ward.ward_id}</span>
                                </div>
                                <Badge variant="outline" className={`px-3 py-1 text-sm bg-transparent ${getGovernanceBadgeColor(ward.badge)}`}>
                                    {getIcon(ward.badge)} {ward.badge}
                                </Badge>
                            </div>

                            <div className="flex justify-between items-end px-2">
                                {months.map((month, i) => {
                                    const score = scores[i];
                                    const height = `${score}%`;
                                    return (
                                        <div key={month} className="flex flex-col items-center group">
                                            <span className="text-xs font-bold mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-white">{score}</span>
                                            <div className="w-8 bg-slate-700/50 rounded-t-sm h-24 flex items-end">
                                                <div
                                                    className={`w-full rounded-t-sm transition-all duration-1000 ${i === months.length - 1 ? (ward.badge === 'Declining' ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-600'
                                                        }`}
                                                    style={{ height }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-slate-400 mt-3 font-medium uppercase">{month}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
