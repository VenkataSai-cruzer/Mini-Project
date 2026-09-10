import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';

import Layout         from './components/Layout';
import LoginPage      from './pages/LoginPage';
import SecurityCenter from './pages/SecurityCenter';
import SecurityLab    from './pages/SecurityLab';
import ActiveSession  from './pages/ActiveSession';
import IncidentCenter from './pages/IncidentCenter';
import AuditLog       from './pages/AuditLog';
import AboutPage      from './pages/AboutPage';

/** Redirect unauthenticated users to /login */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/security-center" replace />} />
        <Route path="security-center" element={<SecurityCenter />} />
        <Route path="lab"             element={<SecurityLab />} />
        <Route path="session"         element={<ActiveSession />} />
        <Route path="incidents"       element={<IncidentCenter />} />
        <Route path="audit"           element={<AuditLog />} />
        <Route path="about"           element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <AppRoutes />
      </SessionProvider>
    </AuthProvider>
  );
}
