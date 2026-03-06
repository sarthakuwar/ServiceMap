import { GridCell, Insight } from '../types';

// Coverage thresholds (km) — a cell is "covered" if the nearest facility is within this distance
const THRESHOLDS = {
    hospital: 3,
    school: 2,
    bus_stop: 1.5,
    police_station: 4,
    fire_station: 4,
};

const SERVICE_LABELS: Record<string, string> = {
    hospital: 'Healthcare',
    school: 'Education',
    bus_stop: 'Transit',
    police_station: 'Police',
    fire_station: 'Fire Services',
};

// ─── City-wide insights ────────────────────────────────────────────────────

export function generateInsights(cells: GridCell[]): Insight[] {
    const insights: Insight[] = [];
    if (!cells || cells.length === 0) return insights;

    // 1. City-Wide: Lowest scoring ward
    const wardScores: Record<string, { total: number; count: number }> = {};
    cells.forEach(cell => {
        if (!wardScores[cell.ward_name]) {
            wardScores[cell.ward_name] = { total: 0, count: 0 };
        }
        wardScores[cell.ward_name].total += cell.accessibility_score;
        wardScores[cell.ward_name].count += 1;
    });

    let lowestWard = '';
    let highestWard = '';
    let minAvg = Infinity;
    let maxAvg = -1;

    Object.entries(wardScores).forEach(([ward, data]) => {
        const avg = data.total / data.count;
        if (avg < minAvg) {
            minAvg = avg;
            lowestWard = ward;
        }
        if (avg > maxAvg) {
            maxAvg = avg;
            highestWard = ward;
        }
    });

    if (lowestWard) {
        insights.push({
            id: 'insight_1',
            title: 'City-Wide Priority',
            description: `${lowestWard} is currently the lowest scoring neighborhood with an average accessibility score of ${Math.round(minAvg)}/100.`,
            type: 'city-wide',
        });
    }

    // 2. City-Wide: Largest accessibility disparity
    if (maxAvg !== -1 && minAvg !== Infinity) {
        insights.push({
            id: 'insight_2',
            title: 'Access Disparity',
            description: `There is a ${Math.round(maxAvg - minAvg)} point disparity between the highest scoring neighborhood (${highestWard}) and the lowest (${lowestWard}).`,
            type: 'city-wide',
        });
    }

    // 3. High population + low hospital access
    const desertCells = cells.filter(
        (c) => c.population_estimate > 40000 && c.service_distances.hospital > 3
    );
    if (desertCells.length > 0) {
        const ward = desertCells[0].ward_name;
        insights.push({
            id: 'insight_3',
            title: 'Healthcare Gap',
            description: `${ward} has high population density (>40k) but residents must travel over 3km to the nearest hospital.`,
            type: 'negative',
            ward_name: ward
        });
    }

    // 4. Transport strong but emergency weak
    const imbalancedCells = cells.filter(
        (c) => c.service_distances.bus_stop < 0.5 && c.service_distances.fire_station > 4
    );
    if (imbalancedCells.length > 0) {
        const ward = imbalancedCells[0].ward_name;
        insights.push({
            id: 'insight_4',
            title: 'Service Imbalance',
            description: `Areas in ${ward} have strong transit access but poor emergency response coverage (Fire Station > 4km).`,
            type: 'negative',
            ward_name: ward
        });
    }

    // 5. Positive highlight
    if (highestWard) {
        insights.push({
            id: 'insight_5',
            title: 'Well Served',
            description: `${highestWard} integrates transit, healthcare, and education exceptionally well, providing ⭐⭐⭐⭐⭐ coverage.`,
            type: 'positive',
            ward_name: highestWard
        });
    }

    return insights;
}

// ─── Ward-level deterministic insights ────────────────────────────────────

export function generateWardInsights(allCells: GridCell[], wardName: string): Insight[] {
    const insights: Insight[] = [];
    const wardCells = allCells.filter(c => c.ward_name === wardName);
    if (wardCells.length === 0) return insights;

    // Compute ward averages
    const wardAvgScore = Math.round(
        wardCells.reduce((s, c) => s + c.accessibility_score, 0) / wardCells.length
    );
    const wardPop = wardCells.reduce((s, c) => s + c.population_estimate, 0);

    // City averages for comparison
    const cityAvgScore = Math.round(
        allCells.reduce((s, c) => s + c.accessibility_score, 0) / allCells.length
    );

    // Per-service average distances for ward
    const serviceKeys: (keyof GridCell['service_distances'])[] = ['hospital', 'school', 'bus_stop', 'police_station', 'fire_station'];
    const wardServiceAvgs: Record<string, number> = {};
    serviceKeys.forEach(key => {
        wardServiceAvgs[key] = wardCells.reduce((s, c) => s + c.service_distances[key], 0) / wardCells.length;
    });

    // ── Insight 1: Weakest service (largest distance relative to threshold) ──
    let worstService = '';
    let worstRatio = 0;
    serviceKeys.forEach(key => {
        const threshold = THRESHOLDS[key];
        const ratio = wardServiceAvgs[key] / threshold;
        if (ratio > worstRatio) {
            worstRatio = ratio;
            worstService = key;
        }
    });

    if (worstService && worstRatio > 1) {
        const label = SERVICE_LABELS[worstService] || worstService;
        insights.push({
            id: 'ward_insight_1',
            title: `${label} Gap`,
            description: `${wardName}'s weakest service is ${label.toLowerCase()} — average distance is ${wardServiceAvgs[worstService].toFixed(1)}km, which is ${Math.round((worstRatio - 1) * 100)}% over the recommended ${THRESHOLDS[worstService as keyof typeof THRESHOLDS]}km threshold.`,
            type: 'negative',
            ward_name: wardName,
        });
    } else if (worstService) {
        // All services within threshold — positive
        insights.push({
            id: 'ward_insight_1',
            title: 'All Services Covered',
            description: `${wardName} has all critical services within recommended distances. The furthest service (${SERVICE_LABELS[worstService]}) averages just ${wardServiceAvgs[worstService].toFixed(1)}km.`,
            type: 'positive',
            ward_name: wardName,
        });
    }

    // ── Insight 2: City comparison ──
    const diff = wardAvgScore - cityAvgScore;
    if (diff >= 10) {
        insights.push({
            id: 'ward_insight_2',
            title: 'Above City Average',
            description: `${wardName} scores ${wardAvgScore}/100, which is ${diff} points above the city average of ${cityAvgScore}/100. Well-positioned for sustained growth.`,
            type: 'positive',
            ward_name: wardName,
        });
    } else if (diff <= -10) {
        insights.push({
            id: 'ward_insight_2',
            title: 'Below City Average',
            description: `${wardName} scores ${wardAvgScore}/100, which is ${Math.abs(diff)} points below the city average of ${cityAvgScore}/100. Targeted infrastructure investment needed.`,
            type: 'negative',
            ward_name: wardName,
        });
    } else {
        insights.push({
            id: 'ward_insight_2',
            title: 'Near City Average',
            description: `${wardName} scores ${wardAvgScore}/100, close to the city average of ${cityAvgScore}/100 (${diff > 0 ? '+' : ''}${diff} points).`,
            type: 'city-wide',
            ward_name: wardName,
        });
    }

    // ── Insight 3: Population pressure ──
    const popDensityAvg = wardCells.reduce((s, c) => s + (c.population_density || c.population_estimate / 0.73), 0) / wardCells.length;
    const cityPopDensityAvg = allCells.reduce((s, c) => s + (c.population_density || c.population_estimate / 0.73), 0) / allCells.length;
    const densityRatio = popDensityAvg / cityPopDensityAvg;

    if (densityRatio > 1.5 && wardAvgScore < cityAvgScore) {
        insights.push({
            id: 'ward_insight_3',
            title: 'High-Pressure Zone',
            description: `${wardName} has ${Math.round(densityRatio * 100 - 100)}% higher population density than city average, but below-average service access. ${(wardPop / 1000).toFixed(0)}k residents are underserved.`,
            type: 'negative',
            ward_name: wardName,
        });
    } else if (densityRatio > 1.3) {
        insights.push({
            id: 'ward_insight_3',
            title: 'Dense Population',
            description: `${wardName} serves ${(wardPop / 1000).toFixed(0)}k residents with ${Math.round(densityRatio * 100 - 100)}% above-average density. Monitor capacity as population grows.`,
            type: 'city-wide',
            ward_name: wardName,
        });
    } else {
        insights.push({
            id: 'ward_insight_3',
            title: 'Balanced Density',
            description: `${wardName} has manageable population density (${(wardPop / 1000).toFixed(0)}k residents) relative to its service infrastructure.`,
            type: 'positive',
            ward_name: wardName,
        });
    }

    return insights;
}
