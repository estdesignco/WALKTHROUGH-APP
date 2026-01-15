import React, { useState } from 'react';

const APP_PASSWORD = 'DesignReady2026!';
const AUTH_KEY = 'design_ready_auth';

export const isAuthenticated = () => {
  const auth = localStorage.getItem(AUTH_KEY);
  return auth === 'true';
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
  window.location.reload();
};

const SimpleLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (password === APP_PASSWORD) {
        localStorage.setItem(AUTH_KEY, 'true');
        onLogin();
      } else {
        setError('Incorrect password');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" 
      style={{ 
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
      }}>
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          border: '2px solid #d4af37',
        }}>
        
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#d4af37' }}>
            Design Ready
          </h1>
          <p className="text-stone-400 text-sm">Interior Design Management</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-stone-300 text-sm mb-2">
              Enter Password to Continue
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full px-4 py-3 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2"
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid #444',
                focusRing: '#d4af37',
              }}
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-lg font-semibold text-black transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
            }}
          >
            {loading ? 'Verifying...' : 'Enter App'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-stone-500 text-xs">
            EST Design Co. © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;
