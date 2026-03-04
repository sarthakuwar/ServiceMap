'use client';

import { useState, useEffect } from 'react';
import { GridCell, ContactEntry } from '@/app/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Users, Activity, Download, MessageSquare, Send, Phone, MapPin, Clock, AlertTriangle, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface RightPanelProps {
    cell: GridCell | null;
    onClose: () => void;
    onGenerateReport: () => void;
    onViewDetail?: () => void;
}

const SERVICE_ICONS: Record<string, string> = {
    hospital: '🏥',
    school: '🏫',
    bus_stop: '🚌',
    police_station: '🚔',
    fire_station: '🚒',
};

const SERVICE_LABELS: Record<string, string> = {
    hospital: 'Hospitals & Clinics',
    school: 'Schools',
    bus_stop: 'Transit Stops',
    police_station: 'Police Stations',
    fire_station: 'Fire Stations',
};

export default function RightPanel({ cell, onClose, onGenerateReport, onViewDetail }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'contacts'>('overview');
    const [newComment, setNewComment] = useState('');
    const [localComments, setLocalComments] = useState<string[]>([]);
    const [contacts, setContacts] = useState<Record<string, ContactEntry[]> | null>(null);
    const [contactsLoading, setContactsLoading] = useState(false);

    // Fetch contacts when cell changes and contacts tab is opened
    useEffect(() => {
        if (cell && activeTab === 'contacts' && !contacts) {
            setContactsLoading(true);
            fetch(`http://localhost:8000/api/contacts/${cell.cell_id}`)
                .then(r => r.json())
                .then(data => {
                    setContacts(data.contacts || null);
                    setContactsLoading(false);
                })
                .catch(() => {
                    setContacts(null);
                    setContactsLoading(false);
                });
        }
    }, [cell, activeTab, contacts]);

    // Reset contacts when cell changes
    useEffect(() => {
        setContacts(null);
        setActiveTab('overview');
    }, [cell?.cell_id]);

    if (!cell) return null;

    const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : s >= 40 ? 'text-orange-400' : 'text-red-400';

    const chartData = [
        { name: 'Hospital', dist: parseFloat(cell.service_distances.hospital.toFixed(1)), time: Math.round(cell.service_distances.hospital * 12) },
        { name: 'School', dist: parseFloat(cell.service_distances.school.toFixed(1)), time: Math.round(cell.service_distances.school * 12) },
        { name: 'Transit', dist: parseFloat(cell.service_distances.bus_stop.toFixed(1)), time: Math.round(cell.service_distances.bus_stop * 12) },
        { name: 'Police', dist: parseFloat(cell.service_distances.police_station.toFixed(1)), time: Math.round(cell.service_distances.police_station * 12) },
        { name: 'Fire', dist: parseFloat(cell.service_distances.fire_station.toFixed(1)), time: Math.round(cell.service_distances.fire_station * 12) },
    ].sort((a, b) => a.dist - b.dist);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="font-semibold text-slate-200 mb-2">{label}</p>
                    <p className="text-xs text-slate-400 mb-1">Distance: <span className="text-white font-medium text-sm">{data.dist} km</span></p>
                    <p className="text-xs text-slate-400">Est. Travel: <span className="text-emerald-400 font-medium text-sm">~{data.time} mins</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="absolute top-0 right-0 h-full w-[400px] bg-slate-900 border-l border-slate-800 flex flex-col z-[2000] shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)] transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-white">{cell.ward_name}</h2>
                    <p className="text-sm text-slate-400">Cell ID: {cell.cell_id.substring(0, 8)}...</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-800">
                    <X className="w-5 h-5 text-slate-400" />
                </Button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'contacts' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    📞 Local Services
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {activeTab === 'overview' && (
                    <>
                        {/* Core Metrics */}
                        <div className="flex space-x-4">
                            <Card className="flex-1 bg-slate-800/50 border-slate-700 p-4">
                                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                    <Activity className="w-3 h-3 mr-1" /> Access
                                </div>
                                <div className={`text-3xl font-bold ${getScoreColor(cell.accessibility_score)}`}>
                                    {cell.accessibility_score}<span className="text-sm text-slate-500 font-normal">/100</span>
                                </div>
                            </Card>

                            <Card className="flex-1 bg-slate-800/50 border-slate-700 p-4">
                                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 flex items-center">
                                    <Users className="w-3 h-3 mr-1" /> Population
                                </div>
                                <div className="text-3xl font-bold text-white">
                                    {(cell.population_estimate / 1000).toFixed(1)}k
                                </div>
                            </Card>
                        </div>

                        {/* Vulnerability Index (if available) */}
                        {cell.vulnerability_index !== undefined && (
                            <Card className="bg-slate-800/50 border-slate-700 p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2 text-purple-400" />
                                        <span className="text-sm text-slate-300 font-medium">Vulnerability Index</span>
                                    </div>
                                    <span className={`text-lg font-bold ${cell.vulnerability_index > 60 ? 'text-red-400' : cell.vulnerability_index > 40 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                        {cell.vulnerability_index}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${cell.vulnerability_index > 60 ? 'bg-red-500' : cell.vulnerability_index > 40 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${cell.vulnerability_index}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Fairness-adjusted score: <span className="text-slate-300 font-medium">{cell.fairness_adjusted_score ?? cell.accessibility_score}</span>/100
                                </p>
                            </Card>
                        )}

                        {/* Locality Rating */}
                        <Card className="bg-slate-800/50 border-slate-700 p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300 font-medium">Community Rating</span>
                                <div className="flex space-x-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className={`text-xl ${star <= cell.locality_rating ? 'text-yellow-400' : 'text-slate-700'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Distance to Daily Needs Chart */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Distance to Services (km)</h3>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={70} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="dist" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.dist > 3 ? '#ef4444' : entry.dist > 1.5 ? '#fbbf24' : '#10b981'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Service Quality Context */}
                        <div className="pt-4 border-t border-slate-800">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                                <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                                Service Quality & Access
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-4">
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
                            </div>
                        </div>

                        {/* Community Voices */}
                        <div className="pt-4 border-t border-slate-800">
                            <h3 className="text-sm font-semibold text-white mb-4 flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2 text-blue-400" />
                                Community Voices
                            </h3>

                            <div className="space-y-4 mb-4">
                                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">JL</div>
                                        <span className="text-xs text-slate-400 font-medium">Resident • 2 days ago</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        {cell.accessibility_score > 60
                                            ? "Transit access here is great, but we could really use a local clinic closer by."
                                            : "We've been requesting a bus stop for months. It takes 45 minutes to walk to the nearest main road."}
                                    </p>
                                </div>

                                {localComments.map((comment, idx) => (
                                    <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-blue-900/30">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white">UP</div>
                                            <span className="text-xs text-slate-400 font-medium">Urban Planner • Just now</span>
                                        </div>
                                        <p className="text-sm text-slate-200 leading-relaxed">{comment}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add an observation..."
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newComment.trim()) {
                                            setLocalComments([...localComments, newComment.trim()]);
                                            setNewComment('');
                                        }
                                    }}
                                />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                    onClick={() => {
                                        if (newComment.trim()) {
                                            setLocalComments([...localComments, newComment.trim()]);
                                            setNewComment('');
                                        }
                                    }}
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'contacts' && (
                    <div className="space-y-6">
                        {/* Emergency Banner */}
                        <Card className="bg-red-950/30 border-red-500/20 p-4">
                            <div className="flex items-center space-x-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold text-red-400">Emergency Numbers</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="text-center bg-red-950/50 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-white">112</div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold">Emergency</div>
                                </div>
                                <div className="text-center bg-red-950/50 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-white">100</div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold">Police</div>
                                </div>
                                <div className="text-center bg-red-950/50 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-white">108</div>
                                    <div className="text-[10px] text-red-400 uppercase font-semibold">Ambulance</div>
                                </div>
                            </div>
                        </Card>

                        {contactsLoading && (
                            <div className="flex flex-col items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-3"></div>
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
                                    {(items as ContactEntry[]).slice(0, 3).map((contact: ContactEntry) => (
                                        <Card key={contact.id} className="bg-slate-800/40 border-slate-700/50 p-3 hover:bg-slate-800/70 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-semibold text-white">{contact.display_name}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${contact.distance_km < 1 ? 'bg-emerald-500/20 text-emerald-400' : contact.distance_km < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
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
                                                    {contact.emergency && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">24/7 EMERGENCY</span>}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {!contactsLoading && !contacts && (
                            <div className="text-center py-8">
                                <p className="text-sm text-slate-400">Backend unavailable. Start the FastAPI server to see local contacts.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-900 space-y-3">
                {onViewDetail && (
                    <Button onClick={onViewDetail} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-900/20">
                        View Full Details →
                    </Button>
                )}
                <Button onClick={onGenerateReport} variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold py-5 rounded-xl">
                    <Download className="mr-2 w-5 h-5" /> Generate Ward Report
                </Button>
            </div>
        </div>
    );
}
