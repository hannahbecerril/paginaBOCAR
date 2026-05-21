// src/App.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { NotificationProvider } from './contexts/NotificationContext';
import { Routes, Route, Navigate } from 'react-router-dom';
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
        const user = JSON.parse(storedUser);
        setUserRole(user.rol);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (role) => {
    setUserRole(role);

    if (role === 'Purchases' || role === 'Purchases_Admin') {
      navigate('/Purchases');
    } else if (role === 'Industrialization' || role === 'Industrialization_Admin') {
      navigate('/Industrialization');
    } else if (role === 'Suppliers' || role === 'Suppliers_Admin') {
      navigate('/Suppliers');
    } else {
      navigate('/Login');
    }
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
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--brand-danger)' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Your role ({userRole}) does not have permission to view this section.</p>
        </div>
      );
    }
    return children;
  };

  return (
    <NotificationProvider>
      <Routes>
        {/* Login */}
        <Route path="/Login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

        {/* Purchases module */}
        <Route
          path="/Purchases/*"
          element={
            <ProtectedRoute allowedRoles={['Purchases', 'Purchases_Admin']}>
              <PurchasesDashboard />
            </ProtectedRoute>
          }
        />

        {/* Industrialization module */}
        <Route
          path="/Industrialization/*"
          element={
            <ProtectedRoute allowedRoles={['Industrialization', 'Industrialization_Admin']}>
              <IndustrializationDashboard />
            </ProtectedRoute>
          }
        />

        {/* Suppliers module */}
        <Route
          path="/Suppliers/*"
          element={
            <ProtectedRoute allowedRoles={['Suppliers', 'Suppliers_Admin']}>
              <SuppliersDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/Login" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;