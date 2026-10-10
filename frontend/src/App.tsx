import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsCards } from './components/MetricsCards';
import { MapViewer } from './components/MapViewer';
import { CutOffSettlementsTable } from './components/CutOffSettlementsTable';
import { CopilotChat } from './components/CopilotChat';
import { AnalysisForm } from './components/AnalysisForm';
import { AuthModal } from './components/AuthModal';
import { BeforeAfterComparison } from './components/BeforeAfterComparison';
import { CustomImageUpload } from './components/CustomImageUpload';
import type { AnalysisResult } from './types/analysis';
import { ShieldCheck, AlertOctagon, FileText, Download } from 'lucide-react';

export const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('map');
  const [user, setUser] = useState<{ name: string; email: string; picture: string; role: string } | null>(null);

  // Load user from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem('floodsight_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('floodsight_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('floodsight_user');
    setUser(null);
  };

  // Run analysis
  const runAnalysis = async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const payload = params || {
        name: 'Trishuli Valley August 2026 Flood Assessment',
        bbox: [85.15, 27.90, 85.35, 28.18],
        event_date: '2026-08-26',
        slope_threshold_deg: 15.0,
      };

      const resp = await fetch('/api/v1/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error('Analysis request failed');
      const jobData = await resp.json();

      const resResp = await fetch(`/api/v1/analyses/${jobData.job_id}/results`);
      if (!resResp.ok) throw new Error('Failed to retrieve analysis results');
      const data: AnalysisResult = await resResp.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error executing pipeline');
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, []);

  const handleDownloadPdf = () => {
    if (!result) return;
    window.open(`/api/v1/analyses/${result.job_id}/report.pdf`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Upgraded Navbar */}
      <Navbar
        onNewAnalysisClick={() => setModalOpen(true)}
        onDownloadReport={handleDownloadPdf}
        loading={loading}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Loading Spinner */}
        {loading && !result && (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">
              Processing Multi-Temporal Sentinel Radar & DEM Valley Geometry...
            </p>
          </div>
        )}

        {result && (
          <>
            {/* Top KPI Cards (Always visible on all tabs for operational situational awareness) */}
            <MetricsCards result={result} />

            {/* TAB 1: GIS Map View */}
            {activeTab === 'map' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <MapViewer result={result} />
                  </div>
                  <div className="lg:col-span-1">
                    <CopilotChat jobId={result.job_id} />
                  </div>
                </div>
                <CutOffSettlementsTable settlements={result.settlements} />
              </div>
            )}

            {/* TAB 2: Before vs After Satellite Comparison Slider */}
            {activeTab === 'compare' && (
              <div className="animate-in fade-in duration-200">
                <BeforeAfterComparison />
              </div>
            )}

            {/* TAB 3: Upload Custom Imagery */}
            {activeTab === 'upload' && (
              <div className="animate-in fade-in duration-200">
                <CustomImageUpload />
              </div>
            )}

            {/* TAB 4: Road Network Isolation Graph */}
            {activeTab === 'routing' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <CutOffSettlementsTable settlements={result.settlements} />
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-xs text-slate-300 space-y-2">
                  <h4 className="font-bold text-white text-sm">Topological Graph Formulation & Dijkstra Methodology</h4>
                  <p className="text-slate-400 leading-relaxed">
                    The road system is modeled as an undirected weighted graph <code className="text-blue-400 font-mono">G = (V, E)</code>. Vertices denote highway intersections, rural settlement centers, and district hospitals. Edges represent surveyed road links with physical lengths.
                    Post-disaster inundation edges are pruned to model bridge collapse and asphalt washout. Settlements where shortest-path reachability transitioned to infinity (<code className="text-rose-400 font-mono">∞</code>) are classified as newly isolated.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 5: Situation Report & Grounded Copilot */}
            {activeTab === 'copilot' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
                <CopilotChat jobId={result.job_id} />

                {/* PDF Report Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-base">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span>Official 1-Page Situation Report (PDF)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generated directly by the analytical engine using ReportLab. Bounded strictly to computed values:
                      inundation polygon area, disrupted highway lengths, exposed bridge counts, and isolated settlements.
                    </p>
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono text-slate-300">
                      <div><b>Event:</b> {result.name}</div>
                      <div><b>Event Date:</b> {result.event_date}</div>
                      <div><b>Inundated Area:</b> {result.total_flood_area_km2} km² ({result.total_flood_area_hectares} ha)</div>
                      <div><b>Cut-Off Villages:</b> {result.cut_off_settlements_count}</div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleDownloadPdf}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official PDF SitRep</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compliance & Attributions Footer */}
            <footer className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-400 mt-8">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Spaceborne Remote Sensing Compliance & Attributions</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">Required Attributions:</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                    {result.attributions.map((attr, i) => (
                      <li key={i}>{attr}</li>
                    ))}
                    <li>Kuro Siwo dataset © Bountos et al., NeurIPS 2024 (MIT License).</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">Operational Limitations:</h4>
                  <p className="text-[11px] leading-relaxed">
                    Sentinel-1 radar revisits occur on a 12-day orbital repeat cycle; satellite systems provide
                    damage assessment, not advance warning of glacier breaches.
                    Road intersections represent physical inundation exposure, requiring on-site UAV confirmation.
                  </p>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* New Analysis Configuration Modal */}
      <AnalysisForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={runAnalysis}
        loading={loading}
      />

      {/* Google Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />
    </div>
  );
};

export default App;
