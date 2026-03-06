'use client';

import { useState } from 'react';
import { SimulationAnalysis, AffectedWard, Grievance } from '@/app/types';
import { computeServiceDistanceComparison, ServiceDistanceComparison } from '@/app/utils/simulationAnalysis';
import { X, ChevronDown, ChevronUp, Download, TrendingUp, Shield, Users, MapPin, Target, AlertTriangle, Lightbulb, FileText, ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimulationAnalysisPanelProps {
    analysis: SimulationAnalysis;
    facilityTypes: string[];
    onClose: () => void;
    onExportPDF?: () => void;
    matchedGrievances?: Grievance[];
}

const FACILITY_EMOJI: Record<string, string> = {
    hospital: '🏥', school: '🏫', bus_stop: '🚌',
    police_station: '🚔', fire_station: '🚒',
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={6} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={6}
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute text-center">
                <div className="text-lg font-extrabold" style={{ color }}>{score}</div>
                <div className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">/ 100</div>
            </div>
        </div>
    );
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: {
    title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left">
                <div className="flex items-center space-x-2.5">
                    {icon}
                    <span className="text-sm font-bold text-slate-700">{title}</span>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && <div className="px-5 py-4 border-t border-slate-100">{children}</div>}
        </div>
    );
}

function CoverageBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-600 w-24 shrink-0">{label}</span>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.min(100, Math.max(2, Math.abs(value) * 2))}%`, backgroundColor: color }} />
            </div>
            <span className={`text-xs font-bold w-14 text-right ${value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {value > 0 ? '+' : ''}{value}%
            </span>
        </div>
    );
}

export default function SimulationAnalysisPanel({
    analysis, facilityTypes, onClose, onExportPDF, matchedGrievances
}: SimulationAnalysisPanelProps) {
    const {
        populationAffected, zonesImproved, avgScoreIncrease,
        coverageImprovements, vulnerabilityReduction, affectedWards,
        impactScore, insightNarrative, recommendation, matchedGrievanceCount,
    } = analysis;

    const popStr = populationAffected >= 1000 ? `${(populationAffected / 1000).toFixed(1)}k` : `${populationAffected}`;
    const facilityIcons = facilityTypes.map(t => FACILITY_EMOJI[t] || '📍').join(' ');

    const beforeAvg = analysis.beforeCells.length > 0
        ? Math.round(analysis.beforeCells.reduce((s, c) => s + c.accessibility_score, 0) / analysis.beforeCells.length) : 0;
    const afterAvg = analysis.afterCells.length > 0
        ? Math.round(analysis.afterCells.reduce((s, c) => s + c.accessibility_score, 0) / analysis.afterCells.length) : 0;

    // Compute per-service distance comparison
    const serviceComparison = computeServiceDistanceComparison(analysis.beforeCells, analysis.afterCells);

    // Compute gap closure (how much of the gap to ideal score=80 does this close?)
    const idealScore = 80;
    const currentGap = Math.max(0, idealScore - beforeAvg);
    const gapClosed = currentGap > 0 ? Math.round(((afterAvg - beforeAvg) / currentGap) * 100) : 0;

    // Actual state metrics
    const actualDeserts = analysis.beforeCells.filter(c => c.accessibility_score < 40 && c.population_estimate > 10000).length;
    const simDeserts = analysis.afterCells.filter(c => c.accessibility_score < 40 && c.population_estimate > 10000).length;
    const actualUnderservedPop = analysis.beforeCells.filter(c => c.accessibility_score < 40).reduce((s, c) => s + c.population_estimate, 0);
    const simUnderservedPop = analysis.afterCells.filter(c => c.accessibility_score < 40).reduce((s, c) => s + c.population_estimate, 0);

    return (
        <div className="fixed inset-0 z-[3500] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-lg shadow-lg shadow-orange-200">
                            {facilityIcons}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Simulation Analysis</h2>
                            <p className="text-xs text-slate-400">{facilityTypes.length} placement{facilityTypes.length > 1 ? 's' : ''} • {zonesImproved} zone{zonesImproved !== 1 ? 's' : ''} improved</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <div className="px-6 py-5 space-y-5">

                        {/* ── Hero Narrative ── */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                            <div className="flex items-start space-x-3">
                                <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{insightNarrative}</p>
                            </div>
                        </div>

                        {/* ── Planning Recommendation ── */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5">
                            <div className="flex items-start space-x-3">
                                <Target className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Planning Recommendation</div>
                                    <p className="text-sm text-slate-700 font-semibold">{recommendation}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Quick Stats Row ── */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Population</div>
                                <div className="text-xl font-extrabold text-slate-800">{popStr}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Zones</div>
                                <div className="text-xl font-extrabold text-orange-600">{zonesImproved}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Gain</div>
                                <div className="text-xl font-extrabold text-emerald-600">+{avgScoreIncrease.toFixed(1)}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Dist Drop</div>
                                <div className="text-xl font-extrabold text-indigo-600">{Math.abs(Math.min(0, ...serviceComparison.map(s => s.delta))).toFixed(1)}<span className="text-sm font-normal text-slate-400">km</span></div>
                            </div>
                        </div>

                        {/* ── Current Reality vs Simulation Plan ── */}
                        <CollapsibleSection title="Current Reality vs Simulation Plan"
                            icon={<BarChart3 className="w-4 h-4 text-purple-500" />} defaultOpen={true}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span>Metric</span><span>Current</span><span>Simulated</span>
                                </div>
                                {[
                                    { label: 'Avg Score', before: beforeAvg, after: afterAvg, unit: '/100' },
                                    { label: 'Service Deserts', before: actualDeserts, after: simDeserts, unit: ' zones', invert: true },
                                    { label: 'Underserved Pop', before: actualUnderservedPop, after: simUnderservedPop, unit: '', fmt: true, invert: true },
                                    { label: 'Vulnerability', before: vulnerabilityReduction.before, after: vulnerabilityReduction.after, unit: '', invert: true },
                                ].map((row, i) => {
                                    const delta = row.after - row.before;
                                    const isGood = row.invert ? delta < 0 : delta > 0;
                                    return (
                                        <div key={i} className={`grid grid-cols-3 text-center py-2.5 ${i % 2 === 0 ? 'bg-slate-50/50' : ''} rounded-lg`}>
                                            <span className="text-xs font-semibold text-slate-600 text-left pl-2">{row.label}</span>
                                            <span className="text-sm font-bold text-slate-400">
                                                {row.fmt && row.before >= 1000 ? `${(row.before / 1000).toFixed(1)}k` : row.before}{row.unit}
                                            </span>
                                            <span className={`text-sm font-bold ${isGood ? 'text-emerald-600' : delta === 0 ? 'text-slate-400' : 'text-red-500'}`}>
                                                {row.fmt && row.after >= 1000 ? `${(row.after / 1000).toFixed(1)}k` : row.after}{row.unit}
                                                {delta !== 0 && <span className="text-[10px] ml-1">({isGood ? '↑' : '↓'})</span>}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Gap closure indicator */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-3 mt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-purple-700">Gap Closure to Ideal (Score ≥80)</span>
                                        <span className="text-sm font-extrabold text-purple-600">{gapClosed}%</span>
                                    </div>
                                    <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, gapClosed)}%` }} />
                                    </div>
                                    <p className="text-[10px] text-purple-500 mt-1.5">
                                        This placement closes {gapClosed}% of the gap between current avg ({beforeAvg}) and ideal ({idealScore}).
                                    </p>
                                </div>
                            </div>
                        </CollapsibleSection>

                        {/* ── Per-Service Distance Comparison ── */}
                        <CollapsibleSection title="Service Distance Breakdown"
                            icon={<TrendingUp className="w-4 h-4 text-blue-500" />} defaultOpen={false}>
                            <div className="space-y-3">
                                <div className="grid grid-cols-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span className="text-left">Service</span>
                                    <span>Before</span>
                                    <span>After</span>
                                    <span>Δ</span>
                                    <span>Coverage</span>
                                </div>
                                {serviceComparison.map((svc, i) => {
                                    const improved = svc.delta < 0;
                                    const coverageDelta = svc.afterCoveragePercent - svc.beforeCoveragePercent;
                                    return (
                                        <div key={svc.service} className={`grid grid-cols-5 text-center items-center py-2 ${i % 2 === 0 ? 'bg-slate-50/50' : ''} rounded-lg`}>
                                            <span className="text-xs font-semibold text-slate-600 text-left pl-2">{svc.label}</span>
                                            <span className="text-xs text-slate-400">{svc.beforeAvg}km</span>
                                            <span className={`text-xs font-bold ${improved ? 'text-emerald-600' : 'text-slate-500'}`}>{svc.afterAvg}km</span>
                                            <span className={`text-xs font-bold ${improved ? 'text-emerald-600' : svc.delta === 0 ? 'text-slate-300' : 'text-red-500'}`}>
                                                {svc.delta !== 0 ? (svc.delta > 0 ? '+' : '') + svc.delta + 'km' : '—'}
                                            </span>
                                            <span className={`text-xs font-bold ${coverageDelta > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {svc.afterCoveragePercent}%
                                                {coverageDelta > 0 && <span className="text-[9px]"> (+{coverageDelta})</span>}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3">Coverage = % population within threshold (Hospital 3km, School 2km, Transit 1.5km, Emergency 4km)</p>
                        </CollapsibleSection>

                        {/* ── Coverage Improvements (collapsed) ── */}
                        <CollapsibleSection title="Coverage Improvements"
                            icon={<Shield className="w-4 h-4 text-indigo-500" />} defaultOpen={false}>
                            <div className="space-y-3">
                                <CoverageBar label="🏥 Healthcare" value={coverageImprovements.healthcare} color="#10b981" />
                                <CoverageBar label="🚔 Emergency" value={coverageImprovements.emergency} color="#6366f1" />
                                <CoverageBar label="🚌 Transit" value={coverageImprovements.transit} color="#f59e0b" />
                                <CoverageBar label="🏫 Education" value={coverageImprovements.education} color="#3b82f6" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3">% change in population within threshold distances (Hospital 3km, Police/Fire 4km, Transit 1.5km, School 2km)</p>
                        </CollapsibleSection>

                        {/* ── Affected Wards (collapsed) ── */}
                        {affectedWards.length > 0 && (
                            <CollapsibleSection title={`Affected Wards (${affectedWards.length})`}
                                icon={<MapPin className="w-4 h-4 text-orange-500" />} defaultOpen={false}>
                                <div className="space-y-2">
                                    {affectedWards.map((w: AffectedWard) => (
                                        <div key={w.wardId} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                                            <div>
                                                <span className="text-sm font-semibold text-slate-700">{w.wardName}</span>
                                                <span className="text-[10px] text-slate-400 ml-2">({(w.populationAffected / 1000).toFixed(1)}k pop)</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-slate-400">{w.accessibilityBefore}</span>
                                                <span className="text-xs text-slate-300">→</span>
                                                <span className="text-xs font-bold text-emerald-600">{w.accessibilityAfter}</span>
                                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">+{w.accessibilityDelta}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CollapsibleSection>
                        )}

                        {/* ── Grievance Impact (collapsed) ── */}
                        {(matchedGrievanceCount ?? 0) > 0 && (
                            <CollapsibleSection title={`Grievance Impact (${matchedGrievanceCount} matched)`}
                                icon={<AlertTriangle className="w-4 h-4 text-red-500" />} defaultOpen={false}>
                                <p className="text-sm text-slate-600 mb-3">
                                    This placement addresses <strong className="text-slate-800">{matchedGrievanceCount}</strong> open citizen complaint{(matchedGrievanceCount ?? 0) > 1 ? 's' : ''} in the affected area.
                                </p>
                                {matchedGrievances && matchedGrievances.length > 0 && (
                                    <div className="space-y-2">
                                        {matchedGrievances.slice(0, 5).map(g => (
                                            <div key={g.id} className="flex items-start space-x-2 py-2 px-3 bg-red-50/50 rounded-lg">
                                                <span className="text-xs">{g.severity === 'critical' ? '🔴' : g.severity === 'high' ? '🟠' : '🟡'}</span>
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-700 line-clamp-1">{g.title}</p>
                                                    <p className="text-[10px] text-slate-400">{g.location?.ward_name} • {g.upvotes} upvotes</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CollapsibleSection>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <p className="text-[10px] text-slate-400">Deterministic analysis • No AI dependencies</p>
                    {onExportPDF && (
                        <Button onClick={onExportPDF} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-lg">
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Planning Report
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
