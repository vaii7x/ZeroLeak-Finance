import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';

const PURPOSE_CHIPS = [
  'Fraud analysis',
  'Credit risk analysis',
  'Portfolio analysis',
  'Financial reporting',
  'Transaction analysis',
  'Customer segmentation',
  'Research',
  'Other'
];

const RECIPIENT_OPTIONS = [
  'External financial analyst',
  'Internal team',
  'Trusted partner',
  'Third-party service',
  'AI model',
  'Public',
  'Custom'
];

export default function DataUpload() {
  const { rawFile, setRawFile, runFullAnalysis, exposurePlan } = usePipeline();

  const getInitial = () => {
    try {
      const saved = localStorage.getItem('zeroleak_dataset');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  };

  const initial = getInitial();
  const [localFile, setLocalFile] = useState(rawFile || null);
  const [fileLoaded, setFileLoaded] = useState(!!initial || !!rawFile);
  const [fileName, setFileName] = useState(initial?.fileName || rawFile?.name || '');
  const [fileMeta, setFileMeta] = useState(initial?.fileMeta || '');
  const [purpose, setPurpose] = useState(initial?.purpose || 'Identify suspicious transaction patterns.');
  const [selectedChip, setSelectedChip] = useState(initial?.selectedChip || 'Fraud analysis');
  const [recipient, setRecipient] = useState(initial?.recipient || 'External financial analyst');
  const [uploadWarning, setUploadWarning] = useState(false);

  // Modal analysis states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [analysisError, setAnalysisError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepLabel, setStepLabel] = useState('Dataset Analysis & Field Classification (CSV streaming)...');

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const processSelectedFile = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result || '';
      let headers = [];
      let rowCount = 0;
      let sampleRows = [];
      let targetFile = file;

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          const arrayData = Array.isArray(parsed) ? parsed : [parsed];
          rowCount = arrayData.length;
          if (arrayData.length > 0 && typeof arrayData[0] === 'object') {
            headers = Object.keys(arrayData[0]);
            sampleRows = arrayData.slice(0, 5);
            // Convert to CSV for backend
            const csvHeader = headers.join(',');
            const csvRows = arrayData.map(row =>
              headers.map(h => {
                const val = row[h] ?? '';
                const str = String(val).replace(/"/g, '""');
                return str.includes(',') ? `"${str}"` : str;
              }).join(',')
            );
            const csvContent = [csvHeader, ...csvRows].join('\n');
            targetFile = new File([csvContent], file.name.replace(/\.json$/i, '.csv'), { type: 'text/csv' });
          }
        } catch {
          headers = ['id', 'record', 'value'];
          rowCount = 1;
        }
      } else {
        // CSV / TSV / plain text
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        rowCount = Math.max(0, lines.length - 1);
        if (lines.length > 0) {
          headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          sampleRows = lines.slice(1, 6).map(line => {
            const vals = line.split(',');
            const obj = {};
            headers.forEach((h, i) => {
              obj[h] = vals[i] ? vals[i].trim().replace(/^["']|["']$/g, '') : '';
            });
            return obj;
          });
        }
      }

      if (headers.length === 0) {
        headers = ['transaction_id', 'amount', 'timestamp', 'merchant', 'account_number'];
        rowCount = rowCount || 50;
      }

      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const metaStr = `${rowCount.toLocaleString()} rows · ${headers.length} columns · ${formattedSize}`;

      const datasetObj = {
        fileName: file.name,
        fileSize: formattedSize,
        rowCount,
        columns: headers,
        sampleRows,
        fileMeta: metaStr,
        purpose,
        recipient,
        selectedChip
      };

      try {
        localStorage.setItem('zeroleak_dataset', JSON.stringify(datasetObj));
      } catch {
        // ignore
      }

      setLocalFile(targetFile);
      setRawFile(targetFile);
      setFileName(file.name);
      setFileMeta(metaStr);
      setFileLoaded(true);
      setUploadWarning(false);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleLoadDemo = async () => {
    try {
      const res = await fetch('/demo_transactions.csv');
      const text = await res.text();
      const demoFile = new File([text], 'demo_transactions.csv', { type: 'text/csv' });
      processSelectedFile(demoFile);
    } catch (err) {
      console.error('Failed to load demo dataset:', err);
    }
  };

  const handleRemoveFile = () => {
    try {
      localStorage.removeItem('zeroleak_dataset');
      localStorage.removeItem('zeroleak_plan');
    } catch {
      // ignore
    }
    setLocalFile(null);
    setRawFile(null);
    setFileLoaded(false);
    setFileName('');
    setFileMeta('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleChipClick = (chip) => {
    setSelectedChip(chip);
    setPurpose(`Perform ${chip.toLowerCase()} with strict zero-leak compliance.`);
  };

  const startAnalysis = async () => {
    let fileToAnalyze = localFile || rawFile;

    // Resilient fallback: if user refreshed the page with demo dataset, reload the demo CSV
    if (!fileToAnalyze) {
      try {
        const res = await fetch('/demo_transactions.csv');
        if (res.ok) {
          const text = await res.text();
          const demoFile = new File([text], fileName || 'demo_transactions.csv', { type: 'text/csv' });
          setLocalFile(demoFile);
          setRawFile(demoFile);
          fileToAnalyze = demoFile;
        }
      } catch (e) {
        console.warn('Auto-reload demo dataset failed:', e);
      }
    }

    if (!fileToAnalyze) {
      setUploadWarning(true);
      return;
    }

    setUploadWarning(false);
    setIsModalOpen(true);
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setAnalysisError(null);
    setStepLabel('Dataset Analysis & Field Classification (CSV streaming)...');

    try {
      await runFullAnalysis(fileToAnalyze, purpose, recipient, (step, label) => {
        setAnalysisStep(step);
        setStepLabel(label);
      });
      setAnalysisStep(4);
      setStepLabel('Exposure Plan generated successfully. Transitioning...');
      setTimeout(() => {
        navigate('/exposure-plan');
      }, 700);
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Analysis failed. Please ensure the backend is running on :8000.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const proceedToExposurePlan = () => {
    setIsModalOpen(false);
    navigate('/exposure-plan');
  };

  return (
    <div className="bg-[#070B09] text-[#F1F3EF] font-body min-h-screen flex flex-col items-center justify-start selection:bg-[#72D6A0] selection:text-[#070B09] antialiased">
      {/* 1. TOP HEADER (Focused Back-to-Main principle) */}
      <header className="w-full max-w-[780px] px-4 pt-8 pb-4 flex items-center justify-between border-b border-[#1C2923]/60 relative z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] group-hover:scale-125 transition-transform animate-pulse"></span>
            <span className="font-headline font-semibold text-sm tracking-tight text-[#F1F3EF]">
              ZeroLeak Finance
            </span>
          </Link>
          <span className="text-[#3E4942] font-mono text-xs">/</span>
          <span className="text-[#8D9A93] font-mono text-xs">PII Cloaking Enclave</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
            <span className="hidden sm:inline">Hardware Enclave Active</span>
            <span className="sm:hidden">Active</span>
          </div>
          <Link
            to="/exposure-plan"
            className="text-xs font-mono text-[#8D9A93] hover:text-[#72D6A0] transition-colors"
          >
            Skip to Plan →
          </Link>
        </div>
      </header>

      {/* 2. MAIN WORKFLOW CONTAINER (~740px wide matching Stitch) */}
      <main className="w-full max-w-[780px] px-4 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Title and Subtitle */}
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-[#F1F3EF] text-3xl font-medium tracking-tight">
            Prepare data for safe sharing
          </h1>
          <p className="font-body text-[#8D9A93] text-sm">
            Tell ZeroLeak why the data is needed and who will receive it.
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center gap-2 py-1 text-xs font-mono border-b border-[#1C2923]/50 pb-4">
          <div className="flex items-center gap-1.5 text-[#72D6A0] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#72D6A0] animate-ping inline-block sm:hidden" />
            <span>01</span>
            <span>DATA</span>
          </div>
          <span className="text-[#3E4942]">/</span>
          <div className="flex items-center gap-1.5 text-[#4FAF83] font-medium">
            <span>02</span>
            <span>PURPOSE</span>
          </div>
          <span className="text-[#3E4942]">/</span>
          <div className="flex items-center gap-1.5 text-[#4FAF83] font-medium">
            <span>03</span>
            <span>RECIPIENT</span>
          </div>
          <span className="text-[#3E4942]">/</span>
          <Link
            to="/exposure-plan"
            className="flex items-center gap-1.5 text-[#8D9A93] opacity-60 hover:opacity-100 hover:text-[#72D6A0] transition-all"
          >
            <span>04</span>
            <span>EXPOSURE PLAN</span>
          </Link>
        </div>

        {/* SECTION 1: DATASET */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs tracking-wider text-[#8D9A93] uppercase font-semibold">
              DATASET
            </label>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#72D6A0]">
              <span className={`w-1.5 h-1.5 rounded-full ${fileLoaded ? 'bg-[#72D6A0]' : 'bg-[#3E4942]'}`}></span>
              <span>{fileLoaded ? '✓ Dataset loaded' : 'No file selected'}</span>
            </span>
          </div>

          {/* State A: Loaded File Card */}
          {fileLoaded ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0D1512] border border-[#72D6A0]/30 shadow-[0_0_20px_-2px_rgba(114,214,160,0.12)] transition-all hover:border-[#72D6A0]/50">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#163D2D]/60 flex items-center justify-center text-[#72D6A0] border border-[#72D6A0]/30">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-medium text-[#F1F3EF]">{fileName}</span>
                  <span className="font-mono text-xs text-[#8D9A93]">{fileMeta}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="px-3 py-1.5 rounded-xl border border-[#1C2923] bg-[#070B09] text-xs font-mono text-[#8D9A93] hover:text-[#F1F3EF] hover:border-[#72D6A0]/50 transition-all cursor-pointer"
              >
                [ Change file ]
              </button>
            </div>
          ) : (
            /* State B: Dropzone Area */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[#1C2923] hover:border-[#72D6A0]/60 bg-[#0D1512] px-6 py-10 transition-colors cursor-pointer group shadow-[0_0_20px_-2px_rgba(114,214,160,0.06)]"
            >
              <input
                ref={fileInputRef}
                accept=".csv,.json,.xlsx"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-11 h-11 rounded-xl bg-[#163D2D]/40 flex items-center justify-center text-[#8D9A93] group-hover:text-[#72D6A0] transition-colors border border-[#1C2923]">
                <span className="material-symbols-outlined text-2xl">upload_file</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="font-headline text-sm font-medium text-[#F1F3EF]">
                  Drop your dataset here or browse files
                </p>
                <p className="font-mono text-xs text-[#8D9A93]">CSV · JSON · XLSX (Max 100MB)</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#111B17] border border-[#1C2923] text-xs font-mono text-[#F1F3EF] hover:bg-[#163D2D]/60 hover:border-[#72D6A0]/40 transition-colors cursor-pointer"
                >
                  Browse files
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadDemo();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#163D2D]/50 border border-[#72D6A0]/40 text-xs font-mono text-[#72D6A0] hover:bg-[#72D6A0] hover:text-[#070B09] transition-all cursor-pointer shadow-[0_0_12px_rgba(114,214,160,0.15)]"
                >
                  ⚡ Load Demo Dataset
                </button>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: PURPOSE */}
        <section className="flex flex-col gap-3">
          <label className="font-mono text-xs tracking-wider text-[#8D9A93] uppercase font-semibold">
            WHY ARE YOU SHARING THIS DATA?
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Identify suspicious transaction patterns."
              className="w-full bg-[#0D1512] border border-[#72D6A0]/25 focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] rounded-2xl p-4 text-sm font-body text-[#F1F3EF] placeholder-[#506057] transition-all outline-none resize-none leading-relaxed shadow-[0_0_20px_-2px_rgba(114,214,160,0.08)]"
            />
          </div>
          <p className="font-body text-xs text-[#8D9A93]">
            This context helps ZeroLeak determine what information the recipient actually needs.
          </p>

          {/* Suggested Purpose Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {PURPOSE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                  selectedChip === chip
                    ? 'bg-[#163D2D]/60 border border-[#72D6A0] text-[#72D6A0] shadow-[0_0_12px_-2px_rgba(114,214,160,0.3)]'
                    : 'bg-[#0D1512] border border-[#1C2923] text-[#8D9A93] hover:text-[#F1F3EF] hover:border-[#4FAF83]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        {/* SECTION 3: RECIPIENT */}
        <section className="flex flex-col gap-3">
          <label className="font-mono text-xs tracking-wider text-[#8D9A93] uppercase font-semibold">
            WHO WILL RECEIVE THIS DATA?
          </label>
          <div className="relative w-full">
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full appearance-none bg-[#0D1512] border border-[#72D6A0]/25 focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] rounded-2xl px-4 py-3 text-sm font-body text-[#F1F3EF] transition-all outline-none cursor-pointer shadow-[0_0_20px_-2px_rgba(114,214,160,0.08)]"
            >
              {RECIPIENT_OPTIONS.map((rec) => (
                <option key={rec} value={rec} className="bg-[#0D1512] text-[#F1F3EF]">
                  {rec}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8D9A93]">
              <span className="material-symbols-outlined text-lg">expand_more</span>
            </div>
          </div>
          <p className="font-body text-xs text-[#8D9A93]">
            Recipient context affects what ZeroLeak recommends sharing.
          </p>
        </section>

        {/* FOOTER ACTION */}
        <footer className="pt-6 border-t border-[#1C2923]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#8D9A93]">
            <span className="text-[#72D6A0] font-medium">01 DATA</span>
            <span className="text-[#3E4942]">→</span>
            <span className="text-[#4FAF83] font-medium">02 PURPOSE</span>
            <span className="text-[#3E4942]">→</span>
            <span className="text-[#4FAF83] font-medium">03 RECIPIENT</span>
            <span className="text-[#3E4942]">→</span>
            <span className="text-[#8D9A93] opacity-60">04 EXPOSURE PLAN</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
            {uploadWarning && (
              <span className="font-mono text-xs text-[#ff6b6b] flex items-center gap-1.5 animate-pulse">
                <span className="material-symbols-outlined text-sm">warning</span>
                Please upload to get data!
              </span>
            )}
            <button
              type="button"
              onClick={startAnalysis}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#F1F3EF] hover:bg-[#72D6A0] text-[#070B09] font-sans font-semibold text-sm hover:shadow-[0_0_24px_rgba(114,214,160,0.45)] active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Analyze dataset</span>
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>
        </footer>

      </main>

      {/* 3. INTERACTIVE CRYPTOGRAPHIC PROCESSING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0D1512] border border-[#1C2923] rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col gap-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1C2923] pb-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-xs uppercase tracking-wider text-[#72D6A0] font-medium">
                  Zero-Knowledge Compiler
                </span>
                <h3 className="font-headline text-lg text-[#F1F3EF] font-semibold">
                  Analyzing your dataset
                </h3>
                {stepLabel && (
                  <p className="font-mono text-xs text-[#72D6A0] animate-pulse">
                    {stepLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8D9A93] hover:text-[#F1F3EF] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Error Message if API fails */}
            {analysisError && (
              <div className="p-3.5 rounded-xl bg-[#421b24]/90 border border-[#ff6b6b]/40 text-[#ffb4b4] text-xs font-mono flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-[#ff6b6b] shrink-0 mt-0.5">
                  error
                </span>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-white">Backend Connection Error</span>
                  <span>{analysisError}</span>
                  <span className="text-[11px] text-[#ffb4b4]/70 mt-1">
                    Check that FastAPI is running on http://localhost:8000
                  </span>
                </div>
              </div>
            )}

            {/* Execution Trace */}
            <div className="flex flex-col gap-3 font-mono text-xs">
              {/* Step 1 */}
              <div className="flex items-center gap-3 text-[#72D6A0]">
                {analysisStep > 1 ? (
                  <span className="material-symbols-outlined text-base text-[#72D6A0]">check_circle</span>
                ) : analysisStep === 1 && isAnalyzing ? (
                  <span className="w-4 h-4 rounded-full border-2 border-[#72D6A0] border-t-transparent animate-spin inline-block" />
                ) : (
                  <span className="material-symbols-outlined text-base text-[#72D6A0]">check_circle</span>
                )}
                <span className="text-[#F1F3EF] font-medium">
                  1. Dataset Analysis &amp; Field Classification (CSV streaming)
                </span>
              </div>

              {/* Step 2 */}
              <div className={`flex items-center gap-3 transition-opacity ${analysisStep >= 2 ? 'opacity-100 text-[#72D6A0]' : 'opacity-40 text-[#8D9A93]'}`}>
                {analysisStep > 2 ? (
                  <span className="material-symbols-outlined text-base text-[#72D6A0]">check_circle</span>
                ) : analysisStep === 2 && isAnalyzing ? (
                  <span className="w-4 h-4 rounded-full border-2 border-[#72D6A0] border-t-transparent animate-spin inline-block" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-[#506057] inline-block" />
                )}
                <span className="text-[#F1F3EF] font-medium">
                  2. Advisory AI Necessity Recommendations (MockProvider)
                </span>
              </div>

              {/* Step 3 */}
              <div className={`flex items-center gap-3 transition-opacity ${analysisStep >= 3 ? 'opacity-100' : 'opacity-40 text-[#8D9A93]'}`}>
                {analysisStep > 3 ? (
                  <span className="material-symbols-outlined text-base text-[#72D6A0]">check_circle</span>
                ) : analysisStep === 3 && isAnalyzing ? (
                  <span className="w-4 h-4 rounded-full border-2 border-[#72D6A0] border-t-transparent animate-spin inline-block" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-[#506057] inline-block" />
                )}
                <span className="text-[#F1F3EF] font-medium">
                  3. Deterministic Policy Governance ({recipient})
                </span>
              </div>

              {/* Step 4 */}
              <div className={`flex items-center gap-3 transition-opacity ${analysisStep >= 4 ? 'opacity-100' : 'opacity-40 text-[#8D9A93]'}`}>
                {analysisStep >= 4 ? (
                  <span className="material-symbols-outlined text-base text-[#72D6A0]">check_circle</span>
                ) : (
                  <span className="w-4 h-4 rounded-full border border-[#506057] inline-block" />
                )}
                <span className={analysisStep >= 4 ? 'text-[#72D6A0] font-medium' : 'text-[#8D9A93]'}>
                  4. Reviewable Exposure Plan Synthesized ({exposurePlan ? `${exposurePlan.summary.total_fields} fields · ${exposurePlan.summary.protected_fields} protected` : 'Enclave ready'})
                </span>
              </div>
            </div>

            {/* Cryptographic Plan Info */}
            <div className="bg-[#070B09] p-3 rounded-xl border border-[#1C2923] font-mono text-[11px] text-[#8D9A93] flex flex-col gap-1">
              <div className="flex items-center justify-between text-[#506057]">
                <span className="uppercase tracking-wider">EXPOSURE PLAN ID</span>
                <span>STATUS: {exposurePlan?.status || 'INITIALIZING'}</span>
              </div>
              <span className="text-[#72D6A0] font-mono truncate">
                {exposurePlan?.exposure_plan_id || 'Generating enclave UUID...'}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#111B17] border border-[#1C2923] text-xs font-mono text-[#8D9A93] hover:text-[#F1F3EF] cursor-pointer"
              >
                Close
              </button>
              {analysisError ? (
                <button
                  type="button"
                  onClick={startAnalysis}
                  className="px-5 py-2.5 rounded-xl bg-[#ff6b6b] hover:bg-[#fa5252] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_16px_rgba(255,107,107,0.35)]"
                >
                  <span className="material-symbols-outlined text-xs">refresh</span>
                  <span>Retry Analysis</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={proceedToExposurePlan}
                  disabled={isAnalyzing || analysisStep < 4}
                  className="px-5 py-2.5 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_16px_rgba(114,214,160,0.35)] disabled:opacity-50"
                >
                  <span>{isAnalyzing ? 'Analyzing...' : 'Proceed to Plan'}</span>
                  <span className="material-symbols-outlined text-xs font-bold">chevron_right</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
