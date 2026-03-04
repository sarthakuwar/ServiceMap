'use client';

import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GridCell, Facility } from '../../types';
import HexGridLayer from './HexGridLayer';
import FacilityMarkers from './FacilityMarkers';
import SimulationLayer from './SimulationLayer';

interface MapViewProps {
    cells: GridCell[];
    facilities: Facility[];
    selectedCellId: string | null;
    onCellClick: (c: GridCell) => void;
    isSimulating: boolean;
    activeSimType: string | null;
    placedFacilities: Facility[];
    onPlaceFacility: (lat: number, lng: number) => void;
    visibleFacilities: string[];
    vulnerabilityMode: boolean;
}

export default function MapView({ cells, facilities, selectedCellId, onCellClick, isSimulating, activeSimType, placedFacilities, onPlaceFacility, visibleFacilities, vulnerabilityMode }: MapViewProps) {
    const bounds: [[number, number], [number, number]] = [
        [12.85, 77.45],
        [13.15, 77.75]
    ];

    return (
        <div id="service-map-container" className="w-full h-full">
            <MapContainer
                center={[12.98, 77.59]}
                zoom={12}
                minZoom={11}
                maxBounds={bounds}
                className="w-full h-full z-0"
                zoomControl={false}
                style={{ background: '#f8fafc' }}
            >
                {/* CartoDB Voyager Light Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <ZoomControl position="bottomright" />

                <HexGridLayer
                    cells={cells}
                    selectedCellId={selectedCellId}
                    onCellClick={onCellClick}
                    vulnerabilityMode={vulnerabilityMode}
                />

                <FacilityMarkers
                    facilities={facilities}
                    visibleFacilities={visibleFacilities}
                />

                {isSimulating && (
                    <SimulationLayer
                        activeSimType={activeSimType}
                        placedFacilities={placedFacilities}
                        onPlaceFacility={onPlaceFacility}
                    />
                )}
            </MapContainer>
        </div>
    );
}
