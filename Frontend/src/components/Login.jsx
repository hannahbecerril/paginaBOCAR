import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
import '../App.css';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('interno');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let url = 'http://127.0.0.1:8000/api/auth/login/interno/';
      let headers = { 'Content-Type': 'application/json' };

      const payloadObj = { password, username };
      const bodyString = JSON.stringify(payloadObj);

      if (tipoUsuario === 'proveedor') {
        url = 'http://127.0.0.1:8000/api/auth/login/proveedor/';
        const secretKey = 'clave_secreta';
        const hash = CryptoJS.HmacSHA256(bodyString, secretKey).toString(CryptoJS.enc.Hex);
        headers['X-Signature'] = hash;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: bodyString,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error de autenticación');

      Cookies.set('access_token', data.access, { expires: 1, sameSite: 'strict' });
      Cookies.set('refresh_token', data.refresh, { expires: 7, sameSite: 'strict' });
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── IZQUIERDA ── */}
        <div className="login-left">
          <div className="login-left-grid" />
          <div className="login-left-overlay" />

          <div className="login-left-top">
            <div className="brand-logo">
              <div className="brand-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="#fff">
                  <rect x="1" y="1" width="5" height="5" rx="1"/>
                  <rect x="8" y="1" width="5" height="5" rx="1"/>
                  <rect x="1" y="8" width="5" height="5" rx="1"/>
                  <rect x="8" y="8" width="5" height="5" rx="1"/>
                </svg>
              </div>
              CHATIZA CORP
            </div>
          </div>

          <div className="login-left-bottom">
            <p className="left-title">Sistema de Gestión Industrial y Proveedores</p>
            <p className="left-sub">Plataforma centralizada para la gestión de solicitudes, cotizaciones y seguimiento de proveedores.</p>
          </div>
        </div>

        {/* ── DERECHA ── */}
        <div className="login-right">
          <div className="login-form-wrapper">
            <h2>Iniciar Sesión</h2>
            <p className="login-form-subtitle">Ingresa tus credenciales para acceder</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label>Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Introduce tu usuario"
                  required
                />
              </div>

              <div className="login-field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <p className="user-type-label">Tipo de usuario</p>
                <div className="user-type-grid">
                  <button
                    type="button"
                    className={`user-type-btn ${tipoUsuario === 'interno' ? 'active' : ''}`}
                    onClick={() => setTipoUsuario('interno')}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <circle cx="8" cy="5" r="3"/>
                      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/>
                    </svg>
                    Personal interno
                  </button>
                  <button
                    type="button"
                    className={`user-type-btn ${tipoUsuario === 'proveedor' ? 'active' : ''}`}
                    onClick={() => setTipoUsuario('proveedor')}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <rect x="1" y="6" width="14" height="8" rx="1.5"/>
                      <path d="M5 6V5a3 3 0 016 0v1"/>
                    </svg>
                    Proveedores
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Acceder al Sistema'}
                {!loading && (
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 8h10M9 4l4 4-4 4"/>
                  </svg>
                )}
              </button>
            </form>

            <p className="login-terms">Al acceder, aceptas los términos de uso y políticas de privacidad</p>
          </div>
        </div>

      </div>
    </div>
  );
}
