'use client';

import dynamic from 'next/dynamic';
import { GridCell, Facility } from '@/app/types';

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

const DynamicMap = dynamic<MapViewProps>(() => import('./MapView'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-slate-400 font-medium">Loading Map Engines...</p>
            </div>
        </div>
    ),
});

export default DynamicMap;
