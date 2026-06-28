import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Award, FileText, Calendar, User, Search, RefreshCw } from 'lucide-react';

interface VerificationResult {
  isValid: boolean;
  certId?: string;
  studentName?: string;
  studentId?: string;
  issueDate?: string;
  message: string;
}

export const VerifyCertificate: React.FC = () => {
  const { certId } = useParams<{ certId: string }>();
  const [searchId, setSearchId] = useState(certId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchVerification = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`http://localhost:3000/api/v1/verify/cert/${id.trim()}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        isValid: false,
        message: 'Could not connect to the verification server. Please check the ID or try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (certId) {
      fetchVerification(certId);
    }
  }, [certId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVerification(searchId);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-6 mb-8 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="font-bold text-white text-xl">L</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              LUMINA ACADEMY
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Library Management System</p>
          </div>
        </div>
        <Link
          to="/"
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 backdrop-blur transition-all"
        >
          Sign In to Portal
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full flex-grow flex flex-col justify-center py-8 z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Certificate Registry
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Verify the authenticity of digital "No-Due Certificates" issued by Lumina Central Library.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="relative flex rounded-xl border border-slate-800 bg-slate-950/80 p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-900/50 transition-all shadow-inner">
            <div className="flex items-center pl-3 pointer-events-none text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Certificate UUID (e.g. 8b3c9f...)"
              className="w-full bg-transparent border-0 py-2 px-3 text-slate-100 placeholder-slate-500 focus:ring-0 focus:outline-none text-sm font-mono"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>

        {/* Verification Result Display */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-medium">Validating cryptographic record with database...</p>
          </div>
        )}

        {!loading && searched && result && (
          <div
            className={`rounded-2xl border p-6 md:p-8 backdrop-blur transition-all duration-300 ${
              result.isValid
                ? 'border-emerald-500/30 bg-emerald-950/10 shadow-lg shadow-emerald-950/20'
                : 'border-red-500/30 bg-red-950/10 shadow-lg shadow-red-950/20'
            }`}
          >
            {result.isValid ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5 animate-pulse">
                  <ShieldCheck className="w-9 h-9 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">VALID CERTIFICATE</h3>
                <span className="text-[10px] font-mono bg-emerald-950/50 text-emerald-300 border border-emerald-800/30 px-3 py-1 rounded-full mb-6">
                  ID: {result.certId}
                </span>

                <p className="text-slate-300 text-sm max-w-sm mb-6 leading-relaxed">
                  {result.message}
                </p>

                <div className="w-full border-t border-slate-800/80 pt-6 grid grid-cols-2 gap-4 text-left">
                  <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Holder Name</span>
                    <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-sm">
                      <User className="w-4 h-4 text-blue-400" />
                      {result.studentName}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Student ID</span>
                    <div className="flex items-center gap-1.5 text-slate-200 font-mono text-sm">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      {result.studentId}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50 col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Issued Date</span>
                    <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-sm">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      {result.issueDate ? new Date(result.issueDate).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <Award className="w-4 h-4" />
                  Cryptographically secure digital release
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5">
                  <ShieldAlert className="w-9 h-9 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">VERIFICATION FAILED</h3>
                
                {searchId && (
                  <span className="text-[10px] font-mono bg-red-950/50 text-red-300 border border-red-800/30 px-3 py-1 rounded-full mb-6">
                    ID: {searchId}
                  </span>
                )}

                <p className="text-slate-300 text-sm max-w-sm mb-4 leading-relaxed">
                  {result.message}
                </p>

                {result.studentName && (
                  <div className="w-full border-t border-slate-800/80 pt-6 grid grid-cols-2 gap-4 text-left">
                    <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Student Name</span>
                      <div className="text-slate-200 font-semibold text-sm">{result.studentName}</div>
                    </div>
                    <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/50">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Student ID</span>
                      <div className="text-slate-200 font-mono text-sm">{result.studentId}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !searched && !certId && (
          <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 p-10 text-center flex flex-col items-center">
            <Award className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400 text-sm max-w-xs">
              Enter a certificate ID to lookup dynamic details including verification timestamps and academic details.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center border-t border-slate-800 pt-6 text-[11px] text-slate-500 font-medium z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>&copy; 2026 Lumina Library Systems. All rights reserved.</p>
        <p>Lumina Cryptographic Verification Service (LCVS v1.0.4)</p>
      </footer>
    </div>
  );
};
