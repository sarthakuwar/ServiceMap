'use client';

import { useState } from 'react';
import { X, MapPin, Camera, AlertTriangle, Send, Shield, ChevronDown } from 'lucide-react';
import { GrievanceCategory, GrievanceSeverity, CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_TO_DEPARTMENT, DEPARTMENT_LABELS } from '@/app/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    prefilledLocation?: { lat: number; lng: number; ward_name?: string; cell_id?: string };
    onSubmit: (data: any) => Promise<any>;
}

const CATEGORIES: GrievanceCategory[] = [
    'road_pothole', 'water_supply', 'sewage_drainage', 'streetlight',
    'garbage', 'public_toilet', 'encroachment', 'noise_pollution',
    'tree_hazard', 'public_transport', 'healthcare_access', 'school_infra',
    'park_maintenance', 'other'
];

const SEVERITIES: { value: GrievanceSeverity; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'medium', label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'high', label: 'High', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'critical', label: 'Critical', color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function GrievanceSubmitModal({ isOpen, onClose, prefilledLocation, onSubmit }: Props) {
    const [category, setCategory] = useState<GrievanceCategory>('road_pothole');
    const [severity, setSeverity] = useState<GrievanceSeverity>('medium');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [citizenName, setCitizenName] = useState('');
    const [citizenPhone, setCitizenPhone] = useState('');
    const [citizenEmail, setCitizenEmail] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [addressText, setAddressText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showCategories, setShowCategories] = useState(false);

    if (!isOpen) return null;

    const department = CATEGORY_TO_DEPARTMENT[category];
    const slaText = severity === 'critical' ? '48 hours' : severity === 'high' ? '15 days' : '30 days';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setSubmitting(true);
        try {
            const data = {
                category,
                severity,
                title: title.trim(),
                description: description.trim(),
                lat: prefilledLocation?.lat || 12.9716,
                lng: prefilledLocation?.lng || 77.5946,
                address_text: addressText,
                citizen_name: isAnonymous ? 'Anonymous' : citizenName,
                citizen_phone: citizenPhone,
                citizen_email: citizenEmail || undefined,
                is_anonymous: isAnonymous,
            };
            const res = await onSubmit(data);
            setResult(res);
        } catch (err) {
            console.error(err);
        }
        setSubmitting(false);
    };

    if (result) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Grievance Filed Successfully</h2>
                    <p className="text-sm text-slate-500 mb-6">Your complaint has been registered with the {DEPARTMENT_LABELS[department]}.</p>

                    <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Grievance ID</span>
                            <span className="text-xs font-bold text-slate-800">{result.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Tracking Number</span>
                            <span className="text-xs font-bold text-orange-600">{result.tracking_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Department</span>
                            <span className="text-xs font-semibold text-slate-700">{DEPARTMENT_LABELS[result.department as keyof typeof DEPARTMENT_LABELS] || result.department}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">Ward</span>
                            <span className="text-xs font-semibold text-slate-700">{result.ward_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-slate-400">SLA Deadline</span>
                            <span className="text-xs font-semibold text-slate-700">{new Date(result.sla_resolve_deadline).toLocaleDateString('en-IN')}</span>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-4">
                        Save your tracking number <strong>{result.tracking_number}</strong> to check status anytime.
                    </p>

                    <button onClick={() => { setResult(null); onClose(); }} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white rounded-t-2xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Report a Civic Issue</h2>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">CPGRAMS Compliant • SLA Enforced</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Category */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Category</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowCategories(!showCategories)}
                                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-left hover:border-slate-300 transition-colors"
                            >
                                <span className="flex items-center space-x-2">
                                    <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                                    <span className="text-sm font-medium text-slate-800">{CATEGORY_LABELS[category]}</span>
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
                            </button>
                            {showCategories && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => { setCategory(cat); setShowCategories(false); }}
                                            className={`w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors ${category === cat ? 'bg-orange-50' : ''}`}
                                        >
                                            <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                                            <span className="text-sm text-slate-700">{CATEGORY_LABELS[cat]}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Severity</label>
                        <div className="grid grid-cols-4 gap-2">
                            {SEVERITIES.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setSeverity(s.value)}
                                    className={`text-xs font-bold py-2 rounded-lg border transition-all ${severity === s.value ? s.color + ' ring-2 ring-offset-1 ring-slate-300' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Brief description of the issue"
                            maxLength={100}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 text-right">{title.length}/100</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Provide detailed information about the issue..."
                            maxLength={2000}
                            rows={3}
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 resize-none"
                        />
                    </div>

                    {/* Location */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center space-x-2 mb-3">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Location</span>
                        </div>
                        {prefilledLocation ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {prefilledLocation.ward_name || 'Selected Location'}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {prefilledLocation.lat.toFixed(4)}, {prefilledLocation.lng.toFixed(4)}
                                        {prefilledLocation.cell_id && ` • Cell: ${prefilledLocation.cell_id.slice(0, 8)}...`}
                                    </p>
                                </div>
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg">✓ Set</span>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400">Click on the map to set location, or enter manually below.</p>
                        )}
                        <input
                            type="text"
                            value={addressText}
                            onChange={e => setAddressText(e.target.value)}
                            placeholder="Address (optional)"
                            className="w-full mt-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-200"
                        />
                    </div>

                    {/* Citizen Details */}
                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Details</span>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-3.5 h-3.5 rounded border-slate-300 text-orange-500 focus:ring-orange-200" />
                                <span className="text-[10px] text-slate-500">File anonymously</span>
                            </label>
                        </div>
                        {!isAnonymous && (
                            <div className="space-y-3">
                                <input type="text" value={citizenName} onChange={e => setCitizenName(e.target.value)} placeholder="Your name" required={!isAnonymous}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="tel" value={citizenPhone} onChange={e => setCitizenPhone(e.target.value)} placeholder="Phone (for updates)"
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                    <input type="email" value={citizenEmail} onChange={e => setCitizenEmail(e.target.value)} placeholder="Email (optional)"
                                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-200" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Auto-computed Info */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">Auto-Routed To</p>
                            <p className="text-sm font-bold text-blue-800">{DEPARTMENT_LABELS[department]}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-blue-500 uppercase tracking-wider font-bold">SLA Deadline</p>
                            <p className="text-sm font-bold text-blue-800">{slaText}</p>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || !title.trim() || !description.trim()}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Submit Grievance</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
