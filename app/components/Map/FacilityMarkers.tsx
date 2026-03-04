'use client';

import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from '../../types';
import MarkerClusterGroup from 'react-leaflet-cluster';

interface FacilityMarkersProps {
    facilities: Facility[];
    visibleFacilities: string[];
}

const FACILITY_COLORS: Record<string, string> = {
    hospital: '#ef4444',
    school: '#3b82f6',
    bus_stop: '#10b981',
    police_station: '#6366f1',
    fire_station: '#f97316',
};

const FACILITY_LETTERS: Record<string, string> = {
    hospital: 'H',
    school: 'S',
    bus_stop: 'B',
    police_station: 'P',
    fire_station: 'F',
};

const FACILITY_LABELS: Record<string, string> = {
    hospital: 'Hospital',
    school: 'School',
    bus_stop: 'Transit',
    police_station: 'Police',
    fire_station: 'Fire Station',
};

const createFacilityIcon = (type: string) => {
    const color = FACILITY_COLORS[type] || '#64748b';
    const letter = FACILITY_LETTERS[type] || '?';
    return L.divIcon({
        html: `
            <div style="
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: ${color};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                font-family: 'Inter', sans-serif;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            ">${letter}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
        className: '',
    });
};

const createClusterIcon = (cluster: any) => {
    const count = cluster.getChildCount();
    return L.divIcon({
        html: `
            <div style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: #0f172a;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 13px;
                font-weight: 700;
                font-family: 'Inter', sans-serif;
                border: 3px solid white;
                box-shadow: 0 3px 8px rgba(0,0,0,0.15);
            ">${count}</div>`,
        iconSize: [36, 36],
        className: '',
    });
};

export default function FacilityMarkers({ facilities, visibleFacilities }: FacilityMarkersProps) {
    const filteredFacilities = facilities.filter(f => visibleFacilities.includes(f.type));

    if (filteredFacilities.length === 0) return null;

    return (
        <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={40} spiderfyOnMaxZoom>
            {filteredFacilities.map(f => (
                <Marker key={f.id} position={[f.lat, f.lng]} icon={createFacilityIcon(f.type)}>
                    <Popup>
                        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '180px', color: '#0f172a' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{f.display_name || f.name}</div>
                            <div style={{ display: 'inline-block', background: FACILITY_COLORS[f.type] + '20', color: FACILITY_COLORS[f.type], padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
                                {FACILITY_LABELS[f.type] || f.type}
                            </div>
                            {f.address && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>📍 {f.address}</div>}
                            {f.phone && <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginBottom: '4px' }}>📞 {f.phone}</div>}
                            {f.hours && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>🕐 {f.hours}</div>}
                            {f.emergency && <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, background: '#fef2f2', padding: '4px 8px', borderRadius: '8px', textAlign: 'center' }}>24/7 Emergency</div>}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MarkerClusterGroup>
    );
}
