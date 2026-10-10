import React, { useState } from 'react';
import { X, ShieldCheck, Lock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; picture: string; role: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Lead Geospatial Analyst');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Simulate OAuth response & verify with backend
      const mockProfile = {
        name: 'Nirman Amrawanshi',
        email: 'nirman.amrawanshi@disaster-response.org',
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        role: selectedRole,
      };

      const resp = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockProfile),
      });

      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem('floodsight_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (e) {
      console.error('Login error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Disaster Intelligence Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with authorized agency credentials to access tactical satellite layers and task models.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operational Deployment Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="Lead Geospatial Analyst">Lead Geospatial Analyst (Satellite Ops)</option>
              <option value="Tactical Search & Rescue Commander">Tactical Search & Rescue Commander</option>
              <option value="UN / Humanitarian Coordinator">UN / Humanitarian Coordinator</option>
              <option value="Field GIS Specialist">Field GIS Specialist</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition duration-200 text-xs disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center text-[11px] text-slate-500 pt-2">
            <Lock className="w-3 h-3" />
            <span>End-to-end encrypted session with OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
