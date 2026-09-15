import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GradientWaves from '../components/GradientWaves';
import { usePipeline } from '../context/PipelineContext';

export default function Sanitization() {
  const {
    rawFile,
    setRawFile,
    exposurePlan,
    executeSanitizationAndValidation,
  } = usePipeline();

  const [currentStep, setCurrentStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [runtimeError, setRuntimeError] = useState(null);

  const handleAttachDemoAndRun = async () => {
    try {
      const res = await fetch('/demo_transactions.csv');
      const text = await res.text();
      const demoFile = new File([text], 'demo_transactions.csv', { type: 'text/csv' });
      setRawFile(demoFile);
    } catch (err) {
      setRuntimeError('Could not load demo transactions: ' + err.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const runProcess = async () => {
      if (!rawFile || !exposurePlan?.exposure_plan_id) {
        return;
      }

      setCurrentStep(1);
      setRuntimeError(null);
      setIsComplete(false);

      try {
        await executeSanitizationAndValidation((step) => {
          if (isMounted) setCurrentStep(step);
        });

        if (isMounted) {
          setCurrentStep(5);
          setIsComplete(true);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Enclave processing failed:', err);
          setRuntimeError(err.message || 'Processing failed');
        }
      }
    };

    runProcess();

    return () => {
      isMounted = false;
    };
  }, [rawFile, exposurePlan]);

  return (
    <div className="bg-[#070B09] font-body text-[#F1F3EF] min-h-screen relative overflow-hidden flex flex-col justify-between selection:bg-[#72D6A0] selection:text-[#070B09]">
      {/* Background layer: React Bits GradientWaves with ZeroLeak Green Theme */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-auto">
        <GradientWaves
          horizonColor="#070B09"
          waveColor="#163D2D"
          crestColor="#72D6A0"
          speed={0.35}
          amplitude={2.2}
          waveScale={0.55}
          waveRatio={0.9}
          swell={30}
          turbulence={18}
          tilt={1.12}
          zoom={1.05}
          height={5.2}
          fogDepth={16}
          detail="medium"
          brightness={1.05}
          opacity={0.88}
          mouseInteraction={true}
          parallaxStrength={0.45}
          grain={true}
          grainIntensity={0.04}
        />
        {/* Dark Vignette Layer for text readability */}
        <div className="pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center,_transparent_30%,_#070B09_90%] opacity-85 z-[1]" />
      </div>

      {/* Top Application Header */}
      <header className="w-full relative z-10 bg-[#070B09]/70 backdrop-blur-md border-b border-[#1C2923]/60">
        <div className="max-w-7xl mx-auto h-16 px-6 md:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] group-hover:scale-125 transition-transform duration-300"></span>
            <span className="font-headline font-semibold text-lg tracking-tight text-[#F1F3EF]">
              ZeroLeak <span className="font-normal text-[#8D9A93]">Finance</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono text-[#8D9A93]">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#163D2D]/60 border border-[#72D6A0]/30 text-[#72D6A0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
              Enclave Processing
            </span>
            <Link to="/safe-dataset" className="hover:text-[#F1F3EF] transition-colors">
              Skip to Safe Dataset →
            </Link>
          </div>
        </div>
      </header>

      {/* Centerpiece Processing Viewport */}
      <main className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-4 py-8 pointer-events-auto">
        <div className="w-full max-w-lg mx-auto flex flex-col items-center text-center">
          {runtimeError && (
            <div className="mb-4 p-3.5 rounded-xl bg-[#421b24]/90 border border-[#ff6b6b]/40 text-[#ffb4b4] text-xs font-mono flex items-start gap-2.5 text-left w-full">
              <span className="material-symbols-outlined text-[18px] text-[#ff6b6b] shrink-0 mt-0.5">error</span>
              <div className="flex flex-col gap-1 flex-1">
                <span className="font-semibold text-white">Sanitization / Validation Error</span>
                <span>{runtimeError}</span>
                <Link to="/upload" className="text-[#72D6A0] hover:underline mt-1">
                  ← Return to Data Upload to re-upload dataset
                </Link>
              </div>
            </div>
          )}

          {!rawFile && (
            <div className="mb-4 p-3 rounded-xl bg-[#111B17]/90 border border-[#ffb86c]/40 text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3 text-left w-full backdrop-blur-md">
              <div className="flex items-center gap-2 text-[#ffb86c]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb86c] animate-pulse"></span>
                <span>Original CSV stream not in memory.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAttachDemoAndRun}
                  className="px-3 py-1 rounded-lg bg-[#163D2D] hover:bg-[#72D6A0] text-[#72D6A0] hover:text-[#070B09] font-bold text-[11px] transition-all cursor-pointer"
                >
                  ⚡ Attach Demo &amp; Run
                </button>
                <Link
                  to="/upload"
                  className="px-3 py-1 rounded-lg bg-[#070B09] border border-[#1C2923] text-[#8D9A93] hover:text-white text-[11px] transition-all"
                >
                  Upload CSV
                </Link>
              </div>
            </div>
          )}

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1512]/90 border border-[#1C2923] shadow-sm mb-3.5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
            <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#72D6A0]">
              {isComplete ? 'Processing Complete' : 'Privacy Runtime Active'}
            </span>
          </div>

          {/* Heading & Subtext */}
          <h1 className="font-headline text-3xl md:text-4xl font-semibold tracking-tight text-[#F1F3EF] mb-2">
            {isComplete ? 'Safe data verified' : 'Preparing safe data'}
          </h1>
          <p className="font-body text-xs sm:text-sm text-[#8D9A93] max-w-md mx-auto leading-relaxed mb-7">
            {isComplete
              ? 'Your approved exposure plan has been verified with zero PII leaks.'
              : 'Applying your approved exposure plan and mathematically validating the result.'}
          </p>

          {/* Processing Visualizer Orbit Ring */}
          <div className="relative mb-7 flex items-center justify-center w-36 h-36">
            <div className="absolute inset-0 rounded-full border border-[#1C2923]/80"></div>
            {/* Rotating Outer Pulse Ring */}
            <svg
              className={`absolute inset-0 w-full h-full ${
                isComplete ? '' : 'animate-[spin_9s_linear_infinite]'
              }`}
              fill="none"
              viewBox="0 0 144 144"
            >
              <circle cx="72" cy="72" r="66" stroke="#1C2923" strokeWidth="1.5"></circle>
              <circle
                className="transition-all duration-500"
                cx="72"
                cy="72"
                r="66"
                stroke={isComplete ? '#72D6A0' : '#4FAF83'}
                strokeDasharray={isComplete ? '415 0' : '50 110'}
                strokeLinecap="round"
                strokeWidth="2.5"
              ></circle>
            </svg>
            {/* Subtle Inner Counter Ring */}
            <svg
              className={`absolute inset-2 w-[128px] h-[128px] ${
                isComplete ? '' : 'animate-[spin_6s_linear_infinite_reverse]'
              }`}
              fill="none"
              viewBox="0 0 128 128"
            >
              <circle cx="64" cy="64" r="58" stroke="#163D2D" strokeDasharray="3 6" strokeWidth="1"></circle>
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="#72D6A0"
                strokeDasharray={isComplete ? '365 0' : '30 150'}
                strokeLinecap="round"
                strokeWidth="1.5"
              ></circle>
            </svg>
            {/* Center Core */}
            <div className="relative w-24 h-24 rounded-full bg-[#0D1512]/90 border border-[#1C2923] flex flex-col items-center justify-center shadow-inner backdrop-blur-md">
              <span
                className={`material-symbols-outlined text-[26px] text-[#72D6A0] transition-transform duration-300 ${
                  isComplete ? 'scale-110' : 'animate-pulse'
                }`}
              >
                {isComplete ? 'shield_lock' : 'lock'}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8D9A93] font-medium mt-1">
                {isComplete ? 'SECURE' : 'ZeroLeak'}
              </span>
            </div>
          </div>

          {/* Process Steps Card */}
          <div className="w-full max-w-[460px] bg-[#0D1512]/90 border border-[#1C2923] rounded-xl p-3 mb-5 text-left flex flex-col gap-1.5 shadow-xl backdrop-blur-xl">
            {/* Step 1 */}
            <div className="flex items-center justify-between py-2 px-3 rounded bg-[#070B09]/50 border border-transparent">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 flex items-center justify-center text-[#72D6A0] font-mono text-xs font-bold">
                  ✓
                </span>
                <span className="font-body text-xs sm:text-sm text-[#F1F3EF]">Exposure plan approved</span>
              </div>
              <span className="font-mono text-[10px] tracking-wider text-[#72D6A0] font-semibold">
                DONE
              </span>
            </div>

            {/* Step 2 */}
            <div
              className={`flex items-center justify-between py-2 px-3 rounded transition-all duration-300 ${
                currentStep >= 2 ? 'bg-[#070B09]/50' : 'opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 flex items-center justify-center text-[#72D6A0] font-mono text-xs">
                  {currentStep > 2 ? '✓' : currentStep === 2 ? (
                    <span className="w-2 h-2 rounded-full bg-[#72D6A0] animate-ping" />
                  ) : '○'}
                </span>
                <span className="font-body text-xs sm:text-sm text-[#F1F3EF]">Removing prohibited fields</span>
              </div>
              <span
                className={`font-mono text-[10px] tracking-wider font-semibold ${
                  currentStep > 2 ? 'text-[#72D6A0]' : currentStep === 2 ? 'text-[#72D6A0] animate-pulse' : 'text-[#8D9A93]'
                }`}
              >
                {currentStep > 2 ? 'DONE' : currentStep === 2 ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>

            {/* Step 3 */}
            <div
              className={`flex items-center justify-between py-2 px-3 rounded transition-all duration-300 ${
                currentStep >= 3 ? 'bg-[#070B09]/50' : 'opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 flex items-center justify-center text-[#72D6A0] font-mono text-xs">
                  {currentStep > 3 ? '✓' : currentStep === 3 ? (
                    <span className="w-2 h-2 rounded-full bg-[#72D6A0] animate-ping" />
                  ) : '○'}
                </span>
                <span className="font-body text-xs sm:text-sm text-[#F1F3EF]">Tokenizing sensitive identifiers</span>
              </div>
              <span
                className={`font-mono text-[10px] tracking-wider font-semibold ${
                  currentStep > 3 ? 'text-[#72D6A0]' : currentStep === 3 ? 'text-[#72D6A0] animate-pulse' : 'text-[#8D9A93]'
                }`}
              >
                {currentStep > 3 ? 'DONE' : currentStep === 3 ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>

            {/* Step 4 */}
            <div
              className={`flex items-center justify-between py-2 px-3 rounded transition-all duration-300 ${
                currentStep >= 4 ? 'bg-[#070B09]/50' : 'opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 flex items-center justify-center text-[#72D6A0] font-mono text-xs">
                  {currentStep >= 5 ? '✓' : currentStep === 4 ? (
                    <span className="w-2 h-2 rounded-full bg-[#72D6A0] animate-ping" />
                  ) : '○'}
                </span>
                <span className="font-body text-xs sm:text-sm text-[#F1F3EF]">Validating safe output</span>
              </div>
              <span
                className={`font-mono text-[10px] tracking-wider font-semibold ${
                  currentStep >= 5 ? 'text-[#72D6A0]' : currentStep === 4 ? 'text-[#72D6A0] animate-pulse' : 'text-[#8D9A93]'
                }`}
              >
                {currentStep >= 5 ? 'DONE' : currentStep === 4 ? 'ACTIVE' : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Completion Banner (shown upon validation complete) */}
          <div
            className={`w-full max-w-[460px] bg-[#0D1512]/95 border border-[#72D6A0]/40 rounded-xl p-4 flex flex-col items-center shadow-2xl transition-all duration-500 backdrop-blur-xl ${
              isComplete
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 text-[#72D6A0] font-mono text-xs font-semibold uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>SAFE DATA READY</span>
            </div>
            <p className="font-body text-xs text-[#8D9A93]">
              Output validation passed without exceptions. Zero prohibited fields detected.
            </p>
            <Link
              to="/safe-dataset"
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-[#F1F3EF] hover:bg-[#72D6A0] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 shadow-[0_0_16px_rgba(241,243,239,0.2)] hover:shadow-[0_0_24px_rgba(114,214,160,0.5)]"
            >
              <span>View safe dataset</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full relative z-10 px-6 py-3 flex items-center justify-between text-[11px] font-mono text-[#8D9A93] bg-[#070B09]/70 backdrop-blur-md border-t border-[#1C2923]/60">
        <div>ZeroLeak Finance · Data Transformation Engine</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]"></span>
          <span>Output Validation Verified</span>
        </div>
      </footer>
    </div>
  );
}
