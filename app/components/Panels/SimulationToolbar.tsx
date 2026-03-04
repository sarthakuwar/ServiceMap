import { Button } from '@/components/ui/button';
import { Cross, BookOpen, Bus, Shield, Flame, Trash2 } from 'lucide-react';

interface SimulationToolbarProps {
    activeType: string | null;
    setActiveType: (t: string | null) => void;
    onReset: () => void;
    impactSummary: { populationAffected: number; zonesImproved: number; avgScoreIncrease: number } | null;
}

export default function SimulationToolbar({ activeType, setActiveType, onReset, impactSummary }: SimulationToolbarProps) {
    const tools = [
        { id: 'hospital', label: 'Clinic/Hospital', icon: Cross, color: 'text-red-400' },
        { id: 'school', label: 'School', icon: BookOpen, color: 'text-blue-400' },
        { id: 'bus_stop', label: 'Transit Hub', icon: Bus, color: 'text-emerald-400' },
        { id: 'police_station', label: 'Police', icon: Shield, color: 'text-indigo-400' },
        { id: 'fire_station', label: 'Fire Station', icon: Flame, color: 'text-orange-400' },
    ];

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center space-y-4">

            {/* Impact Summary Popup */}
            {impactSummary && impactSummary.zonesImproved > 0 && (
                <div className="bg-slate-900/95 backdrop-blur border border-cyan-500/30 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] px-6 py-4 rounded-xl flex items-center space-x-8 animate-in slide-in-from-bottom-5">
                    <div>
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Families Helped</div>
                        <div className="text-xl font-bold text-cyan-400">+{(impactSummary.populationAffected / 1000).toFixed(1)}k</div>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-700"></div>
                    <div>
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Zones Improved</div>
                        <div className="text-xl font-bold text-white">{impactSummary.zonesImproved}</div>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-700"></div>
                    <div>
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Avg Score Gain</div>
                        <div className="text-xl font-bold text-emerald-400">+{impactSummary.avgScoreIncrease.toFixed(1)}</div>
                    </div>
                </div>
            )}

            {/* Tools */}
            <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-2 rounded-2xl flex items-center space-x-2 shadow-2xl">
                <div className="px-4 py-2 border-r border-slate-800">
                    <span className="text-sm font-semibold text-slate-300">Choose a Service</span>
                    <p className="text-xs text-slate-500">to place on the map</p>
                </div>

                <div className="flex space-x-1 px-2">
                    {tools.map(t => {
                        const Icon = t.icon;
                        const isActive = activeType === t.id;
                        return (
                            <Button
                                key={t.id}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={`h-14 px-4 flex flex-col items-center justify-center space-y-1 rounded-xl transition-all ${isActive ? 'bg-slate-800 border border-slate-600 shadow-inner' : 'hover:bg-slate-800/50'
                                    }`}
                                onClick={() => setActiveType(isActive ? null : t.id)}
                            >
                                <Icon className={`w-5 h-5 ${t.color}`} />
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                    {t.label}
                                </span>
                            </Button>
                        );
                    })}
                </div>

                <div className="pl-2 border-l border-slate-800">
                    <Button
                        variant="destructive"
                        className="h-14 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-transparent rounded-xl"
                        onClick={onReset}
                    >
                        <Trash2 className="w-5 h-5 mr-2" /> Reset
                    </Button>
                </div>
            </div>
        </div>
    );
}
