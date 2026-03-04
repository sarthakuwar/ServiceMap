import { WardHistory } from '@/app/types';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface GovernancePanelProps {
    history: WardHistory[];
}

const getBadgeStyle = (badge: string) => {
    switch (badge) {
        case 'Improving': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Stable': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Declining': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
};

const getBarColor = (badge: string, isLatest: boolean) => {
    if (isLatest) {
        switch (badge) {
            case 'Improving': return '#10b981';
            case 'Declining': return '#ef4444';
            default: return '#f59e0b';
        }
    }
    return '#fed7aa';
};

export default function GovernancePanel({ history }: GovernancePanelProps) {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Governance Accountability</h2>
                    <p className="text-sm text-slate-400 mt-1">Track 3-month accessibility score trends across local wards.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {history.map((ward, idx) => {
                    const months = Object.keys(ward.history);
                    const data = months.map((m, i) => ({
                        name: m,
                        score: ward.history[m],
                        isLatest: i === months.length - 1
                    }));

                    return (
                        <div key={ward.ward_id || idx} className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">{ward.ward_name}</h3>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Ward {ward.ward_id || idx + 1}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${getBadgeStyle(ward.badge)}`}>
                                    {ward.badge}
                                </span>
                            </div>

                            <div className="h-24">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} barCategoryGap="20%">
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                            contentStyle={{
                                                background: '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '0.75rem',
                                                fontSize: '12px',
                                                padding: '8px 12px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                                            }}
                                            labelStyle={{ color: '#334155', fontWeight: 700, fontSize: '11px' }}
                                        />
                                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                            {data.map((entry, i) => (
                                                <Cell key={i} fill={getBarColor(ward.badge, entry.isLatest)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Governance Audit Banner */}
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5 flex items-center justify-between">
                <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-orange-800">Governance Audit Pending</h4>
                        <p className="text-xs text-orange-600 mt-0.5">Monthly accountability reports for {history.length} wards are ready for review.</p>
                    </div>
                </div>
                <button className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shrink-0">
                    Review All
                </button>
            </div>
        </div>
    );
}
