'use client';

import { useState, useEffect, useMemo } from 'react';
import { GridCell, ContactEntry, WardHistory } from '@/app/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    X, Activity, Users, Shield, AlertTriangle,
    Phone, MapPin, Clock, TrendingUp, TrendingDown,
    Minus, FileText, Download, ChevronRight
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell as RechartsCell,
    LineChart, Line, CartesianGrid, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface WardDetailPageProps {
    cell: GridCell;
    allCells: GridCell[];
    wardHistory: WardHistory[];
    onClose: () => void;
    onGenerateReport: () => void;
}

const SERVICE_ICONS: Record<string, string> = {
    hospital: '🏥', school: '🏫', bus_stop: '🚌',
    police_station: '🚔', fire_station: '🚒',
};

const SERVICE_LABELS: Record<string, string> = {
    hospital: 'Hospitals & Clinics', school: 'Schools',
    bus_stop: 'Transit Stops', police_station: 'Police Stations',
    fire_station: 'Fire Stations',
};

// Gap thresholds — critical if beyond these distances (km)
const GAP_THRESHOLDS: Record<string, { critical: number; moderate: number; label: string }> = {
    hospital: { critical: 4, moderate: 2, label: 'Hospital' },
    school: { critical: 3, moderate: 1.5, label: 'School' },
    bus_stop: { critical: 2, moderate: 0.8, label: 'Transit Stop' },
    police_station: { critical: 5, moderate: 3, label: 'Police Station' },
    fire_station: { critical: 5, moderate: 3, label: 'Fire Station' },
};

export default function WardDetailPage({ cell, allCells, wardHistory, onClose, onGenerateReport }: WardDetailPageProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'trends'>('overview');
    const [contacts, setContacts] = useState<Record<string, ContactEntry[]> | null>(null);
    const [contactsLoading, setContactsLoading] = useState(false);

    // Fetch contacts
    useEffect(() => {
        if (activeTab === 'services' && !contacts) {
            setContactsLoading(true);
            fetch(`http://localhost:8000/api/contacts/${cell.cell_id}`)
                .then(r => r.json())
                .then(data => { setContacts(data.contacts || null); setContactsLoading(false); })
                .catch(() => { setContacts(null); setContactsLoading(false); });
        }
    }, [activeTab, contacts, cell.cell_id]);

    // Reset on cell change
    useEffect(() => { setContacts(null); setActiveTab('overview'); }, [cell.cell_id]);

    // --- Computed Data ---

    const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : s >= 40 ? 'text-orange-400' : 'text-red-400';
    const getScoreBg = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-yellow-500' : s >= 40 ? 'bg-orange-500' : 'bg-red-500';

    // Gap analysis
    const gaps = useMemo(() => {
        const result: { service: string; label: string; icon: string; distance: number; severity: 'critical' | 'moderate' | 'adequate' }[] = [];
        for (const [svc, threshold] of Object.entries(GAP_THRESHOLDS)) {
            const dist = (cell.service_distances as any)[svc] ?? 999;
            let severity: 'critical' | 'moderate' | 'adequate' = 'adequate';
            if (dist >= threshold.critical) severity = 'critical';
            else if (dist >= threshold.moderate) severity = 'moderate';
            result.push({ service: svc, label: threshold.label, icon: SERVICE_ICONS[svc] || '📍', distance: parseFloat(dist.toFixed(1)), severity });
        }
        return result;
    }, [cell]);

    const criticalGaps = gaps.filter(g => g.severity === 'critical');
    const moderateGaps = gaps.filter(g => g.severity === 'moderate');

    // City average comparison
    const cityAvg = useMemo(() => {
        if (allCells.length === 0) return { score: 0, population: 0 };
        const totalScore = allCells.reduce((s, c) => s + c.accessibility_score, 0);
        const totalPop = allCells.reduce((s, c) => s + c.population_estimate, 0);
        return {
            score: Math.round(totalScore / allCells.length),
            population: Math.round(totalPop / allCells.length),
        };
    }, [allCells]);

    // Ward cells (same ward_name)
    const wardCells = useMemo(() => allCells.filter(c => c.ward_name === cell.ward_name), [allCells, cell.ward_name]);
    const wardAvgScore = wardCells.length > 0 ? Math.round(wardCells.reduce((s, c) => s + c.accessibility_score, 0) / wardCells.length) : cell.accessibility_score;
    const wardTotalPop = wardCells.reduce((s, c) => s + c.population_estimate, 0);

    // Distance chart data
    const distChartData = [
        { name: 'Hospital', dist: parseFloat(cell.service_distances.hospital.toFixed(1)) },
        { name: 'School', dist: parseFloat(cell.service_distances.school.toFixed(1)) },
        { name: 'Transit', dist: parseFloat(cell.service_distances.bus_stop.toFixed(1)) },
        { name: 'Police', dist: parseFloat(cell.service_distances.police_station.toFixed(1)) },
        { name: 'Fire', dist: parseFloat(cell.service_distances.fire_station.toFixed(1)) },
    ].sort((a, b) => a.dist - b.dist);

    // Radar comparison data
    const radarData = [
        {
            subject: 'Healthcare',
            ward: Math.round(100 / (1 + cell.service_distances.hospital)),
            city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.hospital, 0) / Math.max(1, allCells.length)))),
        },
        {
            subject: 'Education',
            ward: Math.round(100 / (1 + cell.service_distances.school)),
            city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.school, 0) / Math.max(1, allCells.length)))),
        },
        {
            subject: 'Transport',
            ward: Math.round(100 / (1 + cell.service_distances.bus_stop)),
            city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.bus_stop, 0) / Math.max(1, allCells.length)))),
        },
        {
            subject: 'Police',
            ward: Math.round(100 / (1 + cell.service_distances.police_station)),
            city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.police_station, 0) / Math.max(1, allCells.length)))),
        },
        {
            subject: 'Fire',
            ward: Math.round(100 / (1 + cell.service_distances.fire_station)),
            city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.fire_station, 0) / Math.max(1, allCells.length)))),
        },
    ];

    // Ward history data
    const thisWardHistory = wardHistory.find(w => w.ward_name === cell.ward_name);
    const trendData = thisWardHistory
        ? Object.entries(thisWardHistory.history).map(([month, score]) => ({ month, score }))
        : [];

    const tabs = [
        { key: 'overview' as const, label: 'Overview' },
        { key: 'services' as const, label: '📞 Services' },
        { key: 'trends' as const, label: '📊 Trends' },
    ];

    return (
        <div className="absolute inset-0 z-[2000] bg-slate-900/98 backdrop-blur-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900">
                <div className="flex items-center space-x-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{cell.ward_name}</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Ward Infrastructure Dossier • Cell {cell.cell_id.substring(0, 8)}...</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className={`text-4xl font-black ${getScoreColor(cell.accessibility_score)}`}>
                            {cell.accessibility_score}
                        </div>
                        <div className="text-xs text-slate-400 leading-tight">
                            Accessibility<br />Score
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-800 w-10 h-10">
                    <X className="w-6 h-6 text-slate-400" />
                </Button>
            </div>

            {/* Ward Planning Summary Banner */}
            <div className="px-8 py-4 bg-slate-800/50 border-b border-slate-800">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-white mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-blue-400" />
                            Ward Planning Summary
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Population</div>
                                <div className="text-lg font-bold text-white">{(wardTotalPop / 1000).toFixed(1)}k</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Ward Avg. Score</div>
                                <div className={`text-lg font-bold ${getScoreColor(wardAvgScore)}`}>{wardAvgScore}/100</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Critical Gaps</div>
                                <div className={`text-lg font-bold ${criticalGaps.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {criticalGaps.length > 0 ? criticalGaps.length + ' found' : 'None'}
                                </div>
                            </div>
                        </div>
                    </div>
                    {criticalGaps.length > 0 && (
                        <div className="bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-3 max-w-xs ml-6">
                            <div className="text-xs font-bold text-red-400 mb-1 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Recommended Intervention
                            </div>
                            <div className="text-sm text-slate-200">
                                Add {criticalGaps[0].label.toLowerCase()} within {GAP_THRESHOLDS[criticalGaps[0].service].critical}km radius
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex px-8 border-b border-slate-800 bg-slate-900">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab.key
                            ? 'text-white border-emerald-500'
                            : 'text-slate-400 border-transparent hover:text-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8">

                {/* ─── TAB 1: OVERVIEW ─── */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 gap-8">

                        {/* Left Column */}
                        <div className="space-y-6">

                            {/* Score Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="bg-slate-800/50 border-slate-700 p-5">
                                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                        <Activity className="w-3 h-3 mr-1" /> Accessibility
                                    </div>
                                    <div className={`text-4xl font-black ${getScoreColor(cell.accessibility_score)}`}>
                                        {cell.accessibility_score}<span className="text-sm text-slate-500 font-normal">/100</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">City avg: {cityAvg.score}</div>
                                </Card>

                                <Card className="bg-slate-800/50 border-slate-700 p-5">
                                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                        <Users className="w-3 h-3 mr-1" /> Population
                                    </div>
                                    <div className="text-4xl font-black text-white">
                                        {(cell.population_estimate / 1000).toFixed(1)}<span className="text-sm text-slate-500 font-normal">k</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">City avg: {(cityAvg.population / 1000).toFixed(1)}k</div>
                                </Card>

                                {cell.vulnerability_index !== undefined && (
                                    <>
                                        <Card className="bg-slate-800/50 border-slate-700 p-5">
                                            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                                <Shield className="w-3 h-3 mr-1" /> Vulnerability
                                            </div>
                                            <div className={`text-4xl font-black ${cell.vulnerability_index > 60 ? 'text-red-400' : cell.vulnerability_index > 40 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                {cell.vulnerability_index}
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                                <div className={`h-1.5 rounded-full ${cell.vulnerability_index > 60 ? 'bg-red-500' : cell.vulnerability_index > 40 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${cell.vulnerability_index}%` }}></div>
                                            </div>
                                        </Card>

                                        <Card className="bg-slate-800/50 border-slate-700 p-5">
                                            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Fairness Score</div>
                                            <div className={`text-4xl font-black ${getScoreColor(cell.fairness_adjusted_score ?? cell.accessibility_score)}`}>
                                                {cell.fairness_adjusted_score ?? cell.accessibility_score}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">Adjusted for socioeconomic factors</div>
                                        </Card>
                                    </>
                                )}
                            </div>

                            {/* Gap Analysis */}
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
                                    Infrastructure Gap Analysis
                                </h3>
                                <div className="space-y-2">
                                    {gaps.map(gap => (
                                        <div key={gap.service} className={`flex items-center justify-between p-3 rounded-lg border ${gap.severity === 'critical' ? 'bg-red-950/30 border-red-500/20' :
                                            gap.severity === 'moderate' ? 'bg-amber-950/20 border-amber-500/20' :
                                                'bg-emerald-950/20 border-emerald-500/20'
                                            }`}>
                                            <div className="flex items-center">
                                                <span className="text-lg mr-3">{gap.icon}</span>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{gap.label}</div>
                                                    <div className="text-xs text-slate-400">{gap.distance} km away</div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${gap.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                                gap.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {gap.severity}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Distance Chart */}
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <h3 className="text-sm font-bold text-white mb-4">Distance to Services (km)</h3>
                                <div className="h-52">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={distChartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={70} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                                cursor={{ fill: 'transparent' }}
                                            />
                                            <Bar dataKey="dist" radius={[0, 4, 4, 0]}>
                                                {distChartData.map((entry, index) => (
                                                    <RechartsCell key={`cell-${index}`} fill={entry.dist > 3 ? '#ef4444' : entry.dist > 1.5 ? '#fbbf24' : '#10b981'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">

                            {/* Ward vs City Radar Comparison */}
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <h3 className="text-sm font-bold text-white mb-4">Ward vs City Average</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                            <PolarRadiusAxis tick={false} axisLine={false} />
                                            <Radar name="This Ward" dataKey="ward" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                                            <Radar name="City Avg" dataKey="city" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} strokeDasharray="4 4" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex items-center justify-center space-x-6 mt-2">
                                    <div className="flex items-center text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5"></div> This Ward
                                    </div>
                                    <div className="flex items-center text-xs text-slate-400">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 mr-1.5"></div> City Average
                                    </div>
                                </div>
                            </Card>

                            {/* Locality Rating */}
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-slate-300 font-medium">Community Rating</span>
                                    <div className="flex space-x-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`text-2xl ${star <= cell.locality_rating ? 'text-yellow-400' : 'text-slate-700'}`}>★</span>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Service Quality */}
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                                    <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                                    Service Quality & Access
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-400 mb-1">Avg. Wait Times</div>
                                        <div className="text-sm font-bold text-slate-200">
                                            {cell.population_estimate > 20000 ? 'High (45m+)' : 'Moderate (15m)'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-400 mb-1">Facility Condition</div>
                                        <div className="text-sm font-bold text-slate-200">
                                            {cell.locality_rating >= 4 ? 'Well Maintained' : cell.locality_rating === 3 ? 'Standard' : 'Needs Repair'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-400 mb-1">Priority Score</div>
                                        <div className="text-sm font-bold text-slate-200">{cell.priority_score}</div>
                                    </div>
                                    <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-400 mb-1">Ward Zones</div>
                                        <div className="text-sm font-bold text-slate-200">{wardCells.length} hexagons</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ─── TAB 2: SERVICES ─── */}
                {activeTab === 'services' && (
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Emergency Banner */}
                        <Card className="bg-red-950/30 border-red-500/20 p-5">
                            <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-red-400">Emergency Numbers</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-2">
                                <div className="text-center bg-red-950/50 rounded-lg py-3">
                                    <div className="text-2xl font-bold text-white">112</div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold">Emergency</div>
                                </div>
                                <div className="text-center bg-red-950/50 rounded-lg py-3">
                                    <div className="text-2xl font-bold text-white">100</div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold">Police</div>
                                </div>
                                <div className="text-center bg-red-950/50 rounded-lg py-3">
                                    <div className="text-2xl font-bold text-white">108</div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold">Ambulance</div>
                                </div>
                            </div>
                        </Card>

                        {contactsLoading && (
                            <div className="flex flex-col items-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                                <p className="text-sm text-slate-400">Querying backend for nearby services...</p>
                            </div>
                        )}

                        {!contactsLoading && contacts && Object.entries(contacts).map(([type, items]) => (
                            <div key={type}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                    <span className="mr-2">{SERVICE_ICONS[type] || '📍'}</span>
                                    {SERVICE_LABELS[type] || type}
                                    <span className="ml-auto text-slate-600">{(items as ContactEntry[]).length} nearest</span>
                                </h4>
                                <div className="space-y-2">
                                    {(items as ContactEntry[]).map((contact: ContactEntry) => (
                                        <Card key={contact.id} className="bg-slate-800/40 border-slate-700/50 p-4 hover:bg-slate-800/70 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-semibold text-white">{contact.display_name}</span>
                                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${contact.distance_km < 1 ? 'bg-emerald-500/20 text-emerald-400' : contact.distance_km < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {contact.distance_km} km
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-xs text-slate-400">
                                                    <MapPin className="w-3 h-3 mr-1.5 text-slate-500 shrink-0" />
                                                    <span className="truncate">{contact.address}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-400">
                                                    <Phone className="w-3 h-3 mr-1.5 text-slate-500 shrink-0" />
                                                    <span className="text-blue-400 font-medium">{contact.phone}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-400">
                                                    <Clock className="w-3 h-3 mr-1.5 text-slate-500 shrink-0" />
                                                    <span>{contact.hours}</span>
                                                    {contact.emergency && (
                                                        <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">24/7 EMERGENCY</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!contactsLoading && !contacts && (
                            <div className="text-center py-12">
                                <p className="text-sm text-slate-400">Backend unavailable. Start the FastAPI server to see local services.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 3: TRENDS & REPORTS ─── */}
                {activeTab === 'trends' && (
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Governance Badge */}
                        {thisWardHistory && (
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">Governance Status</h3>
                                        <p className="text-xs text-slate-400">Based on quarterly accessibility trend analysis</p>
                                    </div>
                                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold ${thisWardHistory.badge === 'Improving' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        thisWardHistory.badge === 'Declining' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {thisWardHistory.badge === 'Improving' ? <TrendingUp className="w-4 h-4" /> :
                                            thisWardHistory.badge === 'Declining' ? <TrendingDown className="w-4 h-4" /> :
                                                <Minus className="w-4 h-4" />}
                                        <span>{thisWardHistory.badge}</span>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Trend Chart */}
                        {trendData.length > 0 && (
                            <Card className="bg-slate-800/50 border-slate-700 p-5">
                                <h3 className="text-sm font-bold text-white mb-4">Accessibility Score Trend</h3>
                                <div className="h-56">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                            />
                                            <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', stroke: '#1e293b', strokeWidth: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )}

                        {!thisWardHistory && (
                            <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
                                <p className="text-slate-400 text-sm">No historical data available for {cell.ward_name}</p>
                            </Card>
                        )}

                        {/* Generate Report */}
                        <Card className="bg-slate-800/50 border-slate-700 p-5">
                            <h3 className="text-sm font-bold text-white mb-3">Policy Report Export</h3>
                            <p className="text-xs text-slate-400 mb-4">
                                Generate a comprehensive PDF report for this ward, including accessibility metrics, gap analysis, and infrastructure recommendations.
                            </p>
                            <Button onClick={onGenerateReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 rounded-xl shadow-lg shadow-blue-900/20">
                                <Download className="mr-2 w-5 h-5" /> Generate Ward Report (PDF)
                            </Button>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
