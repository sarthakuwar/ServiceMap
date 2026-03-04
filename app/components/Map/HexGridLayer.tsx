'use client';

import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import * as h3 from 'h3-js';
import L from 'leaflet';
import { GridCell } from '@/app/types';
import { getScoreColor } from '@/app/utils/scoring';

interface HexGridLayerProps {
    cells: GridCell[];
    onCellClick: (cell: GridCell) => void;
    selectedCellId: string | null;
    vulnerabilityMode?: boolean;
}

function getVulnerabilityColor(vuln: number): string {
    if (vuln >= 70) return '#dc2626'; // red-600
    if (vuln >= 55) return '#f97316'; // orange-500
    if (vuln >= 40) return '#a855f7'; // purple-500
    return '#6366f1'; // indigo-500
}

export default function HexGridLayer({ cells, onCellClick, selectedCellId, vulnerabilityMode = false }: HexGridLayerProps) {
    // Convert H3 cells to a single GeoJSON FeatureCollection for optimal Leaflet rendering
    const geoJsonData = useMemo(() => {
        if (!cells || cells.length === 0) return { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection;

        return {
            type: 'FeatureCollection',
            features: cells.map((cell) => {
                const hexBoundary = h3.cellToBoundary(cell.cell_id, true);
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [hexBoundary],
                    },
                    properties: cell,
                };
            }),
        } as GeoJSON.FeatureCollection;
    }, [cells]);

    const styleFunction = (feature: unknown) => {
        const props = (feature as { properties?: GridCell }).properties;
        const isSelected = props?.cell_id === selectedCellId;
        const fillColor = vulnerabilityMode
            ? getVulnerabilityColor(props?.vulnerability_index ?? 0)
            : getScoreColor(props?.accessibility_score ?? 0);
        return {
            fillColor,
            weight: isSelected ? 3 : 1,
            opacity: 1,
            color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.2)',
            fillOpacity: isSelected ? 0.7 : 0.45,
        };
    };

    const onEachFeature = (feature: unknown, layer: L.Layer) => {
        layer.on({
            click: () => {
                const props = (feature as { properties?: GridCell }).properties;
                if (props) onCellClick(props);
            },
            mouseover: (e: L.LeafletMouseEvent) => {
                const lyr = e.target;
                lyr.setStyle({ fillOpacity: 0.8 });
            },
            mouseout: (e: L.LeafletMouseEvent) => {
                const lyr = e.target;
                lyr.setStyle(styleFunction(feature));
            },
        });
    };

    // The key must change when data changes so GeoJSON completely re-renders 
    // We use the length combined with the selected ID to avoid too many full rebuilds
    const layerKey = `hex-layer-${cells.length}-${selectedCellId}-${vulnerabilityMode}`;

    return (
        <GeoJSON
            key={layerKey}
            data={geoJsonData}
            style={styleFunction}
            onEachFeature={onEachFeature}
        />
    );
}
