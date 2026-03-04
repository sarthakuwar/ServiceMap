'use client';

import { useState, useEffect } from 'react';
import { GridCell, WardHistory, ContactEntry } from '@/app/types';
import { X, Users, Activity, Download, Shield, TrendingUp, Phone, MapPin, Clock, AlertTriangle, Droplets, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, CartesianGrid } from 'recharts';

interface WardDetailPageProps {
    cell: GridCell;
    allCells: GridCell[];
    wardHistory: WardHistory[];
    onClose: () => void;
    onGenerateReport: () => void;
}

const SERVICE_ICONS: Record<string, string> = {
    hospital: '🏥', school: '🏫', bus_stop: '🚌', police_station: '🚔', fire_station: '🚒',
};

const SERVICE_LABELS: Record<string, string> = {
    hospital: 'Hospitals & Clinics', school: 'Schools', bus_stop: 'Transit Stops',
    police_station: 'Police Stations', fire_station: 'Fire Stations',
};

const GAP_THRESHOLDS: Record<string, { critical: number; moderate: number }> = {
    hospital: { critical: 4, moderate: 2 },
    school: { critical: 3, moderate: 1.5 },
    bus_stop: { critical: 2, moderate: 0.8 },
    police_station: { critical: 5, moderate: 3 },
    fire_station: { critical: 5, moderate: 3 },
};

export default function WardDetailPage({ cell, allCells, wardHistory, onClose, onGenerateReport }: WardDetailPageProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'trends'>('overview');
    const [contacts, setContacts] = useState<Record<string, ContactEntry[]> | null>(null);
    const [contactsLoading, setContactsLoading] = useState(false);

    const cityAvg = allCells.length > 0 ? Math.round(allCells.reduce((sum, c) => sum + c.accessibility_score, 0) / allCells.length) : 0;
    const wardCells = allCells.filter(c => c.ward_name === cell.ward_name);
    const wardAvg = wardCells.length > 0 ? Math.round(wardCells.reduce((s, c) => s + c.accessibility_score, 0) / wardCells.length) : cell.accessibility_score;
    const wardPop = wardCells.reduce((s, c) => s + c.population_estimate, 0);
    const wardHistory_ = wardHistory.find(w => w.ward_name === cell.ward_name);

    useEffect(() => {
        if (activeTab === 'services' && !contacts) {
            setContactsLoading(true);
            fetch(`http://localhost:8000/api/contacts/${cell.cell_id}`)
                .then(r => r.json())
                .then(d => { setContacts(d.contacts || null); setContactsLoading(false); })
                .catch(() => { setContacts(null); setContactsLoading(false); });
        }
    }, [activeTab, cell.cell_id, contacts]);

    const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-500' : 'text-red-500';
    const getBarColor = (dist: number) => dist > 3 ? '#ef4444' : dist > 1.5 ? '#f59e0b' : '#10b981';
    const getBarWidth = (dist: number) => Math.min(100, (dist / 5) * 100);

    const distanceData = [
        { name: 'Hospital', icon: '🏥', dist: parseFloat(cell.service_distances.hospital.toFixed(1)) },
        { name: 'School', icon: '🏫', dist: parseFloat(cell.service_distances.school.toFixed(1)) },
        { name: 'Transit', icon: '🚌', dist: parseFloat(cell.service_distances.bus_stop.toFixed(1)) },
        { name: 'Police', icon: '🚔', dist: parseFloat(cell.service_distances.police_station.toFixed(1)) },
        { name: 'Fire', icon: '🚒', dist: parseFloat(cell.service_distances.fire_station.toFixed(1)) },
    ].sort((a, b) => a.dist - b.dist);

    const radarData = [
        { subject: 'Healthcare', ward: Math.round(100 / (1 + cell.service_distances.hospital)), city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.hospital, 0) / allCells.length))) },
        { subject: 'Education', ward: Math.round(100 / (1 + cell.service_distances.school)), city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.school, 0) / allCells.length))) },
        { subject: 'Transport', ward: Math.round(100 / (1 + cell.service_distances.bus_stop)), city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.bus_stop, 0) / allCells.length))) },
        { subject: 'Police', ward: Math.round(100 / (1 + cell.service_distances.police_station)), city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.police_station, 0) / allCells.length))) },
        { subject: 'Fire Safety', ward: Math.round(100 / (1 + cell.service_distances.fire_station)), city: Math.round(100 / (1 + (allCells.reduce((s, c) => s + c.service_distances.fire_station, 0) / allCells.length))) },
    ];

    const gapAnalysis = Object.entries(cell.service_distances).map(([key, dist]) => {
        const thresh = GAP_THRESHOLDS[key];
        if (!thresh) return null;
        return {
            service: key,
            distance: dist,
            severity: dist >= thresh.critical ? 'Critical' : dist >= thresh.moderate ? 'Moderate' : 'Adequate'
        };
    }).filter(Boolean);

    const criticalGaps = gapAnalysis.filter(g => g?.severity === 'Critical').length;

    return (
        <div className="absolute inset-0 z-[3000] bg-white/98 backdrop-blur-lg overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-200 z-10">
                <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div>
                            <div className="flex items-center space-x-2 text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                                <span>ServiceMap</span>
                                <span>›</span>
                                <span>Wards</span>
                                <span>›</span>
                                <span>Analytics</span>
                                <span>›</span>
                                <span>Reports</span>
                            </div>
                            <h1 className="text-2xl font-bold text-slate-900">{cell.ward_name}</h1>
                            <p className="text-xs text-slate-400">Cell ID: {cell.cell_id.substring(0, 12)}... • Ward {cell.ward_id}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs font-bold px-4">
                            <ExternalLink className="w-3 h-3 mr-1.5" /> Export Dossier
                        </Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4">
                            Follow Ward
                        </Button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors ml-2">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-6">
                {/* Top Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Accessibility Score</div>
                        <div className={`text-3xl font-extrabold ${getScoreColor(cell.accessibility_score)}`}>
                            {cell.accessibility_score}<span className="text-sm font-normal text-slate-300">/100</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">↑ {Math.abs(cell.accessibility_score - cityAvg)} vs city avg ({cityAvg})</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Population Density</div>
                        <div className="text-3xl font-extrabold text-slate-800">
                            {(wardPop / 1000).toFixed(1)}k<span className="text-sm font-normal text-slate-300">/area</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">High Density Area</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Civic Issues Resolved</div>
                        <div className="text-3xl font-extrabold text-emerald-600">92%</div>
                        <p className="text-xs text-slate-400 mt-1">Top 10% in City</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Service Coverage</div>
                        <div className="text-3xl font-extrabold text-blue-600">
                            {cell.locality_rating}.{Math.floor(Math.random() * 5)}<span className="text-sm font-normal text-slate-300">/10</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">👁 Avg. Public Health</p>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="flex space-x-0 border-b border-slate-200 mb-8">
                    {['overview', 'services', 'trends'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${activeTab === tab
                                ? 'border-orange-500 text-slate-900'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab === 'services' ? '📞 Services' : tab === 'trends' ? '📊 Trends' : '⬡ Overview'}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Distance Chart */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-4">Average Distance to Services</h3>
                                <div className="space-y-4">
                                    {distanceData.map(item => (
                                        <div key={item.name} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium text-slate-600">
                                                <span>{item.icon} {item.name}</span>
                                                <span className="font-bold">{item.dist} km</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${getBarWidth(item.dist)}%`, backgroundColor: getBarColor(item.dist) }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Utility Data */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Droplets className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-600">Water Continuity</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">18.5 <span className="text-sm font-normal text-slate-400">hrs</span></div>
                                    <p className="text-[10px] text-slate-400 mt-1">Average daily supply period in 4 main sectors.</p>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Trash2 className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs font-bold text-slate-600">Waste Collection</span>
                                    </div>
                                    <div className="text-2xl font-bold text-slate-800">94<span className="text-sm font-normal text-slate-400">%</span></div>
                                    <p className="text-[10px] text-slate-400 mt-1">Door-to-door collection efficiency in the last 30 days.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Radar Chart */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-slate-900">Ward Comparison</h3>
                                    <div className="flex items-center space-x-3 text-[10px]">
                                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-orange-500 mr-1"></span>Ward</span>
                                        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-300 mr-1"></span>City Avg</span>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={radarData} outerRadius="75%">
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar name="This Ward" dataKey="ward" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
                                        <Radar name="City Average" dataKey="city" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.05} strokeWidth={2} strokeDasharray="4 4" />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Citizen Feedback */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-4">Citizen Feedback</h3>
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">VR</div>
                                        <div>
                                            <p className="text-xs text-slate-600">"The last 2 km road was a great addition, but needs more streetlights."</p>
                                            <span className="text-[10px] text-slate-300">2 days ago</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600 shrink-0">PB</div>
                                        <div>
                                            <p className="text-xs text-slate-600">"Bus accessibility for senior citizens near the main road needs urgent improvement."</p>
                                            <span className="text-[10px] text-slate-300">1 week ago</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-xs text-blue-600 font-medium mt-3 hover:underline">View All 1,248 Ratings</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Services Tab */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-bold text-red-600">Emergency Numbers</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="text-center bg-red-100/50 rounded-lg py-2">
                                    <div className="text-lg font-bold text-red-700">112</div>
                                    <div className="text-[10px] text-red-500 uppercase font-semibold">Emergency</div>
                                </div>
                                <div className="text-center bg-red-100/50 rounded-lg py-2">
                                    <div className="text-lg font-bold text-red-700">100</div>
                                    <div className="text-[10px] text-red-500 uppercase font-semibold">Police</div>
                                </div>
                                <div className="text-center bg-red-100/50 rounded-lg py-2">
                                    <div className="text-lg font-bold text-red-700">108</div>
                                    <div className="text-[10px] text-red-500 uppercase font-semibold">Ambulance</div>
                                </div>
                            </div>
                        </div>

                        {contactsLoading && (
                            <div className="flex flex-col items-center py-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-3"></div>
                                <p className="text-sm text-slate-400">Loading local services...</p>
                            </div>
                        )}

                        {!contactsLoading && contacts && Object.entries(contacts).map(([type, items]) => (
                            <div key={type}>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                                    <span className="mr-2">{SERVICE_ICONS[type] || '📍'}</span>
                                    {SERVICE_LABELS[type] || type}
                                    <span className="ml-auto text-slate-300">{(items as ContactEntry[]).length} nearest</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {(items as ContactEntry[]).map((c: ContactEntry) => (
                                        <div key={c.id} className="bg-white border border-slate-100 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-semibold text-slate-800">{c.display_name}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.distance_km < 1 ? 'bg-emerald-100 text-emerald-600' : c.distance_km < 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                                    {c.distance_km} km
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-xs text-slate-500"><MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" /><span className="truncate">{c.address}</span></div>
                                                <div className="flex items-center text-xs text-slate-500"><Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" /><span className="text-blue-600 font-medium">{c.phone}</span></div>
                                                <div className="flex items-center text-xs text-slate-500"><Clock className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />{c.hours} {c.emergency && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">24/7</span>}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!contactsLoading && !contacts && (
                            <div className="text-center py-16">
                                <p className="text-sm text-slate-400">Backend unavailable. Start the FastAPI server to see local contacts.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Trends Tab */}
                {activeTab === 'trends' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            {/* Active Projects */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-4">Active Projects</h3>
                                <div className="space-y-3">
                                    {[
                                        { name: 'Smart Street Lighting', progress: 86, color: 'bg-blue-500' },
                                        { name: 'Stormwater Drain Repair', progress: 62, color: 'bg-orange-500' },
                                        { name: 'New Community PHC', progress: 34, color: 'bg-emerald-500' },
                                    ].map((project, idx) => (
                                        <div key={idx} className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-700 w-40 truncate">{project.name}</span>
                                            <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full">
                                                <div className={`h-full rounded-full ${project.color}`} style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-500">{project.progress}%</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Governance Status */}
                                <div className={`mt-6 p-4 rounded-xl ${wardHistory_?.badge === 'Improving' ? 'bg-emerald-50 border border-emerald-200' : wardHistory_?.badge === 'Declining' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Governance Status</div>
                                    <div className={`text-lg font-bold ${wardHistory_?.badge === 'Improving' ? 'text-emerald-700' : wardHistory_?.badge === 'Declining' ? 'text-red-700' : 'text-blue-700'}`}>
                                        {wardHistory_?.badge === 'Improving' ? 'Highly Transparent' : wardHistory_?.badge === 'Declining' ? 'Needs Improvement' : 'Stable'}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Meeting 9/10 compliance standards for public data sharing.</p>
                                </div>
                            </div>

                            {/* Line Chart */}
                            <div className="bg-white border border-slate-200 rounded-xl p-6">
                                <h3 className="text-sm font-bold text-slate-900 mb-4">Service Index Trend</h3>
                                {wardHistory_ && (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <LineChart data={Object.entries(wardHistory_.history).map(([m, s]) => ({ month: m, score: s }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: '#ffffff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '0.75rem',
                                                    fontSize: '12px',
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                                                }}
                                            />
                                            <Line type="monotone" dataKey="score" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', strokeWidth: 2, r: 5, stroke: '#fff' }} activeDot={{ r: 7 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                                {!wardHistory_ && <p className="text-sm text-slate-400 py-12 text-center">No historical data available.</p>}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Button onClick={onGenerateReport} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 px-8 rounded-xl shadow-lg">
                                <Download className="mr-2 w-5 h-5" /> Generate Ward Report (PDF)
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 mt-8 py-4 text-center text-xs text-slate-400">
                © 2024 ServiceMap Division • Data updated October 24, 2023 &nbsp;&nbsp;|&nbsp;&nbsp; Data Source &nbsp;&nbsp; Terms of Governance &nbsp;&nbsp; Privacy
            </div>
        </div>
    );
}
