export interface MetricDefinition {
    name: string;
    description: string;
    formula: string;
    dataSource: string;
}

export const METRIC_DEFINITIONS: Record<string, MetricDefinition> = {
    accessibility_score: {
        name: 'Accessibility Score',
        description: 'Composite index measuring how easily residents can access essential services (hospitals, schools, transit, emergency). Higher is better.',
        formula: 'Weighted average of n-nearest service distances: hospital_3 (30%), school_3 (25%), emergency_1 (25%), transit_1 (20%)',
        dataSource: 'Calculated from facility geocoordinates via haversine distance',
    },
    vulnerability_index: {
        name: 'Vulnerability Index',
        description: 'Measures how underserved a cell is, combining service deficit with population density. Higher = more vulnerable.',
        formula: '0.6 × (1 - score/100) + 0.4 × normalized_population_density, scaled 0-100',
        dataSource: 'Derived from accessibility score and census population data',
    },
    fairness_adjusted_score: {
        name: 'Fairness Adjusted Score',
        description: 'Accessibility score penalized by vulnerability — ensures high-vulnerability areas get prioritized even with decent raw scores.',
        formula: 'accessibility_score - vulnerability_index × 0.15',
        dataSource: 'Computed from accessibility score and vulnerability index',
    },
    priority_score: {
        name: 'Priority Score',
        description: 'Combines population size with service deficit to rank areas by urgency for infrastructure investment.',
        formula: 'population_estimate × (1 - accessibility_score / 100)',
        dataSource: 'Population data + accessibility score',
    },
    civic_issues_resolved: {
        name: 'Civic Issues Resolved',
        description: 'Estimated resolution rate of civic complaints — areas with better accessibility tend to have faster resolution cycles.',
        formula: 'clamp(0.5 + accessibility_score / 200, 0.4, 0.95) × 100%',
        dataSource: 'Deterministic estimate based on ward accessibility',
    },
    service_coverage: {
        name: 'Service Coverage',
        description: 'Percentage of population within threshold distance of essential services.',
        formula: 'Population within thresholds: Hospital 3km, Police 4km, Transit 1.5km, School 2km',
        dataSource: 'Facility locations + population grid',
    },
    water_continuity: {
        name: 'Water Supply Continuity',
        description: 'Estimated daily hours of water supply — correlates positively with infrastructure accessibility.',
        formula: 'clamp(12 + accessibility_score / 10, 12, 23) hours/day',
        dataSource: 'Deterministic estimate based on ward accessibility',
    },
    waste_collection: {
        name: 'Waste Collection Efficiency',
        description: 'Estimated percentage of waste collected regularly — positively correlated with infrastructure density.',
        formula: 'clamp(70 + accessibility_score / 4, 65, 99)%',
        dataSource: 'Deterministic estimate based on ward accessibility',
    },
    locality_rating: {
        name: 'Locality Rating',
        description: 'Star rating (0-10) representing overall service quality of a locality.',
        formula: '10 × (accessibility_score / 100)',
        dataSource: 'Derived from accessibility score',
    },
    data_transparency: {
        name: 'Data Transparency Rating',
        description: 'Governance badge indicating whether a ward is improving, stable, or declining based on historical accessibility trends.',
        formula: 'Based on accessibility score trajectory over last 6 months',
        dataSource: 'Ward history data (wardHistory.json)',
    },
};

export function getMetricTooltip(key: string): string {
    const def = METRIC_DEFINITIONS[key];
    if (!def) return '';
    return `${def.description}\n\nFormula: ${def.formula}\nSource: ${def.dataSource}`;
}
