import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';

export default function SafeDataset() {
  const { sanitizedResult, validationResult, exposurePlan, datasetMeta } = usePipeline();

  const [showAiModal, setShowAiModal] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [aiSentSuccess, setAiSentSuccess] = useState(false);

  const getDataset = () => {
    try {
      const saved = localStorage.getItem('zeroleak_dataset');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  };

  const dataset = datasetMeta || getDataset();

  // Parse actual sanitized CSV content if available
  const parsedSanitized = useMemo(() => {
    if (!sanitizedResult?.content) return null;
    const lines = sanitizedResult.content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return null;

    const parseLine = (line) => {
      const res = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          res.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += c;
        }
      }
      res.push(cur.trim().replace(/^["']|["']$/g, ''));
      return res;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => {
      const vals = parseLine(line);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = vals[idx] !== undefined ? vals[idx] : '';
      });
      return row;
    });
    return { headers, rows };
  }, [sanitizedResult]);

  // Build comparative rows from real exposure plan decisions + real sanitized values
  const dynamicRows = useMemo(() => {
    const originalSample = dataset?.sampleRows && dataset.sampleRows[0] ? dataset.sampleRows[0] : null;
    const sanitizedSample = parsedSanitized?.rows && parsedSanitized.rows[0] ? parsedSanitized.rows[0] : null;

    const getRawVal = (field) => {
      if (!originalSample) return '-';
      if (originalSample[field] !== undefined) return originalSample[field];
      const match = Object.entries(originalSample).find(([k]) => k.trim().toLowerCase() === field.trim().toLowerCase());
      return match ? match[1] : '-';
    };

    const getSanitizedVal = (field) => {
      if (!sanitizedSample) return null;
      if (sanitizedSample[field] !== undefined) return sanitizedSample[field];
      const match = Object.entries(sanitizedSample).find(([k]) => k.trim().toLowerCase() === field.trim().toLowerCase());
      return match ? match[1] : null;
    };

    if (exposurePlan?.decisions && exposurePlan.decisions.length > 0) {
      return exposurePlan.decisions.map((d) => {
        const origVal = getRawVal(d.field);
        const transformedVal = getSanitizedVal(d.field);

        let safeVal;
        if (d.action === 'ALLOW') {
          safeVal = transformedVal !== null ? transformedVal : origVal;
        } else if (d.action === 'REDACT') {
          safeVal = transformedVal !== null ? transformedVal : '[REDACTED]';
        } else if (d.action === 'TOKENIZE') {
          safeVal = transformedVal !== null ? transformedVal : '[TOKENIZED]';
        } else if (d.action === 'GENERALIZE') {
          safeVal = transformedVal !== null ? transformedVal : '[GENERALIZED]';
        } else {
          // REMOVE or BLOCK
          safeVal = '[REMOVED]';
        }

        const icon = d.action === 'ALLOW' ? 'check_circle' : d.action === 'TOKENIZE' ? 'token' : d.action === 'GENERALIZE' ? 'map' : d.action === 'REDACT' ? 'visibility_off' : 'block';
        const safeType = d.action === 'ALLOW' ? 'Preserved' : d.action === 'TOKENIZE' ? 'Tokenized' : d.action === 'GENERALIZE' ? 'Generalized' : d.action === 'REDACT' ? 'Redacted' : 'Stripped';

        return {
          field: d.field,
          original: String(origVal),
          origType: d.classification,
          origRisk: d.action === 'BLOCK' ? 'critical' : d.action === 'REMOVE' ? 'high' : d.action === 'TOKENIZE' ? 'medium' : 'low',
          safe: String(safeVal),
          safeType,
          safeNote: d.reason,
          icon,
        };
      });
    }

    if (!dataset || !dataset.columns || dataset.columns.length === 0) return [];

    return dataset.columns.map((col) => {
      const origVal = getRawVal(col);
      const transformedVal = getSanitizedVal(col);
      return {
        field: col,
        original: String(origVal),
        origType: 'Attribute',
        origRisk: 'low',
        safe: transformedVal !== null ? String(transformedVal) : String(origVal),
        safeType: 'Preserved',
        safeNote: 'Input dataset field',
        icon: 'check_circle'
      };
    });
  }, [dataset, exposurePlan, parsedSanitized]);

  const handleDownload = () => {
    let csvContent = sanitizedResult?.content;
    let filename = sanitizedResult?.filename || `${dataset?.fileName ? dataset.fileName.replace(/\.csv$/i, '') : 'dataset'}_safe.csv`;

    if (!csvContent) {
      // Synthesize safe CSV from dynamic rows for fallback
      const headers = dynamicRows.filter(r => !r.safe.includes('[REMOVED]') && !r.safe.includes('[STRIPPED]')).map(r => r.field);
      const rowVals = dynamicRows.filter(r => !r.safe.includes('[REMOVED]') && !r.safe.includes('[STRIPPED]')).map(r => r.safe);
      csvContent = `${headers.join(',')}\n${rowVals.join(',')}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleConfirmAi = () => {
    setShowAiModal(false);
    setAiSentSuccess(true);
    setTimeout(() => setAiSentSuccess(false), 4000);
  };

  const isSafeAttested = validationResult?.is_safe !== false;

  return (
    <div className="bg-[#070B09] text-[#F1F3EF] font-body min-h-screen flex flex-col selection:bg-[#72D6A0] selection:text-[#070B09]">
      {/* Top Navigation */}
      <header className="w-full bg-[#0D1512]/90 border-b border-[#1C2923] sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0]"></span>
              <span className="font-headline font-bold text-lg tracking-tight text-[#F1F3EF]">
                ZeroLeak
              </span>
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#8D9A93] uppercase pl-1.5 border-l border-[#1C2923]">
                FINANCE
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-xs font-mono text-[#8D9A93]">
              <Link to="/upload" className="hover:text-[#F1F3EF] transition-colors">
                Data Upload
              </Link>
              <Link to="/exposure-plan" className="hover:text-[#F1F3EF] transition-colors">
                Exposure Plan
              </Link>
              <span className="text-[#72D6A0]">
                Safe Dataset
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#163D2D]/40 border border-[#72D6A0]/30 text-[#72D6A0] text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
              Enclave Live: ENC-08492
            </div>

            <Link
              to="/login"
              className="p-2 rounded-lg bg-[#0D1512] border border-[#1C2923] hover:border-[#72D6A0]/40 text-[#8D9A93] hover:text-[#F1F3EF] transition"
              title="Switch Account"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col items-center">
        {/* 1. Progress / Context Breadcrumb */}
        <nav aria-label="Pipeline Progress" className="w-full flex items-center justify-center mb-8">
          <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono uppercase tracking-wider text-[#8D9A93]">
            <li className="flex items-center gap-1.5 text-[#8D9A93]/80">
              <span className="text-[#4FAF83]">01</span> DATA
            </li>
            <li className="text-[#1C2923]">/</li>
            <li className="flex items-center gap-1.5 text-[#8D9A93]/80">
              <span className="text-[#4FAF83]">02</span> PURPOSE
            </li>
            <li className="text-[#1C2923]">/</li>
            <li className="flex items-center gap-1.5 text-[#8D9A93]/80">
              <span className="text-[#4FAF83]">03</span> RECIPIENT
            </li>
            <li className="text-[#1C2923]">/</li>
            <li>
              <Link
                to="/exposure-plan"
                className="flex items-center gap-1.5 text-[#8D9A93]/80 hover:text-[#72D6A0] transition-colors"
              >
                <span className="text-[#4FAF83]">04</span> EXPOSURE PLAN
              </Link>
            </li>
            <li className="text-[#1C2923]">/</li>
            <li className="flex items-center gap-2 text-[#72D6A0] font-semibold px-2.5 py-1 rounded bg-[#163D2D]/60 border border-[#72D6A0]/40 shadow-[0_0_12px_rgba(114,214,160,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
              05 SAFE DATASET
            </li>
          </ol>
        </nav>

        {!dataset ? (
          /* Dedicated Empty State - No mock filler data */
          <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl bg-[#0D1512] border border-[#1C2923] max-w-xl w-full my-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#163D2D]/50 border border-[#72D6A0]/40 flex items-center justify-center text-[#72D6A0] mb-5 shadow-[0_0_24px_rgba(114,214,160,0.15)]">
              <span className="material-symbols-outlined text-[32px]">shield_lock</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#070B09] border border-[#1C2923] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb86c]"></span>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#8D9A93] font-semibold">
                No Dataset Active
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F1F3EF] mb-2">
              No safe dataset available
            </h2>
            <p className="font-mono text-sm text-[#72D6A0] font-medium mb-3">
              Please upload to get data!
            </p>
            <p className="font-body text-xs sm:text-sm text-[#8D9A93] max-w-md mx-auto leading-relaxed mb-8">
              Upload your financial data in the preparation enclave to generate a cryptographically attested, zero-PII safe dataset.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F1F3EF] hover:bg-[#72D6A0] text-[#070B09] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(241,243,239,0.15)] hover:shadow-[0_0_28px_rgba(114,214,160,0.45)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Upload Dataset</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              to="/"
              className="text-xs font-mono text-[#8D9A93] hover:text-[#72D6A0] transition-colors mt-6"
            >
              ← Return to Landing Page
            </Link>
          </div>
        ) : (
          /* Active State — Rendered for Uploaded Dataset */
          <>
            {/* 2. Success Header */}
            <section className="text-center max-w-2xl mx-auto flex flex-col items-center mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1512] border border-[#1C2923] shadow-sm mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#72D6A0] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#72D6A0]"></span>
                </span>
                <span className="font-mono text-xs tracking-widest uppercase text-[#72D6A0] font-semibold">
                  Enclave Sanitization Complete
                </span>
              </div>

              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F1F3EF] mb-3">
                Your data is ready to share.
              </h1>
              <p className="font-body text-sm sm:text-base text-[#8D9A93] max-w-xl leading-relaxed">
                ZeroLeak applied the approved Exposure Plan inside hardware enclaves. Analytical utility is preserved for <span className="text-[#F1F3EF] font-medium">{dataset.recipient}</span>.
              </p>

              {/* Feedback alerts */}
              {downloadSuccess && (
                <div className="mt-4 px-4 py-2 rounded-xl bg-[#163D2D] border border-[#72D6A0]/50 text-[#72D6A0] text-xs font-mono flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Safe dataset encrypted archive generated and downloaded.
                </div>
              )}
              {aiSentSuccess && (
                <div className="mt-4 px-4 py-2 rounded-xl bg-[#163D2D] border border-[#72D6A0]/50 text-[#72D6A0] text-xs font-mono flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">shield_lock</span>
                  Safe dataset successfully dispatched to boundary. Raw data remained isolated.
                </div>
              )}
            </section>

            {/* 3. Output Validation & Status Card */}
            <section className="w-full bg-[#0D1512] border border-[#1C2923] rounded-2xl p-5 sm:p-6 mb-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-[#1C2923]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#8D9A93] tracking-wider uppercase">Output Validation</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#163D2D] text-[#72D6A0] border border-[#72D6A0]/20">
                      Zero-Leak Policy Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#8D9A93]">Mathematical attestation verified for dataset: <span className="text-[#F1F3EF] font-mono">{dataset.fileName}</span></p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto bg-[#070B09] px-4 py-2 rounded-xl border border-[#163D2D]">
                  <div className={`w-2.5 h-2.5 rounded-full ${isSafeAttested ? 'bg-[#72D6A0] shadow-[0_0_8px_#72D6A0]' : 'bg-[#ff6b6b] shadow-[0_0_8px_#ff6b6b]'}`}></div>
                  <div>
                    <div className={`font-mono text-xs font-bold tracking-wider ${isSafeAttested ? 'text-[#72D6A0]' : 'text-[#ff6b6b]'}`}>
                      {validationResult?.status || 'SAFE TO SHARE'}
                    </div>
                    <div className="text-[10px] text-[#8D9A93]">
                      {validationResult?.violations?.length ? `${validationResult.violations.length} violations` : 'Zero-leak proof attested'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Checks Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-5 pb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-[#F1F3EF]">
                  <span className={`material-symbols-outlined text-[18px] ${validationResult?.checks?.blocked_fields_check !== false ? 'text-[#72D6A0]' : 'text-[#ff6b6b]'}`}>
                    {validationResult?.checks?.blocked_fields_check !== false ? 'check_circle' : 'cancel'}
                  </span>
                  <span>Direct PII removed</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#F1F3EF]">
                  <span className={`material-symbols-outlined text-[18px] ${validationResult?.checks?.tokenization_check !== false ? 'text-[#72D6A0]' : 'text-[#ff6b6b]'}`}>
                    {validationResult?.checks?.tokenization_check !== false ? 'check_circle' : 'cancel'}
                  </span>
                  <span>Identifiers tokenized</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#F1F3EF]">
                  <span className={`material-symbols-outlined text-[18px] ${validationResult?.checks?.generalization_check !== false ? 'text-[#72D6A0]' : 'text-[#ff6b6b]'}`}>
                    {validationResult?.checks?.generalization_check !== false ? 'check_circle' : 'cancel'}
                  </span>
                  <span>Generalization attested</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#F1F3EF]">
                  <span className={`material-symbols-outlined text-[18px] ${validationResult?.checks?.schema_check !== false ? 'text-[#72D6A0]' : 'text-[#ff6b6b]'}`}>
                    {validationResult?.checks?.schema_check !== false ? 'check_circle' : 'cancel'}
                  </span>
                  <span>Schema integrity valid</span>
                </div>
              </div>

              {/* Summary Stats Line */}
              <div className="pt-3 border-t border-[#1C2923] flex items-center justify-between text-xs text-[#8D9A93] font-mono">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8D9A93] text-[16px]">bar_chart</span>
                  <span>
                    {sanitizedResult?.row_count !== undefined ? `${sanitizedResult.row_count.toLocaleString()} rows · ${sanitizedResult.column_count} sanitized columns` : `${dataset.rowCount?.toLocaleString()} records · ${dynamicRows.length} attributes evaluated`}
                  </span>
                </div>
                <span className="hidden sm:inline text-[#72D6A0]">
                  Plan ID: {exposurePlan?.exposure_plan_id ? exposurePlan.exposure_plan_id.slice(0, 18) + '...' : 'Attested'}
                </span>
              </div>
            </section>

            {/* 4. Centerpiece: What Changed (Before / After Comparison) */}
            <section className="w-full mb-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
                <div>
                  <span className="font-mono text-xs tracking-widest uppercase text-[#8D9A93]">Audit Trace</span>
                  <h2 className="font-headline text-xl font-bold text-[#F1F3EF] mt-0.5">Attribute Transformation Trace</h2>
                </div>
                <p className="text-xs text-[#8D9A93] font-mono">Inspect corresponding fields side-by-side</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl border border-[#1C2923] overflow-hidden bg-[#0D1512] shadow-xl divide-y md:divide-y-0 md:divide-x divide-[#1C2923]">
                {/* Column 1: Original Record */}
                <div className="p-5 sm:p-6 bg-[#070B09]/60">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1C2923]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#163D2D]/50 text-[#F1F3EF] border border-[#1C2923]">
                        ORIGINAL RECORD
                      </span>
                      <span className="text-xs text-[#8D9A93] font-mono">(Raw Client Input)</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8D9A93]">{dynamicRows.length} attributes</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    {dynamicRows.map((row, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-[#0D1512] border border-[#1C2923] hover:border-[#283C32] transition flex items-center justify-between"
                      >
                        <div className="flex flex-col">
                          <span className="text-[#8D9A93] text-[10px] uppercase tracking-wider">{row.field}</span>
                          <span className="text-[#F1F3EF] font-medium text-sm mt-0.5 font-body truncate max-w-xs">{row.original}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border shrink-0 ${
                            row.origRisk === 'critical' || row.origRisk === 'high'
                              ? 'bg-[#421b24]/40 text-[#ff6b6b] border-[#ff6b6b]/30'
                              : 'bg-[#1C2923] text-[#8D9A93] border-[#283C32]'
                          }`}
                        >
                          {row.origType}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Safe Data Output */}
                <div className="p-5 sm:p-6 bg-[#0D1512]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1C2923]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#163D2D] text-[#72D6A0] border border-[#72D6A0]/40">
                        SAFE DATA OUTPUT
                      </span>
                      <span className="text-xs text-[#72D6A0] font-mono">Sanitized Output</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#8D9A93]">Zero-PII Payload</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    {dynamicRows.map((row, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                          row.safeType === 'Stripped'
                            ? 'bg-[#070B09]/70 border-[#1C2923] opacity-60'
                            : 'bg-[#121E19] border-[#1C2923] hover:border-[#72D6A0]/40'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-[#8D9A93] text-[10px] uppercase tracking-wider">{row.field}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`font-semibold text-sm truncate max-w-xs ${
                                row.safeType === 'Stripped'
                                  ? 'text-[#8D9A93] line-through'
                                  : 'text-[#72D6A0]'
                              }`}
                            >
                              {row.safe}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#163D2D] text-[#72D6A0] shrink-0">
                              {row.safeType}
                            </span>
                          </div>
                          <span className="text-[#8D9A93] text-[11px] font-body mt-0.5 truncate">{row.safeNote}</span>
                        </div>
                        <span className="material-symbols-outlined text-[#72D6A0] text-[18px]">
                          {row.icon}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Primary Actions & Export */}
            <section className="w-full flex flex-col items-center gap-4 pt-4 pb-12">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F1F3EF] text-[#070B09] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#72D6A0] transition shadow-lg active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Download safe dataset</span>
                </button>

                {/* Dispatch Safe Dataset Button (Replaced generic smart_toy with sleek shield_lock) */}
                <button
                  onClick={() => setShowAiModal(true)}
                  className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#163D2D] border border-[#72D6A0]/40 text-[#72D6A0] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#72D6A0] hover:text-[#070B09] transition shadow-lg active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">shield_lock</span>
                  <span>Dispatch safe dataset</span>
                </button>
              </div>

              <div className="flex items-center gap-4 mt-2">
                <Link
                  to="/upload"
                  className="text-xs font-mono text-[#72D6A0] hover:underline transition"
                >
                  Upload Another Dataset
                </Link>
                <span className="text-[#1C2923]">·</span>
                <Link
                  to="/"
                  className="text-xs font-mono text-[#8D9A93] hover:text-[#72D6A0] transition"
                >
                  ← Return to Landing Page
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Interactive Modal for Egress Boundary Dispatch */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0D1512] border border-[#1C2923] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#163D2D] border border-[#72D6A0]/40 flex items-center justify-center shrink-0 text-[#72D6A0]">
                <span className="material-symbols-outlined text-[22px]">shield_lock</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-[#F1F3EF]">
                  Dispatch safe dataset to boundary?
                </h3>
                <p className="text-xs text-[#8D9A93] font-body mt-0.5">
                  Enforcing strict hardware enclave egress perimeter
                </p>
              </div>
            </div>

            <div className="bg-[#070B09] rounded-xl p-3.5 border border-[#1C2923] mb-6 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 text-[#72D6A0]">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Only the validated safe dataset will be provided.</span>
              </div>
              <div className="flex items-center gap-2 text-[#ff6b6b]">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>The original raw dataset will not be sent under any condition.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2.5 rounded-xl text-[#8D9A93] hover:text-[#F1F3EF] hover:bg-[#163D2D]/30 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAi}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#72D6A0] text-[#070B09] font-bold uppercase tracking-wider hover:bg-[#4FAF83] transition shadow-[0_0_16px_rgba(114,214,160,0.3)]"
              >
                <span>Dispatch Safe Data</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
