// sections/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Shield, ArrowRight } from 'lucide-react'; // Added Shield import
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('internal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let url = 'http://127.0.0.1:8000/api/auth/login/internal/';
      let headers = { 'Content-Type': 'application/json' };

      const payloadObj = { password, username };
      const bodyString = JSON.stringify(payloadObj);

      if (userType === 'supplier') {
        url = 'http://127.0.0.1:8000/api/auth/login/supplier/';
        const secretKey = 'secret_key';
        const hash = CryptoJS.HmacSHA256(bodyString, secretKey).toString(CryptoJS.enc.Hex);
        headers['X-Signature'] = hash;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: bodyString,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Authentication error');

      Cookies.set('access_token', data.access, { expires: 1, sameSite: 'strict' });
      Cookies.set('refresh_token', data.refresh, { expires: 7, sameSite: 'strict' });
      localStorage.setItem('user', JSON.stringify(data.usuario));
      navigate('/industrialization/rfqform');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* LEFT PANEL - Branding */}
      <div className="hidden md:flex md:w-2/5 lg:w-[42%] relative flex-col justify-between p-10 overflow-hidden" style={{ backgroundColor: '#0f2742' }}>
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
              <p className="text-xs font-semibold tracking-wider text-white">CHATIZA CORP</p>
              <p className="text-[10px] text-white/50">Industrial Management</p>
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10">
          <h2 className="text-white text-2xl font-semibold leading-snug mb-4">
            Industrial & Supplier Management System
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Centralized platform for managing requests, quotations, and supplier tracking.
          </p>

          {/* Features List */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <div className="w-5 h-5 bg-white/10 flex items-center justify-center">
                <Shield size={12} className="text-white/70" />
              </div>
              <span>Secure document management</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <div className="w-5 h-5 bg-white/10 flex items-center justify-center">
                <Users size={12} className="text-white/70" />
              </div>
              <span>Supplier collaboration</span>
            </div>
            <div className="flex items-center gap-3 text-white/70 text-sm">
              <div className="w-5 h-5 bg-white/10 flex items-center justify-center">
                <Building size={12} className="text-white/70" />
              </div>
              <span>Quote management</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 w-full flex items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="md:w-65% mx-auto w-90%">
          {/* Header */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sign In
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Enter your credentials to access the system
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 text-sm px-4 py-3 border" style={{ color: 'var(--brand-danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--brand-danger)' }}>
              <div className="flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />

            {/* Password Field */}
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* User Type Selection */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
                User Type
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("internal")}
                  className={`
                    px-4 py-3 text-sm font-medium border transition-all duration-200
                    flex items-center justify-center gap-2
                    ${userType === "internal"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <Users size={16} />
                  Internal Staff
                </button>

                <button
                  type="button"
                  onClick={() => setUserType("supplier")}
                  className={`
                    px-4 py-3 text-sm font-medium border transition-all duration-200
                    flex items-center justify-center gap-2
                    ${userType === "supplier"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  <Building size={16} />
                  Suppliers
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full mt-6"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Access System
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
              By accessing, you accept the terms of use and privacy policies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}