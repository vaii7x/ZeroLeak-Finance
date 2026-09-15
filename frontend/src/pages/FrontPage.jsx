import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CardNav from '../components/CardNav';
import { useAuth } from '../context/AuthContext';

export default function FrontPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Pre-login: ONLY Account section
  // Post-login: Data Workspace, AI Configuration, and Account details
  const navItems = isAuthenticated
    ? [
        {
          label: "Data Workspace",
          bgColor: "#0D1512",
          textColor: "#F1F3EF",
          labelColor: "#72D6A0",
          links: [
            { label: "Upload Dataset", href: "/upload", ariaLabel: "Upload financial dataset" },
            { label: "Exposure Plan", href: "/exposure-plan", ariaLabel: "Review exposure plan" },
            { label: "Safe Dataset", href: "/safe-dataset", ariaLabel: "Export safe dataset" }
          ]
        },
        {
          label: "AI Configuration",
          bgColor: "#0D1512",
          textColor: "#F1F3EF",
          labelColor: "#72D6A0",
          links: [
            { label: "AI Provider (BYOK)", href: "/byok", ariaLabel: "Configure BYOK AI Provider" }
          ]
        },
        {
          label: user?.full_name || user?.email || "Account",
          bgColor: "#0D1512",
          textColor: "#F1F3EF",
          labelColor: "#72D6A0",
          links: [
            { label: "Open Workspace", href: "/upload", ariaLabel: "Open data workspace" },
            { label: "AI Settings", href: "/byok", ariaLabel: "AI Provider settings" },
            {
              label: "Sign Out",
              href: "#",
              ariaLabel: "Sign out of account",
              onClick: handleLogout
            }
          ]
        }
      ]
    : [
        {
          label: "Account",
          bgColor: "#0D1512",
          textColor: "#F1F3EF",
          labelColor: "#72D6A0",
          links: [
            { label: "Log In", href: "/login", ariaLabel: "Log in to ZeroLeak" },
            { label: "Create Account", href: "/signup", ariaLabel: "Create a ZeroLeak account" }
          ]
        }
      ];

  const authenticatedRightElement = (
    <div className="flex items-center gap-2.5">
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]" />
        <span className="text-[#F1F3EF] truncate max-w-[150px]">{user?.email || 'Operator'}</span>
      </div>
      <Link
        to="/upload"
        className="px-4 py-1.5 rounded-full bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-[0_0_14px_rgba(114,214,160,0.3)] hover:shadow-[0_0_20px_rgba(114,214,160,0.5)]"
      >
        Workspace
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="p-1.5 rounded-full bg-[#0D1512] border border-[#1C2923] hover:border-[#ff6b6b]/40 text-[#8D9A93] hover:text-[#ff6b6b] transition cursor-pointer"
        title="Sign Out"
      >
        <span className="material-symbols-outlined text-[16px] block">logout</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative bg-[#070B09] flex flex-col justify-between items-center selection:bg-[#72D6A0] selection:text-[#070B09] font-body antialiased overflow-x-hidden">
      
      {/* Subtle modern dark grid & ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(114,214,160,0.12),rgba(7,11,9,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#16221D0D_1px,transparent_1px),linear-gradient(to_bottom,#16221D0D_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Floating CardNav */}
      <header className="relative z-30 w-full pt-6 px-4 sm:px-10 flex justify-center">
        <CardNav
          items={navItems}
          baseColor="#0D1512"
          menuColor="#72D6A0"
          showAuth={!isAuthenticated}
          buttonText="Create Account"
          buttonHref="/signup"
          rightElement={isAuthenticated ? authenticatedRightElement : null}
        />
      </header>

      {/* Center Hero Viewport */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6">
          
          {/* Status Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1512] border border-[#1C2923] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse" />
            <span className="font-mono text-[11px] tracking-widest text-[#72D6A0] uppercase font-medium">
              Financial Privacy Runtime
            </span>
          </div>

          {/* Crisp, Bold Title */}
          <h1 className="font-headline font-bold text-5xl sm:text-7xl md:text-8xl tracking-tight text-[#F1F3EF] leading-[1.04]">
            ZeroLeak <span className="text-[#72D6A0]">Finance</span>
          </h1>

          {/* Core Value Proposition */}
          <div className="flex flex-col items-center gap-3">
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-[#F1F3EF] tracking-tight font-normal">
              Share what they need. <span className="text-[#72D6A0]">Nothing more.</span>
            </h2>

            <p className="font-body text-sm sm:text-base text-[#8D9A93] max-w-xl font-light leading-relaxed">
              A context-aware runtime for financial data sharing. Generate verifiable exposure plans and transform sensitive records before sending them to third parties or AI models.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93] flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#72D6A0]">verified</span>
              <span>Purpose-Bound Filtering</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93] flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#72D6A0]">tune</span>
              <span>Deterministic Policies</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93] flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#72D6A0]">key</span>
              <span>Bring Your Own Key</span>
            </div>
          </div>

          {/* Dynamic Action Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="px-8 py-3.5 rounded-full bg-[#72D6A0] text-[#070B09] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#4FAF83] transition-all duration-200 shadow-[0_0_24px_rgba(114,214,160,0.35)] hover:shadow-[0_0_32px_rgba(114,214,160,0.55)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">terminal</span>
                  <span>Open Workspace</span>
                </Link>
                <Link
                  to="/byok"
                  className="px-7 py-3.5 rounded-full bg-[#0D1512] border border-[#1C2923] text-[#F1F3EF] hover:border-[#72D6A0]/50 hover:text-[#72D6A0] font-mono text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">key</span>
                  <span>AI Provider</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-7 py-3.5 rounded-full bg-transparent border border-[#1C2923] text-[#8D9A93] hover:text-[#ff6b6b] hover:border-[#ff6b6b]/40 font-mono text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-8 py-3.5 rounded-full bg-[#72D6A0] text-[#070B09] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#4FAF83] transition-all duration-200 shadow-[0_0_24px_rgba(114,214,160,0.35)] hover:shadow-[0_0_32px_rgba(114,214,160,0.55)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>

                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-full bg-[#0D1512] border border-[#1C2923] text-[#F1F3EF] hover:border-[#72D6A0]/50 hover:text-[#72D6A0] font-mono text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Clean, Modern Footer */}
      <footer className="relative z-10 w-full py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8D9A93] font-mono border-t border-[#1C2923]/40">
        <div>© 2026 ZeroLeak Finance · Context-Aware Privacy Runtime</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]"></span>
          <span>End-to-End Data Protection</span>
        </div>
      </footer>
    </div>
  );
}
