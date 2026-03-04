import { useState, useEffect } from 'react';
import { GridCell, Facility } from '../types';
import { computeAccessibilityScore, computePriorityScore, getLocalityRating } from '../utils/scoring';
import * as turf from '@turf/turf';

export function useSimulation(initialCells: GridCell[]) {
    const [isSimulating, setIsSimulating] = useState(false);
    const [placedFacilities, setPlacedFacilities] = useState<Facility[]>([]);
    const [originalCells, setOriginalCells] = useState<GridCell[]>(initialCells);
    const [simulatedCells, setSimulatedCells] = useState<GridCell[]>(initialCells);
    const [impactSummary, setImpactSummary] = useState<{
        populationAffected: number;
        zonesImproved: number;
        avgScoreIncrease: number;
    } | null>(null);

    // Sync with prop when loaded
    useEffect(() => {
        if (initialCells && initialCells.length > 0) {
            setOriginalCells(initialCells);
            if (!isSimulating) setSimulatedCells(initialCells);
        }
    }, [initialCells, isSimulating]);

    const addFacility = (type: string, lat: number, lng: number) => {
        const newFacility: Facility = {
            id: `sim_${Date.now()}`,
            type,
            name: `Simulated ${type}`,
            lat,
            lng
        };

        setPlacedFacilities(prev => [...prev, newFacility]);

        // Recalculate impact using RADIUS optimization
        // Impact radius based on prompt: hospital 5km, school 2km, transport hub 1km 
        const radiusKM = type === 'hospital' ? 5 : type === 'school' ? 2 : 1;
        let improvedZones = 0;
        let popAffected = 0;
        let totalScoreIncrease = 0;

        const updatedCells = simulatedCells.map(cell => {
            // Use turf to calculate haversine distance 
            const from = turf.point([cell.longitude, cell.latitude]);
            const to = turf.point([lng, lat]);
            const dist = turf.distance(from, to, { units: 'kilometers' });

            // If outside impact radius, no change
            if (dist > radiusKM) return cell;

            const currentDistForType = cell.service_distances[type as keyof typeof cell.service_distances] || Infinity;

            // If the new facility is closer than existing ones:
            if (dist < currentDistForType) {
                const newDistances = { ...cell.service_distances, [type]: dist };
                const newScore = computeAccessibilityScore(newDistances);

                // If score actually improved
                if (newScore > cell.accessibility_score) {
                    improvedZones++;
                    popAffected += cell.population_estimate;
                    totalScoreIncrease += (newScore - cell.accessibility_score);

                    return {
                        ...cell,
                        service_distances: newDistances,
                        accessibility_score: newScore,
                        locality_rating: getLocalityRating(newScore),
                        priority_score: computePriorityScore(cell.population_estimate, newScore)
                    };
                }
            }
            return cell;
        });

        setSimulatedCells(updatedCells);

        // Update impact summary cumulatively
        setImpactSummary(prev => {
            return {
                populationAffected: (prev?.populationAffected || 0) + popAffected,
                zonesImproved: (prev?.zonesImproved || 0) + improvedZones,
                avgScoreIncrease: improvedZones > 0 ? ((prev?.avgScoreIncrease || 0) * (prev?.zonesImproved || 0) + totalScoreIncrease) / ((prev?.zonesImproved || 0) + improvedZones) : (prev ? prev.avgScoreIncrease : 0)
            };
        });
    };

    const reset = () => {
        setIsSimulating(false);
        setPlacedFacilities([]);
        setSimulatedCells(originalCells);
        setImpactSummary(null);
    };

    return {
        isSimulating,
        setIsSimulating,
        placedFacilities,
        simulatedCells,
        addFacility,
        reset,
        impactSummary
    };
}
