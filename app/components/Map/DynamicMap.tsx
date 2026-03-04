'use client';

import dynamic from 'next/dynamic';
import { GridCell, Facility } from '../../types';

interface DynamicMapProps {
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

const MapView = dynamic(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto mb-3"></div>
                <p className="text-sm text-slate-400 font-medium">Loading map...</p>
            </div>
        </div>
    )
});

export default function DynamicMap(props: DynamicMapProps) {
    return <MapView {...props} />;
}
