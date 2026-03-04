import fs from 'fs';
import path from 'path';
import startURL from 'url';
import * as h3 from 'h3-js';
import * as turf from '@turf/turf';

const __dirname = path.dirname(startURL.fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/data');

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Bounding box for Central Bangalore
const minLat = 12.92;
const maxLat = 13.02;
const minLng = 77.55;
const maxLng = 77.65;
const centerLat = (minLat + maxLat) / 2;
const centerLng = (minLng + maxLng) / 2;

const getRandomLocation = () => ({
    lat: minLat + Math.random() * (maxLat - minLat),
    lng: minLng + Math.random() * (maxLng - minLng),
});

// 1. Facilities
console.log('Generating facilities...');
const facilityTypes = ['hospital', 'school', 'bus_stop', 'police_station', 'fire_station'];
const facilities = [];
let idCounter = 1;

facilityTypes.forEach((type) => {
    const count = type === 'hospital' ? 12 : type === 'school' ? 40 : type === 'bus_stop' ? 80 : 10;
    for (let i = 0; i < count; i++) {
        const loc = getRandomLocation();
        facilities.push({
            id: `fac_${idCounter++}`,
            type,
            name: `City ${type} ${i + 1}`,
            lat: loc.lat,
            lng: loc.lng,
        });
    }
});
fs.writeFileSync(path.join(OUT_DIR, 'facilities.json'), JSON.stringify(facilities, null, 2));

// 2. Grid Cells
console.log('Generating H3 Grid Cells...');
const polygon = [
    [minLat, minLng],
    [minLat, maxLng],
    [maxLat, maxLng],
    [maxLat, minLng],
];
const cells = h3.polygonToCells(polygon, 8); // resolution 8

function distance(lat1, lon1, lat2, lon2) {
    const p = 0.017453292519943295;    // Math.PI / 180
    const c = Math.cos;
    const a = 0.5 - c((lat2 - lat1) * p) / 2 +
        c(lat1 * p) * c(lat2 * p) *
        (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

function computeAccessibilityScore(distances) {
    const svc = (dist) => 1 / (1 + dist);
    const score =
        0.35 * svc(distances.hospital) +
        0.25 * svc(distances.bus_stop) +
        0.20 * svc(distances.school) +
        0.20 * svc(Math.min(distances.police_station, distances.fire_station));
    return Math.round(score * 100);
}

const getLocalityRating = (score) => {
    if (score >= 85) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
};

const gridCells = cells.map(cellId => {
    const [lat, lng] = h3.cellToLatLng(cellId);
    const distFromCenter = distance(lat, lng, centerLat, centerLng);
    // Center-weighted population: closer to center = higher pop
    const popFactor = Math.max(0, 1 - (distFromCenter / 10)); // max distance across is ~14km, radius ~7km
    const population = Math.floor(1000 + (Math.random() * 20000) + (popFactor * 60000));

    const distances = {
        hospital: Infinity,
        school: Infinity,
        bus_stop: Infinity,
        police_station: Infinity,
        fire_station: Infinity
    };

    facilities.forEach(fac => {
        const d = distance(lat, lng, fac.lat, fac.lng);
        if (d < distances[fac.type]) {
            distances[fac.type] = d;
        }
    });

    const accessibility_score = computeAccessibilityScore(distances);
    const star_rating = getLocalityRating(accessibility_score);
    const priority_score = parseFloat(((population / 1000) / Math.max(1, accessibility_score)).toFixed(2));

    // Assign a ward ID loosely based on quadrant
    const isNorth = lat > centerLat;
    const isEast = lng > centerLng;
    const wardId = isNorth ? (isEast ? 'W1' : 'W2') : (isEast ? 'W3' : 'W4');
    const wardName = isNorth ? (isEast ? 'Indiranagar' : 'Malleshwaram') : (isEast ? 'Koramangala' : 'Jayanagar');

    return {
        cell_id: cellId,
        latitude: lat,
        longitude: lng,
        population_estimate: population,
        service_distances: distances,
        accessibility_score,
        locality_rating: star_rating,
        priority_score,
        ward_id: wardId,
        ward_name: wardName
    };
});
fs.writeFileSync(path.join(OUT_DIR, 'gridCells.json'), JSON.stringify(gridCells, null, 2));

// 3. Gap Analysis / Recommendations
console.log('Generating Recommendations...');
const recommendations = [];
gridCells.forEach(cell => {
    if (cell.accessibility_score < 40 && cell.population_estimate > 10000) {
        let missingService = 'general infrastructure';
        let missingType = 'hospital';
        if (cell.service_distances.hospital > 4) { missingService = 'hospital'; missingType = 'hospital'; }
        else if (cell.service_distances.school > 2) { missingService = 'school'; missingType = 'school'; }
        else if (cell.service_distances.bus_stop > 1) { missingService = 'transport hub'; missingType = 'transport_hub'; }
        else if (cell.service_distances.fire_station > 5) { missingService = 'fire station'; missingType = 'fire_station'; }

        recommendations.push({
            id: `rec_${cell.cell_id}`,
            cell_id: cell.cell_id,
            lat: cell.latitude,
            lng: cell.longitude,
            ward_name: cell.ward_name,
            population: cell.population_estimate,
            priority_score: cell.priority_score,
            missing_service: missingType,
            recommendation_text: `Build a ${missingService} near cell ${cell.cell_id.substring(0, 6)}`,
            severity: cell.priority_score > 5 ? 'Critical' : 'High'
        });
    }
});
recommendations.sort((a, b) => b.priority_score - a.priority_score);
fs.writeFileSync(path.join(OUT_DIR, 'recommendations.json'), JSON.stringify(recommendations.slice(0, 15), null, 2));

// 4. Ward Boundaries
console.log('Generating Ward Boundaries...');
// Create 4 large polygons for the 4 synthetic wards
const bboxW1 = [minLng + (maxLng - minLng) / 2, minLat + (maxLat - minLat) / 2, maxLng, maxLat]; // East, North
const bboxW2 = [minLng, minLat + (maxLat - minLat) / 2, minLng + (maxLng - minLng) / 2, maxLat]; // West, North
const bboxW3 = [minLng + (maxLng - minLng) / 2, minLat, maxLng, minLat + (maxLat - minLat) / 2]; // East, South
const bboxW4 = [minLng, minLat, minLng + (maxLng - minLng) / 2, minLat + (maxLat - minLat) / 2]; // West, South

const wardBoundaries = {
    type: "FeatureCollection",
    features: [
        turf.bboxPolygon(bboxW1, { properties: { id: 'W1', name: 'Indiranagar' } }),
        turf.bboxPolygon(bboxW2, { properties: { id: 'W2', name: 'Malleshwaram' } }),
        turf.bboxPolygon(bboxW3, { properties: { id: 'W3', name: 'Koramangala' } }),
        turf.bboxPolygon(bboxW4, { properties: { id: 'W4', name: 'Jayanagar' } })
    ]
};
// Add the specific properties correctly
wardBoundaries.features[0].properties = { id: 'W1', name: 'Indiranagar' };
wardBoundaries.features[1].properties = { id: 'W2', name: 'Malleshwaram' };
wardBoundaries.features[2].properties = { id: 'W3', name: 'Koramangala' };
wardBoundaries.features[3].properties = { id: 'W4', name: 'Jayanagar' };

fs.writeFileSync(path.join(OUT_DIR, 'wardBoundaries.json'), JSON.stringify(wardBoundaries, null, 2));

// 5. Ward History
console.log('Generating Ward History...');
const wardHistory = [
    { ward_id: 'W1', ward_name: 'Indiranagar', history: { 'Jan': 68, 'Feb': 72, 'Mar': 78 }, badge: 'Improving' },
    { ward_id: 'W2', ward_name: 'Malleshwaram', history: { 'Jan': 84, 'Feb': 83, 'Mar': 82 }, badge: 'Stable' },
    { ward_id: 'W3', ward_name: 'Koramangala', history: { 'Jan': 75, 'Feb': 76, 'Mar': 75 }, badge: 'Stable' },
    { ward_id: 'W4', ward_name: 'Jayanagar', history: { 'Jan': 62, 'Feb': 58, 'Mar': 52 }, badge: 'Declining' }
];
fs.writeFileSync(path.join(OUT_DIR, 'wardHistory.json'), JSON.stringify(wardHistory, null, 2));

// 6. Feedback
console.log('Generating Feedback...');
const feedback = [];
for (let i = 0; i < 8; i++) {
    const loc = getRandomLocation();
    feedback.push({
        id: `fb_${i}`,
        lat: loc.lat,
        lng: loc.lng,
        issue_type: 'infrastructure',
        description: `Need better access to public services in this area.`,
        timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    });
}
fs.writeFileSync(path.join(OUT_DIR, 'feedback.json'), JSON.stringify(feedback, null, 2));

console.log('All JSON files generated successfully in public/data');
