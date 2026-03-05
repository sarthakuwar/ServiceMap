'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GridCell, Facility, Recommendation, WardHistory, Insight } from './types';
import { useSimulation } from './hooks/useSimulation';
import { generateInsights } from './utils/insightEngine';
import { generateWardReport } from './utils/reportGenerator';

// Components
import LeftSidebar from './components/Sidebar/LeftSidebar';
import RightPanel from './components/Sidebar/RightPanel';
import StatsBar from './components/UI/StatsBar';
import SimulationToolbar from './components/Panels/SimulationToolbar';
import InsightsPanel from './components/Panels/InsightsPanel';
import LeaderboardPanel from './components/Panels/LeaderboardPanel';
import GovernancePanel from './components/Panels/GovernancePanel';
import AIChatbot from './components/UI/AIChatbot';
import GrievanceDashboard from './components/Grievances/GrievanceDashboard';
import GrievanceSubmitModal from './components/Grievances/GrievanceSubmitModal';

// Dynamic Map
const DynamicMap = dynamic(() => import('./components/Map/DynamicMap'), { ssr: false });
const WardDetailPage = dynamic(() => import('./components/Panels/WardDetailPage'), { ssr: false });

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'map' | 'sim' | 'rank' | 'report' | 'grievances'>('map');
  const [vulnerabilityMode, setVulnerabilityMode] = useState(false);

  // Data State
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [wardHistory, setWardHistory] = useState<WardHistory[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Simulation State
  const [activeSimType, setActiveSimType] = useState<string | null>(null);
  const { isSimulating, setIsSimulating, placedFacilities, simulatedCells, addFacility, reset, impactSummary } = useSimulation(gridCells);

  // Selection State
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const selectedCell = (isSimulating ? simulatedCells : gridCells).find(c => c.cell_id === selectedCellId) || null;
  const [visibleFacilities, setVisibleFacilities] = useState<string[]>([]);
  const [showWardDetail, setShowWardDetail] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [pendingGrievances, setPendingGrievances] = useState(0);

  const API_BASE = 'http://localhost:8000';

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/grid?vulnerability=true`).then(r => r.json()),
      fetch(`${API_BASE}/api/facilities`).then(r => r.json()),
      fetch(`${API_BASE}/api/recommendations`).then(r => r.json()),
      fetch(`${API_BASE}/api/ward-history`).then(r => r.json())
    ]).then(([cellsData, facData, recData, historyData]) => {
      setGridCells(cellsData);
      setFacilities(facData);
      setRecommendations(recData);
      setWardHistory(historyData);
      setInsights(generateInsights(cellsData));
      setLoading(false);
    }).catch(() => {
      console.warn('FastAPI backend unavailable, falling back to static JSON');
      Promise.all([
        fetch('/data/gridCells.json').then(r => r.json()),
        fetch('/data/facilities.json').then(r => r.json()),
        fetch('/data/recommendations.json').then(r => r.json()),
        fetch('/data/wardHistory.json').then(r => r.json())
      ]).then(([cellsData, facData, recData, historyData]) => {
        setGridCells(cellsData);
        setFacilities(facData);
        setRecommendations(recData);
        setWardHistory(historyData);
        setInsights(generateInsights(cellsData));
        setLoading(false);
      }).catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
    });
  }, []);

  // Fetch pending grievance count
  useEffect(() => {
    fetch(`${API_BASE}/api/grievances/stats`)
      .then(r => r.json())
      .then(s => setPendingGrievances(s.pending_ack || 0))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (isSimulating && simulatedCells.length > 0) {
      setInsights(generateInsights(simulatedCells));
    } else if (!isSimulating && gridCells.length > 0) {
      setInsights(generateInsights(gridCells));
    }
  }, [isSimulating, simulatedCells, gridCells]);

  useEffect(() => {
    if (activeView === 'sim') {
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
      setActiveSimType(null);
    }
  }, [activeView, setIsSimulating]);

  const handleGenerateReport = () => {
    if (selectedCell) {
      const wardRecs = recommendations.filter(r => r.ward_name === selectedCell.ward_name);
      generateWardReport(
        'service-map-container',
        selectedCell.ward_name,
        selectedCell.accessibility_score,
        selectedCell.locality_rating,
        selectedCell.population_estimate,
        wardRecs
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-emerald-600 font-medium animate-pulse">Loading city infrastructure data...</p>
      </div>
    );
  }

  const avgScore = gridCells.length > 0
    ? Math.round(gridCells.reduce((sum, c) => sum + c.accessibility_score, 0) / gridCells.length)
    : 0;

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <LeftSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        avgScore={avgScore}
        impactSummary={isSimulating ? impactSummary : null}
        vulnerabilityMode={vulnerabilityMode}
        setVulnerabilityMode={setVulnerabilityMode}
        visibleFacilities={visibleFacilities}
        setVisibleFacilities={setVisibleFacilities}
        onReportIssue={() => setShowGrievanceModal(true)}
        grievanceCount={pendingGrievances}
      />

      <main className="flex-1 relative flex">
        {/* Core Map Background */}
        <div className="absolute inset-0 z-[1]">
          <DynamicMap
            cells={isSimulating ? simulatedCells : gridCells}
            facilities={facilities}
            selectedCellId={selectedCellId}
            onCellClick={(c: GridCell) => {
              if (!isSimulating) {
                setSelectedCellId(c.cell_id);
                if (activeView !== 'map') setActiveView('map');
              }
            }}
            isSimulating={isSimulating}
            activeSimType={activeSimType}
            placedFacilities={placedFacilities}
            onPlaceFacility={(lat: number, lng: number) => activeSimType && addFacility(activeSimType, lat, lng)}
            visibleFacilities={visibleFacilities}
            vulnerabilityMode={vulnerabilityMode}
          />
        </div>

        {/* Global Overlays */}
        <StatsBar
          cells={gridCells}
          impactSummary={isSimulating ? impactSummary : null}
        />

        {/* Main Dashboard Overlays */}
        {activeView === 'map' && (
          <>
            <div className="absolute top-20 right-6 z-[1000] w-[320px]">
              <InsightsPanel insights={insights} cells={isSimulating ? simulatedCells : gridCells} recommendations={recommendations} />
            </div>

            <RightPanel
              cell={selectedCell}
              onClose={() => setSelectedCellId(null)}
              onGenerateReport={handleGenerateReport}
              onViewDetail={() => setShowWardDetail(true)}
            />
          </>
        )}

        {/* Ward Detail Page Overlay */}
        {showWardDetail && selectedCell && (
          <WardDetailPage
            cell={selectedCell}
            allCells={isSimulating ? simulatedCells : gridCells}
            wardHistory={wardHistory}
            onClose={() => setShowWardDetail(false)}
            onGenerateReport={handleGenerateReport}
          />
        )}

        {/* Simulation Overlays */}
        {activeView === 'sim' && (
          <SimulationToolbar
            activeType={activeSimType}
            setActiveType={setActiveSimType}
            onReset={reset}
            impactSummary={impactSummary}
          />
        )}

        {/* Leaderboard Overlay */}
        {activeView === 'rank' && (
          <div className="absolute inset-0 z-[2000] bg-white/95 backdrop-blur-lg overflow-hidden flex">
            <div className="w-1/2 h-full">
              <LeaderboardPanel cells={gridCells} recommendations={recommendations} />
            </div>
            <div className="w-1/2 h-full border-l border-slate-200">
              <GovernancePanel history={wardHistory} />
            </div>
          </div>
        )}

        {/* Grievance Dashboard Overlay */}
        {activeView === 'grievances' && (
          <div className="absolute inset-0 z-[2000] bg-white/95 backdrop-blur-lg overflow-hidden">
            <GrievanceDashboard />
          </div>
        )}

        {/* Report Export View */}
        {activeView === 'report' && (
          <div className="absolute inset-0 z-[2000] bg-white/90 backdrop-blur flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Export Analysis</h2>
              <p className="text-slate-500 mb-8">Select a neighborhood on the map to generate a detailed policy document summing up current infrastructure accessibility.</p>
              <button
                onClick={() => setActiveView('map')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg"
              >
                Back to Map
              </button>
            </div>
          </div>
        )}
      </main>

      {/* AI Chatbot FAB */}
      <AIChatbot cells={gridCells} facilities={facilities} recommendations={recommendations} />

      {/* Grievance Submission Modal */}
      <GrievanceSubmitModal
        isOpen={showGrievanceModal}
        onClose={() => setShowGrievanceModal(false)}
        prefilledLocation={selectedCell ? { lat: selectedCell.latitude, lng: selectedCell.longitude, ward_name: selectedCell.ward_name, cell_id: selectedCell.cell_id } : undefined}
        onSubmit={async (data) => {
          const res = await fetch(`${API_BASE}/api/grievances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json();
          // Refresh pending count
          fetch(`${API_BASE}/api/grievances/stats`)
            .then(r => r.json())
            .then(s => setPendingGrievances(s.pending_ack || 0))
            .catch(() => { });
          return result;
        }}
      />
    </div>
  );
}
