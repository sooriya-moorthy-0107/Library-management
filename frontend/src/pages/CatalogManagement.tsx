import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import {
  Plus, Search, Edit3, BookOpen, Package, X, Check,
  ChevronDown, Filter, BarChart2, LogOut, RefreshCw, Tag,
} from 'lucide-react';

interface BookType {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  edition: string;
  publicationYear: number;
  categoryId: string;
  departmentId: string;
  coverImageUrl?: string;
  description: string;
  finePerDay: number;
  maxIssueDays: number;
  isDigitalAvailable: boolean;
  drmPolicy: string;
  totalCopies: number;
  availableCopies: number;
}

const CATEGORIES = ['All', 'Neuroscience', 'Physics', 'Medicine', 'Design', 'Economics', 'Art History', 'Engineering', 'Mathematics', 'Computer Science', 'Chemistry', 'Biology'];

const emptyBook = {
  isbn: '', title: '', authors: '', publisher: '', edition: '',
  publicationYear: new Date().getFullYear(), categoryId: 'General', departmentId: 'Sciences',
  coverImageUrl: '', description: '', finePerDay: 5, maxIssueDays: 14,
  maxRenewals: 2, replacementCost: 0, isDigitalAvailable: false, drmPolicy: 'BORROW_ONLY',
};

export const CatalogManagement: React.FC = () => {
  const { apiFetch, user, logout } = useLmsStore();
  const [books, setBooks] = useState<BookType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [formData, setFormData] = useState(emptyBook);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      if (category !== 'All') params.set('category', category);
      const res = await apiFetch(`/books?${params.toString()}`);
      setBooks(res.data ?? res);
      setTotal(res.total ?? res.length ?? 0);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, [search, category, page]);

  const openAddModal = () => {
    setEditingBook(null);
    setFormData(emptyBook);
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  };

  const openEditModal = (book: BookType) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      authors: Array.isArray(book.authors) ? book.authors.join(', ') : String(book.authors),
      publisher: book.publisher,
      edition: book.edition,
      publicationYear: book.publicationYear,
      categoryId: book.categoryId,
      departmentId: book.departmentId,
      coverImageUrl: book.coverImageUrl ?? '',
      description: book.description,
      finePerDay: book.finePerDay,
      maxIssueDays: book.maxIssueDays,
      maxRenewals: 2,
      replacementCost: 0,
      isDigitalAvailable: book.isDigitalAvailable,
      drmPolicy: book.drmPolicy,
    });
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        authors: formData.authors.split(',').map((a) => a.trim()).filter(Boolean),
        publicationYear: Number(formData.publicationYear),
        finePerDay: Number(formData.finePerDay),
        maxIssueDays: Number(formData.maxIssueDays),
        maxRenewals: Number(formData.maxRenewals),
        replacementCost: Number(formData.replacementCost),
      };

      if (editingBook) {
        await apiFetch(`/books/${editingBook.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setFormSuccess('Book updated successfully');
      } else {
        await apiFetch('/books', { method: 'POST', body: JSON.stringify(payload) });
        setFormSuccess('Book added to catalog');
      }

      await fetchBooks();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message ?? 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Nav */}
      <nav className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-sm">L</div>
          <div>
            <h1 className="text-sm font-bold text-white">Catalog Management</h1>
            <p className="text-[10px] text-slate-500 font-mono">Lumina Library System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold">
              {user?.fullName?.[0] ?? 'L'}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search title, ISBN, category..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-900/50 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="appearance-none bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-300 focus:outline-none focus:border-emerald-500 transition-all"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            <button onClick={fetchBooks} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {['librarian', 'admin', 'super_admin'].includes(user?.role ?? '') && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Book
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {total} titles in catalog</span>
          {category !== 'All' && <span className="flex items-center gap-1"><Filter className="w-3 h-3" /> Filtered: {category}</span>}
        </div>

        {/* Book Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-slate-600">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">No books found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                canEdit={['librarian', 'admin', 'super_admin'].includes(user?.role ?? '')}
                onEdit={() => openEditModal(book)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 px-3">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-400 text-sm">{formError}</div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="ISBN *" value={formData.isbn} onChange={(v) => setFormData({ ...formData, isbn: v })} required placeholder="978-0-000-00000-0" />
                <FormField label="Title *" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required placeholder="Book title" />
                <FormField label="Authors * (comma-separated)" value={formData.authors} onChange={(v) => setFormData({ ...formData, authors: v })} required placeholder="Author 1, Author 2" />
                <FormField label="Publisher" value={formData.publisher} onChange={(v) => setFormData({ ...formData, publisher: v })} placeholder="Publisher name" />
                <FormField label="Edition" value={formData.edition} onChange={(v) => setFormData({ ...formData, edition: v })} placeholder="e.g. 3rd Edition" />
                <FormField label="Publication Year" value={String(formData.publicationYear)} onChange={(v) => setFormData({ ...formData, publicationYear: parseInt(v) })} type="number" placeholder="2024" />
                <FormField label="Category" value={formData.categoryId} onChange={(v) => setFormData({ ...formData, categoryId: v })} placeholder="e.g. Physics" />
                <FormField label="Department" value={formData.departmentId} onChange={(v) => setFormData({ ...formData, departmentId: v })} placeholder="e.g. Sciences" />
                <FormField label="Fine Per Day (₹)" value={String(formData.finePerDay)} onChange={(v) => setFormData({ ...formData, finePerDay: parseFloat(v) })} type="number" placeholder="5" />
                <FormField label="Max Issue Days" value={String(formData.maxIssueDays)} onChange={(v) => setFormData({ ...formData, maxIssueDays: parseInt(v) })} type="number" placeholder="14" />
                <FormField label="Replacement Cost (₹)" value={String(formData.replacementCost)} onChange={(v) => setFormData({ ...formData, replacementCost: parseFloat(v) })} type="number" placeholder="250" />
                <FormField label="Cover Image URL" value={formData.coverImageUrl} onChange={(v) => setFormData({ ...formData, coverImageUrl: v })} placeholder="https://..." />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the book"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDigitalAvailable}
                    onChange={(e) => setFormData({ ...formData, isDigitalAvailable: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-400">Digital Edition Available</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">DRM Policy</label>
                  <select
                    value={formData.drmPolicy}
                    onChange={(e) => setFormData({ ...formData, drmPolicy: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="BORROW_ONLY">Borrow Only</option>
                    <option value="OPEN">Open Access</option>
                    <option value="RESTRICTED">Restricted</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingBook ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface BookCardProps { book: BookType; canEdit: boolean; onEdit: () => void }

const BookCard: React.FC<BookCardProps> = ({ book, canEdit, onEdit }) => {
  const availColor = book.availableCopies === 0
    ? 'text-rose-400 bg-rose-950/30'
    : book.availableCopies <= 1
    ? 'text-amber-400 bg-amber-950/30'
    : 'text-emerald-400 bg-emerald-950/30';

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-800/50 transition-all hover:shadow-xl hover:shadow-emerald-900/10">
      {/* Cover */}
      <div className="h-40 bg-slate-800 overflow-hidden relative">
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-slate-700" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${availColor}`}>
            {book.availableCopies}/{book.totalCopies} available
          </span>
        </div>
        {book.isDigitalAvailable && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-900/50">Digital</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-2">
        <p className="text-sm font-bold text-slate-200 line-clamp-2 leading-tight">{book.title}</p>
        <p className="text-xs text-slate-500 line-clamp-1">
          {Array.isArray(book.authors) ? book.authors.join(', ') : String(book.authors)}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <Tag className="w-3 h-3" /> {book.categoryId}
          </span>
          <span className="text-[10px] text-slate-600">₹{book.finePerDay}/day fine</span>
        </div>

        {canEdit && (
          <button
            onClick={onEdit}
            className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/30 border border-slate-700 hover:border-emerald-700/50 text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3 h-3" /> Edit Book
          </button>
        )}
      </div>
    </div>
  );
};

interface FormFieldProps {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; placeholder?: string; type?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, value, onChange, required, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-900/50 transition-all"
    />
  </div>
);
