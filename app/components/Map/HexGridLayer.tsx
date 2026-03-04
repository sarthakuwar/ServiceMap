'use client';

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as h3 from 'h3-js';
import { useEffect, useRef } from 'react';
import { GridCell } from '../../types';

interface HexGridLayerProps {
    cells: GridCell[];
    selectedCellId: string | null;
    onCellClick: (cell: GridCell) => void;
    vulnerabilityMode?: boolean;
}

const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#fbbf24';
    if (score >= 40) return '#f97316';
    return '#ef4444';
};

const getVulnerabilityColor = (vi: number): string => {
    if (vi >= 70) return '#dc2626';
    if (vi >= 55) return '#f97316';
    if (vi >= 40) return '#a855f7';
    return '#6366f1';
};

export default function HexGridLayer({ cells, selectedCellId, onCellClick, vulnerabilityMode }: HexGridLayerProps) {
    const map = useMap();
    const layerGroupRef = useRef<L.LayerGroup>(L.layerGroup());

    useEffect(() => {
        const group = layerGroupRef.current;
        group.clearLayers();

        cells.forEach(cell => {
            const boundary = h3.cellToBoundary(cell.cell_id);
            const latLngs = boundary.map(([lat, lng]) => [lat, lng] as [number, number]);

            const isSelected = cell.cell_id === selectedCellId;
            const score = vulnerabilityMode ? (cell.vulnerability_index ?? cell.accessibility_score) : cell.accessibility_score;
            const fillColor = vulnerabilityMode ? getVulnerabilityColor(score) : getScoreColor(cell.accessibility_score);

            const polygon = L.polygon(latLngs, {
                fillColor,
                fillOpacity: isSelected ? 0.75 : 0.5,
                color: isSelected ? '#0f172a' : 'rgba(0, 0, 0, 0.15)',
                weight: isSelected ? 3 : 1,
            });

            polygon.on('click', () => onCellClick(cell));
            polygon.on('mouseover', () => {
                if (!isSelected) polygon.setStyle({ fillOpacity: 0.65 });
            });
            polygon.on('mouseout', () => {
                if (!isSelected) polygon.setStyle({ fillOpacity: 0.5 });
            });

            polygon.bindTooltip(
                `<div style="font-family: Inter, sans-serif; font-size: 12px; min-width: 140px; color: #0f172a;">
                    <div style="font-weight: 700; margin-bottom: 4px;">${cell.ward_name}</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span style="color: #64748b;">Score</span>
                        <span style="font-weight: 600; color: ${fillColor};">${cell.accessibility_score}/100</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #64748b;">Population</span>
                        <span style="font-weight: 600;">${(cell.population_estimate / 1000).toFixed(1)}k</span>
                    </div>
                </div>`,
                {
                    direction: 'top',
                    offset: [0, -10],
                    className: '',
                    opacity: 1,
                }
            );

            polygon.addTo(group);
        });

        group.addTo(map);

        return () => {
            group.clearLayers();
        };
    }, [cells, selectedCellId, map, onCellClick, vulnerabilityMode]);

    return null;
}
