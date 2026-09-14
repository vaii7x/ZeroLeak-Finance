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
      badgeText="Key Recovery"
      title="Rotate Enclave Secret"
      subtitle="Issue hardware attestation challenge to your registered institutional address"
    >
      {submitted ? (
        <div className="text-center flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-[#163D2D] border border-[#72D6A0]/40 flex items-center justify-center text-[#72D6A0]">
            <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
          </div>
          <h3 className="font-headline text-lg font-semibold text-[#F1F3EF]">Attestation Sent</h3>
          <p className="font-body text-xs text-[#8D9A93] leading-relaxed">
            If an enclave matches <span className="text-[#F1F3EF]">{email}</span>, a cryptographic challenge has been dispatched.
          </p>
          <Link
            to="/login"
            className="mt-3 px-5 py-2.5 rounded-xl bg-[#72D6A0] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#4FAF83] transition-colors"
          >
            Back to Terminal
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-xs text-[#8D9A93]" htmlFor="email">
              Institutional Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@institution.com"
              className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl px-4 py-2.5 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] font-body"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200"
          >
            Dispatch Challenge
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
