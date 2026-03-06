import { Grievance, GrievanceCategory } from '../types';

// ─── Facility → Grievance Category Mapping ──────────────────────────────────
// Verified against types/index.ts GrievanceCategory and grievances.json seed data

const FACILITY_TO_CATEGORIES: Record<string, GrievanceCategory[]> = {
    hospital: ['healthcare_access'],
    school: ['school_infra'],
    bus_stop: ['public_transport'],
    police_station: ['encroachment', 'noise_pollution'],
    fire_station: [],
};

// ─── Match Grievances to Simulation ──────────────────────────────────────────

export function matchGrievancesToSimulation(
    grievances: Grievance[],
    facilityTypes: string[],
    affectedWardNames: string[]
): Grievance[] {
    // Collect all relevant categories from the placed facility types
    const relevantCategories = new Set<GrievanceCategory>();
    for (const ft of facilityTypes) {
        const cats = FACILITY_TO_CATEGORIES[ft] || [];
        cats.forEach(c => relevantCategories.add(c));
    }

    if (relevantCategories.size === 0) return [];

    // Normalize ward names for comparison
    const wardSet = new Set(affectedWardNames.map(w => w.toLowerCase()));

    return grievances.filter(g => {
        // Must be an open/active grievance
        const isActive = !['resolved', 'citizen_confirmed', 'closed'].includes(g.status);
        if (!isActive) return false;

        // Must match a relevant category
        if (!relevantCategories.has(g.category as GrievanceCategory)) return false;

        // Must be in an affected ward
        const wardName = g.location?.ward_name?.toLowerCase() || '';
        if (wardSet.size > 0 && !wardSet.has(wardName)) return false;

        return true;
    });
}

export function getMatchedGrievanceSummary(matched: Grievance[]): string {
    if (matched.length === 0) return '';

    const byCat: Record<string, number> = {};
    matched.forEach(g => {
        byCat[g.category] = (byCat[g.category] || 0) + 1;
    });

    const parts = Object.entries(byCat).map(([cat, count]) => {
        const label = cat.replace(/_/g, ' ');
        return `${count} ${label}`;
    });

    return `Addresses ${matched.length} open complaint${matched.length > 1 ? 's' : ''}: ${parts.join(', ')}.`;
}
