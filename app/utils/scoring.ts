import { ServiceDistances } from '../types';

export function computeAccessibilityScore(distances: ServiceDistances, n_nearest_averages?: Record<string, number>): number {
    if (n_nearest_averages) {
        const avg_hosp = n_nearest_averages.hospital_3 || 10;
        const avg_sch = n_nearest_averages.school_3 || 10;
        const near_emerg = n_nearest_averages.emergency_1 || 10;
        const near_bus = n_nearest_averages.transit_1 || 10;

        const score = (
            0.40 * Math.max(0, 100 - (avg_hosp * 10)) +
            0.30 * Math.max(0, 100 - (avg_sch * 15)) +
            0.20 * Math.max(0, 100 - (near_emerg * 10)) +
            0.10 * Math.max(0, 100 - (near_bus * 20))
        );
        return Math.round(score);
    }

    // Fallback if no averages
    const svc = (dist: number) => 1 / (1 + dist);
    const score =
        0.35 * svc(distances.hospital) +
        0.25 * svc(distances.bus_stop) +
        0.20 * svc(distances.school) +
        0.20 * svc(Math.min(distances.police_station, distances.fire_station));
    return Math.round(score * 100);
}

export function getLocalityRating(score: number): number {
    if (score >= 85) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
}

export function computePriorityScore(population: number, accessibilityScore: number): number {
    return parseFloat(((population / 1000) / Math.max(1, accessibilityScore)).toFixed(2));
}

export function getScoreColor(score: number): string {
    // Premium dark mode heatmap colors (Stitch UI aligned approx)
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 60) return '#fbbf24'; // amber-400
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
}

export function getGovernanceBadgeColor(badge: string): string {
    switch (badge) {
        case 'Improving':
            return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'Stable':
            return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'Declining':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
}
