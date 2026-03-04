import { Button } from '@/components/ui/button';
import { Map, Activity, BarChart3, Shield, Layers, Eye, EyeOff } from 'lucide-react';
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
    { key: 'hospital', label: 'Healthcare Facilities', icon: '🏥', color: 'text-red-500' },
    { key: 'school', label: 'Educational Centers', icon: '🏫', color: 'text-blue-500' },
    { key: 'bus_stop', label: 'Transit Hubs', icon: '🚌', color: 'text-emerald-500' },
    { key: 'police_station', label: 'Police Stations', icon: '🚔', color: 'text-indigo-500' },
    { key: 'fire_station', label: 'Fire Stations', icon: '🚒', color: 'text-orange-500' },
];

export default function LeftSidebar({ activeView, setActiveView, avgScore = 0, impactSummary, vulnerabilityMode = false, setVulnerabilityMode, visibleFacilities = [], setVisibleFacilities }: LeftSidebarProps) {
    const getScoreColor = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-yellow-500' : s >= 40 ? 'bg-orange-500' : 'bg-red-500';
    const getScoreTextColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-500' : 'text-red-500';

    return (
        <div className="w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-lg z-[50]">
            {/* Brand */}
            <div className="p-6 pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        UP
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 tracking-tight">Urban Planner</h1>
                        <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Gov. Dashboard</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
                {/* Spatial Index Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Spatial Index</span>
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 cursor-help"></span>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-white text-slate-700 border-slate-200 w-64 p-3 shadow-xl">
                                    <p className="text-xs font-semibold mb-1 text-slate-900">Why Hexagons?</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        We use Uber's H3 Hexagonal Grid to divide the city uniformly. This eliminates size bias common in irregular ward boundaries, ensuring fair and accurate geospatial density analysis.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <p className="text-sm font-bold text-slate-800">Bangalore H3 Grid</p>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Resolution Level: 8</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                    <Button
                        variant={activeView === 'map' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start rounded-lg ${activeView === 'map' ? 'bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        onClick={() => setActiveView('map')}
                    >
                        <Map className="mr-3 w-4 h-4" /> Explore Map
                    </Button>

                    <Button
                        variant={activeView === 'sim' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start rounded-lg ${activeView === 'sim' ? 'bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        onClick={() => setActiveView('sim')}
                    >
                        <Activity className="mr-3 w-4 h-4" /> Simulations
                    </Button>

                    <Button
                        variant={activeView === 'rank' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start rounded-lg ${activeView === 'rank' ? 'bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        onClick={() => setActiveView('rank')}
                    >
                        <BarChart3 className="mr-3 w-4 h-4" /> Leaderboard
                    </Button>
                </nav>

                {/* Vulnerability Toggle */}
                <div className="pt-3">
                    <button
                        onClick={() => setVulnerabilityMode?.(!vulnerabilityMode)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-sm font-medium ${vulnerabilityMode
                            ? 'bg-purple-50 text-purple-900 border border-purple-200'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${vulnerabilityMode ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <Shield className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-sm">Vulnerability Index</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors relative ${vulnerabilityMode ? 'bg-purple-300' : 'bg-slate-300'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${vulnerabilityMode ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                    </button>
                </div>

                {/* Map Layers */}
                <div className="pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Map Layers</h4>
                        <button
                            onClick={() => {
                                if (visibleFacilities.length === FACILITY_LAYERS.length) {
                                    setVisibleFacilities?.([]);
                                } else {
                                    setVisibleFacilities?.(FACILITY_LAYERS.map(l => l.key));
                                }
                            }}
                            className="text-[10px] font-semibold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-wider"
                        >
                            {visibleFacilities.length === FACILITY_LAYERS.length ? 'Hide All' : 'Show All'}
                        </button>
                    </div>
                    <div className="space-y-0.5">
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
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${isActive
                                        ? 'bg-slate-50 text-slate-800'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-base">{layer.icon}</span>
                                        <span>{layer.label}</span>
                                    </div>
                                    {isActive ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Vitality Summary */}
            <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex items-end justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">City Vitality</span>
                    <span className={`text-2xl font-bold ${getScoreTextColor(avgScore)}`}>
                        {avgScore}
                        {impactSummary && impactSummary.zonesImproved > 0 && <span className="text-xs text-emerald-500 font-medium ml-1">+{impactSummary.avgScoreIncrease.toFixed(1)}</span>}
                        <span className="text-sm text-slate-400 font-normal">/100</span>
                    </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${getScoreColor(avgScore)}`} style={{ width: `${avgScore}%` }}></div>
                </div>
            </div>
        </div>
    );
}
