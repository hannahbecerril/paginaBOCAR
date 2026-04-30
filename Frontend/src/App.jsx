import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

import Login from './sections/Login'; 
import Compras from './sections/Compras';
import Industrializacion from './sections/Industrializacion';
import './index.css';

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
      navigate('/compras');
    } else if (role === 'Industrialization' || role === 'Industrialization_Admin') {
      navigate('/industrializacion');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('user');
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    navigate('/login');
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!userRole) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-red-600 font-bold text-xl">Acceso Denegado</h2>
          <p>Tu rol ({userRole}) no tiene permiso para ver esta sección.</p>
        </div>
      );
    }
    return children;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      {/* El Header se muestra solo si NO estamos en la pantalla de Login */}
      {location.pathname !== '/login' && userRole && (
        <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
          <h1 className="font-bold text-[#0f2742]">CHATIZA CORP</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              Rol: {userRole}
            </span>
            <button 
              onClick={handleLogout}
              className="text-red-600 text-sm border border-red-200 px-3 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>
      )}

      {/* ÁREA DE RUTAS DINÁMICAS */}
      <main className={location.pathname !== '/login' ? "flex-1 p-6" : "flex-1"}>
        <Routes>
          {/* Ruta Pública */}
          <Route 
            path="/login" 
            element={userRole ? <Navigate to="/" replace /> : <Login onLogin={handleLoginSuccess} />} 
          />

          {/* Rutas Protegidas de Compras */}
          {/* El /* permite que el componente Compras tenga sus propias sub-rutas internamente */}
          <Route 
            path="/compras/*" 
            element={
              <ProtectedRoute allowedRoles={['Purchases', 'Purchases_Admin']}>
                <Compras />
              </ProtectedRoute>
            } 
          />

          {/* Rutas Protegidas de Industrialización */}
          <Route 
            path="/industrializacion/*" 
            element={
              <ProtectedRoute allowedRoles={['Industrialization', 'Industrialization_Admin']}>
                <Industrializacion />
              </ProtectedRoute>
            } 
          />

          {/* Ruta Raíz por defecto (Redirige según el rol) */}
          <Route 
            path="/" 
            element={
              !userRole ? <Navigate to="/login" replace /> :
              (userRole === 'Purchases' || userRole === 'Purchases_Admin') ? <Navigate to="/compras" replace /> :
              (userRole === 'Industrialization' || userRole === 'Industrialization_Admin') ? <Navigate to="/industrializacion" replace /> :
              <div className="p-10">Rol sin página principal configurada.</div>
            }
          />

          {/* Ruta 404 para cualquier URL que no exista */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;