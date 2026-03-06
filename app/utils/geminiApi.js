"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithGemini = chatWithGemini;
exports.generateAIInsights = generateAIInsights;
exports.generateVulnerabilityPlan = generateVulnerabilityPlan;
var GEMINI_API_KEY = "AIzaSyDzEy7zyVwxsiAXNLHPs9NyMIgR2LR3w_U";
var GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
];
function getGeminiUrl(model) {
    return "https://generativelanguage.googleapis.com/v1beta/models/".concat(model, ":generateContent?key=").concat(GEMINI_API_KEY);
}
function callGeminiWithFallback(body) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, GEMINI_MODELS_1, model, response, errorText, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, GEMINI_MODELS_1 = GEMINI_MODELS;
                    _a.label = 1;
                case 1:
                    if (!(_i < GEMINI_MODELS_1.length)) return [3 /*break*/, 9];
                    model = GEMINI_MODELS_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    return [4 /*yield*/, fetch(getGeminiUrl(model), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                        })];
                case 3:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.json()];
                case 4: return [2 /*return*/, _a.sent()];
                case 5: return [4 /*yield*/, response.text()];
                case 6:
                    errorText = _a.sent();
                    // If it's a quota/rate error, try next model
                    if (response.status === 429 || response.status === 503) {
                        console.warn("Model ".concat(model, " quota exhausted, trying next..."));
                        return [3 /*break*/, 8];
                    }
                    // For other errors, log and try next
                    console.warn("Model ".concat(model, " error (").concat(response.status, "):"), errorText);
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.warn("Model ".concat(model, " network error:"), err_1);
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/, null]; // All models failed
            }
        });
    });
}
function buildPlatformContext(cells, facilities, recommendations) {
    if (!cells || cells.length === 0)
        return "No data available.";
    var wardScores = {};
    cells.forEach(function (c) {
        if (!wardScores[c.ward_name])
            wardScores[c.ward_name] = { scores: [], pop: 0, vuln: [] };
        wardScores[c.ward_name].scores.push(c.accessibility_score);
        wardScores[c.ward_name].pop += c.population_estimate;
        if (c.vulnerability_index !== undefined)
            wardScores[c.ward_name].vuln.push(c.vulnerability_index);
    });
    var wardSummaries = Object.entries(wardScores).map(function (_a) {
        var name = _a[0], data = _a[1];
        var avg = Math.round(data.scores.reduce(function (a, b) { return a + b; }, 0) / data.scores.length);
        var avgVuln = data.vuln.length > 0
            ? Math.round(data.vuln.reduce(function (a, b) { return a + b; }, 0) / data.vuln.length)
            : null;
        return {
            name: name,
            avgScore: avg,
            population: data.pop,
            zones: data.scores.length,
            avgVulnerability: avgVuln,
        };
    });
    var cityAvg = Math.round(cells.reduce(function (s, c) { return s + c.accessibility_score; }, 0) / cells.length);
    var deserts = cells.filter(function (c) { return c.accessibility_score < 40 && c.population_estimate > 10000; });
    var totalPop = cells.reduce(function (s, c) { return s + c.population_estimate; }, 0);
    var context = "You are an AI assistant for ServiceMap, an urban infrastructure accessibility platform for Bangalore, India.\n\nCITY-WIDE STATISTICS:\n- Total hex zones analyzed: ".concat(cells.length, "\n- City average accessibility score: ").concat(cityAvg, "/100\n- Total population covered: ").concat((totalPop / 1000).toFixed(1), "k\n- Service deserts (score<40, pop>10k): ").concat(deserts.length, " zones\n- Underserved population: ").concat((deserts.reduce(function (s, c) { return s + c.population_estimate; }, 0) / 1000).toFixed(1), "k\n\nWARD-LEVEL DATA:\n").concat(wardSummaries.map(function (w) { return "- ".concat(w.name, ": Avg Score=").concat(w.avgScore, "/100, Pop=").concat((w.population / 1000).toFixed(1), "k, Zones=").concat(w.zones).concat(w.avgVulnerability !== null ? ", Vulnerability=".concat(w.avgVulnerability) : ""); }).join("\n"), "\n\nSCORING SYSTEM:\n- Accessibility Score (0-100): Weighted composite of distance to hospital (35%), transit (25%), school (20%), emergency services (20%)\n- Score \u226580 = Excellent, \u226560 = Moderate, \u226540 = Below Average, <40 = Critical\n- Locality Rating: 1-5 stars based on score\n\nSERVICE DISTANCE AVERAGES (km):\n").concat((function () {
        var avgDist = {
            hospital: cells.reduce(function (s, c) { return s + c.service_distances.hospital; }, 0) /
                cells.length,
            school: cells.reduce(function (s, c) { return s + c.service_distances.school; }, 0) / cells.length,
            bus_stop: cells.reduce(function (s, c) { return s + c.service_distances.bus_stop; }, 0) /
                cells.length,
            police_station: cells.reduce(function (s, c) { return s + c.service_distances.police_station; }, 0) /
                cells.length,
            fire_station: cells.reduce(function (s, c) { return s + c.service_distances.fire_station; }, 0) /
                cells.length,
        };
        return Object.entries(avgDist)
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return "- ".concat(k, ": ").concat(v.toFixed(2), " km");
        })
            .join("\n");
    })());
    if (recommendations && recommendations.length > 0) {
        context += "\n\nTOP INFRASTRUCTURE RECOMMENDATIONS:\n";
        recommendations.slice(0, 5).forEach(function (r) {
            context += "- ".concat(r.ward_name, ": ").concat(r.recommendation_text, " (Severity: ").concat(r.severity, ", Missing: ").concat(r.missing_service, ")\n");
        });
    }
    return context;
}
function buildSingleWardContext(cell) {
    var vulnScore = cell.vulnerability_index || 0;
    var accessScore = cell.accessibility_score;
    var pop = (cell.population_estimate / 1000).toFixed(1);
    var _a = cell.service_distances, hospital = _a.hospital, school = _a.school, bus_stop = _a.bus_stop, police_station = _a.police_station, fire_station = _a.fire_station;
    var gaps = [];
    if (hospital > 4)
        gaps.push("Critical: Hospital > 4km");
    else if (hospital > 2)
        gaps.push("Moderate: Hospital > 2km");
    if (school > 3)
        gaps.push("Critical: School > 3km");
    else if (school > 1.5)
        gaps.push("Moderate: School > 1.5km");
    if (bus_stop > 2)
        gaps.push("Critical: Transit > 2km");
    else if (bus_stop > 0.8)
        gaps.push("Moderate: Transit > 0.8km");
    if (police_station > 5)
        gaps.push("Critical: Police > 5km");
    if (fire_station > 5)
        gaps.push("Critical: Fire Station > 5km");
    return "WARD CONTEXT:\nWard Name: ".concat(cell.ward_name, "\nPopulation: ").concat(pop, "k\nVulnerability Index: ").concat(vulnScore, "/100 (Higher is worse)\nAccessibility Score: ").concat(accessScore, "/100 (Higher is better)\n\nLOCAL SERVICE DISTANCES (km):\n- Hospital: ").concat(hospital.toFixed(2), "\n- School: ").concat(school.toFixed(2), "\n- Transit (Bus): ").concat(bus_stop.toFixed(2), "\n- Police Station: ").concat(police_station.toFixed(2), "\n- Fire Station: ").concat(fire_station.toFixed(2), "\n\nSERVICE GAPS IDENTIFIED:\n").concat(gaps.length > 0 ? gaps.map(function (g) { return "- ".concat(g); }).join('\n') : "None detected based on thresholds.");
}
function chatWithGemini(query, cells, facilities, recommendations, conversationHistory) {
    return __awaiter(this, void 0, void 0, function () {
        var context, contents, data, err_2;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    context = buildPlatformContext(cells, facilities, recommendations);
                    contents = [];
                    // System context as first user message
                    contents.push({
                        role: "user",
                        parts: [
                            {
                                text: "".concat(context, "\n\nIMPORTANT: You are embedded in the ServiceMap dashboard. Keep responses concise (2-4 sentences max), data-driven, and actionable. Use specific numbers from the data. If asked about wards, scores, or services, refer to the actual data above. Format key stats in bold using **bold**."),
                            },
                        ],
                    });
                    contents.push({
                        role: "model",
                        parts: [
                            {
                                text: "Understood. I'm ready to help analyze Bangalore's infrastructure data. Ask me anything about ward scores, service coverage, or improvement priorities.",
                            },
                        ],
                    });
                    // Add conversation history
                    if (conversationHistory) {
                        conversationHistory.forEach(function (msg) {
                            contents.push({
                                role: msg.role === "user" ? "user" : "model",
                                parts: [{ text: msg.text }],
                            });
                        });
                    }
                    // Add current query
                    contents.push({
                        role: "user",
                        parts: [{ text: query }],
                    });
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, callGeminiWithFallback({
                            contents: contents,
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 300,
                                topP: 0.9,
                            },
                        })];
                case 2:
                    data = _f.sent();
                    if (!data) {
                        return [2 /*return*/, "Sorry, all AI models are currently at capacity. Please try again in a minute."];
                    }
                    return [2 /*return*/, (((_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) ||
                            "No response generated.")];
                case 3:
                    err_2 = _f.sent();
                    console.error("Gemini API error:", err_2);
                    return [2 /*return*/, "Connection error. Please check your network and try again."];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function generateAIInsights(cells, recommendations) {
    return __awaiter(this, void 0, void 0, function () {
        var targetCell, context, prompt, data, err_3;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    targetCell = cells[0];
                    if (!targetCell)
                        return [2 /*return*/, "[]"];
                    context = buildSingleWardContext(targetCell);
                    prompt = "".concat(context, "\n\nINSTRUCTIONS:\nBased ONLY on the data provided above, generate exactly 3 highly specific infrastructure insights for this ward as a JSON array constraint. Do not use outside city-wide data.\n\nRules for Determinism:\n1. If there are \"Critical\" service gaps, prioritize creating a \"negative\" insight for the worst gap.\n2. If \"Vulnerability Index\" > 60, prioritize a \"negative\" insight regarding high vulnerability paired with population size.\n3. If \"Accessibility Score\" > 75, create a \"positive\" insight highlighting good overall service coverage.\n4. Output MUST be ONLY valid JSON, adhering to this strict schema:\n[{\n  \"id\": \"must be unique, e.g., 'insight_1'\",\n  \"title\": \"Short title, max 5 words\",\n  \"description\": \"Exactly one sentence referencing a specific number from the context.\",\n  \"type\": \"negative\" or \"positive\",\n  \"ward_name\": \"").concat(targetCell.ward_name, "\",\n  \"priority\": number (1 is highest, 3 is lowest)\n}]\nNO markdown formatting. NO conversational introductory text. ONLY the JSON array.");
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, callGeminiWithFallback({
                            contents: [{ role: "user", parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.3,
                                maxOutputTokens: 800,
                                topP: 0.8,
                            },
                        })];
                case 2:
                    data = _f.sent();
                    if (!data) {
                        console.warn("All Gemini models exhausted for insights");
                        return [2 /*return*/, ""];
                    }
                    return [2 /*return*/, ((_e = (_d = (_c = (_b = (_a = data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || ""];
                case 3:
                    err_3 = _f.sent();
                    console.error("Gemini insights error:", err_3);
                    return [2 /*return*/, ""];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function generateVulnerabilityPlan(cell) {
    return __awaiter(this, void 0, void 0, function () {
        var context, prompt, data, err_4;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    context = buildSingleWardContext(cell);
                    prompt = "".concat(context, "\n\nINSTRUCTIONS:\nYou are an austere urban planning system. Based strictly on the data provided above, output a 3-step mitigation action plan designed to reduce vulnerability.\n\nRules for Determinism:\n1. Output format MUST be exactly three numbered points.\n2. Step 1 MUST address the nearest critical service gap, or if none, the lowest performing accessibility metric.\n3. Step 2 MUST address population density management or transit connectivity.\n4. Step 3 MUST be a specific, measurable administrative or policy action based on the data.\n5. Use bold text for metric emphasis.\n6. DO NOT include any introductory or concluding sentences. DO NOT say \"Here is the plan:\". Return ONLY the numbered list.");
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, callGeminiWithFallback({
                            contents: [{ role: "user", parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.5,
                                maxOutputTokens: 600,
                            },
                        })];
                case 2:
                    data = _f.sent();
                    return [2 /*return*/, ((_e = (_d = (_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.text) || "Unable to generate plan at this time."];
                case 3:
                    err_4 = _f.sent();
                    console.error("Gemini plan error:", err_4);
                    return [2 /*return*/, "Connection error while generating AI Action Plan."];
                case 4: return [2 /*return*/];
            }
        });
    });
}
