'use client';

import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GridCell, Facility } from '@/app/types';
import HexGridLayer from './HexGridLayer';
import FacilityMarkers from './FacilityMarkers';
import SimulationLayer from './SimulationLayer';

interface MapViewProps {
    cells: GridCell[];
    facilities: Facility[];
    selectedCellId: string | null;
    onCellClick: (cell: GridCell) => void;
    isSimulating: boolean;
    activeSimType: string | null;
    placedFacilities: Facility[];
    onPlaceFacility: (lat: number, lng: number) => void;
    visibleFacilities: string[];
    vulnerabilityMode?: boolean;
}

export default function MapView({
    cells,
    facilities,
    selectedCellId,
    onCellClick,
    isSimulating,
    activeSimType,
    placedFacilities,
    onPlaceFacility,
    visibleFacilities,
    vulnerabilityMode = false
}: MapViewProps) {
    // Center of Bangalore more accurately with tighter max bounds
    const center: [number, number] = [12.98, 77.59];
    const maxBounds: L.LatLngBoundsExpression = [
        [12.85, 77.45], // South West
        [13.1, 77.75]  // North East
    ];

    return (
        <div className="h-full w-full bg-slate-900 overflow-hidden relative" id="service-map-container">
            <MapContainer
                center={center}
                zoom={12}
                minZoom={11}
                maxBounds={maxBounds}
                maxBoundsViscosity={1.0}
                zoomControl={false} // Default disabled, custom positioning later if needed
                className="h-full w-full"
                style={{ background: '#0f172a' }} // slate-900 background below tiles
            >
                {/* Dark theme tile layer via CartoDB */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <ZoomControl position="bottomright" />

                <HexGridLayer
                    cells={cells}
                    onCellClick={onCellClick}
                    selectedCellId={selectedCellId}
                    vulnerabilityMode={vulnerabilityMode}
                />

                <FacilityMarkers
                    facilities={facilities}
                    visibleTypes={visibleFacilities}
                />

                <SimulationLayer
                    isSimulating={isSimulating}
                    activePlacementType={activeSimType}
                    placedFacilities={placedFacilities}
                    onPlaceFacility={onPlaceFacility}
                />
            </MapContainer>
        </div>
    );
}
