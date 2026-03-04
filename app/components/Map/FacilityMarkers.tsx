'use client';

import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Facility } from '@/app/types';

// Icons using a highly visible dark-mode friendly palette
const ICONS: Record<string, L.DivIcon> = {
    hospital: L.divIcon({ html: '<div class="flex items-center justify-center w-7 h-7 bg-red-500 border-2 border-white rounded-full text-white text-xs font-bold shadow-lg shadow-black/50">H</div>', className: '' }),
    school: L.divIcon({ html: '<div class="flex items-center justify-center w-7 h-7 bg-blue-500 border-2 border-white rounded-full text-white text-xs font-bold shadow-lg shadow-black/50">S</div>', className: '' }),
    bus_stop: L.divIcon({ html: '<div class="flex items-center justify-center w-6 h-6 bg-emerald-500 border-2 border-white rounded-full text-white text-[10px] font-bold shadow-lg shadow-black/50">B</div>', className: '' }),
    police_station: L.divIcon({ html: '<div class="flex items-center justify-center w-7 h-7 bg-indigo-500 border-2 border-white rounded-full text-white text-xs font-bold shadow-lg shadow-black/50">P</div>', className: '' }),
    fire_station: L.divIcon({ html: '<div class="flex items-center justify-center w-7 h-7 bg-orange-500 border-2 border-white rounded-full text-white text-xs font-bold shadow-lg shadow-black/50">F</div>', className: '' }),
};

const TYPE_LABELS: Record<string, string> = {
    hospital: 'Hospital',
    school: 'School',
    bus_stop: 'Transit Stop',
    police_station: 'Police Station',
    fire_station: 'Fire Station',
};

const TYPE_COLORS: Record<string, string> = {
    hospital: '#ef4444',
    school: '#3b82f6',
    bus_stop: '#10b981',
    police_station: '#6366f1',
    fire_station: '#f97316',
};

const defaultIcon = L.divIcon({ html: '<div class="flex items-center justify-center w-5 h-5 bg-gray-500 border-2 border-slate-900 rounded-full shadow-md shadow-black/50"></div>', className: '' });

interface FacilityMarkersProps {
    facilities: Facility[];
    visibleTypes: string[];
}

export default function FacilityMarkers({ facilities, visibleTypes }: FacilityMarkersProps) {
    if (!facilities || visibleTypes.length === 0) return null;

    const filtered = facilities.filter(f => visibleTypes.includes(f.type) || visibleTypes.includes('all'));
    if (filtered.length === 0) return null;

    // Custom cluster icon
    const createClusterCustomIcon = (cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
            html: `<div class="flex items-center justify-center w-9 h-9 bg-slate-700 border-2 border-emerald-400 rounded-full text-white text-xs font-bold shadow-xl">${count}</div>`,
            className: '',
            iconSize: L.point(36, 36),
        });
    };

    return (
        <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            iconCreateFunction={createClusterCustomIcon}
        >
            {filtered.map(facility => (
                <Marker
                    key={facility.id}
                    position={[facility.lat, facility.lng]}
                    icon={ICONS[facility.type] || defaultIcon}
                >
                    <Popup className="facility-popup" maxWidth={280} minWidth={240}>
                        <div style={{ fontFamily: 'system-ui, sans-serif', padding: '4px 0' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', lineHeight: 1.3, maxWidth: '180px' }}>
                                    {facility.display_name || facility.name}
                                </div>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '9999px',
                                    backgroundColor: TYPE_COLORS[facility.type] || '#6b7280',
                                    color: 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {TYPE_LABELS[facility.type] || facility.type}
                                </span>
                            </div>
                            {/* Details */}
                            {facility.address && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'flex-start' }}>
                                    <span style={{ marginRight: '6px', flexShrink: 0 }}>📍</span>
                                    <span>{facility.address}</span>
                                </div>
                            )}
                            {facility.phone && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '6px' }}>📞</span>
                                    <span style={{ color: '#2563eb', fontWeight: 600 }}>{facility.phone}</span>
                                </div>
                            )}
                            {facility.hours && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '6px' }}>🕐</span>
                                    <span>{facility.hours}</span>
                                </div>
                            )}
                            {facility.emergency && (
                                <div style={{
                                    marginTop: '6px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: '#dc2626',
                                    backgroundColor: '#fef2f2',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    ⚠️ 24/7 Emergency Service
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MarkerClusterGroup>
    );
}
