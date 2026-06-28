import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import {
  BookOpen, Users, AlertTriangle, TrendingUp, DollarSign,
  Library, RotateCcw, LogOut, Activity, Star, FileText,
  Shield, ChevronRight, RefreshCw, Clock,
} from 'lucide-react';

interface KpiData {
  catalog: { totalTitles: number; totalCopies: number; availableCopies: number; issuedCopies: number };
  circulation: { activeLoans: number; overdueLoans: number; overdueRate: number };
  fines: { unpaidAmount: number; collectedAmount: number };
  users: { totalActive: number };
}

interface ActivityPoint { month: string; issued: number; returned: number }
interface TopBook { bookId: string; bookTitle: string; borrowCount: number }
interface AuditEntry { id: string; actorId: string; action: string; entityType: string; newValue: string; createdAt: string }
interface OverdueLoan {
  id: string; daysOverdue: number; estimatedFine: number;
  user: { fullName: string; email: string; studentId: string };
  copy: { barcode: string; book: { title: string } };
  dueAt: string;
}

const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e'];

export const ExecutiveDashboard: React.FC = () => {
  const { apiFetch, user, logout } = useLmsStore();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [activity, setActivity] = useState<ActivityPoint[]>([]);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [overdue, setOverdue] = useState<OverdueLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'overdue' | 'audit'>('overview');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [kpiData, actData, topData, auditData, overdueData] = await Promise.all([
        apiFetch('/reports/kpis'),
        apiFetch('/reports/activity?months=6'),
        apiFetch('/reports/top-books?limit=5'),
        apiFetch('/reports/audit?limit=20'),
        apiFetch('/reports/overdue'),
      ]);
      setKpis(kpiData);
      setActivity(actData);
      setTopBooks(topData);
      setAuditLog(auditData);
      setOverdue(overdueData);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const pieData = kpis
    ? [
        { name: 'Available', value: kpis.catalog.availableCopies },
        { name: 'Issued', value: kpis.catalog.issuedCopies },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Nav */}
      <nav className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-black text-sm">L</div>
          <div>
            <h1 className="text-sm font-bold text-white">Lumina Executive Dashboard</h1>
            <p className="text-[10px] text-slate-500 font-mono">Library Intelligence Center</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">
            <Clock className="w-3 h-3 inline mr-1" />
            Refreshed {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAll}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
              {user?.fullName?.[0] ?? 'A'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button onClick={logout} className="ml-2 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading && !kpis ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <section>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Library KPIs</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={<BookOpen className="w-5 h-5" />}
                  label="Total Titles"
                  value={kpis?.catalog.totalTitles ?? 0}
                  sub={`${kpis?.catalog.totalCopies ?? 0} physical copies`}
                  color="from-violet-600 to-indigo-600"
                />
                <KpiCard
                  icon={<Activity className="w-5 h-5" />}
                  label="Active Loans"
                  value={kpis?.circulation.activeLoans ?? 0}
                  sub={`${kpis?.catalog.availableCopies ?? 0} copies available`}
                  color="from-cyan-600 to-blue-600"
                />
                <KpiCard
                  icon={<AlertTriangle className="w-5 h-5" />}
                  label="Overdue"
                  value={kpis?.circulation.overdueLoans ?? 0}
                  sub={`${kpis?.circulation.overdueRate ?? 0}% overdue rate`}
                  color="from-rose-600 to-pink-600"
                  alert={( kpis?.circulation.overdueLoans ?? 0) > 0}
                />
                <KpiCard
                  icon={<DollarSign className="w-5 h-5" />}
                  label="Fines Outstanding"
                  value={`₹${(kpis?.fines.unpaidAmount ?? 0).toFixed(0)}`}
                  sub={`₹${(kpis?.fines.collectedAmount ?? 0).toFixed(0)} collected`}
                  color="from-amber-500 to-orange-600"
                />
              </div>
            </section>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Line Chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Monthly Circulation Trend
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={activity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="issued" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Books Issued" />
                    <Line type="monotone" dataKey="returned" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} name="Books Returned" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Copy Availability Pie */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
                <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                  <Library className="w-4 h-4 text-violet-400" />
                  Copy Availability
                </h3>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Tabs: Top Books / Overdue / Audit Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex border-b border-slate-800">
                {([
                  { id: 'overview', label: 'Top Borrowed', icon: <Star className="w-3.5 h-3.5" /> },
                  { id: 'overdue', label: `Overdue (${overdue.length})`, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                  { id: 'audit', label: 'Audit Log', icon: <Shield className="w-3.5 h-3.5" /> },
                ] as const).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-5 py-3.5 text-xs font-semibold transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                        : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    {topBooks.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No borrowing data yet</p>}
                    {topBooks.map((book, i) => (
                      <div key={book.bookId} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                          i === 0 ? 'bg-amber-500/20 text-amber-400' :
                          i === 1 ? 'bg-slate-600/50 text-slate-300' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>#{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{book.bookTitle}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-violet-400 font-bold">
                          <RotateCcw className="w-3 h-3" />
                          {book.borrowCount}x
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'overdue' && (
                  <div className="space-y-3">
                    {overdue.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-6 flex flex-col items-center gap-2">
                        <span className="text-2xl">✅</span> No overdue books
                      </p>
                    )}
                    {overdue.map((loan) => (
                      <div key={loan.id} className="flex items-center gap-4 p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/30 transition-colors">
                        <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200 truncate">{loan.copy?.book?.title}</p>
                          <p className="text-xs text-slate-500">{loan.user?.fullName} · {loan.copy?.barcode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-rose-400">{loan.daysOverdue}d overdue</p>
                          <p className="text-[10px] text-slate-500">Est. ₹{loan.estimatedFine}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="space-y-2">
                    {auditLog.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300">
                            <span className="font-mono font-bold text-violet-400">{log.action}</span>
                            {' '}on <span className="text-slate-400">{log.entityType}</span>
                          </p>
                          <p className="text-[10px] text-slate-600 font-mono truncate">{log.newValue}</p>
                        </div>
                        <p className="text-[10px] text-slate-600 flex-shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  color: string;
  alert?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, sub, color, alert }) => (
  <div className={`relative bg-slate-900 border ${alert ? 'border-rose-800/50' : 'border-slate-800'} rounded-2xl p-5 overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${color} opacity-10 blur-2xl -translate-y-1/2 translate-x-1/2`} />
    <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${color} bg-opacity-20 mb-3`}>
      <span className="text-white">{icon}</span>
    </div>
    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</p>
    <p className="text-[10px] text-slate-600 mt-1">{sub}</p>
  </div>
);
