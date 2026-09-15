import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <AuthLayout
      badgeText="Password Reset"
      title="Reset Your Password"
      subtitle="Enter your registered email to receive reset instructions"
    >
      {submitted ? (
        <div className="text-center flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-[#163D2D] border border-[#72D6A0]/40 flex items-center justify-center text-[#72D6A0]">
            <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
          </div>
          <h3 className="font-headline text-lg font-semibold text-[#F1F3EF]">Instructions Sent</h3>
          <p className="font-body text-xs text-[#8D9A93] leading-relaxed">
            If an account matches <span className="text-[#F1F3EF]">{email}</span>, password reset instructions have been sent.
          </p>
          <Link
            to="/login"
            className="mt-3 px-5 py-2.5 rounded-xl bg-[#72D6A0] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#4FAF83] transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-[#8D9A93]" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@company.com"
              className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl px-4 py-2.5 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] font-body"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_16px_rgba(114,214,160,0.3)]"
          >
            Send Reset Link
          </button>

          <div className="text-center pt-2 border-t border-[#1C2923]">
            <Link to="/login" className="font-mono text-xs text-[#8D9A93] hover:text-[#F1F3EF]">
              ← Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
