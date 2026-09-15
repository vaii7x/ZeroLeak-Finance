import React from 'react';
import { Link } from 'react-router-dom';
import DotField from './DotField';

export default function AuthLayout({
  children,
  badgeText = 'Secure Authentication',
  title = 'Sign In',
  subtitle = 'Authenticate into ZeroLeak Finance',
}) {
  return (
    <div className="bg-[#070B09] font-body text-[#F1F3EF] min-h-screen relative overflow-hidden flex flex-col justify-between selection:bg-[#72D6A0] selection:text-[#070B09]">
      {/* Background layer: React Bits DotField with cursor interaction */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={true}
          waveAmplitude={0}
          gradientFrom="rgba(114, 214, 160, 0.4)"
          gradientTo="rgba(22, 61, 45, 0.2)"
          glowColor="#070B09"
        />
        {/* Atmospheric vignette */}
        <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center,_transparent_40%,_#070B09_100%] opacity-80 z-[1]" />
      </div>

      {/* Top Header */}
      <header className="w-full relative z-10 flex items-center justify-between px-6 md:px-10 py-3.5">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] group-hover:scale-125 transition-transform duration-300"></span>
          <span className="font-headline text-lg font-semibold tracking-tight text-[#F1F3EF]">
            ZeroLeak
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#8D9A93] uppercase pl-1.5 border-l border-[#1C2923]">
            FINANCE
          </span>
        </Link>

        <div className="flex items-center gap-2 text-[#8D9A93]">
          <span className="material-symbols-outlined text-[18px] text-[#72D6A0]">lock</span>
          <span className="font-mono text-xs tracking-wider uppercase text-[#8D9A93] hidden sm:inline">
            Encrypted Session
          </span>
        </div>
      </header>

      {/* Main Form Centerpiece - Shifted Upward */}
      <main className="w-full flex-grow flex flex-col justify-center items-center px-4 pt-1 pb-6 -mt-8 sm:-mt-14 relative z-10 pointer-events-auto">
        <div className="w-full max-w-[440px] bg-[#0D1512]/85 backdrop-blur-2xl rounded-2xl p-5 sm:p-7 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] border border-[#1C2923] relative overflow-hidden transition-all duration-300 hover:border-[#72D6A0]/30">
          {/* Subtle top ambient emerald glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#72D6A0] opacity-10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header Section */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#070B09] border border-[#1C2923] shadow-sm mb-2">
              <span className="material-symbols-outlined text-[#72D6A0] text-[20px]">key</span>
            </div>

            {badgeText && (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#163D2D]/50 border border-[#4FAF83]/30 text-[#72D6A0] mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
                <span className="font-mono text-[10px] tracking-widest uppercase font-semibold">
                  {badgeText}
                </span>
              </div>
            )}

            {title && (
              <h1 className="font-headline text-xl sm:text-2xl font-bold text-[#F1F3EF] tracking-tight mt-0.5">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="font-body text-xs text-[#8D9A93] mt-0.5 max-w-sm">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card Content */}
          <div className="relative z-10 mt-4">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full relative z-10 px-6 py-2.5 flex items-center justify-between text-[11px] font-mono text-[#8D9A93]">
        <div>ZEROLEAK FINANCE · SECURE RUNTIME</div>
        <Link to="/" className="hover:text-[#72D6A0] transition-colors">
          Return to home →
        </Link>
      </footer>
    </div>
  );
}
