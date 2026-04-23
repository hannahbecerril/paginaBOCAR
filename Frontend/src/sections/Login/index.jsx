// sections/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Building, Users, Shield, ArrowRight } from 'lucide-react';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

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
      navigate('/industrializacion/rfqform');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">

      {/* LEFT PANEL - Branding */}
      <div className="hidden md:flex w-[42%] relative flex-col justify-between p-10 bg-[#0f2742] overflow-hidden">

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            background: `
              repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 60px),
              repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, transparent 60px)
            `
          }}
        />

        {/* Logo Section */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-[2px]">
                <div className="w-2.5 h-2.5 bg-white" />
                <div className="w-2.5 h-2.5 bg-white" />
                <div className="w-2.5 h-2.5 bg-white" />
                <div className="w-2.5 h-2.5 bg-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider">CHATIZA CORP</p>
              <p className="text-[10px] text-white/50">Industrial Management</p>
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10">
          <h2 className="text-white text-2xl font-semibold leading-snug mb-4">
            Sistema de Gestión Industrial y Proveedores
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Plataforma centralizada para la gestión de solicitudes, cotizaciones y seguimiento de proveedores.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Username Field */}
            <Input
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Introduce tu usuario"
              required
            />

            {/* Password Field */}
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* User Type Selection */}
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Tipo de usuario
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoUsuario("interno")}
                  className={`
                    px-4 py-3 text-sm font-medium border transition-all
                    flex items-center justify-center gap-2
                    ${tipoUsuario === "interno"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <Users size={16} />
                  Personal interno
                </button>

                <button
                  type="button"
                  onClick={() => setTipoUsuario("proveedor")}
                  className={`
                    px-4 py-3 text-sm font-medium border transition-all
                    flex items-center justify-center gap-2
                    ${tipoUsuario === "proveedor"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <Building size={16} />
                  Proveedores
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  Acceder al Sistema
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Al acceder, aceptas los términos de uso y políticas de privacidad
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}