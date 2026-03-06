'use client';

import { useState, useEffect } from 'react';
import { Grievance, GrievanceDashboardStats, STATUS_LABELS, STATUS_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '@/app/types';
import { Shield, Clock, Timer, CheckCircle2, AlertTriangle, ChevronRight, XCircle, Search, Mail, BarChart3, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell } from 'recharts';

const API = 'http://localhost:8000';

export default function AdminDashboard() {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [stats, setStats] = useState<GrievanceDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'triage'>('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [gRes, sRes] = await Promise.all([
                fetch(`${API}/api/grievances`).then(r => r.json()),
                fetch(`${API}/api/grievances/stats`).then(r => r.json()),
            ]);
            setGrievances(gRes);
            setStats(sRes);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
        setLoading(false);
    };

    const handleAcknowledge = async (id: string) => {
        setProcessing(true);
        try {
            // Note: CPGRAMS format requires officer name and email
            await fetch(`${API}/api/grievances/${id}/acknowledge`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    officer_id: "OFF-001", 
                    officer_name: "Admin User",
                    officer_designation: "System Administrator",
                    notes: "Issue formally acknowledged by government."
                })
            });
            await loadData();
        } catch (e) {
            console.error(e);
        }
        setProcessing(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: string, notes: string = '') => {
        setProcessing(true);
        try {
            await fetch(`${API}/api/grievances/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_status: newStatus, notes, officer_name: "Admin User" })
            });
            await loadData();
        } catch (e) {
            console.error(e);
        }
        setProcessing(false);
    };

    const handleResolve = async (id: string) => {
        const notes = prompt("Enter resolution notes (optional):");
        if (notes === null) return; // cancelled
        
        setProcessing(true);
        try {
            await fetch(`${API}/api/grievances/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_status: 'resolved', notes, officer_name: "Admin User" })
            });
            await loadData();
        } catch (e) {
            console.error(e);
        }
        setProcessing(false);
    };
    
    // Sort so pending issues are at the top
    const sortedGrid = [...grievances].sort((a, b) => {
        if (a.status === 'submitted' && b.status !== 'submitted') return -1;
        if (b.status === 'submitted' && a.status !== 'submitted') return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const filtered = sortedGrid.filter(g => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return g.title.toLowerCase().includes(q) || g.tracking_number.toLowerCase().includes(q) || g.id.toLowerCase().includes(q);
    });

    const selectedGrievance = grievances.find(g => g.id === selectedId);

    const isOverdue = (g: Grievance) => {
        if (['resolved', 'citizen_confirmed', 'closed'].includes(g.status)) return false;
        return g.sla_resolve_deadline && new Date() > new Date(g.sla_resolve_deadline);
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
            {/* Left Sidebar Admin Menu */}
            <div className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center space-x-3 mb-2">
                        <Shield className="w-8 h-8 text-emerald-400" />
                        <div>
                            <h1 className="font-bold text-lg tracking-tight leading-tight">GovPortal</h1>
                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Admin Console</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 space-y-2 flex-1">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center p-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <BarChart3 className="w-4 h-4 mr-3" />
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('triage')}
                        className={`w-full flex items-center p-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'triage' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <AlertTriangle className={`w-4 h-4 mr-3 ${activeTab === 'triage' ? 'text-white' : 'text-orange-400'}`} />
                        Issue Triage
                        {stats && stats.pending_ack > 0 && (
                            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'triage' ? 'bg-white text-indigo-600' : 'bg-red-500 text-white'}`}>{stats.pending_ack}</span>
                        )}
                    </button>
                </div>
                <div className="p-4 border-t border-slate-800">
                    <a href="/" className="w-full flex items-center text-slate-400 hover:text-white p-3 rounded-lg font-medium text-sm transition-colors">
                        Return to Map
                    </a>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{activeTab === 'overview' ? 'Performance Overview' : 'Grievance Management'}</h2>
                        <p className="text-xs text-slate-500 mt-1">{activeTab === 'overview' ? 'High-level metrics and SLA tracking across all wards.' : 'Review, acknowledge, and resolve citizen complaints.'}</p>
                    </div>
                    <div className="flex items-center">
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Search tracking #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none w-64"
                            />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex">
                    {activeTab === 'overview' ? (
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {loading || !stats ? (
                                <div className="text-center text-slate-400 mt-20">Loading metrics...</div>
                            ) : (
                                <div className="max-w-6xl mx-auto space-y-8">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-4 gap-6">
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                                                <AlertTriangle className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium">Total Issues</p>
                                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                                                <Clock className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium">Pending Ack</p>
                                                <p className="text-2xl font-bold text-slate-900">{stats.pending_ack}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium">Resolved</p>
                                                <p className="text-2xl font-bold text-slate-900">{stats.resolved_this_month}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center">
                                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                                                <Timer className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500 font-medium">SLA Compliance</p>
                                                <p className={`text-2xl font-bold ${stats.sla_compliance_rate >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{stats.sla_compliance_rate}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts */}
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-800 mb-6">Issues by Status</h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={Object.entries(stats.by_status).map(([k, v]) => ({ name: STATUS_LABELS[k as keyof typeof STATUS_LABELS] || k, count: v }))}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                        <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-800 mb-6">Issues by Category</h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RePieChart>
                                                        <Pie
                                                            data={Object.entries(stats.by_category).map(([k, v]) => ({ name: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] || k, value: v }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {Object.entries(stats.by_category).map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'][index % 6]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                    </RePieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* List View */}
                            <div className="w-1/2 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="p-8 text-center text-slate-400">Loading issues...</div>
                                ) : filtered.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">No issues found.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {filtered.map(g => (
                                            <button 
                                                key={g.id}
                                                onClick={() => setSelectedId(g.id)}
                                                className={`w-full text-left p-5 hover:bg-slate-50 transition-colors flex items-start ${selectedId === g.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-mono font-bold text-slate-500 tracking-wider">{g.tracking_number}</span>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: STATUS_COLORS[g.status] + '20', color: STATUS_COLORS[g.status] }}>
                                                            {STATUS_LABELS[g.status]}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 text-sm truncate">{g.title}</h3>
                                                    <p className="text-xs text-slate-500 mt-1 truncate">{g.description}</p>
                                                    
                                                    <div className="flex items-center mt-3 text-[10px] text-slate-400 font-medium space-x-3">
                                                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(g.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center font-bold text-slate-600">{CATEGORY_ICONS[g.category]} {CATEGORY_LABELS[g.category]}</span>
                                                        <span>•</span>
                                                        <span className={`px-1.5 py-0.5 rounded ${isOverdue(g) ? 'bg-red-100 text-red-600' : 'bg-slate-100'}`}>
                                                            SLA: {new Date(g.sla_resolve_deadline).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Detail View */}
                            <div className="w-1/2 bg-slate-50 overflow-y-auto custom-scrollbar">
                                {!selectedGrievance ? (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        Select an issue to review
                                    </div>
                                ) : (
                                    <div className="p-8 max-w-2xl mx-auto space-y-6">
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-mono tracking-widest mb-1">{selectedGrievance.tracking_number}</p>
                                                        <h2 className="text-2xl font-bold leading-tight">{selectedGrievance.title}</h2>
                                                    </div>
                                                    <span className="text-xs px-3 py-1 rounded-full font-bold bg-white/10 text-white border border-white/20">
                                                        {STATUS_LABELS[selectedGrievance.status]}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6 space-y-6">
                                                <div>
                                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                                                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg">{selectedGrievance.description}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Citizen Details</h4>
                                                        <p className="text-sm font-medium text-slate-800">{selectedGrievance.citizen_name}</p>
                                                        <p className="text-xs text-slate-500 flex items-center mt-1"><Mail className="w-3 h-3 mr-1" /> {selectedGrievance.citizen_email || 'No email provided'}</p>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Location</h4>
                                                        <p className="text-sm font-medium text-slate-800">{selectedGrievance.location.ward_name}</p>
                                                        <p className="text-xs text-slate-500 mt-1">Zone: Default Zone</p>
                                                    </div>
                                                </div>

                                                {/* Action Panel */}
                                                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 mt-8">
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-4 flex items-center">
                                                        <Shield className="w-4 h-4 mr-2" /> Administrative Actions
                                                    </h4>
                                                    
                                                    {selectedGrievance.status === 'submitted' && (
                                                        <div className="space-y-3">
                                                            <p className="text-xs text-indigo-600 mb-3">This grievance is waiting for official acknowledgement.</p>
                                                            <button 
                                                                onClick={() => handleAcknowledge(selectedGrievance.id)}
                                                                disabled={processing}
                                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
                                                            >
                                                                {processing ? 'Processing...' : 'Acknowledge Issue'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {(selectedGrievance.status === 'acknowledged' || selectedGrievance.status === 'under_review') && (
                                                        <div className="space-y-3">
                                                            <button 
                                                                onClick={() => handleUpdateStatus(selectedGrievance.id, 'in_progress', 'Started fieldwork and repairs.')}
                                                                disabled={processing}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors"
                                                            >
                                                                Mark In Progress
                                                            </button>
                                                            <button 
                                                                onClick={() => handleResolve(selectedGrievance.id)}
                                                                disabled={processing}
                                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg transition-colors"
                                                            >
                                                                Resolve Issue
                                                            </button>
                                                        </div>
                                                    )}

                                                    {selectedGrievance.status === 'in_progress' && (
                                                        <button 
                                                            onClick={() => handleResolve(selectedGrievance.id)}
                                                            disabled={processing}
                                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors"
                                                        >
                                                            Resolve Issue
                                                        </button>
                                                    )}

                                                    {['resolved', 'closed', 'citizen_confirmed'].includes(selectedGrievance.status) && (
                                                        <div className="bg-emerald-100 text-emerald-800 text-sm font-bold p-3 rounded-lg text-center flex items-center justify-center">
                                                            <CheckCircle2 className="w-5 h-5 mr-2" /> Issue is successfully resolved.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
