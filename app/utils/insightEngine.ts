import { GridCell, Insight } from '../types';

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
