import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import './App.css';

// Un Dashboard temporal para que veas que sí entraste
const Dashboard = () => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1>✅ ¡Bienvenido al Sistema!</h1>
    <p>Has iniciado sesión correctamente.</p>
    <button onClick={() => window.location.href = '/'}>Cerrar Sesión</button>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Login */}
        <Route path="/" element={<Login />} />
        
        {/* Ruta a la que vas después de entrar */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;