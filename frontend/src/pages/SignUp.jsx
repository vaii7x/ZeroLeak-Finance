import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function SignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');
  const [tier, setTier] = useState('institutional');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Enclave password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(res => setTimeout(res, 700));
      localStorage.setItem(
        'zeroleak_user',
        JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          organization: organization.trim() || 'Confidential Fund',
          tier,
          enclaveId: 'ENC-08492'
        })
      );
      navigate('/upload');
    } catch (err) {
      setErrorMessage(err?.message || 'Provisioning error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      badgeText="Enclave Provisioning"
      title="Create Account"
      subtitle="Establish dedicated zero-knowledge compute boundary"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
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

        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="name">
            Operator Name
          </label>
          <input
            id="name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dr. Elena Rostova"
            className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] font-body"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="email">
            Institutional Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="elena@apexalpha.io"
            className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] font-body"
          />
        </div>

        {/* Organization */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="org">
            Entity / Institution
          </label>
          <input
            id="org"
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Apex Alpha Research"
            className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] font-body"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs text-[#8D9A93]" htmlFor="password">
            Root Password (min. 8 chars)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2 text-sm text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] font-body"
          />
        </div>

        {/* Enclave Tier Selector */}
        <div className="flex flex-col gap-1 pt-1">
          <label className="font-mono text-xs text-[#8D9A93]">Security Enclave Tier</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTier('institutional')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tier === 'institutional'
                  ? 'border-[#72D6A0] bg-[#163D2D]/40 text-[#72D6A0]'
                  : 'border-[#1C2923] bg-[#070B09] text-[#8D9A93] hover:border-[#283C32]'
              }`}
            >
              <div className="font-mono text-xs font-semibold">Institutional</div>
              <div className="text-[10px] text-[#8D9A93] mt-0.5">AMD SEV-SNP Enclave</div>
            </button>
            <button
              type="button"
              onClick={() => setTier('sovereign')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tier === 'sovereign'
                  ? 'border-[#72D6A0] bg-[#163D2D]/40 text-[#72D6A0]'
                  : 'border-[#1C2923] bg-[#070B09] text-[#8D9A93] hover:border-[#283C32]'
              }`}
            >
              <div className="font-mono text-xs font-semibold">Sovereign Air-Gap</div>
              <div className="text-[10px] text-[#8D9A93] mt-0.5">Hardware HSM + ZK</div>
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full py-3 px-4 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(114,214,160,0.3)] hover:shadow-[0_0_28px_rgba(114,214,160,0.5)] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-[#070B09] border-t-transparent rounded-full animate-spin"></span>
              <span>Deploying Enclave...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">shield_lock</span>
              <span>Deploy Safe Enclave</span>
            </>
          )}
        </button>

        {/* Alternate link */}
        <div className="text-center mt-2 pt-2 border-t border-[#1C2923]">
          <span className="font-body text-xs text-[#8D9A93]">Already have credentials? </span>
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
