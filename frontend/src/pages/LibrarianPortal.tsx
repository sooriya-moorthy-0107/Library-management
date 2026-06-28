import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import { Search, Plus, Book, FileText, CheckCircle, CircleAlert, RefreshCw, Barcode, UserCheck, Calendar, ArrowRightLeft, ShieldCheck, User, LogOut } from 'lucide-react';

interface BookType {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  categoryId: string;
  departmentId: string;
  description: string;
  finePerDay: number;
  maxIssueDays: number;
  isDigitalAvailable: boolean;
  drmPolicy: string;
  totalCopies: number;
  availableCopies: number;
}

interface CopyType {
  id: string;
  copyNumber: string;
  barcode: string;
  condition: string;
  locationShelf: string;
  locationRack: string;
  status: 'AVAILABLE' | 'ISSUED' | 'LOST';
}

interface RequestType {
  id: string;
  bookId: string;
  userId: string;
  status: string;
  purpose: string;
  coordinatorComment?: string;
  book: {
    title: string;
  };
  user: {
    fullName: string;
    studentId: string;
  };
}

export const LibrarianPortal: React.FC = () => {
  const { apiFetch, user, logout } = useLmsStore();
  const [activeTab, setActiveTab] = useState<'circulation' | 'catalog' | 'requests'>('circulation');

  // Book Inventory state
  const [books, setBooks] = useState<BookType[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [copies, setCopies] = useState<CopyType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals / forms
  const [showAddBook, setShowAddBook] = useState(false);
  const [isbnLookupVal, setIsbnLookupVal] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    authors: '',
    categoryId: 'Neuroscience',
    departmentId: 'Sciences',
    coverImageUrl: '',
    description: '',
    finePerDay: 5.00,
    maxIssueDays: 14,
    isDigitalAvailable: false,
    drmPolicy: 'BORROW_ONLY',
  });

  const [showAddCopy, setShowAddCopy] = useState(false);
  const [newCopyForm, setNewCopyForm] = useState({
    condition: 'GOOD',
    shelf: 'A1',
    rack: '1',
  });

  // Circulation Desk state
  const [issueForm, setIssueForm] = useState({
    studentId: '',
    barcode: '',
  });
  const [returnForm, setReturnForm] = useState({
    barcode: '',
    conditionNotes: 'GOOD',
  });
  const [circulationLogs, setCirculationLogs] = useState<any[]>([]);
  const [circulationLoading, setCirculationLoading] = useState(false);

  // Hold Requests
  const [requests, setRequests] = useState<RequestType[]>([]);

  // Load functions
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/books?q=${encodeURIComponent(searchQuery)}`);
      setBooks(data);
    } catch (err) {
      console.error('Error fetching catalog', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCopies = async (bookId: string) => {
    try {
      const data = await apiFetch(`/books/${bookId}/copies`);
      setCopies(data);
    } catch (err) {
      console.error('Error fetching copies', err);
    }
  };

  const fetchActiveCirculation = async () => {
    try {
      const data = await apiFetch('/circulation/active');
      setCirculationLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await apiFetch('/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchCatalog();
    } else if (activeTab === 'circulation') {
      fetchActiveCirculation();
    } else if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const handleIsbnLookup = async () => {
    if (!isbnLookupVal.trim()) return;
    try {
      const result = await apiFetch('/books', {
        method: 'POST',
        body: JSON.stringify({ isbn: isbnLookupVal }),
      });
      setLookupResult(result);
      setNewBookForm({
        title: result.title,
        authors: result.authors.join(', '),
        categoryId: result.categoryId,
        departmentId: result.departmentId,
        coverImageUrl: '',
        description: result.description,
        finePerDay: result.finePerDay,
        maxIssueDays: result.maxIssueDays,
        isDigitalAvailable: result.isDigitalAvailable,
        drmPolicy: result.drmPolicy,
      });
    } catch (err) {
      alert('ISBN lookup failed. Manual entry allowed.');
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/books', {
        method: 'POST',
        body: JSON.stringify({
          ...newBookForm,
          isbn: isbnLookupVal || `MANUAL-${Date.now()}`,
          authors: newBookForm.authors.split(',').map(a => a.trim()),
        }),
      });
      alert('Book catalog resource created successfully!');
      setShowAddBook(false);
      setIsbnLookupVal('');
      setLookupResult(null);
      fetchCatalog();
    } catch (err: any) {
      alert(`Error creating catalog resource: ${err.message}`);
    }
  };

  const handleAddCopySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      await apiFetch(`/books/${selectedBook.id}/copies`, {
        method: 'POST',
        body: JSON.stringify(newCopyForm),
      });
      alert('Book inventory copy added successfully!');
      setShowAddCopy(false);
      fetchCopies(selectedBook.id);
      fetchCatalog();
    } catch (err: any) {
      alert(`Error adding copy: ${err.message}`);
    }
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setCirculationLoading(true);
    try {
      const data = await apiFetch('/circulation/issue', {
        method: 'POST',
        body: JSON.stringify(issueForm),
      });
      alert(`Book Copy Issued! Due Date: ${new Date(data.dueDate).toLocaleDateString()}`);
      setIssueForm({ studentId: '', barcode: '' });
      fetchActiveCirculation();
    } catch (err: any) {
      alert(`Issue Rejected: ${err.message}`);
    } finally {
      setCirculationLoading(false);
    }
  };

  const handleReturnBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setCirculationLoading(true);
    try {
      const data = await apiFetch('/circulation/return', {
        method: 'POST',
        body: JSON.stringify(returnForm),
      });
      alert(data.message || 'Book returned successfully!');
      setReturnForm({ barcode: '', conditionNotes: 'GOOD' });
      fetchActiveCirculation();
    } catch (err: any) {
      alert(`Return failed: ${err.message}`);
    } finally {
      setCirculationLoading(false);
    }
  };

  const selectBookForCopies = (book: BookType) => {
    setSelectedBook(book);
    fetchCopies(book.id);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col relative overflow-hidden">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/10">L</div>
          <div>
            <h1 className="text-xs font-extrabold text-slate-900 leading-tight">Lumina Librarian Portal</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Circulation & Inventory Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
              {user?.fullName?.[0] ?? 'L'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</p>
              <p className="text-[9px] text-slate-400 font-semibold tracking-wider font-mono leading-none capitalize">{user?.role}</p>
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
          onClick={() => setActiveTab('circulation')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'circulation'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Circulation Desk
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'catalog'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Book className="w-4 h-4" />
          Catalog Registry
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Queue / Holds Logs
        </button>
      </div>

      {/* Circulation Tab */}
      {activeTab === 'circulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Action Panes */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Issue Pane */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Issue Book Copy
              </h3>
              <form onSubmit={handleIssueBook} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024-FAC-4592"
                    value={issueForm.studentId}
                    onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Copy Barcode
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LUM-4451-BD"
                    value={issueForm.barcode}
                    onChange={(e) => setIssueForm({ ...issueForm, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={circulationLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all"
                >
                  Issue Copy
                </button>
              </form>
            </div>

            {/* Return Pane */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
                <Barcode className="w-4 h-4 text-emerald-600" />
                Return Book Copy
              </h3>
              <form onSubmit={handleReturnBook} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Barcode Scan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LUM-1102-QA"
                    value={returnForm.barcode}
                    onChange={(e) => setReturnForm({ ...returnForm, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Condition Assessment
                  </label>
                  <select
                    value={returnForm.conditionNotes}
                    onChange={(e) => setReturnForm({ ...returnForm, conditionNotes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none transition-all"
                  >
                    <option value="GOOD">GOOD (Ready for shelves)</option>
                    <option value="FAIR">FAIR (Needs clean-up)</option>
                    <option value="DAMAGED">DAMAGED (Submit for repair)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={circulationLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm disabled:opacity-50 transition-all"
                >
                  Process Return
                </button>
              </form>
            </div>

          </div>

          {/* Active Checkouts list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Active Library Circulation Logs</h3>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Borrower / ID</th>
                      <th className="p-3">Asset Barcode</th>
                      <th className="p-3">Book Title</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {circulationLogs.map((log) => {
                      const isOverdue = log.status === 'OVERDUE' || new Date(log.dueAt) < new Date();
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{log.user?.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.user?.studentId}</div>
                          </td>
                          <td className="p-3 font-mono font-semibold text-slate-600">{log.copy?.barcode}</td>
                          <td className="p-3 font-medium text-slate-700 max-w-[180px] truncate">{log.copy?.book?.title}</td>
                          <td className="p-3 font-semibold text-slate-800">{new Date(log.dueAt).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase ${
                                isOverdue ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {isOverdue ? 'Overdue' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {circulationLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                          No active loan parameters registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Books Inventory list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900">Dynamic Inventory Registry</h3>
              <button
                onClick={() => setShowAddBook(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Book
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Catalog Resource</th>
                      <th className="p-3">ISBN</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Copies</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {books.map((book) => (
                      <tr
                        key={book.id}
                        className={`hover:bg-slate-50/50 cursor-pointer ${
                          selectedBook?.id === book.id ? 'bg-blue-50/20' : ''
                        }`}
                        onClick={() => selectBookForCopies(book)}
                      >
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{book.title}</div>
                          <div className="text-[10px] text-slate-500">by {book.authors.join(', ')}</div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{book.isbn}</td>
                        <td className="p-3 font-semibold text-slate-700">{book.departmentId}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800">{book.availableCopies}</span>
                          <span className="text-slate-400"> / {book.totalCopies}</span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectBookForCopies(book);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-500 font-bold"
                          >
                            Manage Copies
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Manage copies of selected book */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Inventory Copy Management</h3>
            
            {selectedBook ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="border-b pb-3">
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{selectedBook.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">by {selectedBook.authors.join(', ')}</p>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Physical copies status</span>
                  <button
                    onClick={() => setShowAddCopy(true)}
                    className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Copy
                  </button>
                </div>

                <div className="space-y-3">
                  {copies.map((copy) => (
                    <div key={copy.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-mono font-bold text-slate-700">{copy.barcode}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Shelf: <span className="font-semibold text-slate-600">{copy.locationShelf}</span> | 
                          Rack: <span className="font-semibold text-slate-600">{copy.locationRack}</span>
                        </div>
                        <div className="text-[9px] mt-1 font-bold text-slate-400">Condition: {copy.condition}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase ${
                          copy.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : copy.status === 'ISSUED'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {copy.status}
                      </span>
                    </div>
                  ))}
                  {copies.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                      No copies registered for this catalog item.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs font-semibold">
                Select a book resource from inventory to view and manage physical copy locations.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Queue Hold Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">Holds Clearance and Queue Monitor</h3>
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3">Requester</th>
                    <th className="p-3">Catalog Resource</th>
                    <th className="p-3">Purpose notes</th>
                    <th className="p-3">Clearance status</th>
                    <th className="p-3">Reviewer Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{req.user?.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{req.user?.studentId}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{req.book?.title}</td>
                      <td className="p-3 text-slate-500 max-w-[200px] truncate">{req.purpose || 'N/A'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-[4px] font-bold text-[9px] uppercase ${
                            req.status === 'QUEUED'
                              ? 'bg-blue-50 text-blue-700'
                              : req.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium italic">{req.coordinatorComment || 'N/A'}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 font-medium">
                        No holds requests currently filed in system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddBook && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-850 relative">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-3 flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              Add New Catalog Resource
            </h3>

            {/* ISBN Lookup Section */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ISBN Registry Autocomplete</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Scan or type ISBN (e.g. 978-0071390119)"
                  value={isbnLookupVal}
                  onChange={(e) => setIsbnLookupVal(e.target.value)}
                  className="flex-grow bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Full Form */}
            <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Book Title</label>
                  <input
                    type="text"
                    required
                    value={newBookForm.title}
                    onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Authors (Comma separated)</label>
                  <input
                    type="text"
                    required
                    value={newBookForm.authors}
                    onChange={(e) => setNewBookForm({ ...newBookForm, authors: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Category ID</label>
                  <input
                    type="text"
                    required
                    value={newBookForm.categoryId}
                    onChange={(e) => setNewBookForm({ ...newBookForm, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Department ID</label>
                  <input
                    type="text"
                    required
                    value={newBookForm.departmentId}
                    onChange={(e) => setNewBookForm({ ...newBookForm, departmentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Catalog Description</label>
                <textarea
                  value={newBookForm.description}
                  onChange={(e) => setNewBookForm({ ...newBookForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Fine Rate / Day (INR)</label>
                  <input
                    type="number"
                    value={newBookForm.finePerDay}
                    onChange={(e) => setNewBookForm({ ...newBookForm, finePerDay: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Max Borrowing (Days)</label>
                  <input
                    type="number"
                    value={newBookForm.maxIssueDays}
                    onChange={(e) => setNewBookForm({ ...newBookForm, maxIssueDays: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 border-t border-slate-100">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="checkbox"
                    checked={newBookForm.isDigitalAvailable}
                    onChange={(e) => setNewBookForm({ ...newBookForm, isDigitalAvailable: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Enable Digital DRM copy
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBook(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                >
                  Create catalog record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Copy Modal */}
      {showAddCopy && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-slate-850">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-3">
              Add Inventory Physical Copy
            </h3>

            <form onSubmit={handleAddCopySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shelf Code</label>
                <input
                  type="text"
                  required
                  value={newCopyForm.shelf}
                  onChange={(e) => setNewCopyForm({ ...newCopyForm, shelf: e.target.value })}
                  placeholder="e.g. A3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rack Number</label>
                <input
                  type="text"
                  required
                  value={newCopyForm.rack}
                  onChange={(e) => setNewCopyForm({ ...newCopyForm, rack: e.target.value })}
                  placeholder="e.g. 2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Condition</label>
                <select
                  value={newCopyForm.condition}
                  onChange={(e) => setNewCopyForm({ ...newCopyForm, condition: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="GOOD">GOOD (Brand New)</option>
                  <option value="FAIR">FAIR (Slightly Used)</option>
                  <option value="DAMAGED">DAMAGED (Needs binding)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCopy(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
                >
                  Save Copy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </div>
  );
};
