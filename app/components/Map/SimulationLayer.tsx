'use client';

import { useMap, Marker, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from '../../types';
import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';

interface SimulationLayerProps {
    activeSimType: string | null;
    placedFacilities: Facility[];
    onPlaceFacility: (lat: number, lng: number) => void;
}

const SIM_ICON = L.divIcon({
    html: `
        <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #14b8a6;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(20, 184, 166, 0.4);
            animation: pulse 2s infinite;
        ">+</div>
        <style>@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }</style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    className: '',
});

function MapClickHandler({ onPlaceFacility, activeSimType }: { onPlaceFacility: (lat: number, lng: number) => void; activeSimType: string | null }) {
    const map = useMap();

    useEffect(() => {
        if (activeSimType) {
            map.getContainer().style.cursor = 'crosshair';
        } else {
            map.getContainer().style.cursor = '';
        }
        return () => { map.getContainer().style.cursor = ''; };
    }, [activeSimType, map]);

    useMapEvents({
        click(e) {
            if (activeSimType) {
                onPlaceFacility(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    return null;
}

export default function SimulationLayer({ activeSimType, placedFacilities, onPlaceFacility }: SimulationLayerProps) {
    const radiusKm = (type: string) => type === 'hospital' ? 5 : type === 'school' ? 2 : 1;

    return (
        <>
            <MapClickHandler onPlaceFacility={onPlaceFacility} activeSimType={activeSimType} />

            {placedFacilities.map(f => (
                <div key={f.id}>
                    <Marker position={[f.lat, f.lng]} icon={SIM_ICON}>
                        <Tooltip direction="top" offset={[0, -15]} permanent={false} className="">
                            New {f.type?.replace('_', ' ')}
                        </Tooltip>
                    </Marker>
                    <Circle
                        center={[f.lat, f.lng]}
                        radius={radiusKm(f.type) * 1000}
                        pathOptions={{
                            color: '#14b8a6',
                            weight: 2,
                            dashArray: '8 6',
                            fillColor: '#14b8a6',
                            fillOpacity: 0.08,
                        }}
                    />
                </div>
            ))}
        </>
    );
}
