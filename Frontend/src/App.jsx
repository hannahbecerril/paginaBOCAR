// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './sections/Login';
import ComprasDashboard from './sections/Compras';
import IndustrializacionDashboard from './sections/Industrializacion';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Compras module - IMPORTANT: Add /* to enable nested routes */}
        <Route path="/compras/*" element={<ComprasDashboard />} />

        {/* Industrializacion module - IMPORTANT: Add /* to enable nested routes */}
        <Route path="/industrializacion/*" element={<IndustrializacionDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;