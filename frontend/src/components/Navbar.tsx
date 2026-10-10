import React, { useState } from 'react';
import { Satellite, FileText, RefreshCw, User, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  onNewAnalysisClick: () => void;
  onDownloadReport: () => void;
  loading: boolean;
  user: { name: string; email: string; picture: string; role: string } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewAnalysisClick,
  onDownloadReport,
  loading,
  user,
  onOpenAuth,
  onLogout,
  activeTab,
  setActiveTab,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-6 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between sticky top-0 z-50 shadow-lg gap-3">
      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl border border-blue-400/30 text-white shadow-md shadow-blue-900/30">
          <Satellite className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-blue-300">
              FloodSight AI
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 tracking-wide uppercase">
              Spaceborne Disaster Intelligence
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Rapid Multi-Modal Satellite Damage Mapping & Road Network Isolation
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🗺️ GIS Map
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'compare' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔄 Before / After Slider
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📤 Upload Custom Images
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'routing' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🛣️ Road Isolation Graph
        </button>
        <button
          onClick={() => setActiveTab('copilot')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'copilot' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🤖 Copilot & SitRep
        </button>
      </nav>

      {/* Right Action Buttons & Auth */}
      <div className="flex items-center gap-3">
        <button
          onClick={onNewAnalysisClick}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span>New AOI</span>
        </button>

        <button
          onClick={onDownloadReport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg shadow-sm shadow-blue-900/30 transition"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>SitRep PDF</span>
        </button>

        {/* User Profile / Google Sign-In */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-full transition"
            >
              <img
                src={user.picture}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-600"
              />
              <span className="text-xs font-medium text-slate-200 hidden sm:inline">{user.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs">
                <div className="border-b border-slate-800 pb-2 mb-2">
                  <p className="font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 rounded-lg shadow-sm transition"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
