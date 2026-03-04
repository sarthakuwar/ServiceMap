import { GridCell, Facility, Recommendation } from '../types';

const GEMINI_API_KEY = '';

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
];

function getGeminiUrl(model: string) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
}

async function callGeminiWithFallback(body: any): Promise<any> {
    for (const model of GEMINI_MODELS) {
        try {
            const response = await fetch(getGeminiUrl(model), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                return await response.json();
            }

            const errorText = await response.text();
            // If it's a quota/rate error, try next model
            if (response.status === 429 || response.status === 503) {
                console.warn(`Model ${model} quota exhausted, trying next...`);
                continue;
            }
            // For other errors, log and try next
            console.warn(`Model ${model} error (${response.status}):`, errorText);
            continue;
        } catch (err) {
            console.warn(`Model ${model} network error:`, err);
            continue;
        }
    }
    return null; // All models failed
}

function buildPlatformContext(cells: GridCell[], facilities?: Facility[], recommendations?: Recommendation[]): string {
    if (!cells || cells.length === 0) return 'No data available.';

    const wardScores: Record<string, { scores: number[]; pop: number; vuln: number[] }> = {};
    cells.forEach(c => {
        if (!wardScores[c.ward_name]) wardScores[c.ward_name] = { scores: [], pop: 0, vuln: [] };
        wardScores[c.ward_name].scores.push(c.accessibility_score);
        wardScores[c.ward_name].pop += c.population_estimate;
        if (c.vulnerability_index !== undefined) wardScores[c.ward_name].vuln.push(c.vulnerability_index);
    });

    const wardSummaries = Object.entries(wardScores).map(([name, data]) => {
        const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        const avgVuln = data.vuln.length > 0 ? Math.round(data.vuln.reduce((a, b) => a + b, 0) / data.vuln.length) : null;
        return { name, avgScore: avg, population: data.pop, zones: data.scores.length, avgVulnerability: avgVuln };
    });

    const cityAvg = Math.round(cells.reduce((s, c) => s + c.accessibility_score, 0) / cells.length);
    const deserts = cells.filter(c => c.accessibility_score < 40 && c.population_estimate > 10000);
    const totalPop = cells.reduce((s, c) => s + c.population_estimate, 0);

    let context = `You are an AI assistant for ServiceMap, an urban infrastructure accessibility platform for Bangalore, India.

CITY-WIDE STATISTICS:
- Total hex zones analyzed: ${cells.length}
- City average accessibility score: ${cityAvg}/100
- Total population covered: ${(totalPop / 1000).toFixed(1)}k
- Service deserts (score<40, pop>10k): ${deserts.length} zones
- Underserved population: ${(deserts.reduce((s, c) => s + c.population_estimate, 0) / 1000).toFixed(1)}k

WARD-LEVEL DATA:
${wardSummaries.map(w => `- ${w.name}: Avg Score=${w.avgScore}/100, Pop=${(w.population / 1000).toFixed(1)}k, Zones=${w.zones}${w.avgVulnerability !== null ? `, Vulnerability=${w.avgVulnerability}` : ''}`).join('\n')}

SCORING SYSTEM:
- Accessibility Score (0-100): Weighted composite of distance to hospital (35%), transit (25%), school (20%), emergency services (20%)
- Score ≥80 = Excellent, ≥60 = Moderate, ≥40 = Below Average, <40 = Critical
- Locality Rating: 1-5 stars based on score

SERVICE DISTANCE AVERAGES (km):
${(() => {
            const avgDist = {
                hospital: cells.reduce((s, c) => s + c.service_distances.hospital, 0) / cells.length,
                school: cells.reduce((s, c) => s + c.service_distances.school, 0) / cells.length,
                bus_stop: cells.reduce((s, c) => s + c.service_distances.bus_stop, 0) / cells.length,
                police_station: cells.reduce((s, c) => s + c.service_distances.police_station, 0) / cells.length,
                fire_station: cells.reduce((s, c) => s + c.service_distances.fire_station, 0) / cells.length,
            };
            return Object.entries(avgDist).map(([k, v]) => `- ${k}: ${v.toFixed(2)} km`).join('\n');
        })()}`;

    if (recommendations && recommendations.length > 0) {
        context += `\n\nTOP INFRASTRUCTURE RECOMMENDATIONS:\n`;
        recommendations.slice(0, 5).forEach(r => {
            context += `- ${r.ward_name}: ${r.recommendation_text} (Severity: ${r.severity}, Missing: ${r.missing_service})\n`;
        });
    }

    return context;
}

export async function chatWithGemini(
    query: string,
    cells: GridCell[],
    facilities?: Facility[],
    recommendations?: Recommendation[],
    conversationHistory?: { role: string; text: string }[]
): Promise<string> {
    const context = buildPlatformContext(cells, facilities, recommendations);

    const contents: any[] = [];

    // System context as first user message
    contents.push({
        role: 'user',
        parts: [{ text: `${context}\n\nIMPORTANT: You are embedded in the ServiceMap dashboard. Keep responses concise (2-4 sentences max), data-driven, and actionable. Use specific numbers from the data. If asked about wards, scores, or services, refer to the actual data above. Format key stats in bold using **bold**.` }]
    });
    contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I\'m ready to help analyze Bangalore\'s infrastructure data. Ask me anything about ward scores, service coverage, or improvement priorities.' }]
    });

    // Add conversation history
    if (conversationHistory) {
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });
    }

    // Add current query
    contents.push({
        role: 'user',
        parts: [{ text: query }]
    });

    try {
        const data = await callGeminiWithFallback({
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
                topP: 0.9,
            }
        });

        if (!data) {
            return 'Sorry, all AI models are currently at capacity. Please try again in a minute.';
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    } catch (err) {
        console.error('Gemini API error:', err);
        return 'Connection error. Please check your network and try again.';
    }
}

export async function generateAIInsights(cells: GridCell[], recommendations?: Recommendation[]): Promise<string> {
    const context = buildPlatformContext(cells, undefined, recommendations);

    const prompt = `${context}

Based on the above data, generate exactly 5 actionable infrastructure insights as a JSON array. Each insight should have:
- "id": unique string like "ai_insight_1"
- "title": short punchy title (3-5 words)
- "description": one sentence with specific data points
- "type": one of "negative", "positive", "city-wide"  
- "ward_name": the relevant ward name (optional, omit for city-wide)
- "priority": number 1-5 (1=most urgent)

Prioritize: critical gaps first, then disparities, then positive highlights.
Return ONLY the JSON array, no markdown formatting or code blocks.`;

    try {
        const data = await callGeminiWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
                topP: 0.8,
            }
        });

        if (!data) {
            console.warn('All Gemini models exhausted for insights');
            return '';
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (err) {
        console.error('Gemini insights error:', err);
        return '';
    }
}
