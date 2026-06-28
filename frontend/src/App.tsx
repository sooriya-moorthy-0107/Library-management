import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLmsStore } from './store/useLmsStore';
import { Login } from './pages/Login';
import { StudentPortal } from './pages/StudentPortal';
import { LibrarianPortal } from './pages/LibrarianPortal';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { CatalogManagement } from './pages/CatalogManagement';
import { VerifyCertificate } from './pages/VerifyCertificate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Determines the correct portal path for a given role
function roleToPath(role: string): string {
  switch (role) {
    case 'student':
      return '/portal/student';
    case 'librarian':
      return '/portal/librarian';
    case 'coordinator':
      return '/portal/librarian'; // Coordinators share Librarian portal
    case 'admin':
    case 'super_admin':
      return '/portal/dashboard';
    default:
      return '/login';
  }
}

// Guard: if not logged in, redirect to /login
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, token } = useLmsStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct portal instead of a 403
    return <Navigate to={roleToPath(user.role)} replace />;
  }

  return <>{children}</>;
}

// Handles "/" — redirects logged-in users to their portal
function RootRedirect() {
  const { user, token, initialize } = useLmsStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (token && user) {
      navigate(roleToPath(user.role), { replace: true });
    }
  }, [token, user]);

  if (token && user) {
    return null; // useEffect will navigate
  }

  return <Navigate to="/login" replace />;
}

// Initializes persisted auth on app load
function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initialize } = useLmsStore();

  useEffect(() => {
    initialize();
  }, []);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            {/* Public */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/verify/:certificateId" element={<VerifyCertificate />} />

            {/* Student Portal */}
            <Route
              path="/portal/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentPortal />
                </ProtectedRoute>
              }
            />

            {/* Librarian + Coordinator Portal */}
            <Route
              path="/portal/librarian"
              element={
                <ProtectedRoute allowedRoles={['librarian', 'coordinator', 'admin', 'super_admin']}>
                  <LibrarianPortal />
                </ProtectedRoute>
              }
            />

            {/* Catalog Management — Librarian/Admin */}
            <Route
              path="/portal/catalog"
              element={
                <ProtectedRoute allowedRoles={['librarian', 'admin', 'super_admin']}>
                  <CatalogManagement />
                </ProtectedRoute>
              }
            />

            {/* Executive Dashboard — Admin only */}
            <Route
              path="/portal/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ExecutiveDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// Redirect already-logged-in users away from /login
function LoginRoute() {
  const { user, token } = useLmsStore();

  if (token && user) {
    return <Navigate to={roleToPath(user.role)} replace />;
  }

  return <Login />;
}
