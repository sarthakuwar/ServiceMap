import { Hospital, School, Bus, Shield, Flame, RotateCcw } from 'lucide-react';

interface SimulationToolbarProps {
    activeType: string | null;
    setActiveType: (t: string | null) => void;
    onReset: () => void;
    impactSummary?: { populationAffected: number; zonesImproved: number; avgScoreIncrease: number; } | null;
}

const SIM_TOOLS = [
    { key: 'hospital', label: 'Clinic/Hospital', icon: Hospital, color: 'text-red-500' },
    { key: 'school', label: 'School', icon: School, color: 'text-blue-500' },
    { key: 'bus_stop', label: 'Transit Hub', icon: Bus, color: 'text-emerald-500' },
    { key: 'police_station', label: 'Police', icon: Shield, color: 'text-indigo-500' },
    { key: 'fire_station', label: 'Fire Station', icon: Flame, color: 'text-orange-500' },
];

export default function SimulationToolbar({ activeType, setActiveType, onReset, impactSummary }: SimulationToolbarProps) {
    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center space-y-3">
            {/* Impact Summary */}
            {impactSummary && impactSummary.zonesImproved > 0 && (
                <div className="bg-white border border-emerald-200 rounded-2xl px-8 py-4 shadow-xl flex items-center divide-x divide-slate-100 space-x-8">
                    <div className="text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Families Helped</div>
                        <div className="text-xl font-bold text-emerald-600">{(impactSummary.populationAffected / 1000).toFixed(1)}k</div>
                    </div>
                    <div className="text-center pl-8">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Zones Improved</div>
                        <div className="text-xl font-bold text-blue-600">{impactSummary.zonesImproved}</div>
                    </div>
                    <div className="text-center pl-8">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Avg Score Gain</div>
                        <div className="text-xl font-bold text-orange-500">+{impactSummary.avgScoreIncrease.toFixed(1)}</div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-6 py-4 shadow-xl flex items-center space-x-1">
                {SIM_TOOLS.map(tool => {
                    const isActive = activeType === tool.key;
                    return (
                        <button
                            key={tool.key}
                            onClick={() => setActiveType(isActive ? null : tool.key)}
                            className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all ${isActive
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                }`}
                        >
                            <tool.icon className={`w-5 h-5 ${isActive ? 'text-white' : tool.color}`} />
                            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{tool.label}</span>
                        </button>
                    );
                })}

                <div className="w-px h-10 bg-slate-200 mx-2"></div>

                <button
                    onClick={onReset}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-xs font-semibold">Reset</span>
                </button>
            </div>

            {/* Simulation mode notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-orange-700 font-medium">Simulation Mode — Changes are not saved to the real plan</p>
            </div>
        </div>
    );
}
