'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Grievance, STATUS_LABELS, CATEGORY_LABELS, CATEGORY_ICONS, DEPARTMENT_LABELS, STATUS_COLORS } from '@/app/types';

interface Props {
    visible: boolean;
}

const API = 'http://localhost:8000';

const MARKER_COLORS: Record<string, string> = {
    submitted: '#f59e0b',
    acknowledged: '#3b82f6',
    under_review: '#8b5cf6',
    in_progress: '#f97316',
    resolved: '#10b981',
    citizen_confirmed: '#059669',
    reopened: '#ef4444',
    escalated: '#dc2626',
    closed: '#94a3b8',
};

function createMarkerIcon(status: string, severity: string) {
    const color = MARKER_COLORS[status] || '#94a3b8';
    const size = severity === 'critical' ? 14 : severity === 'high' ? 12 : 10;
    const pulse = ['escalated', 'submitted'].includes(status) && severity !== 'low';

    return L.divIcon({
        className: 'grievance-marker',
        html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      ${pulse ? `animation: grievancePulse 2s infinite;` : ''}
    "></div>
    <style>
      @keyframes grievancePulse {
        0%,100% { box-shadow: 0 0 0 0 ${color}66; }
        50% { box-shadow: 0 0 0 6px ${color}00; }
      }
    </style>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

export default function GrievanceMapLayer({ visible }: Props) {
    const map = useMap();
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [markersLayer, setMarkersLayer] = useState<L.LayerGroup | null>(null);

    useEffect(() => {
        fetch(`${API}/api/grievances`)
            .then(r => r.json())
            .then(data => setGrievances(data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (markersLayer) {
            map.removeLayer(markersLayer);
        }
        if (!visible || grievances.length === 0) return;

        const layer = L.layerGroup();

        grievances.forEach(g => {
            if (!g.location?.lat || !g.location?.lng) return;
            if (g.status === 'closed') return;

            const icon = createMarkerIcon(g.status, g.severity);
            const marker = L.marker([g.location.lat, g.location.lng], { icon });

            const isOverdue = g.sla_resolve_deadline && new Date() > new Date(g.sla_resolve_deadline) &&
                !['resolved', 'citizen_confirmed', 'closed'].includes(g.status);

            marker.bindPopup(`
        <div style="font-family:system-ui;min-width:200px;max-width:260px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="background:${STATUS_COLORS[g.status] || '#94a3b8'}20;color:${STATUS_COLORS[g.status] || '#94a3b8'};font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;">
              ${STATUS_LABELS[g.status] || g.status}
            </span>
            ${isOverdue ? '<span style="background:#fee2e2;color:#dc2626;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;">OVERDUE</span>' : ''}
          </div>
          <p style="font-size:13px;font-weight:700;color:#1e293b;margin:0 0 4px;">${g.title}</p>
          <p style="font-size:11px;color:#64748b;margin:0 0 8px;">${CATEGORY_ICONS[g.category]} ${CATEGORY_LABELS[g.category]} • ${g.location.ward_name || ''}</p>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
            <span>${g.tracking_number}</span>
            <span>👍 ${g.upvotes || 0}</span>
          </div>
        </div>
      `, {
                className: 'grievance-popup',
                maxWidth: 280,
            });

            marker.addTo(layer);
        });

        layer.addTo(map);
        setMarkersLayer(layer);

        return () => {
            if (layer) map.removeLayer(layer);
        };
    }, [visible, grievances, map]);

    return null;
}
