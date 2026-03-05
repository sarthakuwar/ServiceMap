'use client';

import { useState, useEffect } from 'react';
import {
    AlertTriangle, Clock, CheckCircle2, XCircle, ArrowUpRight,
    Filter, Search, ChevronRight, ThumbsUp, Shield, BarChart3,
    TrendingUp, Users, Timer, Loader2, MapPin
} from 'lucide-react';
import {
    Grievance, GrievanceDashboardStats, GrievanceStatus, GrievanceCategory,
    CATEGORY_LABELS, CATEGORY_ICONS, DEPARTMENT_LABELS, STATUS_LABELS, STATUS_COLORS,
    GovernmentDepartment
} from '@/app/types';
import GrievanceTimeline from './GrievanceTimeline';

interface Props {
    onClose?: () => void;
}

const API = 'http://localhost:8000';

export default function GrievanceDashboard({ onClose }: Props) {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [stats, setStats] = useState<GrievanceDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);

    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterWard, setFilterWard] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

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
            console.error('Failed to load grievances:', err);
        }
        setLoading(false);
    };

    const handleUpvote = async (gid: string) => {
        try {
            await fetch(`${API}/api/grievances/${gid}/upvote`, { method: 'PUT' });
            setGrievances(prev => prev.map(g => g.id === gid ? { ...g, upvotes: (g.upvotes || 0) + 1 } : g));
        } catch { }
    };

    const filtered = grievances.filter(g => {
        if (filterStatus !== 'all' && g.status !== filterStatus) return false;
        if (filterWard !== 'all' && g.location?.ward_name !== filterWard) return false;
        if (filterCategory !== 'all' && g.category !== filterCategory) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return g.title.toLowerCase().includes(q) || g.id.toLowerCase().includes(q) || g.tracking_number?.toLowerCase().includes(q);
        }
        return true;
    });

    const wards = Array.from(new Set(grievances.map(g => g.location?.ward_name).filter(Boolean))) as string[];
    const categories = Array.from(new Set(grievances.map(g => g.category)));

    const getStatusIcon = (status: GrievanceStatus) => {
        switch (status) {
            case 'submitted': return <Clock className="w-3.5 h-3.5" />;
            case 'acknowledged': case 'under_review': return <Shield className="w-3.5 h-3.5" />;
            case 'in_progress': return <Timer className="w-3.5 h-3.5" />;
            case 'resolved': case 'citizen_confirmed': case 'closed': return <CheckCircle2 className="w-3.5 h-3.5" />;
            case 'escalated': return <ArrowUpRight className="w-3.5 h-3.5" />;
            case 'reopened': return <XCircle className="w-3.5 h-3.5" />;
            default: return <Clock className="w-3.5 h-3.5" />;
        }
    };

    const daysAgo = (dateStr: string) => {
        const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
        return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;
    };

    const isOverdue = (g: Grievance) => {
        if (['resolved', 'citizen_confirmed', 'closed'].includes(g.status)) return false;
        return g.sla_resolve_deadline && new Date() > new Date(g.sla_resolve_deadline);
    };

    // Detail view
    if (selectedGrievance) {
        const g = selectedGrievance;
        return (
            <div className="h-full overflow-y-auto bg-white">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 z-10">
                    <div className="flex items-center justify-between">
                        <button onClick={() => setSelectedGrievance(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1">
                            <ChevronRight className="w-3 h-3 rotate-180" /> <span>Back to all grievances</span>
                        </button>
                        <div className="flex items-center space-x-2">
                            <span className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ backgroundColor: STATUS_COLORS[g.status] + '20', color: STATUS_COLORS[g.status] }}>
                                {STATUS_LABELS[g.status]}
                            </span>
                            {isOverdue(g) && <span className="text-[10px] px-2 py-1 rounded-lg font-bold bg-red-100 text-red-600">OVERDUE</span>}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{g.id}</p>
                        <h2 className="text-xl font-bold text-slate-900">{g.title}</h2>
                        <p className="text-sm text-slate-500 mt-2">{g.description}</p>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Category</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">{CATEGORY_ICONS[g.category]} {CATEGORY_LABELS[g.category]}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Department</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">{DEPARTMENT_LABELS[g.department]}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Ward</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">{g.location?.ward_name || 'N/A'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Severity</p>
                            <p className={`text-sm font-semibold mt-1 ${g.severity === 'critical' ? 'text-red-600' : g.severity === 'high' ? 'text-orange-600' : 'text-slate-800'}`}>
                                {g.severity?.toUpperCase()}
                            </p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Filed</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">{new Date(g.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className={`rounded-xl p-3 ${isOverdue(g) ? 'bg-red-50' : 'bg-slate-50'}`}>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">SLA Deadline</p>
                            <p className={`text-sm font-semibold mt-1 ${isOverdue(g) ? 'text-red-600' : 'text-slate-800'}`}>
                                {g.sla_resolve_deadline ? new Date(g.sla_resolve_deadline).toLocaleDateString('en-IN') : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Assigned Officer */}
                    {g.assigned_officer && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-[9px] text-blue-500 uppercase tracking-wider font-bold mb-2">Assigned Officer</p>
                            <p className="text-sm font-bold text-blue-900">{g.assigned_officer.name}</p>
                            <p className="text-xs text-blue-600">{g.assigned_officer.designation} • {DEPARTMENT_LABELS[g.assigned_officer.department]}</p>
                            <p className="text-xs text-blue-500 mt-1">{g.assigned_officer.phone} • {g.assigned_officer.email}</p>
                        </div>
                    )}

                    {/* Resolution */}
                    {g.resolution_notes && (
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <p className="text-[9px] text-emerald-500 uppercase tracking-wider font-bold mb-1">Resolution Notes</p>
                            <p className="text-sm text-emerald-800">{g.resolution_notes}</p>
                            {g.citizen_satisfaction && (
                                <p className="text-xs text-emerald-600 mt-2">Citizen Rating: {'⭐'.repeat(g.citizen_satisfaction)}</p>
                            )}
                        </div>
                    )}

                    {/* Tracking Number */}
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] text-orange-500 uppercase tracking-wider font-bold">Tracking Number</p>
                            <p className="text-lg font-bold text-orange-800 font-mono">{g.tracking_number}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleUpvote(g.id)} className="flex items-center space-x-1 bg-white/80 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                                <ThumbsUp className="w-3.5 h-3.5 text-orange-600" />
                                <span className="text-xs font-bold text-orange-700">{g.upvotes || 0}</span>
                            </button>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Audit Trail</h3>
                        <GrievanceTimeline timeline={g.timeline || []} />
                    </div>
                </div>
            </div>
        );
    }

    // Main dashboard
    return (
        <div className="h-full overflow-y-auto bg-white">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">Civic Grievances</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">CPGRAMS-Compliant Redressal System</p>
                        </div>
                    </div>
                    {loading && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                </div>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="px-6 pt-4">
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { label: 'Total', value: stats.total, icon: BarChart3, color: 'text-slate-700', bg: 'bg-slate-50' },
                            { label: 'Pending', value: stats.pending_ack, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                            { label: 'Active', value: stats.in_progress, icon: Timer, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Resolved', value: stats.resolved_this_month, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
                        ].map(s => (
                            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* SLA Bar */}
                    <div className="mt-3 bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">SLA Compliance</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${stats.sla_compliance_rate >= 80 ? 'bg-emerald-500' : stats.sla_compliance_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${stats.sla_compliance_rate}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{stats.sla_compliance_rate}%</span>
                        </div>
                        <div className="ml-4 pl-4 border-l border-slate-200">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Avg Resolution</p>
                            <p className="text-sm font-bold text-slate-700">{stats.avg_resolution_days} days</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="px-6 py-3 flex items-center space-x-2 border-b border-slate-100">
                <div className="flex-1 relative">
                    <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search by ID or title..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-[11px] text-slate-600 focus:outline-none">
                    <option value="all">All Status</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterWard} onChange={e => setFilterWard(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-[11px] text-slate-600 focus:outline-none">
                    <option value="all">All Wards</option>
                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
            </div>

            {/* Grievance List */}
            <div className="px-6 py-3 space-y-2">
                {filtered.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <p className="text-sm text-slate-400">No grievances found matching your filters.</p>
                    </div>
                )}
                {filtered.map(g => (
                    <button
                        key={g.id}
                        onClick={() => setSelectedGrievance(g)}
                        className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all hover:shadow-md group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-[10px] px-2 py-0.5 rounded-lg font-bold flex items-center space-x-1" style={{ backgroundColor: STATUS_COLORS[g.status] + '15', color: STATUS_COLORS[g.status] }}>
                                        {getStatusIcon(g.status)}
                                        <span>{STATUS_LABELS[g.status]}</span>
                                    </span>
                                    {isOverdue(g) && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold">OVERDUE</span>}
                                    {g.escalation_level > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold">ESC-L{g.escalation_level}</span>}
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 truncate pr-4">{g.title}</h3>
                                <div className="flex items-center space-x-3 mt-1.5">
                                    <span className="text-[10px] text-slate-400">{CATEGORY_ICONS[g.category]} {CATEGORY_LABELS[g.category]}</span>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                        <MapPin className="w-2.5 h-2.5" />
                                        <span>{g.location?.ward_name}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-300">•</span>
                                    <span className="text-[10px] text-slate-400">{daysAgo(g.created_at)}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1 shrink-0">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${g.severity === 'critical' ? 'bg-red-100 text-red-600' : g.severity === 'high' ? 'bg-orange-100 text-orange-600' : g.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {g.severity?.toUpperCase()}
                                </span>
                                <div className="flex items-center space-x-1 text-slate-400">
                                    <ThumbsUp className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">{g.upvotes || 0}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
