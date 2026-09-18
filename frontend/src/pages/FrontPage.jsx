import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CardNav from '../components/CardNav';
import ParticleText from '../components/ParticleText';
import { useAuth } from '../context/AuthContext';

export default function FrontPage() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Minimal necessary navigation items
  const navItems = isAuthenticated
    ? [
        {
          label: "Workspace",
          bgColor: "#0D1512",
          textColor: "#F1F3EF",
          labelColor: "#72D6A0",
          links: [
            { label: "Upload & Run", href: "/upload", ariaLabel: "Data Workspace" },
            { label: "AI Provider (BYOK)", href: "/byok", ariaLabel: "Configure AI Provider" }
          ]
        },
        {
          label: "Account",
          bgColor: "#0D1512",
          textColor: "#F1F3EF",
          labelColor: "#72D6A0",
          links: [
            {
              label: "Sign Out",
              href: "#",
              ariaLabel: "Sign out",
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
            { label: "Log In", href: "/login", ariaLabel: "Log in" },
            { label: "Create Account", href: "/signup", ariaLabel: "Create account" }
          ]
        }
      ];

  const authenticatedRightElement = (
    <div className="flex items-center gap-2">
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
      {/* Subtle modern dark ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(114,214,160,0.07),rgba(7,11,9,0))] pointer-events-none" />

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

      {/* Center Hero Viewport with natural flex flow */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-10 sm:py-16 px-4">
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center gap-6 sm:gap-7">
          
          {/* Status Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0D1512]/90 border border-[#1C2923] backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.4)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse" />
            <span className="font-mono text-[11px] tracking-widest text-[#72D6A0] uppercase font-medium">
              Financial Privacy Runtime
            </span>
          </div>

          {/* ParticleText Animated Logo Title */}
          <div className="w-full max-w-5xl h-[120px] sm:h-[150px] md:h-[180px] lg:h-[210px] flex items-center justify-center">
            <ParticleText
              text="ZeroLeak Finance"
              particleSize={2.4}
              density={5.5}
              color="#F1F3EF"
              highlightColor="#72D6A0"
              scatter={130}
              gatherDuration={1100}
              stagger={250}
              pointerRepel={60}
              repelRadius={140}
              idleDrift={0.4}
              trigger="mount"
              fontSize="clamp(3.6rem, 9.5vw, 7.8rem)"
              fontWeight={800}
              fontFamily="'Space Grotesk', sans-serif"
              glow={true}
              className="w-full h-full"
            />
          </div>

          {/* Core Value Proposition */}
          <div className="flex flex-col items-center gap-3">
            <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-[#F1F3EF] tracking-tight font-normal">
              Share what they need. <span className="text-[#72D6A0]">Nothing more.</span>
            </h2>

            <p className="font-body text-sm sm:text-base text-[#8D9A93] max-w-xl font-light leading-relaxed">
              A context-aware runtime for financial data sharing. Generate verifiable exposure plans and transform sensitive records before sending them to third parties or AI models.
            </p>
          </div>

          {/* Dynamic Action Buttons */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
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

          {/* Quick Explainer Link */}
          <div className="mt-1">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0D1512]/80 hover:bg-[#0D1512] border border-[#1C2923] hover:border-[#72D6A0]/40 text-xs font-mono text-[#8D9A93] hover:text-[#72D6A0] transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[15px] text-[#72D6A0]">info</span>
              <span>How It Works & Architecture</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Trust Label */}
      <footer className="relative z-10 py-5 w-full text-center pointer-events-none">
        <span className="font-mono text-[11px] text-[#425048] tracking-wider uppercase">
          ZeroLeak Protocol · Zero Trust Privacy Runtime
        </span>
      </footer>

    </div>
  );
}
