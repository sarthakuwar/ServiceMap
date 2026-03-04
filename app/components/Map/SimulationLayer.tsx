'use client';

import { useEffect } from 'react';
import { useMap, Marker, Tooltip, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from '@/app/types';

interface SimulationLayerProps {
    isSimulating: boolean;
    activePlacementType: string | null;
    placedFacilities: Facility[];
    onPlaceFacility: (lat: number, lng: number) => void;
}

const SIM_ICON = L.divIcon({
    html: '<div class="flex items-center justify-center w-8 h-8 bg-cyan-500 border-2 border-white rounded-full text-white text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse">★</div>',
    className: ''
});

export default function SimulationLayer({
    isSimulating,
    activePlacementType,
    placedFacilities,
    onPlaceFacility
}: SimulationLayerProps) {
    const map = useMap();

    useEffect(() => {
        if (!isSimulating || !activePlacementType) return;

        map.getContainer().style.cursor = 'crosshair';

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(e as any); // Prevent hexagon clicks from interfering
            onPlaceFacility(e.latlng.lat, e.latlng.lng);
        };

        map.on('click', handleMapClick);

        return () => {
            map.getContainer().style.cursor = '';
            map.off('click', handleMapClick);
        };
    }, [map, isSimulating, activePlacementType, onPlaceFacility]);

    if (!isSimulating) return null;

    return (
        <>
            {placedFacilities.map((fac) => {
                // Impact radius (m)
                const radius = fac.type === 'hospital' ? 5000 : fac.type === 'school' ? 2000 : 1000;

                return (
                    <div key={fac.id}>
                        <Circle
                            center={[fac.lat, fac.lng]}
                            radius={radius}
                            pathOptions={{ fillColor: '#06b6d4', fillOpacity: 0.1, color: '#06b6d4', weight: 1, dashArray: '4, 4' }}
                        />
                        <Marker position={[fac.lat, fac.lng]} icon={SIM_ICON}>
                            <Tooltip direction="top" permanent className="bg-slate-800 text-cyan-400 border-slate-700">
                                <span className="font-bold">New {fac.type.toUpperCase()}</span>
                            </Tooltip>
                        </Marker>
                    </div>
                );
            })}
        </>
    );
}
