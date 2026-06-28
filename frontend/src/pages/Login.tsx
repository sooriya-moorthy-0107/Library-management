import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import { LogIn, KeyRound, ShieldAlert, Sparkles, HelpCircle, CheckCircle, Smartphone } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, verifyMfa, mfaStatus, qrCodeSecret, loginError, logout } = useLmsStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Reset any hanging state
    logout();
  }, []);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }
    
    // College Domain check
    if (!email.endsWith('@college.edu.in')) {
      setLocalError('Access Restricted: Only academic emails ending with @college.edu.in are allowed.');
      return;
    }

    setLocalError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim() || mfaCode.length !== 6) {
      setLocalError('Verification code must be exactly 6 digits.');
      return;
    }

    setLocalError(null);
    setLoading(true);
    try {
      await verifyMfa(mfaCode, mfaStatus === 'SETUP');
    } catch (err: any) {
      setLocalError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse pointer-events-none" />

      <div className="max-w-md w-full glass-effect rounded-2xl border border-slate-800/80 p-8 shadow-2xl relative z-10 bg-slate-900/60">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4">
            <span className="font-extrabold text-2xl">L</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Lumina Library Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Enterprise Management System
          </p>
        </div>

        {/* Error Banners */}
        {(localError || loginError) && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 text-xs flex gap-2.5 items-start">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <span className="font-bold">Security Notice: </span>
              {localError || loginError}
            </div>
          </div>
        )}

        {/* Standard Login Form */}
        {mfaStatus === 'NONE' && (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Academic Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@college.edu.in"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-900/30 transition-all font-medium text-slate-100 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Portal Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-900/30 transition-all font-medium text-slate-100 placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to System
                </>
              )}
            </button>
          </form>
        )}

        {/* MFA Setup/Challenge Form */}
        {mfaStatus !== 'NONE' && (
          <form onSubmit={handleMfaSubmit} className="space-y-6">
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/10 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                <Smartphone className="w-4 h-4" />
                Multi-Factor Authentication
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {mfaStatus === 'SETUP'
                  ? 'Administrative security policy requires setting up your Authenticator App.'
                  : 'A secure MFA passcode is required to authorize this administrative session.'}
              </p>
            </div>

            {mfaStatus === 'SETUP' && (
              <div className="flex flex-col items-center bg-white p-4 rounded-xl border border-slate-800 shadow-inner">
                {/* Simulated QR Code */}
                <div className="w-36 h-36 bg-slate-200 border-2 border-slate-300 rounded flex flex-col items-center justify-center p-2 relative overflow-hidden">
                  <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-full h-full ${
                          (i * 7) % 3 === 0 || (i * 13) % 4 === 0 ? 'bg-slate-900' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-900 bg-white/90 border border-slate-300 px-2 py-0.5 rounded shadow">
                      LUMINA SECURE
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 text-[10px] text-slate-500 font-mono text-center select-all">
                  Secret: <span className="font-bold text-slate-800">{qrCodeSecret}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="123456"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 text-center text-xl font-mono tracking-[0.4em] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-900/30 transition-all font-medium text-slate-100 placeholder-slate-700"
                required
              />
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Enter simulated code <code className="text-slate-400 font-bold bg-slate-900 px-1 py-0.5 rounded font-mono">123456</code> to verify credentials.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Verify Code
                </>
              )}
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
            >
              Cancel Sign In
            </button>
          </form>
        )}

        {/* Quick Credentials Info Box for testing */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Quick Access Profiles (password123)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
            <button
              type="button"
              onClick={() => {
                setEmail('sarah@college.edu.in');
                setPassword('password123');
              }}
              className="p-2 rounded bg-slate-950/60 border border-slate-800/50 text-left hover:border-blue-500/50 hover:text-white transition-all"
            >
              <div className="font-bold text-blue-400">Student</div>
              sarah@college.edu.in
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('john@college.edu.in');
                setPassword('password123');
              }}
              className="p-2 rounded bg-slate-950/60 border border-slate-800/50 text-left hover:border-blue-500/50 hover:text-white transition-all"
            >
              <div className="font-bold text-indigo-400">Librarian</div>
              john@college.edu.in
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('julian@college.edu.in');
                setPassword('password123');
              }}
              className="p-2 rounded bg-slate-950/60 border border-slate-800/50 text-left hover:border-blue-500/50 hover:text-white transition-all"
            >
              <div className="font-bold text-amber-400">Coordinator</div>
              julian@college.edu.in
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('elena@college.edu.in');
                setPassword('password123');
              }}
              className="p-2 rounded bg-slate-950/60 border border-slate-800/50 text-left hover:border-blue-500/50 hover:text-white transition-all"
            >
              <div className="font-bold text-emerald-400">Administrator</div>
              elena@college.edu.in
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
