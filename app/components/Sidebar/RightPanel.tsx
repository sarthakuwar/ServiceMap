'use client';

import { useState, useEffect } from 'react';
import { GridCell, ContactEntry } from '@/app/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Users, Activity, Download, MessageSquare, Send, Phone, MapPin, Clock, AlertTriangle, Shield } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import EmailPromptModal from '../UI/EmailPromptModal';

interface RightPanelProps {
    cell: GridCell | null;
    onClose: () => void;
    onGenerateReport: () => void;
    onViewDetail?: () => void;
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

export default function RightPanel({ cell, onClose, onGenerateReport, onViewDetail }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'contacts'>('overview');
    const [newComment, setNewComment] = useState('');
    const [localComments, setLocalComments] = useState<string[]>([]);
    const [contacts, setContacts] = useState<Record<string, ContactEntry[]> | null>(null);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followerCount, setFollowerCount] = useState<number | null>(null);

    useEffect(() => {
        if (cell && activeTab === 'contacts' && !contacts) {
            setContactsLoading(true);
            fetch(`http://localhost:8000/api/contacts/${cell.cell_id}`)
                .then(r => r.json())
                .then(data => { setContacts(data.contacts || null); setContactsLoading(false); })
                .catch(() => { setContacts(null); setContactsLoading(false); });
        }
    }, [cell, activeTab, contacts]);

    useEffect(() => {
        if (!cell) return;
        setContacts(null);
        setActiveTab('overview');
        
        // Fetch follower count
        fetch(`http://localhost:8000/api/wards/${encodeURIComponent(cell.ward_name)}/followers`)
            .then(r => r.json())
            .then(d => setFollowerCount(d.follower_count))
            .catch(() => {});
    }, [cell?.cell_id, cell?.ward_name]);

    const handleFollow = async (email: string) => {
        if (!cell) return;
        try {
            const res = await fetch(`http://localhost:8000/api/wards/${encodeURIComponent(cell.ward_name)}/follow`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            }).then(r => r.json());
            if (res.follower_count !== undefined) {
                setFollowerCount(res.follower_count);
            }
        } catch { }
    };

    if (!cell) return null;

    const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-500' : 'text-red-500';
    const getScoreBg = (s: number) => s >= 80 ? 'bg-emerald-50 border-emerald-100' : s >= 60 ? 'bg-yellow-50 border-yellow-100' : s >= 40 ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100';
    const getScoreLabel = (s: number) => s >= 80 ? 'text-emerald-700' : s >= 60 ? 'text-yellow-700' : s >= 40 ? 'text-orange-700' : 'text-red-700';

    const distanceData = [
        { name: 'Hospital', icon: '🏥', dist: parseFloat(cell.service_distances.hospital.toFixed(1)) },
        { name: 'School', icon: '🏫', dist: parseFloat(cell.service_distances.school.toFixed(1)) },
        { name: 'Transit', icon: '🚌', dist: parseFloat(cell.service_distances.bus_stop.toFixed(1)) },
        { name: 'Police', icon: '🚔', dist: parseFloat(cell.service_distances.police_station.toFixed(1)) },
        { name: 'Fire', icon: '🚒', dist: parseFloat(cell.service_distances.fire_station.toFixed(1)) },
    ].sort((a, b) => a.dist - b.dist);

    const getBarColor = (dist: number) => dist > 3 ? '#ef4444' : dist > 1.5 ? '#f59e0b' : '#10b981';
    const getBarWidth = (dist: number) => Math.min(100, (dist / 5) * 100);

    return (
        <div className="absolute top-0 right-0 h-full w-[400px] bg-white border-l border-slate-200 flex flex-col z-[2000] shadow-2xl transform transition-transform duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{cell.ward_name}</h2>
                    <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-slate-400 font-medium">Zone: South Bangalore</p>
                        <button onClick={() => setShowFollowModal(true)} className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-full transition-colors flex items-center">
                            <Users className="w-3 h-3 mr-1" /> Follow{followerCount !== null ? ` (${followerCount})` : ''}
                        </button>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-100">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'contacts' ? 'text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    📞 Local Services
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {activeTab === 'overview' && (
                    <>
                        {/* Score Card */}
                        <div className={`${getScoreBg(cell.accessibility_score)} border rounded-2xl p-6 text-center`}>
                            <div className={`text-[10px] font-bold ${getScoreLabel(cell.accessibility_score)} uppercase tracking-widest mb-1`}>Ward Vitality Score</div>
                            <div className={`text-5xl font-extrabold ${getScoreColor(cell.accessibility_score)}`}>
                                {cell.accessibility_score}<span className="text-lg font-normal opacity-60">/100</span>
                            </div>
                            <p className={`text-xs ${getScoreLabel(cell.accessibility_score)} mt-2 font-medium italic`}>
                                {cell.accessibility_score >= 80 ? '"Excellent accessibility, well-served"' :
                                    cell.accessibility_score >= 60 ? '"Moderate accessibility, high density"' :
                                        cell.accessibility_score >= 40 ? '"Below average, needs improvement"' :
                                            '"Critical access deficit"'}
                            </p>
                        </div>

                        {/* Vulnerability Index */}
                        {cell.vulnerability_index !== undefined && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center">
                                        <Shield className="w-4 h-4 mr-2 text-purple-500" />
                                        <span className="text-sm text-slate-700 font-medium">Vulnerability Index</span>
                                    </div>
                                    <span className={`text-lg font-bold ${cell.vulnerability_index > 60 ? 'text-red-500' : cell.vulnerability_index > 40 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                        {cell.vulnerability_index}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${cell.vulnerability_index > 60 ? 'bg-red-500' : cell.vulnerability_index > 40 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${cell.vulnerability_index}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Fairness-adjusted score: <span className="text-slate-600 font-medium">{cell.fairness_adjusted_score ?? cell.accessibility_score}</span>/100
                                </p>
                            </div>
                        )}

                        {/* Distance to Services */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex justify-between items-center">
                                Distance to Services (km)
                                <span className="text-[10px] text-slate-400 font-normal">Goal: &lt; 1km</span>
                            </h4>
                            <div className="space-y-3">
                                {distanceData.map(item => (
                                    <div key={item.name} className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                                            <span>{item.icon} {item.name}</span>
                                            <span>{item.dist} km</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${getBarWidth(item.dist)}%`, backgroundColor: getBarColor(item.dist) }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Community Rating */}
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-800 mb-3">Community Perception</h4>
                            <div className="flex items-center space-x-4">
                                <div className="flex text-yellow-400 space-x-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span key={star} className={`text-xl ${star <= cell.locality_rating ? 'text-yellow-400' : 'text-slate-200'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="text-lg font-bold text-slate-700">{cell.locality_rating}.0<span className="text-xs text-slate-400 ml-1 font-normal">/ 5.0</span></span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                Based on citizen reports from the last 30 days. Primary concern: &quot;Public transport frequency during peak hours&quot;.
                            </p>
                        </div>

                        {/* Community Voices */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                                <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                                Community Voices
                            </h3>

                            <div className="space-y-3 mb-4">
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">JL</div>
                                        <span className="text-xs text-slate-400 font-medium">Resident • 2 days ago</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        {cell.accessibility_score > 60
                                            ? "Transit access here is great, but we could really use a local clinic closer by."
                                            : "We've been requesting a bus stop for months. It takes 45 minutes to walk to the nearest main road."}
                                    </p>
                                </div>

                                {localComments.map((comment, idx) => (
                                    <div key={idx} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">UP</div>
                                            <span className="text-xs text-slate-400 font-medium">Urban Planner • Just now</span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{comment}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Add an observation..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                                    className="bg-slate-900 hover:bg-slate-800 text-white shrink-0"
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
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <div className="flex items-center space-x-2 mb-1">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-bold text-red-600">Emergency Numbers</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="text-center bg-red-100/50 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-red-700">112</div>
                                    <div className="text-[10px] text-red-500 uppercase font-semibold">Emergency</div>
                                </div>
                                <div className="text-center bg-red-100/50 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-red-700">100</div>
                                    <div className="text-[10px] text-red-500 uppercase font-semibold">Police</div>
                                </div>
                                <div className="text-center bg-red-100/50 rounded-lg py-2 px-1">
                                    <div className="text-lg font-bold text-red-700">108</div>
                                    <div className="text-[10px] text-red-500 uppercase font-semibold">Ambulance</div>
                                </div>
                            </div>
                        </div>

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
                                    <span className="ml-auto text-slate-300">{(items as ContactEntry[]).length} nearest</span>
                                </h4>
                                <div className="space-y-2">
                                    {(items as ContactEntry[]).slice(0, 3).map((contact: ContactEntry) => (
                                        <div key={contact.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-slate-100 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-sm font-semibold text-slate-800">{contact.display_name}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${contact.distance_km < 1 ? 'bg-emerald-100 text-emerald-600' : contact.distance_km < 3 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                                                    {contact.distance_km} km
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <MapPin className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                                                    <span className="truncate">{contact.address}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                                                    <span className="text-blue-600 font-medium">{contact.phone}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-slate-500">
                                                    <Clock className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                                                    <span>{contact.hours}</span>
                                                    {contact.emergency && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">24/7 EMERGENCY</span>}
                                                </div>
                                            </div>
                                        </div>
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
            <div className="p-6 border-t border-slate-100 bg-white space-y-3">
                {onViewDetail && (
                    <Button onClick={onViewDetail} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-xl shadow-lg transition-colors">
                        View Full Details →
                    </Button>
                )}
                <Button onClick={onGenerateReport} variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-5 rounded-xl">
                    <Download className="mr-2 w-5 h-5" /> Generate Ward Report
                </Button>
            </div>

            <EmailPromptModal
                isOpen={showFollowModal}
                onClose={() => setShowFollowModal(false)}
                onSubmit={handleFollow}
                title={`Follow ${cell.ward_name}`}
                description="Get email notifications about infrastructure updates and government announcements in this ward."
                entityName="this ward"
            />
        </div>
    );
}
