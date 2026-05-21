// src/App.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './sections/Login';
import PurchasesDashboard from './sections/Purchases';
import IndustrializationDashboard from './sections/Industrialization';
import SuppliersDashboard from './sections/Suppliers';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const token = Cookies.get('access_token');

      if (storedUser && token) {
        try {
          const user = JSON.parse(storedUser);
          setUserRole(user.rol);
        } catch (e) {
          console.error('Error parsing user from localStorage', e);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (rol) => {
    setUserRole(rol);

    let redirectPath = '/';
    if (rol === 'Purchases' || rol === 'Purchases_Admin') {
      redirectPath = '/Purchases';
    } else if (rol === 'Industrialization' || rol === 'Industrialization_Admin') {
      redirectPath = '/Industrialization';
    } else if (rol === 'Suppliers' || rol === 'Suppliers_Admin') {
      redirectPath = '/Suppliers';
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
    <NotificationProvider>
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
            <ProtectedRoute allowedRoles={['Suppliers']}>
              <SuppliersDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/Login" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;