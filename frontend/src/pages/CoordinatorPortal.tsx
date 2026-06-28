import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import {
  ClipboardList, CheckCircle, XCircle, Clock, MessageSquare,
  BookOpen, User, RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react';

interface RequestType {
  id: string;
  bookId: string;
  userId: string;
  status: 'PENDING_COORDINATOR' | 'QUEUED' | 'REJECTED';
  purpose: string;
  coordinatorComment?: string;
  createdAt?: string;
  book: { title: string; authors: string[]; categoryId: string; departmentId: string };
  user: { fullName: string; studentId: string; email: string };
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    PENDING_COORDINATOR: 'bg-amber-50 text-amber-700 border-amber-200',
    QUEUED: 'bg-blue-50 text-blue-700 border-blue-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
  };
  const labels: Record<string, string> = {
    PENDING_COORDINATOR: 'Awaiting Review',
    QUEUED: 'Approved & Queued',
    REJECTED: 'Rejected',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${map[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {labels[status] || status}
    </span>
  );
};

export const CoordinatorPortal: React.FC = () => {
  const { apiFetch } = useLmsStore();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_COORDINATOR' | 'QUEUED' | 'REJECTED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/requests');
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (reqId: string) => {
    const comment = commentMap[reqId]?.trim();
    if (!comment) {
      alert('Please enter a coordinator approval comment before approving.');
      return;
    }
    setActionLoading(reqId);
    try {
      await apiFetch(`/requests/${reqId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ comment }),
      });
      await fetchRequests();
      setExpandedId(null);
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId: string) => {
    const comment = commentMap[reqId]?.trim();
    if (!comment) {
      alert('A mandatory rejection justification comment is required.');
      return;
    }
    setActionLoading(reqId);
    try {
      await apiFetch(`/requests/${reqId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ comment }),
      });
      await fetchRequests();
      setExpandedId(null);
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'PENDING_COORDINATOR').length;
  const approvedCount = requests.filter(r => r.status === 'QUEUED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved & Queued</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-blue-600">{approvedCount}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {(['ALL', 'PENDING_COORDINATOR', 'QUEUED', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filter === f
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'All Requests' : f === 'PENDING_COORDINATOR' ? 'Pending' : f === 'QUEUED' ? 'Approved' : 'Rejected'}
            </button>
          ))}
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">No hold requests match the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const isExpanded = expandedId === req.id;
            const isPending = req.status === 'PENDING_COORDINATOR';
            return (
              <div
                key={req.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
                  isPending ? 'border-amber-200' : 'border-slate-100'
                }`}
              >
                {/* Header Row */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50/50 transition-all"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{req.book?.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested by <span className="font-semibold text-slate-700">{req.user?.fullName}</span>
                      {' '}(<span className="font-mono text-[10px]">{req.user?.studentId}</span>)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={req.status} />
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50/30">
                    {/* Book & Requester Details Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Book Details</span>
                        <div className="font-semibold text-slate-800">{req.book?.title}</div>
                        <div className="text-slate-500">Category: {req.book?.categoryId}</div>
                        <div className="text-slate-500">Department: {req.book?.departmentId}</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requester</span>
                        <div className="font-semibold text-slate-800">{req.user?.fullName}</div>
                        <div className="text-slate-500 font-mono">{req.user?.studentId}</div>
                        <div className="text-slate-500">{req.user?.email}</div>
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Academic Purpose / Justification
                      </span>
                      <p className="text-slate-700 leading-relaxed">{req.purpose || 'No purpose statement provided.'}</p>
                    </div>

                    {/* Existing comment if resolved */}
                    {req.coordinatorComment && !isPending && (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Coordinator Resolution Note
                        </span>
                        <p className="text-slate-700 italic">{req.coordinatorComment}</p>
                      </div>
                    )}

                    {/* Action Panel – only for pending */}
                    {isPending && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Coordinator Comment (Required)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Enter your decision rationale, eligibility confirmation, or rejection reason..."
                            value={commentMap[req.id] || ''}
                            onChange={e => setCommentMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-blue-500 focus:outline-none transition-all resize-none placeholder-slate-400"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading === req.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {actionLoading === req.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve & Queue Hold
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionLoading === req.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
