import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, LogIn, AlertCircle, Loader } from 'lucide-react';
import { use3DTilt } from '../hooks/use3DTilt.js';

function Login({ onToggleAuthMode }) {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cardTilt = use3DTilt({ maxTilt: 5, scale: 1.01 });

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div
        ref={cardTilt.ref}
        onMouseMove={cardTilt.onMouseMove}
        onMouseLeave={cardTilt.onMouseLeave}
        style={cardTilt.style}
        className="glass-card w-full max-w-md p-8 rounded-3xl space-y-8 animate-fade-in-up"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] mb-2">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display">
            Welcome <span className="gradient-text">Back</span>
          </h1>
          <p className="text-[#94A3B8] text-sm font-sans font-medium">
            Sign in to sync your carbon footprint history across devices.
          </p>
        </div>

        {/* Error Banner */}
        {(error || authError) && (
          <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-sans font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="login-email-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="email"
                id="login-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="login-password-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="password"
                id="login-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-premium w-full h-14 flex items-center justify-center gap-2.5 font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none rounded-xl disabled:opacity-50"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center">
          <p className="text-xs text-[#94A3B8] font-sans font-medium">
            Don't have an account?{' '}
            <button
              onClick={onToggleAuthMode}
              className="text-[#F7931A] hover:underline font-bold transition-all bg-transparent border-0 cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
