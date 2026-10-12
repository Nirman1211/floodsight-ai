import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserPlus,
  LogIn,
  Database,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { authService } from '../services/authService';
import { getSupabaseConfig, saveSupabaseConfig, resetSupabaseConfig } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { name: string; email: string; picture: string; role: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDbSettings, setShowDbSettings] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tactical Incident Commander');

  // Custom Google states
  const [googleName, setGoogleName] = useState('Nirman Amrawanshi');
  const [googleEmail, setGoogleEmail] = useState('nirman.amrawanshi@disaster-response.org');

  // Supabase Custom Config states
  const currentConfig = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(currentConfig.url);
  const [sbKey, setSbKey] = useState(currentConfig.anonKey);
  const [sbSavedMsg, setSbSavedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await authService.login(email, password);
      setSuccessMsg(`Welcome back, ${user.name}! Authenticated via ${user.provider || 'cloud database'}.`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await authService.signup(name, email, password, selectedRole);
      setSuccessMsg(`Account created in Supabase database for ${user.name}!`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try another email.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await authService.googleAuth({
        name: googleName.trim() || 'Nirman Amrawanshi',
        email: googleEmail.trim() || 'nirman.amrawanshi@disaster-response.org',
        role: selectedRole,
      });

      setSuccessMsg(`Google identity recorded in database for ${user.name}!`);
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim() || !sbKey.trim()) return;
    saveSupabaseConfig(sbUrl, sbKey);
    setSbSavedMsg('Custom Supabase project saved! Connected to cloud database.');
    setTimeout(() => {
      setSbSavedMsg(null);
      setShowDbSettings(false);
    }, 1200);
  };

  const handleResetSupabaseConfig = () => {
    resetSupabaseConfig();
    const def = getSupabaseConfig();
    setSbUrl(def.url);
    setSbKey(def.anonKey);
    setSbSavedMsg('Reset to default FloodSight cloud instance.');
    setTimeout(() => setSbSavedMsg(null), 1200);
  };

  // Quick Demo credentials
  const fillCommanderDemo = () => {
    setEmail('commander@floodsight.org');
    setPassword('Rescue2026!');
    setTab('login');
    setErrorMsg(null);
  };

  const fillRescuerDemo = () => {
    setEmail('test@rescuer.org');
    setPassword('Secret123!');
    setTab('login');
    setErrorMsg(null);
  };

  const fillNirmanDemo = () => {
    setEmail('nirman@floodsight.org');
    setPassword('Nirman2026!');
    setTab('login');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-2.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Tactical Responder Portal</h2>
          <div className="flex items-center justify-center gap-2 mt-1 text-[11px] font-medium">
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Cloud PostgreSQL Active</span>
            </div>
            <button
              onClick={() => setShowDbSettings(!showDbSettings)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              title="Configure Supabase Database"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Supabase Custom Configuration Drawer */}
        {showDbSettings && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-950 border border-blue-500/30 text-xs space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Supabase Database Connection</span>
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 underline"
              >
                <span>Dashboard</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            {sbSavedMsg && (
              <div className="text-emerald-400 text-[11px] font-medium bg-emerald-950/40 p-1.5 rounded border border-emerald-800/40">
                {sbSavedMsg}
              </div>
            )}

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-2">
              <div>
                <label className="text-slate-400 text-[10px] block">Project URL (VITE_SUPABASE_URL)</label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[10px] block">Anon Public Key (VITE_SUPABASE_ANON_KEY)</label>
                <input
                  type="password"
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                  placeholder="eyJhbGci..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetSupabaseConfig}
                  className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-800/80 p-1 mb-4 text-xs font-semibold">
          <button
            onClick={() => { setTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              tab === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              tab === 'signup' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@floodsight.org"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-lg shadow-blue-600/30 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Authenticating with Database...' : 'Sign In to Portal'}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nirman Amrawanshi"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nirman@disaster-response.org"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Operational Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Tactical Incident Commander">Tactical Incident Commander</option>
                <option value="Lead Geospatial Analyst">Lead Geospatial Analyst (Satellite Ops)</option>
                <option value="Search & Rescue Field Officer">Search & Rescue Field Officer</option>
                <option value="UN Humanitarian Officer">UN Humanitarian Officer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creating User in Supabase...' : 'Register in Disaster Registry'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-semibold">
            <span className="bg-slate-900 px-2 text-slate-500">Or Continue With</span>
          </div>
        </div>

        {/* Continue with Google */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <label className="text-slate-400 block mb-0.5">Google Name</label>
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="Nirman Amrawanshi"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-0.5">Google Email</label>
              <input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="user@gmail.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleDirectGoogleSignIn}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition text-xs disabled:opacity-60 cursor-pointer"
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
            <span>Continue with Google (Sync to Supabase)</span>
          </button>
        </div>

        {/* Quick Demo Pre-fills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Quick Demo Logins:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillCommanderDemo}
              className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              Commander
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={fillRescuerDemo}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Rescuer
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={fillNirmanDemo}
              className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Nirman
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
