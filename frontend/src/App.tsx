import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsCards } from './components/MetricsCards';
import { MapViewer } from './components/MapViewer';
import { CutOffSettlementsTable } from './components/CutOffSettlementsTable';
import { CopilotChat } from './components/CopilotChat';
import { AnalysisForm } from './components/AnalysisForm';
import type { AnalysisResult } from './types/analysis';
import { ShieldCheck, AlertOctagon } from 'lucide-react';

export const App: React.FC = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default Trishuli GLOF analysis
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

      // Fetch results
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onNewAnalysisClick={() => setModalOpen(true)}
        onDownloadReport={handleDownloadPdf}
        loading={loading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && !result && (
          <div className="h-96 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">
              Processing Sentinel-1 Radar Co-registration & Pre-event OSM Graph...
            </p>
          </div>
        )}

        {result && (
          <>
            {/* Top KPI Cards */}
            <MetricsCards result={result} />

            {/* Middle Grid: Map & Copilot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MapViewer result={result} />
              </div>
              <div className="lg:col-span-1">
                <CopilotChat jobId={result.job_id} />
              </div>
            </div>

            {/* Cut-Off Settlements Detailed Routing Table */}
            <CutOffSettlementsTable settlements={result.settlements} />

            {/* Limitations & Compliance Footer Bar */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Mandatory Data Attribution & Scientific Honesty</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-300 mb-1">Required Attributions:</h4>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
                    {result.attributions.map((attr, i) => (
                      <li key={i}>{attr}</li>
                    ))}
                    <li>Kuro Siwo training corpus © Bountos et al., NeurIPS 2024 (MIT License).</li>
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
            </section>
          </>
        )}
      </main>

      {/* New Analysis Modal */}
      <AnalysisForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={runAnalysis}
        loading={loading}
      />
    </div>
  );
};

export default App;
