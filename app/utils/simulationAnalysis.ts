import { GridCell, SimulationAnalysis, CoverageImprovements, AffectedWard } from '../types';

// ─── Coverage Thresholds (km) ────────────────────────────────────────────────
// A cell is "covered" if the nearest facility of that type is within this distance

const COVERAGE_THRESHOLDS = {
    healthcare: 3,   // hospital within 3 km
    emergency: 4,    // police/fire within 4 km
    transit: 1.5,    // bus stop within 1.5 km
    education: 2,    // school within 2 km
};

// ─── Utility ─────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
}

function avgField(cells: GridCell[], field: (c: GridCell) => number): number {
    if (cells.length === 0) return 0;
    return cells.reduce((sum, c) => sum + field(c), 0) / cells.length;
}

// ─── Coverage Improvements ──────────────────────────────────────────────────

function coveragePercent(cells: GridCell[], serviceKey: keyof GridCell['service_distances'], threshold: number): number {
    if (cells.length === 0) return 0;
    const totalPop = cells.reduce((s, c) => s + c.population_estimate, 0);
    if (totalPop === 0) return 0;
    const coveredPop = cells
        .filter(c => c.service_distances[serviceKey] <= threshold)
        .reduce((s, c) => s + c.population_estimate, 0);
    return Math.round((coveredPop / totalPop) * 100);
}

export function computeCoverageImprovements(
    before: GridCell[],
    after: GridCell[]
): CoverageImprovements {
    const bHealth = coveragePercent(before, 'hospital', COVERAGE_THRESHOLDS.healthcare);
    const aHealth = coveragePercent(after, 'hospital', COVERAGE_THRESHOLDS.healthcare);

    const bPolice = coveragePercent(before, 'police_station', COVERAGE_THRESHOLDS.emergency);
    const aPolice = coveragePercent(after, 'police_station', COVERAGE_THRESHOLDS.emergency);

    const bFire = coveragePercent(before, 'fire_station', COVERAGE_THRESHOLDS.emergency);
    const aFire = coveragePercent(after, 'fire_station', COVERAGE_THRESHOLDS.emergency);

    const bTransit = coveragePercent(before, 'bus_stop', COVERAGE_THRESHOLDS.transit);
    const aTransit = coveragePercent(after, 'bus_stop', COVERAGE_THRESHOLDS.transit);

    const bEdu = coveragePercent(before, 'school', COVERAGE_THRESHOLDS.education);
    const aEdu = coveragePercent(after, 'school', COVERAGE_THRESHOLDS.education);

    return {
        healthcare: aHealth - bHealth,
        emergency: Math.max(aPolice - bPolice, aFire - bFire),
        transit: aTransit - bTransit,
        education: aEdu - bEdu,
    };
}

// ─── Service Distance Comparison ─────────────────────────────────────────────

export interface ServiceDistanceComparison {
    service: string;
    label: string;
    beforeAvg: number;
    afterAvg: number;
    delta: number;
    threshold: number;
    beforeCoveragePercent: number;
    afterCoveragePercent: number;
}

export function computeServiceDistanceComparison(
    before: GridCell[],
    after: GridCell[]
): ServiceDistanceComparison[] {
    const services: { key: keyof GridCell['service_distances']; label: string; threshold: number }[] = [
        { key: 'hospital', label: 'Healthcare', threshold: COVERAGE_THRESHOLDS.healthcare },
        { key: 'school', label: 'Education', threshold: COVERAGE_THRESHOLDS.education },
        { key: 'bus_stop', label: 'Transit', threshold: COVERAGE_THRESHOLDS.transit },
        { key: 'police_station', label: 'Police', threshold: COVERAGE_THRESHOLDS.emergency },
        { key: 'fire_station', label: 'Fire Services', threshold: COVERAGE_THRESHOLDS.emergency },
    ];

    return services.map(({ key, label, threshold }) => {
        const beforeAvg = before.length > 0
            ? before.reduce((s, c) => s + c.service_distances[key], 0) / before.length
            : 0;
        const afterAvg = after.length > 0
            ? after.reduce((s, c) => s + c.service_distances[key], 0) / after.length
            : 0;

        return {
            service: key,
            label,
            beforeAvg: Math.round(beforeAvg * 100) / 100,
            afterAvg: Math.round(afterAvg * 100) / 100,
            delta: Math.round((afterAvg - beforeAvg) * 100) / 100,
            threshold,
            beforeCoveragePercent: coveragePercent(before, key, threshold),
            afterCoveragePercent: coveragePercent(after, key, threshold),
        };
    });
}

// ─── Vulnerability Reduction ─────────────────────────────────────────────────

export function computeVulnerabilityReduction(
    before: GridCell[],
    after: GridCell[]
): { before: number; after: number } {
    const avgBefore = Math.round(avgField(before, c => c.vulnerability_index ?? 0));
    const avgAfter = Math.round(avgField(after, c => c.vulnerability_index ?? 0));
    return { before: avgBefore, after: avgAfter };
}

// ─── Affected Wards ──────────────────────────────────────────────────────────

export function computeAffectedWards(
    before: GridCell[],
    after: GridCell[]
): AffectedWard[] {
    // Build lookup from after by cell_id
    const afterMap = new Map<string, GridCell>();
    after.forEach(c => afterMap.set(c.cell_id, c));

    // Group by ward
    const wardData: Record<string, {
        wardId: string;
        beforeScores: number[];
        afterScores: number[];
        pop: number;
    }> = {};

    before.forEach(bCell => {
        const aCell = afterMap.get(bCell.cell_id);
        if (!aCell) return;

        const key = bCell.ward_name;
        if (!wardData[key]) {
            wardData[key] = { wardId: bCell.ward_id, beforeScores: [], afterScores: [], pop: 0 };
        }
        wardData[key].beforeScores.push(bCell.accessibility_score);
        wardData[key].afterScores.push(aCell.accessibility_score);
        wardData[key].pop += bCell.population_estimate;
    });

    const result: AffectedWard[] = [];
    for (const [wardName, data] of Object.entries(wardData)) {
        const avgBefore = Math.round(data.beforeScores.reduce((a, b) => a + b, 0) / data.beforeScores.length);
        const avgAfter = Math.round(data.afterScores.reduce((a, b) => a + b, 0) / data.afterScores.length);
        const delta = avgAfter - avgBefore;

        if (delta > 0) {
            result.push({
                wardName,
                wardId: data.wardId,
                accessibilityBefore: avgBefore,
                accessibilityAfter: avgAfter,
                accessibilityDelta: delta,
                populationAffected: data.pop,
            });
        }
    }

    return result.sort((a, b) => b.accessibilityDelta - a.accessibilityDelta);
}

// ─── Impact Score ────────────────────────────────────────────────────────────

export function computeImpactScore(
    zonesImproved: number,
    totalZones: number,
    avgScoreIncrease: number,
    populationAffected: number,
    totalPopulation: number,
    vulnerabilityReduction: { before: number; after: number },
    matchedGrievances: number
): number {
    const accessibilityFactor = clamp((avgScoreIncrease / 20) * 100, 0, 100);
    const populationFactor = clamp((populationAffected / Math.max(1, totalPopulation)) * 100 * 3, 0, 100);
    const vulnFactor = clamp((vulnerabilityReduction.before - vulnerabilityReduction.after) * 5, 0, 100);
    const grievanceFactor = clamp(matchedGrievances * 5, 0, 100);

    return Math.round(
        0.4 * accessibilityFactor +
        0.3 * populationFactor +
        0.2 * vulnFactor +
        0.1 * grievanceFactor
    );
}

// ─── Insight Narrative ──────────────────────────────────────────────────────

const FACILITY_LABELS: Record<string, string> = {
    hospital: 'healthcare facility',
    school: 'educational institution',
    bus_stop: 'transit hub',
    police_station: 'police station',
    fire_station: 'fire station',
};

export function generateInsightNarrative(
    facilityTypes: string[],
    populationAffected: number,
    zonesImproved: number,
    avgScoreIncrease: number,
    affectedWards: AffectedWard[]
): string {
    const primaryType = facilityTypes[facilityTypes.length - 1] || 'facility';
    const label = FACILITY_LABELS[primaryType] || primaryType;
    const popStr = populationAffected >= 1000
        ? `${(populationAffected / 1000).toFixed(1)}k`
        : `${populationAffected}`;
    const wardNames = affectedWards.slice(0, 3).map(w => w.wardName).join(', ');

    if (zonesImproved === 0) {
        return 'No significant impact detected from this placement. Consider relocating the facility to an underserved area.';
    }

    return `Infrastructure placement significantly improves ${label.replace('_', ' ')} access for ${popStr} residents across ${zonesImproved} zone${zonesImproved > 1 ? 's' : ''}, raising average accessibility by ${avgScoreIncrease.toFixed(1)} points${affectedWards.length > 0 ? ` and reducing service vulnerability in ${wardNames}` : ''}.`;
}

// ─── Planning Recommendation ─────────────────────────────────────────────────

export function generatePlanningRecommendation(
    facilityTypes: string[],
    affectedWards: AffectedWard[],
    impactScore: number,
    matchedGrievances: number
): string {
    const primaryType = facilityTypes[facilityTypes.length - 1] || 'facility';
    const label = FACILITY_LABELS[primaryType] || primaryType;
    const bestWard = affectedWards.length > 0 ? affectedWards[0] : null;

    if (!bestWard) {
        return 'Consider an alternative location with higher unmet service demand for maximum impact.';
    }

    let rec = `Recommendation: Construct a ${label.charAt(0).toUpperCase() + label.slice(1)} in ${bestWard.wardName}.`;
    rec += ` Expected Impact Score: ${impactScore}/100.`;

    if (matchedGrievances > 0) {
        rec += ` Addresses ${matchedGrievances} open citizen complaint${matchedGrievances > 1 ? 's' : ''}.`;
    }

    return rec;
}

// ─── Full Analysis Builder ──────────────────────────────────────────────────

export function buildSimulationAnalysis(
    originalCells: GridCell[],
    simulatedCells: GridCell[],
    facilityTypes: string[],
    populationAffected: number,
    zonesImproved: number,
    avgScoreIncrease: number,
    matchedGrievances: number = 0
): SimulationAnalysis {
    const coverage = computeCoverageImprovements(originalCells, simulatedCells);
    const vuln = computeVulnerabilityReduction(originalCells, simulatedCells);
    const wards = computeAffectedWards(originalCells, simulatedCells);
    const totalPop = originalCells.reduce((s, c) => s + c.population_estimate, 0);

    const impactScore = computeImpactScore(
        zonesImproved, originalCells.length, avgScoreIncrease,
        populationAffected, totalPop, vuln, matchedGrievances
    );

    const narrative = generateInsightNarrative(
        facilityTypes, populationAffected, zonesImproved, avgScoreIncrease, wards
    );

    const recommendation = generatePlanningRecommendation(
        facilityTypes, wards, impactScore, matchedGrievances
    );

    return {
        beforeCells: originalCells,
        afterCells: simulatedCells,
        populationAffected,
        zonesImproved,
        avgScoreIncrease,
        coverageImprovements: coverage,
        vulnerabilityReduction: vuln,
        affectedWards: wards,
        impactScore,
        insightNarrative: narrative,
        recommendation,
        matchedGrievanceCount: matchedGrievances,
    };
}
