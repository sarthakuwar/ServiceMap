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
    population_density?: number;
    service_distances: ServiceDistances;
    accessibility_score: number;
    locality_rating: number;
    priority_score: number;
    ward_id: string;
    ward_name: string;
    vulnerability_index?: number;
    fairness_adjusted_score?: number;
    n_nearest_averages?: {
        hospital_3: number;
        school_3: number;
        emergency_1: number;
        transit_1: number;
        [key: string]: number;
    };
    provenance?: {
        accessibility_sources: string[];
        population_source: string;
        facility_sources: string[];
        computed_at: string;
        formula_version: string;
    };
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

// ─── Grievance System Types ──────────────────────────────────────────────────

export type GrievanceCategory =
    | 'road_pothole'
    | 'water_supply'
    | 'sewage_drainage'
    | 'streetlight'
    | 'garbage'
    | 'public_toilet'
    | 'encroachment'
    | 'noise_pollution'
    | 'tree_hazard'
    | 'public_transport'
    | 'healthcare_access'
    | 'school_infra'
    | 'park_maintenance'
    | 'other';

export type GrievanceSeverity = 'low' | 'medium' | 'high' | 'critical';

export type GrievanceStatus =
    | 'submitted'
    | 'acknowledged'
    | 'under_review'
    | 'in_progress'
    | 'resolved'
    | 'citizen_confirmed'
    | 'reopened'
    | 'escalated'
    | 'closed';

export type GovernmentDepartment =
    | 'BBMP_Engineering'
    | 'BWSSB'
    | 'BESCOM'
    | 'SWM'
    | 'BMTC'
    | 'Health_Dept'
    | 'Education_Dept'
    | 'Horticulture'
    | 'Revenue'
    | 'Traffic_Police'
    | 'Town_Planning'
    | 'General_BBMP';

export type OfficerRole = 'field_engineer' | 'ward_supervisor' | 'zonal_commissioner' | 'commissioner';

export const CATEGORY_LABELS: Record<GrievanceCategory, string> = {
    road_pothole: 'Road & Potholes',
    water_supply: 'Water Supply',
    sewage_drainage: 'Sewage & Drainage',
    streetlight: 'Street Lights',
    garbage: 'Garbage Collection',
    public_toilet: 'Public Toilets',
    encroachment: 'Encroachment',
    noise_pollution: 'Noise Pollution',
    tree_hazard: 'Tree Hazard',
    public_transport: 'Bus Stop / Transit',
    healthcare_access: 'Healthcare Access',
    school_infra: 'School Infrastructure',
    park_maintenance: 'Parks & Playgrounds',
    other: 'Other Civic Issue',
};

export const CATEGORY_ICONS: Record<GrievanceCategory, string> = {
    road_pothole: '🕳️',
    water_supply: '💧',
    sewage_drainage: '🚰',
    streetlight: '💡',
    garbage: '🗑️',
    public_toilet: '🚻',
    encroachment: '🚧',
    noise_pollution: '🔊',
    tree_hazard: '🌳',
    public_transport: '🚌',
    healthcare_access: '🏥',
    school_infra: '🏫',
    park_maintenance: '🌳',
    other: '📋',
};

export const CATEGORY_TO_DEPARTMENT: Record<GrievanceCategory, GovernmentDepartment> = {
    road_pothole: 'BBMP_Engineering',
    water_supply: 'BWSSB',
    sewage_drainage: 'BWSSB',
    streetlight: 'BESCOM',
    garbage: 'SWM',
    public_toilet: 'Health_Dept',
    encroachment: 'Revenue',
    noise_pollution: 'Traffic_Police',
    tree_hazard: 'Horticulture',
    public_transport: 'BMTC',
    healthcare_access: 'Health_Dept',
    school_infra: 'Education_Dept',
    park_maintenance: 'Horticulture',
    other: 'General_BBMP',
};

export const DEPARTMENT_LABELS: Record<GovernmentDepartment, string> = {
    BBMP_Engineering: 'BBMP Engineering',
    BWSSB: 'BWSSB (Water & Sewerage)',
    BESCOM: 'BESCOM (Electricity)',
    SWM: 'Solid Waste Management',
    BMTC: 'BMTC (Transport)',
    Health_Dept: 'Public Health Dept',
    Education_Dept: 'Education Dept',
    Horticulture: 'Horticulture Dept',
    Revenue: 'Revenue Dept',
    Traffic_Police: 'Traffic Police',
    Town_Planning: 'BBMP Town Planning',
    General_BBMP: 'General BBMP',
};

export const STATUS_LABELS: Record<GrievanceStatus, string> = {
    submitted: 'Submitted',
    acknowledged: 'Acknowledged',
    under_review: 'Under Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    citizen_confirmed: 'Citizen Confirmed',
    reopened: 'Reopened',
    escalated: 'Escalated',
    closed: 'Closed',
};

export const STATUS_COLORS: Record<GrievanceStatus, string> = {
    submitted: '#f59e0b',
    acknowledged: '#3b82f6',
    under_review: '#8b5cf6',
    in_progress: '#f97316',
    resolved: '#10b981',
    citizen_confirmed: '#059669',
    reopened: '#ef4444',
    escalated: '#dc2626',
    closed: '#64748b',
};

export interface GrievanceLocation {
    lat: number;
    lng: number;
    address_text?: string;
    cell_id?: string;
    ward_id?: string;
    ward_name?: string;
}

export interface GrievanceSubmission {
    category: GrievanceCategory;
    severity: GrievanceSeverity;
    title: string;
    description: string;
    location: GrievanceLocation;
    photo_urls?: string[];
    citizen_name: string;
    citizen_phone: string;
    citizen_email?: string;
    is_anonymous: boolean;
}

export interface Grievance {
    id: string;
    tracking_number: string;
    category: GrievanceCategory;
    severity: GrievanceSeverity;
    severity_official?: GrievanceSeverity;
    title: string;
    description: string;
    status: GrievanceStatus;
    department: GovernmentDepartment;
    location: GrievanceLocation;
    photo_urls: string[];
    citizen_name: string;
    citizen_phone: string;
    citizen_email?: string;
    is_anonymous: boolean;
    created_at: string;
    updated_at: string;
    acknowledged_at?: string;
    resolved_at?: string;
    closed_at?: string;
    sla_ack_deadline: string;
    sla_resolve_deadline: string;
    escalation_level: number;
    assigned_officer?: OfficerInfo;
    resolution_notes?: string;
    resolution_photos?: string[];
    citizen_satisfaction?: number;
    citizen_feedback?: string;
    accessibility_score_at_filing?: number;
    vulnerability_index_at_filing?: number;
    timeline: GrievanceTimelineEntry[];
    upvotes: number;
}

export interface OfficerInfo {
    id: string;
    name: string;
    designation: string;
    department: GovernmentDepartment;
    ward_id?: string;
    phone: string;
    email: string;
    role: OfficerRole;
}

export interface GrievanceTimelineEntry {
    id: string;
    timestamp: string;
    action: string;
    actor_type: 'system' | 'citizen' | 'officer';
    actor_name: string;
    notes?: string;
}

export interface GrievanceDashboardStats {
    total: number;
    pending_ack: number;
    in_progress: number;
    resolved_this_month: number;
    avg_resolution_days: number;
    sla_compliance_rate: number;
    overdue: number;
    by_category: Record<string, number>;
    by_ward: Record<string, number>;
    by_status: Record<string, number>;
    by_department: Record<string, number>;
}
