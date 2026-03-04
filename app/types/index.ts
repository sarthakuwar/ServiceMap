export interface ServiceDistances {
    hospital: number;
    school: number;
    bus_stop: number;
    police_station: number;
    fire_station: number;
}

export interface GridCell {
    cell_id: string;
    latitude: number;
    longitude: number;
    population_estimate: number;
    service_distances: ServiceDistances;
    accessibility_score: number;
    locality_rating: number;
    priority_score: number;
    ward_id: string;
    ward_name: string;
    vulnerability_index?: number;
    fairness_adjusted_score?: number;
}

export interface Facility {
    id: string;
    type: string;
    name: string;
    lat: number;
    lng: number;
    display_name?: string;
    address?: string;
    phone?: string;
    hours?: string;
    emergency?: boolean;
}

export interface ContactEntry {
    id: string;
    type: string;
    display_name: string;
    distance_km: number;
    travel_time_min: number;
    address: string;
    phone: string;
    hours: string;
    emergency: boolean;
    lat: number;
    lng: number;
}

export interface Recommendation {
    id: string;
    cell_id: string;
    lat: number;
    lng: number;
    ward_name: string;
    population: number;
    priority_score: number;
    missing_service: string;
    recommendation_text: string;
    severity: 'Critical' | 'High' | 'Medium';
}

export interface WardHistory {
    ward_id: string;
    ward_name: string;
    history: Record<string, number>;
    badge: 'Improving' | 'Stable' | 'Declining';
}

export interface Feedback {
    id: string;
    lat: number;
    lng: number;
    issue_type: string;
    description: string;
    timestamp: string;
}

export interface Insight {
    id: string;
    title: string;
    description: string;
    type: 'positive' | 'negative' | 'neutral' | 'city-wide';
    ward_name?: string;
}
