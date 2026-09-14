import React from 'react';
import { Link } from 'react-router-dom';
import AuroraShader from '../components/AuroraShader';
import ParticleText from '../components/ParticleText';
import CardNav from '../components/CardNav';

const NAV_ITEMS = [
  {
    label: "Account",
    bgColor: "#0D1512",
    textColor: "#F1F3EF",
    labelColor: "#72D6A0",
    links: [
      { label: "Log In", href: "/login", ariaLabel: "Enclave login" },
      { label: "Create Account", href: "/signup", ariaLabel: "Provision enclave account" }
    ]
  },
  {
    label: "Enclave Security",
    bgColor: "#111B17",
    textColor: "#F1F3EF",
    labelColor: "#72D6A0",
    links: [
      { label: "Hardware Attestation", href: "#", ariaLabel: "Hardware Attestation" },
      { label: "Zero-Knowledge Proofs", href: "#", ariaLabel: "Zero-Knowledge Proofs" }
    ]
  }
];

export default function FrontPage() {
  return (
    <div className="h-screen w-screen overflow-hidden relative bg-[#070b09] flex flex-col justify-between items-center selection:bg-[#72d6a0] selection:text-[#070b09] font-body antialiased select-none">
      {/* Aurora Beam Background Shader */}
      <AuroraShader />

      {/* Top Floating CardNav from React Bits */}
      <header className="relative z-30 w-full pt-6 px-4 sm:px-10 flex justify-center">
        <CardNav
          items={NAV_ITEMS}
          baseColor="#0D1512"
          menuColor="#72D6A0"
          showAuth={false}
        />
      </header>

      {/* Center Hero Viewport */}
      <main className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 -mt-10 sm:-mt-14">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1512]/80 border border-[#1C2923] mb-2 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
            <span className="font-mono text-[11px] tracking-widest text-[#72D6A0] uppercase font-semibold">
              Confidential Financial Runtime v2.4
            </span>
          </div>

          {/* ParticleText Animated Title Component from React Bits */}
          <div className="w-full max-w-5xl h-[130px] sm:h-[160px] md:h-[190px] lg:h-[220px] flex items-center justify-center">
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

          {/* Core Message */}
          <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl text-[#F1F3EF] tracking-tight -mt-1 sm:-mt-2 font-normal">
            Share what they need. <span className="text-[#72D6A0] font-normal">Nothing more.</span>
          </h2>

          {/* Supporting Line */}
          <p className="font-body text-sm sm:text-base text-[#8D9A93] max-w-xl mt-2 font-light leading-relaxed">
            Safe, purpose-specific financial data sharing with air-gapped cryptographic proofs and verifiable exposure plans.
          </p>

          {/* Minimal Action Buttons: Log In and Create Account */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-full bg-transparent border border-[#72D6A0]/40 text-[#72D6A0] hover:bg-[#72D6A0]/10 hover:border-[#72D6A0] font-mono text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 backdrop-blur-sm hover:-translate-y-0.5 active:translate-y-0 shadow-[0_0_15px_rgba(114,214,160,0.1)]"
            >
              Log In
            </Link>

            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-full bg-[#72D6A0] text-[#070B09] font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-[#4FAF83] transition-all duration-200 shadow-[0_0_24px_rgba(114,214,160,0.35)] hover:shadow-[0_0_32px_rgba(114,214,160,0.55)] hover:-translate-y-0.5 active:translate-y-0"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Bottom Spacer */}
      <footer className="relative z-10 w-full pb-6 px-8 flex items-center justify-between text-xs text-[#8D9A93] font-mono">
        <div>ZERO-KNOWLEDGE ENCLAVE · SHA-256 SALT</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]"></span>
            Hardware Attestation Active
          </span>
        </div>
      </footer>
    </div>
  );
}
