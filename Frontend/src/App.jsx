// src/App.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import Login from './sections/Login';
import PurchasesDashboard from './sections/Purchases';
import IndustrializationDashboard from './sections/Industrialization';
import SuppliersDashboard from './sections/Suppliers';

// ── Inner app — has access to NotificationContext ─────────────────────────────
function AppContent() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { reloadNotifications } = useNotifications();

  // Restore session on hard reload (token + user already in cookies/localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = Cookies.get('access_token');
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.rol);
        // Token present on reload → notifications already load via NotificationProvider mount
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (rol) => {
    setUserRole(rol);

    // Trigger a single notification fetch now that the auth cookie is set
    reloadNotifications();

    let redirectPath = '/';
    if (rol === 'Purchases' || rol === 'Purchases_Admin') {
      redirectPath = '/Purchases';
    } else if (rol === 'Industrialization' || rol === 'Industrialization_Admin') {
      redirectPath = '/Industrialization';
    } else if (rol === 'Supplier') {
      redirectPath = '/Suppliers';
    } else if (rol === 'SuperAdmin') {
      redirectPath = '/Industrialization';
    }
    navigate(redirectPath);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('user');
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    navigate('/Login');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-brand-accent border-t-transparent" />
          <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!userRole) return <Navigate to="/Login" replace />;
    const normalizedRole = userRole.replace('_Admin', '');
    if (!allowedRoles.includes(normalizedRole)) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--brand-danger)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Your role ({userRole}) does not have permission to view this section.</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 text-sm"
            style={{ backgroundColor: 'var(--brand-accent)', color: 'white' }}
          >
            Go Back to Login
          </button>
        </div>
      );
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/Login" element={<Login onLogin={handleLoginSuccess} />} />

      <Route
        path="/Purchases/*"
        element={
          <ProtectedRoute allowedRoles={['Purchases']}>
            <PurchasesDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/Industrialization/*"
        element={
          <ProtectedRoute allowedRoles={['Industrialization']}>
            <IndustrializationDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/Suppliers/*"
        element={
          <ProtectedRoute allowedRoles={['Supplier']}>
            <SuppliersDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/Login" replace />} />
    </Routes>
  );
}

// ── Root — provides the NotificationContext to the entire tree ────────────────
export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
