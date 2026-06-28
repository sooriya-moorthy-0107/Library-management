import { create } from 'zustand';

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  studentId?: string;
  phone?: string;
  departmentId?: string;
}

interface LmsState {
  user: UserInfo | null;
  token: string | null;
  activeRole: string; // The role currently viewed
  activeTab: string;
  loginError: string | null;
  mfaStatus: 'NONE' | 'SETUP' | 'CHALLENGE';
  mfaEmail: string | null;
  qrCodeSecret: string | null;
  
  initialize: () => void;
  login: (email: string, pass: string) => Promise<any>;
  verifyMfa: (code: string, isSetup: boolean) => Promise<any>;
  logout: () => void;
  switchRole: (role: string) => void;
  setTab: (tab: string) => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

export const useLmsStore = create<LmsState>((set, get) => ({
  user: null,
  token: null,
  activeRole: 'student',
  activeTab: 'catalog',
  loginError: null,
  mfaStatus: 'NONE',
  mfaEmail: null,
  qrCodeSecret: null,

  initialize: () => {
    const token = localStorage.getItem('lms_token');
    const userStr = localStorage.getItem('lms_user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ token, user, activeRole: user.role, activeTab: user.role === 'student' ? 'catalog' : 'dashboard' });
    }
  },

  apiFetch: async (path: string, options: RequestInit = {}) => {
    const token = get().token;
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/v1${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'API request failed');
    }
    return res.json();
  },

  login: async (email, password) => {
    set({ loginError: null });
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      if (data.status === 'MFA_SETUP') {
        set({ mfaStatus: 'SETUP', mfaEmail: data.email, qrCodeSecret: data.qrCodeSecret });
        return { mfaRequired: true, isSetup: true };
      } else if (data.status === 'MFA_CHALLENGE') {
        set({ mfaStatus: 'CHALLENGE', mfaEmail: data.email });
        return { mfaRequired: true, isSetup: false };
      }

      localStorage.setItem('lms_token', data.token);
      localStorage.setItem('lms_user', JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        activeRole: data.user.role,
        activeTab: data.user.role === 'student' ? 'catalog' : 'dashboard',
        mfaStatus: 'NONE',
        mfaEmail: null,
      });

      return { success: true };
    } catch (err: any) {
      set({ loginError: err.message });
      throw err;
    }
  },

  verifyMfa: async (code, isSetup) => {
    const email = get().mfaEmail;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/v1/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, isSetup }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid code');
      }

      localStorage.setItem('lms_token', data.token);
      localStorage.setItem('lms_user', JSON.stringify(data.user));

      set({
        token: data.token,
        user: data.user,
        activeRole: data.user.role,
        activeTab: data.user.role === 'student' ? 'catalog' : 'dashboard',
        mfaStatus: 'NONE',
        mfaEmail: null,
        qrCodeSecret: null,
      });

      return { success: true };
    } catch (err: any) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    set({ user: null, token: null, activeRole: 'student', activeTab: 'catalog', mfaStatus: 'NONE' });
  },

  switchRole: (role) => {
    let defaultTab = 'catalog';
    if (role === 'librarian') defaultTab = 'catalog';
    else if (role === 'coordinator') defaultTab = 'requests';
    else if (role === 'admin' || role === 'super_admin') defaultTab = 'dashboard';

    set({ activeRole: role, activeTab: defaultTab });
  },

  setTab: (tab) => {
    set({ activeTab: tab });
  },
}));
