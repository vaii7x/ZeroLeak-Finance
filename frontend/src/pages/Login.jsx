import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate authenticating into ZeroLeak Enclave
      await new Promise(res => setTimeout(res, 600));
      // Store mock user session
      localStorage.setItem('zeroleak_user', JSON.stringify({ email: trimmedEmail, enclaveId: 'ENC-08492' }));
      navigate('/upload');
    } catch (err) {
      setErrorMessage(err?.message || 'Authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badgeText="Enclave Authentication"
      title="Access Terminal"
      subtitle="Sign in with verified institutional credentials"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 bg-[#421b24]/80 border border-[#ff6b6b]/30 rounded-xl text-[#ffb4b4] text-xs transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ff6b6b] shrink-0">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="email">
            Institutional Email
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#8D9A93] pointer-events-none text-[18px]">
              mail
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@institution.com"
              className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-all font-body"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs text-[#8D9A93]" htmlFor="password">
              Enclave Secret
            </label>
            <Link
              to="/forgot-password"
              className="font-mono text-[11px] text-[#72D6A0] hover:underline"
            >
              Rotate Key?
            </Link>
          </div>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#8D9A93] pointer-events-none text-[18px]">
              lock
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-all font-body"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[#8D9A93] hover:text-[#F1F3EF] transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full py-3 px-4 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(114,214,160,0.3)] hover:shadow-[0_0_28px_rgba(114,214,160,0.5)] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-[#070B09] border-t-transparent rounded-full animate-spin"></span>
              <span>Attesting Enclave...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">key</span>
              <span>Authenticate</span>
            </>
          )}
        </button>

        {/* Alternate link */}
        <div className="text-center mt-3 pt-3 border-t border-[#1C2923]">
          <span className="font-body text-xs text-[#8D9A93]">New to ZeroLeak? </span>
          <Link
            to="/signup"
            className="font-mono text-xs text-[#72D6A0] hover:underline font-semibold"
          >
            Provision Enclave Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
