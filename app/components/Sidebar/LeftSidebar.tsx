import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Map, Activity, BarChart3, Info, User, Shield, Layers, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LeftSidebarProps {
    activeView: 'map' | 'sim' | 'rank' | 'report';
    setActiveView: (v: 'map' | 'sim' | 'rank' | 'report') => void;
    avgScore?: number;
    impactSummary?: { populationAffected: number; zonesImproved: number; avgScoreIncrease: number } | null;
    vulnerabilityMode?: boolean;
    setVulnerabilityMode?: (v: boolean) => void;
    visibleFacilities?: string[];
    setVisibleFacilities?: (v: string[]) => void;
}

const FACILITY_LAYERS = [
    { key: 'hospital', label: 'Hospitals', icon: '🏥', color: 'text-red-400' },
    { key: 'school', label: 'Schools', icon: '🏫', color: 'text-blue-400' },
    { key: 'bus_stop', label: 'Transit', icon: '🚌', color: 'text-emerald-400' },
    { key: 'police_station', label: 'Police', icon: '🚔', color: 'text-indigo-400' },
    { key: 'fire_station', label: 'Fire Stn', icon: '🚒', color: 'text-orange-400' },
];

export default function LeftSidebar({ activeView, setActiveView, avgScore = 0, impactSummary, vulnerabilityMode = false, setVulnerabilityMode, visibleFacilities = [], setVisibleFacilities }: LeftSidebarProps) {
    const getScoreColor = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-yellow-500' : s >= 40 ? 'bg-orange-500' : 'bg-red-500';

    return (
        <div className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-[50]">
            {/* Brand */}
            <div className="p-6 pb-2">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight">Urban Planner</h1>
                        <p className="text-xs text-emerald-400">Gov. Dashboard</p>
                    </div>
                </div>

                {/* City Profile Summary */}
                <Card className="p-4 bg-slate-800/50 border-slate-700 mb-6 rounded-xl">
                    <div className="flex items-center justify-between pointer-events-auto">
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Spatial Index</div>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-help"><Info className="w-4 h-4 text-slate-500 hover:text-white transition-colors" /></div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-800 text-slate-200 border-slate-700 w-64 p-3 shadow-xl">
                                    <p className="text-xs font-semibold mb-1 text-white">Why Hexagons?</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        We use Uber's H3 Hexagonal Grid to divide the city uniformly. This eliminates size bias common in irregular ward boundaries, ensuring fair and accurate geospatial density analysis.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <div className="text-base font-medium text-slate-200">Bangalore H3 Grid</div>
                </Card>
            </div>

            {/* Navigation */}
            <div className="px-4 flex-1">
                <div className="space-y-2">
                    <Button
                        variant={activeView === 'map' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start ${activeView === 'map' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                        onClick={() => setActiveView('map')}
                    >
                        <Map className="mr-3 w-4 h-4" /> Explore Map
                    </Button>

                    <Button
                        variant={activeView === 'sim' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start ${activeView === 'sim' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                        onClick={() => setActiveView('sim')}
                    >
                        <Activity className="mr-3 w-4 h-4" /> Simulations
                    </Button>

                    <Button
                        variant={activeView === 'rank' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start ${activeView === 'rank' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                        onClick={() => setActiveView('rank')}
                    >
                        <BarChart3 className="mr-3 w-4 h-4" /> Leaderboard
                    </Button>
                </div>

                {/* Vulnerability Toggle */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <button
                        onClick={() => setVulnerabilityMode?.(!vulnerabilityMode)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${vulnerabilityMode
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-800'
                            }`}
                    >
                        <div className="flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Vulnerability Index
                        </div>
                        <div className={`w-8 h-4 rounded-full transition-colors ${vulnerabilityMode ? 'bg-purple-500' : 'bg-slate-700'} relative`}>
                            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${vulnerabilityMode ? 'left-4' : 'left-0.5'}`}></div>
                        </div>
                    </button>
                </div>

                {/* Map Layers */}
                <div className="mt-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                            <Layers className="w-3 h-3 mr-1.5" /> Map Layers
                        </div>
                        <button
                            onClick={() => {
                                if (visibleFacilities.length === FACILITY_LAYERS.length) {
                                    setVisibleFacilities?.([]);
                                } else {
                                    setVisibleFacilities?.(FACILITY_LAYERS.map(l => l.key));
                                }
                            }}
                            className="text-[10px] font-semibold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider"
                        >
                            {visibleFacilities.length === FACILITY_LAYERS.length ? 'Hide All' : 'Show All'}
                        </button>
                    </div>
                    <div className="space-y-1">
                        {FACILITY_LAYERS.map(layer => {
                            const isActive = visibleFacilities.includes(layer.key);
                            return (
                                <button
                                    key={layer.key}
                                    onClick={() => {
                                        if (isActive) {
                                            setVisibleFacilities?.(visibleFacilities.filter(f => f !== layer.key));
                                        } else {
                                            setVisibleFacilities?.([...visibleFacilities, layer.key]);
                                        }
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                        }`}
                                >
                                    <span>{layer.icon} {layer.label}</span>
                                    {isActive ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Vitality Summary */}
            <div className="p-6 border-t border-slate-800">
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">City Vitality Score</div>

                <div className="flex items-end justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Accessibility</span>
                    <span className="text-sm font-bold text-white">
                        {avgScore}
                        {impactSummary && impactSummary.zonesImproved > 0 && <span className="text-xs text-emerald-400 font-medium ml-1">+{impactSummary.avgScoreIncrease.toFixed(1)}</span>}
                        <span className="text-slate-500 font-normal">/100</span>
                    </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(avgScore)}`} style={{ width: `${avgScore}%` }}></div>
                </div>
            </div>
        </div>
    );
}
