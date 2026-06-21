import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, LogIn, AlertCircle, Loader, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import { use3DTilt } from '../hooks/use3DTilt.js';

function Login({ onToggleAuthMode }) {
  const { login, forgotPassword, resetPassword, error: authError } = useAuth();
  
  // View states: 'login' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const cardTilt = use3DTilt({ maxTilt: 5, scale: 1.01 });

  // Handle Login Submit
  const handleLoginSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  // Handle Request OTP (Forgot Password)
  const handleForgotPasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const msg = await forgotPassword(email);
      setSuccessMessage(msg || 'Verification code sent to your email.');
      setAuthMode('reset');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, forgotPassword]);

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const msg = await resetPassword(email, otp, newPassword);
      setSuccessMessage(msg || 'Password updated successfully! Please log in.');
      setAuthMode('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Reset failed. Please check your OTP code.');
    } finally {
      setLoading(false);
    }
  }, [email, otp, newPassword, resetPassword]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div
        ref={cardTilt.ref}
        onMouseMove={cardTilt.onMouseMove}
        onMouseLeave={cardTilt.onMouseLeave}
        style={cardTilt.style}
        className="glass-card w-full max-w-md p-8 rounded-3xl space-y-8 animate-fade-in-up"
      >
        {/* Render Forgot Password Form */}
        {authMode === 'forgot' && (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-white font-display">
                Forgot <span className="gradient-text">Password</span>
              </h1>
              <p className="text-[#94A3B8] text-sm font-sans font-medium">
                Enter your email address to receive a 6-digit verification code.
              </p>
            </div>

            {/* Notifications */}
            {(error || authError) && (
              <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-sans font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || authError}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="forgot-email-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="email"
                    id="forgot-email-input"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full h-14 flex items-center justify-center gap-2.5 font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none rounded-xl disabled:opacity-50"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
              </button>
            </form>

            {/* Back Button */}
            <div className="text-center pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className="inline-flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white font-bold transition-all bg-transparent border-0 cursor-pointer focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
            </div>
          </>
        )}

        {/* Render Enter OTP & Reset Form */}
        {authMode === 'reset' && (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-white font-display">
                Verify <span className="gradient-text">OTP</span>
              </h1>
              <p className="text-[#94A3B8] text-sm font-sans font-medium">
                Please enter the 6-digit verification code and your new password.
              </p>
            </div>

            {/* Notifications */}
            {successMessage && (
              <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-sans font-medium">
                <span>{successMessage}</span>
              </div>
            )}
            {(error || authError) && (
              <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-sans font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || authError}</span>
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              {/* Verification Code */}
              <div className="space-y-1.5">
                <label htmlFor="reset-otp-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                  Verification Code (OTP)
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    id="reset-otp-input"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="e.g. 123456"
                    className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl font-mono tracking-widest text-center text-lg"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label htmlFor="reset-newpassword-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="password"
                    id="reset-newpassword-input"
                    name="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-premium w-full h-14 flex items-center justify-center gap-2.5 font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none rounded-xl disabled:opacity-50 mt-4"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>

            {/* Back & Resend Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="inline-flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white font-bold transition-all bg-transparent border-0 cursor-pointer focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </button>
              <button
                onClick={handleForgotPasswordSubmit}
                className="text-xs text-[#F7931A] hover:underline font-bold transition-all bg-transparent border-0 cursor-pointer focus:outline-none"
              >
                Resend Code
              </button>
            </div>
          </>
        )}

        {/* Render Login Form */}
        {authMode === 'login' && (
          <>
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

            {/* Notifications */}
            {successMessage && (
              <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-sans font-medium">
                <span>{successMessage}</span>
              </div>
            )}
            {(error || authError) && (
              <div className="flex items-start gap-2.5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-sans font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-6">
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
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password & Forgot link */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="login-password-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-[#F7931A] hover:underline font-bold transition-all bg-transparent border-0 cursor-pointer focus:outline-none"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="password"
                    id="login-password-input"
                    name="password"
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
                Don&apos;t have an account?{' '}
                <button
                  onClick={onToggleAuthMode}
                  className="text-[#F7931A] hover:underline font-bold transition-all bg-transparent border-0 cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
