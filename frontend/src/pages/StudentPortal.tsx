import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import { Search, Book, Bookmark, FileCheck, CircleAlert, HelpCircle, X, Award, ExternalLink, Calendar, RefreshCw, Landmark, Receipt, Info, ShieldCheck, Printer, Copy, LogOut } from 'lucide-react';

interface BookType {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  coverImageUrl?: string;
  categoryId: string;
  departmentId: string;
  description: string;
  finePerDay: number;
  maxIssueDays: number;
  isDigitalAvailable: boolean;
  drmPolicy: 'BORROW_ONLY' | 'OPEN';
  totalCopies: number;
  availableCopies: number;
}

interface LoanType {
  id: string;
  copyId: string;
  userId: string;
  issuedAt: string;
  dueAt: string;
  renewedCount: number;
  status: 'ACTIVE' | 'OVERDUE' | 'RETURNED';
  copy: {
    barcode: string;
    book: {
      title: string;
      authors: string[];
      coverImageUrl?: string;
      maxIssueDays: number;
    };
  };
}

interface FineType {
  id: string;
  transactionId: string;
  userId: string;
  fineType: string;
  amount: number;
  waivedAmount: number;
  status: 'UNPAID' | 'PAID' | 'FULLY_WAIVED' | 'PARTIALLY_WAIVED';
  transaction: {
    copy: {
      barcode: string;
      book: {
        title: string;
      };
    };
  };
}

interface CertType {
  id: string;
  userId: string;
  isValid: boolean;
  createdAt: string;
}

export const StudentPortal: React.FC = () => {
  const { apiFetch, user, logout } = useLmsStore();
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans' | 'cert'>('catalog');

  // Catalog State
  const [books, setBooks] = useState<BookType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Loans & Fines State
  const [loans, setLoans] = useState<LoanType[]>([]);
  const [fines, setFines] = useState<FineType[]>([]);
  const [loadingCirc, setLoadingCirc] = useState(false);

  // Certificate State
  const [certs, setCerts] = useState<CertType[]>([]);
  const [certRequestLoading, setCertRequestLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  // Reader Modal DRM State
  const [readingBook, setReadingBook] = useState<BookType | null>(null);
  const [readProgress, setReadProgress] = useState(32);
  const [copyBlockWarning, setCopyBlockWarning] = useState(false);
  const [printBlockWarning, setPrintBlockWarning] = useState(false);

  // Payment receipt state
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);

  // Load functions
  const fetchCatalog = async () => {
    setLoadingBooks(true);
    try {
      const q = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
      const cat = selectedCategory !== 'All Categories' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      const data = await apiFetch(`/books?${q}${cat}`);
      setBooks(data);
    } catch (err) {
      console.error('Error fetching catalog', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchLoansAndFines = async () => {
    setLoadingCirc(true);
    try {
      // Get all active loans and fines for the logged-in student
      const allFines = await apiFetch('/fines');
      setFines(allFines);
      
      const allRequests = await apiFetch('/requests');
      // active loans can be retrieved from general circulation active, filtered for current user
      const allActive = await apiFetch('/circulation/active');
      const studentLoans = allActive.filter((l: any) => l.userId === user?.id);
      setLoans(studentLoans);
    } catch (err) {
      console.error('Error fetching loans/fines', err);
    } finally {
      setLoadingCirc(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      const data = await apiFetch('/certificates/no-due');
      setCerts(data);
      setCertError(null);
    } catch (err: any) {
      console.error('Error fetching certs', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchCatalog();
    } else if (activeTab === 'loans') {
      fetchLoansAndFines();
    } else if (activeTab === 'cert') {
      fetchLoansAndFines();
      fetchCertificates();
    }
  }, [activeTab]);

  const handleRequestHold = async (bookId: string) => {
    try {
      await apiFetch('/requests', {
        method: 'POST',
        body: JSON.stringify({ bookId, purpose: 'Academic study and homework references.' }),
      });
      alert('Hold request successfully submitted to your Department Coordinator for clearance!');
      fetchCatalog();
    } catch (err: any) {
      alert(`Request Hold Failed: ${err.message}`);
    }
  };

  const handleRenew = async (txnId: string) => {
    try {
      const data = await apiFetch(`/circulation/renew/${txnId}`, { method: 'POST' });
      alert(`Extension Granted! New Due Date: ${new Date(data.newDueDate).toLocaleDateString()}`);
      fetchLoansAndFines();
    } catch (err: any) {
      alert(`Renewal Failed: ${err.message}`);
    }
  };

  const handlePayFine = async (fineId: string) => {
    try {
      const data = await apiFetch('/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({ fineId }),
      });
      
      // Fetch receipt details
      const receiptRes = await apiFetch(`/payments/${data.payment.id}/receipt`);
      setPaymentReceipt(receiptRes.receipt);
      alert('Payment authorization successful! Fine cleared.');
      fetchLoansAndFines();
    } catch (err: any) {
      alert(`Fine payment failed: ${err.message}`);
    }
  };

  const handleGenerateCertificate = async () => {
    setCertRequestLoading(true);
    setCertError(null);
    try {
      const data = await apiFetch('/certificates/no-due', { method: 'POST' });
      setCerts([data, ...certs]);
      alert('No-Due Certificate successfully generated!');
    } catch (err: any) {
      setCertError(err.message || 'Verification checks failed. Ensure all loans are returned and fines are paid.');
    } finally {
      setCertRequestLoading(false);
    }
  };

  // DRM event handlers inside reader
  const triggerCopyDrm = () => {
    setCopyBlockWarning(true);
    setTimeout(() => setCopyBlockWarning(false), 3000);
  };

  const triggerPrintDrm = () => {
    setPrintBlockWarning(true);
    setTimeout(() => setPrintBlockWarning(false), 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingBook) {
        // Block Ctrl+P and Ctrl+C
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
          e.preventDefault();
          triggerPrintDrm();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          triggerCopyDrm();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingBook]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative overflow-hidden">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/10">L</div>
          <div>
            <h1 className="text-xs font-extrabold text-slate-900 leading-tight">Lumina Student Portal</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Academic Resources Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
              {user?.fullName?.[0] ?? 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</p>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wider font-mono leading-none">{user?.studentId || 'STUDENT'}</p>
            </div>
            <button onClick={logout} className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Background Library Watermark */}
      <div className="absolute right-12 bottom-12 opacity-[0.03] text-slate-900 pointer-events-none select-none z-0">
        <svg width="350" height="350" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
          <path d="M6 14h10"/>
          <path d="M6 18h10"/>
        </svg>
      </div>

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 relative z-10">
      
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Search className="w-4 h-4" />
          Catalog Discovery
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'loans'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          My Loans & Fines
        </button>
        <button
          onClick={() => setActiveTab('cert')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'cert'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          No Due Certificate
        </button>
      </div>

      {/* Catalog Search Tab */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch">
            {/* Search Input */}
            <div className="relative flex-grow max-w-lg">
              <input
                type="text"
                placeholder="Search catalog by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCatalog()}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            {/* Category Select */}
            <div className="flex gap-2">
              {['All Categories', 'Neuroscience', 'Physics', 'Medicine', 'Design', 'Economics'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loadingBooks ? (
            <div className="flex justify-center items-center py-20">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
              <Book className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No catalog resources found matching search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div
                  key={book.id}
                  className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image & Basic Info */}
                    <div className="flex gap-4">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-20 h-28 object-cover rounded-lg bg-slate-100 shadow-sm border border-slate-100 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-20 h-28 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 font-bold text-center p-2 text-xs shadow-sm">
                          {book.title.substring(0, 20)}
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">
                          {book.categoryId}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 mt-1 line-clamp-2 leading-tight">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">by {book.authors.join(', ')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">ISBN: {book.isbn}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-4 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg">
                      {book.description || 'No digital description available for this item.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs mb-4">
                      <span className="text-slate-500 font-medium">Physical Copies:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          book.availableCopies > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {book.availableCopies} available / {book.totalCopies} total
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequestHold(book.id)}
                        disabled={book.availableCopies === 0}
                        className="flex-1 py-2 px-3 text-xs font-bold text-white rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                      >
                        Request Hold
                      </button>

                      {book.isDigitalAvailable && (
                        <button
                          onClick={() => setReadingBook(book)}
                          className="flex-1 py-2 px-3 text-xs font-bold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 active:scale-[0.98] transition-all text-center flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Read Digital
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loans & Fines Tab */}
      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Loans */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600" />
              Active Borrowing Records
            </h3>

            {loadingCirc ? (
              <div className="py-10 text-center text-slate-500">Loading your loans...</div>
            ) : loans.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No active physical book checkouts found. Explore Catalog to request items.
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => {
                  const isOverdue = new Date(loan.dueAt) < new Date();
                  return (
                    <div
                      key={loan.id}
                      className={`bg-white border rounded-2xl p-4 flex gap-4 transition-all hover:shadow-sm ${
                        isOverdue ? 'border-red-200 bg-red-50/10' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{loan.copy.book.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              isOverdue
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">by {loan.copy.book.authors.join(', ')}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Copy barcode: {loan.copy.barcode}</p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                          <div className="text-slate-500">
                            Due: <span className="font-semibold text-slate-800">{new Date(loan.dueAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-[10px] text-slate-400 font-semibold">Renewals: {loan.renewedCount} / 2</span>
                            <button
                              onClick={() => handleRenew(loan.id)}
                              disabled={loan.renewedCount >= 2 || isOverdue}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              Renew
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overdue Fines */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-red-600" />
              Overdue Fine Balances
            </h3>

            {loadingCirc ? (
              <div className="py-10 text-center text-slate-500">Loading fine ledger...</div>
            ) : fines.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-500 text-xs">
                Zero active fine penalties. Outstanding record is clean.
              </div>
            ) : (
              <div className="space-y-4">
                {fines.map((fine) => (
                  <div
                    key={fine.id}
                    className={`bg-white border rounded-2xl p-4 flex gap-4 transition-all hover:shadow-sm ${
                      fine.status === 'UNPAID' ? 'border-amber-200 bg-amber-50/5' : 'border-slate-100'
                    }`}
                  >
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-slate-900">Fine on: {fine.transaction.copy.book.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            fine.status === 'UNPAID'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {fine.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Barcode: {fine.transaction.copy.barcode} ({fine.fineType})</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                        <div className="text-slate-800 font-bold">
                          Amount: INR {fine.amount}
                          {fine.waivedAmount > 0 && (
                            <span className="text-[10px] font-normal text-slate-500 ml-2">
                              (Waived: INR {fine.waivedAmount})
                            </span>
                          )}
                        </div>

                        {fine.status === 'UNPAID' && (
                          <button
                            onClick={() => handlePayFine(fine.id)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center gap-1"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Pay Fine Online
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Due Certificate Tab */}
      {activeTab === 'cert' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-indigo-600" />
              Digital "No Due Certificate" Release Desk
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              A **No Due Certificate (NDC)** is required for academic semester clearances, convocation registrations, and department transfers.
              The library verifies that you have **zero active physical books borrowed** and **zero pending fines** before cryptographically generating a certificate.
            </p>

            {/* Validation Banner */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 mb-6 flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Automatic Registry Checks</span>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Active Book Loans</span>
                <span className={`font-bold px-2 py-0.5 rounded ${loans.length === 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                  {loans.length === 0 ? 'Clear (0)' : `${loans.length} Active`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-slate-200/50 pt-2.5">
                <span className="text-slate-600">Unpaid Fines Ledger</span>
                <span className={`font-bold px-2 py-0.5 rounded ${fines.filter(f => f.status === 'UNPAID').length === 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                  {fines.filter(f => f.status === 'UNPAID').length === 0 ? 'Clear (INR 0.00)' : 'Overdue Balance Pending'}
                </span>
              </div>
            </div>

            {certError && (
              <div className="p-3 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium flex gap-2">
                <CircleAlert className="w-4 h-4 flex-shrink-0" />
                {certError}
              </div>
            )}

            <button
              onClick={handleGenerateCertificate}
              disabled={certRequestLoading || loans.length > 0 || fines.filter(f => f.status === 'UNPAID').length > 0}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {certRequestLoading ? 'Securing Cryptographic Certificate...' : 'Generate No Due Certificate'}
            </button>
          </div>

          {/* Generated Certificates List */}
          {certs.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Generated Certificates</h4>
              {certs.map((c) => (
                <div key={c.id} className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/20 text-indigo-100 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                  <div className="absolute right-[-4%] bottom-[-8%] opacity-5 pointer-events-none">
                    <Award className="w-48 h-48" />
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">STATUS</span>
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          Active & Verified
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono bg-slate-950/60 px-3 py-1 rounded-full border border-indigo-800/30">
                      ID: {c.id}
                    </span>
                  </div>

                  <div className="space-y-1.5 border-t border-indigo-900/50 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Borrower Full Name</span>
                      <span className="font-bold text-white">{user?.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Borrower Student ID</span>
                      <span className="font-mono text-white">{user?.studentId || '2024-STUD-8812'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-400">Generation Timestamp</span>
                      <span className="text-white">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-indigo-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-semibold">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      Authentic Lumina Central Registry Release
                    </div>
                    
                    <a
                      href={`/verify/cert/${c.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                    >
                      Verify Badge
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Simulated DRM Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50 overflow-hidden select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col justify-between text-slate-100 shadow-2xl relative">
            
            {/* DRM Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-800/30">
                  DRM PROTECTED ({readingBook.drmPolicy})
                </span>
                <h3 className="font-bold text-sm text-slate-100 line-clamp-1">{readingBook.title}</h3>
              </div>
              <button
                onClick={() => setReadingBook(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DRM warnings */}
            {copyBlockWarning && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-900 border border-red-700 text-red-100 text-xs px-4 py-2 rounded-xl shadow-lg z-55 flex items-center gap-2 animate-bounce">
                <CircleAlert className="w-4 h-4" />
                DRM Violation: Text copying and selection is disabled for this digital asset.
              </div>
            )}

            {printBlockWarning && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-red-900 border border-red-700 text-red-100 text-xs px-4 py-2 rounded-xl shadow-lg z-55 flex items-center gap-2 animate-bounce">
                <CircleAlert className="w-4 h-4" />
                DRM Violation: Screen print and save operations are restricted by security policy.
              </div>
            )}

            {/* Reader Simulated Body */}
            <div className="flex-grow overflow-y-auto p-8 font-serif leading-relaxed text-slate-300 relative text-justify">
              
              {/* Copy Protection Overlay */}
              <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={(e) => e.preventDefault()} />

              <div className="max-w-2xl mx-auto space-y-6 select-none pointer-events-none">
                <h4 className="text-center text-slate-500 uppercase tracking-widest text-xs mb-8">Chapter IV: Core Paradigms</h4>
                <p>
                  In the development of large-scale distributed architectures, system consistency frameworks represent the foundational constraint layer. 
                  Unlike synchronous consensus models, modern enterprise nodes rely on decentralized state transitions configured with fallback protocols. 
                  When an endpoint experiences high database latency, transaction parameters route downstream to local storage vectors, securing session persistence without structural downtime.
                </p>
                <p>
                  As cataloged in our clinical records, the neural pathways governing behavioral thresholds function as analog variables. 
                  Under specific micro-stimulations, cognitive models demonstrate adaptive learning characteristics, enabling subjects to bypass normal retention constraints. 
                  Understanding these synapses forms the primary step in developing high-throughput neuro-interfaces.
                </p>
                <p>
                  Furthermore, visual column boundaries in modern interface layouts represent spatial limits. Grid columns allocate layout priorities dynamically, ensuring visual focus remains centered on content anchors.
                  This paradigm models the core column system detailed in historic Swiss design manuals.
                </p>
              </div>
            </div>

            {/* Reader Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
              <div className="flex items-center gap-4">
                <span>Reading Progress: {readProgress}%</span>
                <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full" style={{ width: `${readProgress}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={triggerCopyDrm}
                  className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </button>
                <button
                  onClick={triggerPrintDrm}
                  className="px-3 py-1.5 rounded bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {paymentReceipt && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 border-b pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Lumina Fine Payment Receipt
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Receipt No</span>
                <span className="font-mono font-bold">{paymentReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Student</span>
                <span className="font-semibold">{paymentReceipt.studentName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Book Title</span>
                <span className="font-semibold text-slate-900 line-clamp-1">{paymentReceipt.bookTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Barcode Paid</span>
                <span className="font-mono font-semibold">{paymentReceipt.barcode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Amount Settled</span>
                <span className="font-bold text-emerald-700">INR {paymentReceipt.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Mode</span>
                <span className="font-semibold text-indigo-700 font-mono text-[10px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {paymentReceipt.paymentMode} (RAZORPAY)
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setPaymentReceipt(null)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  );
};
