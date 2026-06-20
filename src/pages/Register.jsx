import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Mail, Lock, User, UserPlus, AlertCircle, Loader, MapPin } from 'lucide-react';
import { use3DTilt } from '../hooks/use3DTilt.js';
import LocationAutocomplete from '../components/LocationAutocomplete.jsx';

function Register({ onToggleAuthMode }) {
  const { register, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cardTilt = use3DTilt({ maxTilt: 5, scale: 1.01 });

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register(email, password, name, location);
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
  }, [email, password, name, location, register]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div
        ref={cardTilt.ref}
        onMouseMove={cardTilt.onMouseMove}
        onMouseLeave={cardTilt.onMouseLeave}
        style={cardTilt.style}
        className="glass-card w-full max-w-md p-8 rounded-3xl space-y-6 animate-fade-in-up"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] mb-2">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display">
            Start your <span className="gradient-text">Journey</span>
          </h1>
          <p className="text-[#94A3B8] text-sm font-sans font-medium">
            Create an account to track your carbon footprint across devices.
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="reg-name-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="text"
                id="reg-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="reg-email-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="email"
                id="reg-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label htmlFor="reg-location-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
              City &amp; Country
            </label>
            <LocationAutocomplete
              id="reg-location-input"
              value={location}
              onChange={setLocation}
              placeholder="e.g. New York, US"
              className="w-full h-14 pr-4 focus:outline-none text-sm transition-all rounded-xl"
              showIcon={true}
              ariaLabel="City and country"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="reg-password-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
              <input
                type="password"
                id="reg-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-14 pl-12 pr-4 focus:outline-none text-sm transition-all rounded-xl"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-premium w-full h-14 flex items-center justify-center gap-2.5 font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none rounded-xl disabled:opacity-50 mt-4"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-[#94A3B8] font-sans font-medium">
            Already have an account?{' '}
            <button
              onClick={onToggleAuthMode}
              className="text-[#F7931A] hover:underline font-bold transition-all bg-transparent border-0 cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
