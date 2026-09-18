import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/upload', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup({
        email: trimmedEmail,
        password,
        full_name: trimmedEmail.split('@')[0],
      });
      navigate('/upload');
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badgeText="Get Started"
      title="Create Account"
      subtitle="Set up your ZeroLeak Finance account"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 bg-[#421b24]/80 border border-[#ff6b6b]/30 rounded-xl text-[#ffb4b4] text-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#ff6b6b] shrink-0">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="email">
            Email Address
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
              placeholder="you@example.com"
              className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-all font-body"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="password">
            Password (min. 8 characters)
          </label>
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#8D9A93] pointer-events-none text-[18px]">
              lock
            </span>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-all font-body"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full py-3 px-4 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(114,214,160,0.3)] hover:shadow-[0_0_28px_rgba(114,214,160,0.5)] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-[#070B09] border-t-transparent rounded-full animate-spin"></span>
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Create Account</span>
            </>
          )}
        </button>

        {/* Alternate link */}
        <div className="text-center mt-2 pt-2 border-t border-[#1C2923]">
          <span className="font-body text-xs text-[#8D9A93]">Already have an account? </span>
          <Link
            to="/login"
            className="font-mono text-xs text-[#72D6A0] hover:underline font-semibold"
          >
            Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
