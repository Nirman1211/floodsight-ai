import React from 'react';
import { Satellite, FileText, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onNewAnalysisClick: () => void;
  onDownloadReport: () => void;
  loading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewAnalysisClick, onDownloadReport, loading }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30 text-blue-400">
          <Satellite className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">FloodSight AI</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              IIT Mandi Track B
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Mapping Flood Damage & Isolated Settlements from Space
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onNewAnalysisClick}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Run Analysis
        </button>

        <button
          onClick={onDownloadReport}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition"
        >
          <FileText className="w-4 h-4" />
          Download 1-Page SitRep (PDF)
        </button>
      </div>
    </header>
  );
};
