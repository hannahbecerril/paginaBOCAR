// src/App.jsx
import { NotificationProvider } from './contexts/NotificationContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './sections/Login';
import PurchasesDashboard from './sections/Purchases';
import IndustrializationDashboard from './sections/Industrialization';
import SuppliersDashboard from './sections/Suppliers';

function App() {
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