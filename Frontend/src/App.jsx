// src/App.jsx
import { NotificationProvider } from './contexts/NotificationContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
    <BrowserRouter>
      <NotificationProvider>
        <Routes>
          {/* Login */}
          <Route path="/Login" element={<Login />} />

          {/* Purchases module */}
          <Route path="/Purchases/*" element={<PurchasesDashboard />} />

          {/* Industrialization module  */}
          <Route path="/Industrialization/*" element={<IndustrializationDashboard />} />

          {/* Suppliers module */}
          <Route path="/Suppliers/*" element={<SuppliersDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/Login" />} />
        </Routes>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;