import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePipeline } from '../context/PipelineContext';
import { useAuth } from '../context/AuthContext';

const INITIAL_FIELDS = [
  {
    id: 1,
    name: 'Transaction amount',
    classification: 'FINANCIAL_VALUE',
    action: 'ALLOW',
    reason: 'Required for fraud analysis & anomaly detection',
    control: 'Included',
    controlType: 'static',
    category: 'shared'
  },
  {
    id: 2,
    name: 'Merchant',
    classification: 'TRANSACTION',
    action: 'ALLOW',
    reason: 'Required for merchant classification & pattern detection',
    control: 'Included',
    controlType: 'static',
    category: 'shared'
  },
  {
    id: 3,
    name: 'Transaction timestamp',
    classification: 'DATE',
    action: 'ALLOW',
    reason: 'Required for temporal sequence & velocity analysis',
    control: 'Included',
    controlType: 'static',
    category: 'shared'
  },
  {
    id: 4,
    name: 'Location',
    classification: 'LOCATION',
    action: 'GENERALIZE',
    reason: 'Exact coordinates unnecessary; generalize to city/region level',
    control: 'City level',
    controlType: 'select',
    options: ['City level', 'State level', 'Country level', 'Suppress'],
    category: 'transformed'
  },
  {
    id: 5,
    name: 'Account number',
    classification: 'BANK_ACCOUNT',
    action: 'TOKENIZE',
    reason: 'Identity unnecessary; consistent token preserved for linking',
    control: 'HMAC-SHA256 Token',
    controlType: 'select',
    options: ['HMAC-SHA256 Token', 'Salted Pseudonym', 'Zero-Knowledge Hash', 'Suppress'],
    category: 'transformed'
  },
  {
    id: 6,
    name: 'Customer name',
    classification: 'PERSON_NAME',
    action: 'REMOVE',
    reason: 'Direct PII not required for transaction pattern evaluation',
    control: 'Excluded',
    controlType: 'static',
    category: 'removed'
  },
  {
    id: 7,
    name: 'Email',
    classification: 'EMAIL',
    action: 'REMOVE',
    reason: 'Contact information excluded under zero-leak policy',
    control: 'Excluded',
    controlType: 'static',
    category: 'removed'
  },
  {
    id: 8,
    name: 'Phone',
    classification: 'PHONE',
    action: 'REMOVE',
    reason: 'Direct identifier not required for stated analytical purpose',
    control: 'Excluded',
    controlType: 'static',
    category: 'removed'
  },
  {
    id: 9,
    name: 'PAN / Tax ID',
    classification: 'GOVERNMENT_ID',
    action: 'BLOCK',
    reason: 'Prohibited from external sharing by institutional policy',
    control: 'Blocked by policy',
    controlType: 'blocked',
    category: 'blocked'
  },
  {
    id: 10,
    name: 'API credential',
    classification: 'CREDENTIAL',
    action: 'BLOCK',
    reason: 'Cryptographic credentials can never cross isolation boundary',
    control: 'Blocked by policy',
    controlType: 'blocked',
    category: 'blocked'
  }
];

export default function ExposurePlan() {
  const { exposurePlan, approveCurrentPlan, datasetMeta } = usePipeline();
  const { user, logout } = useAuth();

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

  // Convert decisions from backend into table display items
  const planFields = useMemo(() => {
    if (exposurePlan?.decisions && exposurePlan.decisions.length > 0) {
      return exposurePlan.decisions.map((d, idx) => {
        let controlType = 'static';
        let options = undefined;
        let control = 'Included';
        let category = 'shared';

        if (d.action === 'ALLOW') {
          control = 'Included';
          controlType = 'static';
          category = 'shared';
        } else if (d.action === 'TOKENIZE') {
          control = 'HMAC-SHA256 Token';
          controlType = 'select';
          options = ['HMAC-SHA256 Token', 'Salted Pseudonym', 'Zero-Knowledge Hash', 'Suppress'];
          category = 'transformed';
        } else if (d.action === 'GENERALIZE') {
          control = 'City / Interval Generalized';
          controlType = 'select';
          options = ['City / Interval Generalized', 'Macro Region', 'Suppress'];
          category = 'transformed';
        } else if (d.action === 'REDACT') {
          control = 'Redacted [MASKED]';
          controlType = 'static';
          category = 'transformed';
        } else if (d.action === 'BLOCK') {
          control = 'Blocked by policy';
          controlType = 'blocked';
          category = 'blocked';
        } else {
          control = 'Excluded';
          controlType = 'static';
          category = 'removed';
        }

        return {
          id: idx + 1,
          name: d.field,
          classification: d.classification,
          action: d.action,
          ai_recommendation: d.ai_recommendation,
          reason: d.reason,
          policy_overrode_ai: d.policy_overrode_ai,
          control,
          controlType,
          options,
          category,
        };
      });
    }

    // Heuristic fallback if direct navigation without backend run
    if (!dataset || !dataset.columns || dataset.columns.length === 0) return INITIAL_FIELDS;
    return dataset.columns.map((col, idx) => {
      const lower = col.toLowerCase();
      if (lower.includes('name') || lower.includes('customer') || lower.includes('user') || lower.includes('holder')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'PERSON_NAME',
          action: 'REMOVE',
          reason: 'Direct PII not required for transaction pattern evaluation',
          control: 'Excluded',
          controlType: 'static',
          category: 'removed'
        };
      }
      if (lower.includes('pan') || lower.includes('ssn') || lower.includes('tax') || lower.includes('id') || lower.includes('national')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'GOVERNMENT_ID',
          action: 'BLOCK',
          reason: 'Prohibited from external sharing by institutional policy',
          control: 'Blocked by policy',
          controlType: 'blocked',
          category: 'blocked'
        };
      }
      if (lower.includes('account') || lower.includes('card') || lower.includes('bank') || lower.includes('iban')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'BANK_ACCOUNT',
          action: 'TOKENIZE',
          reason: 'Identity unnecessary; consistent token preserved for linking',
          control: 'HMAC-SHA256 Token',
          controlType: 'select',
          options: ['HMAC-SHA256 Token', 'Salted Pseudonym', 'Zero-Knowledge Hash', 'Suppress'],
          category: 'transformed'
        };
      }
      if (lower.includes('email') || lower.includes('mail')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'EMAIL',
          action: 'REMOVE',
          reason: 'Contact information excluded under zero-leak policy',
          control: 'Excluded',
          controlType: 'static',
          category: 'removed'
        };
      }
      if (lower.includes('phone') || lower.includes('mobile') || lower.includes('cell')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'PHONE',
          action: 'REMOVE',
          reason: 'Direct identifier not required for stated analytical purpose',
          control: 'Excluded',
          controlType: 'static',
          category: 'removed'
        };
      }
      if (lower.includes('location') || lower.includes('city') || lower.includes('addr') || lower.includes('geo')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'LOCATION',
          action: 'GENERALIZE',
          reason: 'Exact coordinates unnecessary; generalize to city/region level',
          control: 'City level',
          controlType: 'select',
          options: ['City level', 'State level', 'Country level', 'Suppress'],
          category: 'transformed'
        };
      }
      if (lower.includes('date') || lower.includes('time')) {
        return {
          id: idx + 1,
          name: col,
          classification: 'DATE',
          action: 'ALLOW',
          reason: 'Required for temporal sequence & velocity analysis',
          control: 'Included',
          controlType: 'static',
          category: 'shared'
        };
      }
      return {
        id: idx + 1,
        name: col,
        classification: 'FINANCIAL_VALUE',
        action: 'ALLOW',
        reason: 'Essential metric required for analytical utility',
        control: 'Included',
        controlType: 'static',
        category: 'shared'
      };
    });
  }, [exposurePlan, dataset]);

  const [fields, setFields] = useState(planFields);

  useEffect(() => {
    setFields(planFields);
  }, [planFields]);

  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState(null);
  const [datasetName, setDatasetName] = useState(dataset?.fileName || '');
  const [purpose, setPurpose] = useState(exposurePlan?.purpose || dataset?.purpose || '');
  const [recipient, setRecipient] = useState(exposurePlan?.recipient || dataset?.recipient || '');

  const navigate = useNavigate();

  const handleApprove = async () => {
    setIsApproving(true);
    setApproveError(null);
    try {
      if (exposurePlan?.exposure_plan_id) {
        await approveCurrentPlan();
      }
      navigate('/sanitization');
    } catch (err) {
      console.error('Approval failed:', err);
      setApproveError(err.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  const handleControlChange = (id, newControl) => {
    setFields(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        let action = f.action;
        let category = f.category;
        if (newControl === 'Suppress') {
          action = 'REMOVE';
          category = 'removed';
        }
        return { ...f, control: newControl, action, category };
      })
    );
  };

  const filteredFields = useMemo(() => {
    return fields.filter(f => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.reason.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === 'ALL') return true;
      return f.category === activeFilter;
    });
  }, [fields, activeFilter, searchQuery]);

  // Dynamic counts
  const counts = useMemo(() => {
    const shared = fields.filter(f => f.category === 'shared').length;
    const transformed = fields.filter(f => f.category === 'transformed').length;
    const removed = fields.filter(f => f.category === 'removed').length;
    const blocked = fields.filter(f => f.category === 'blocked').length;
    return {
      total: fields.length,
      shared,
      transformed,
      removed,
      blocked
    };
  }, [fields]);

  return (
    <div className="bg-[#070B09] font-sans text-[#F1F3EF] min-h-screen flex flex-col selection:bg-[#72D6A0] selection:text-[#070B09] antialiased">
      {/* 1. STITCH COMPLIANT TOP HEADER */}
      <header className="fixed top-0 w-full z-50 bg-[#070B09]/85 backdrop-blur-xl border-b border-[#16221D]">
        <div className="max-w-[1400px] mx-auto h-20 px-6 sm:px-10 flex items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] animate-pulse group-hover:scale-125 transition-transform"></div>
              <span className="font-headline font-semibold text-[18px] tracking-tight text-[#F1F3EF]">
                ZeroLeak Finance
              </span>
            </Link>
            <span className="hidden sm:inline-block text-[#506057] font-mono text-xs">/</span>
            <span className="hidden sm:inline-block text-xs font-mono uppercase tracking-wider text-[#8D9A93] px-2.5 py-1 rounded-lg bg-[#0D1512] border border-[#16221D]">
              Exposure Plan
            </span>
          </div>

          {/* Progress Indicator */}
          <nav className="hidden md:flex items-center gap-2.5 font-mono text-[11px] tracking-wider text-[#8D9A93]">
            <Link
              to="/upload"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#8D9A93]/80 hover:text-[#72D6A0] transition-colors"
            >
              <span className="text-[#4FAF83] font-medium">01</span>
              <span>DATA</span>
            </Link>
            <span className="text-[#506057] text-xs">→</span>
            <Link
              to="/upload"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#8D9A93]/80 hover:text-[#72D6A0] transition-colors"
            >
              <span className="text-[#4FAF83] font-medium">02</span>
              <span>PURPOSE</span>
            </Link>
            <span className="text-[#506057] text-xs">→</span>
            <Link
              to="/upload"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#8D9A93]/80 hover:text-[#72D6A0] transition-colors"
            >
              <span className="text-[#4FAF83] font-medium">03</span>
              <span>RECIPIENT</span>
            </Link>
            <span className="text-[#506057] text-xs">→</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0D1512] border border-[#72D6A0]/30 text-[#72D6A0] font-semibold shadow-[0_0_12px_rgba(114,214,160,0.15)]">
              <span>04</span>
              <span>EXPOSURE PLAN</span>
            </div>
            <span className="text-[#506057] text-xs">→</span>
            <Link
              to="/safe-dataset"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#8D9A93]/60 hover:text-[#8D9A93] transition-colors"
            >
              <span>05</span>
              <span>SAFE DATASET</span>
            </Link>
          </nav>

          {/* Right side: Enclave status and user */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse"></span>
              <span className="text-[#F1F3EF] truncate max-w-[160px]">{user?.email || 'Active'}</span>
            </span>
            <Link
              to="/byok"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0D1512] border border-[#1C2923] hover:border-[#72D6A0]/40 text-xs font-mono text-[#8D9A93] hover:text-[#72D6A0] transition"
              title="Configure AI Provider (BYOK)"
            >
              <span className="material-symbols-outlined text-[15px] text-[#72D6A0]">key</span>
              <span className="hidden sm:inline">AI Provider</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="p-2 rounded-lg bg-[#0D1512] border border-[#1C2923] hover:border-[#ff6b6b]/40 text-[#8D9A93] hover:text-[#ff6b6b] transition cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTAINER */}
      <main className="w-full pt-20 flex-1 flex flex-col">
        {!dataset ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl bg-[#0D1512] border border-[#1C2923] max-w-xl w-full mx-auto my-14 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#163D2D]/50 border border-[#72D6A0]/40 flex items-center justify-center text-[#72D6A0] mb-5 shadow-[0_0_24px_rgba(114,214,160,0.15)]">
              <span className="material-symbols-outlined text-[32px]">policy</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#070B09] border border-[#1C2923] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb86c]"></span>
              <span className="font-mono text-[10px] tracking-widest uppercase text-[#8D9A93] font-semibold">
                Plan Uninitialized
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F1F3EF] mb-2">
              No exposure plan generated
            </h2>
            <p className="font-mono text-sm text-[#72D6A0] font-medium mb-3">
              Please upload to get data!
            </p>
            <p className="font-body text-xs sm:text-sm text-[#8D9A93] max-w-md mx-auto leading-relaxed mb-8">
              ZeroLeak constructs an exposure plan and policy enforcement matrix once your financial dataset is uploaded.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F1F3EF] hover:bg-[#72D6A0] text-[#070B09] font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(241,243,239,0.15)] hover:shadow-[0_0_28px_rgba(114,214,160,0.45)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Go to Data Upload</span>
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
          <div className="max-w-[1400px] w-full mx-auto px-6 sm:px-10 py-10 sm:py-12 flex flex-col gap-8">
            
            {/* 2. PAGE HEADER & CONTEXT BAR */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h1 className="font-headline font-semibold text-3xl sm:text-4xl text-[#F1F3EF] tracking-tight">
                    Exposure Plan
                  </h1>
                  <p className="text-[#8D9A93] text-sm sm:text-base font-normal">
                    ZeroLeak analyzed your data against the stated purpose and recipient context.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#0D1512] border border-[#1C2923] hover:border-[#72D6A0]/40 text-xs font-mono text-[#8D9A93] hover:text-[#F1F3EF] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Edit Parameters</span>
                  </button>
                </div>
              </div>

              {/* Context Pill / Bar */}
              <div className="w-full bg-[#0D1512] border border-[#1C2923] rounded-xl px-5 sm:px-7 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono divide-y md:divide-y-0 md:divide-x divide-[#1C2923]">
                  <div className="flex items-center gap-2.5 md:pr-6">
                    <span className="text-[#506057] uppercase tracking-wider">Dataset</span>
                    <span className="material-symbols-outlined text-[16px] text-[#72D6A0]">description</span>
                    <span className="text-[#F1F3EF] font-medium truncate">{datasetName}</span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-3 md:pt-0 md:px-6">
                    <span className="text-[#506057] uppercase tracking-wider">Purpose</span>
                    <span className="material-symbols-outlined text-[16px] text-[#4FAF83]">policy</span>
                    <span className="text-[#F1F3EF] font-medium truncate">{purpose}</span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-3 md:pt-0 md:pl-6">
                    <span className="text-[#506057] uppercase tracking-wider">Recipient</span>
                    <span className="material-symbols-outlined text-[16px] text-[#8D9A93]">badge</span>
                    <span className="text-[#F1F3EF] font-medium truncate">{recipient}</span>
                  </div>
                </div>
              </div>
            </div>

          {/* 3. MINIMALIST ANALYSIS METRICS CARDS (INTERACTIVE FILTERS) */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {/* Total Analyzed */}
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`p-5 rounded-2xl bg-[#0D1512] border text-left transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between cursor-pointer ${
                  activeFilter === 'ALL'
                    ? 'border-[#72D6A0] ring-1 ring-[#72D6A0]/40'
                    : 'border-[#1C2923] hover:border-[#1C2923]/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#8D9A93]">
                    Fields Analyzed
                  </span>
                  {activeFilter === 'ALL' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]"></span>
                  )}
                </div>
                <div className="my-2.5">
                  <span className="font-headline text-3xl font-semibold text-[#F1F3EF]">{counts.total}</span>
                </div>
                <span className="text-xs text-[#506057]">Full schema evaluated</span>
              </button>

              {/* Will Be Shared */}
              <button
                type="button"
                onClick={() => setActiveFilter('shared')}
                className={`p-5 rounded-2xl bg-[#0D1512] border text-left transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between cursor-pointer ${
                  activeFilter === 'shared'
                    ? 'border-[#72D6A0] ring-1 ring-[#72D6A0]/40 bg-[#163D2D]/20'
                    : 'border-[#1C2923] hover:border-[#72D6A0]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#8D9A93]">
                    Will Be Shared
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#72D6A0] shadow-[0_0_8px_#72D6A0]"></span>
                </div>
                <div className="my-2.5">
                  <span className="font-headline text-3xl font-semibold text-[#72D6A0]">{counts.shared}</span>
                </div>
                <span className="text-xs text-[#8D9A93]">Raw necessary fields</span>
              </button>

              {/* Will Be Transformed */}
              <button
                type="button"
                onClick={() => setActiveFilter('transformed')}
                className={`p-5 rounded-2xl bg-[#0D1512] border text-left transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between cursor-pointer ${
                  activeFilter === 'transformed'
                    ? 'border-[#4FAF83] ring-1 ring-[#4FAF83]/40 bg-[#163D2D]/20'
                    : 'border-[#1C2923] hover:border-[#4FAF83]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#8D9A93]">
                    Will Be Transformed
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#4FAF83]"></span>
                </div>
                <div className="my-2.5">
                  <span className="font-headline text-3xl font-semibold text-[#4FAF83]">
                    {counts.transformed}
                  </span>
                </div>
                <span className="text-xs text-[#8D9A93]">Generalized / Tokenized</span>
              </button>

              {/* Will Be Removed */}
              <button
                type="button"
                onClick={() => setActiveFilter('removed')}
                className={`p-5 rounded-2xl bg-[#0D1512] border text-left transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between cursor-pointer ${
                  activeFilter === 'removed'
                    ? 'border-[#8D9A93] ring-1 ring-[#8D9A93]/40 bg-[#182420]/30'
                    : 'border-[#1C2923] hover:border-[#8D9A93]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#8D9A93]">
                    Will Be Removed
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#506057]"></span>
                </div>
                <div className="my-2.5">
                  <span className="font-headline text-3xl font-semibold text-[#8D9A93]">{counts.removed}</span>
                </div>
                <span className="text-xs text-[#8D9A93]">Non-essential fields</span>
              </button>

              {/* Blocked By Policy */}
              <button
                type="button"
                onClick={() => setActiveFilter('blocked')}
                className={`col-span-2 sm:col-span-1 p-5 rounded-2xl bg-[#0D1512] border text-left transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex flex-col justify-between cursor-pointer ${
                  activeFilter === 'blocked'
                    ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/40 bg-[#42220d]/20'
                    : 'border-[#1C2923] hover:border-[#F59E0B]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#8D9A93]">
                    Blocked By Policy
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                </div>
                <div className="my-2.5">
                  <span className="font-headline text-3xl font-semibold text-[#F59E0B]">{counts.blocked}</span>
                </div>
                <span className="text-xs text-[#F59E0B]/90">Zero-export mandate</span>
              </button>
            </div>

            {/* Principle Callout */}
            <div className="px-5 py-3 rounded-xl bg-[#0D1512]/70 border border-[#16221D] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#72D6A0] text-[18px]">shield_lock</span>
              <p className="text-xs font-mono text-[#8D9A93]">
                <span className="text-[#F1F3EF] font-medium">ZeroLeak Core Principle:</span> “Only the information necessary for the stated purpose should leave your organization.”
              </p>
            </div>
          </div>

          {/* 4. CLEAN FIELD RECOMMENDATIONS TABLE */}
          <div className="rounded-2xl border border-[#1C2923] bg-[#0D1512] shadow-[0_12px_36px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col">
            
            {/* Table Search & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-[#1C2923] bg-[#050806]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#8D9A93]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter fields, classifications..."
                  className="w-full bg-[#0D1512] border border-[#1C2923] rounded-xl pl-9 pr-4 py-1.5 text-xs text-[#F1F3EF] placeholder-[#8D9A93]/50 focus:outline-none focus:border-[#72D6A0]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-mono text-[#8D9A93]">
                  Showing {filteredFields.length} of {fields.length} sample fields
                </span>
                {activeFilter !== 'ALL' && (
                  <button
                    onClick={() => setActiveFilter('ALL')}
                    className="text-xs font-mono text-[#72D6A0] hover:underline pl-2 border-l border-[#1C2923] cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead>
                  <tr className="border-b border-[#1C2923] bg-[#050806]/80 text-[#8D9A93] font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-4 px-6 font-semibold">FIELD</th>
                    <th className="py-4 px-6 font-semibold">CLASSIFICATION</th>
                    <th className="py-4 px-6 font-semibold">ACTION</th>
                    <th className="py-4 px-6 font-semibold">REASON</th>
                    <th className="py-4 px-6 font-semibold text-right">USER CONTROL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#16221D] text-sm">
                  {filteredFields.map((field) => {
                    let actionBadge = null;
                    if (field.action === 'ALLOW') {
                      actionBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-[#72D6A0]/10 text-[#72D6A0] border border-[#72D6A0]/20">
                          ALLOW
                        </span>
                      );
                    } else if (field.action === 'GENERALIZE') {
                      actionBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-[#4FAF83]/15 text-[#4FAF83] border border-[#4FAF83]/30">
                          GENERALIZE
                        </span>
                      );
                    } else if (field.action === 'TOKENIZE') {
                      actionBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-[#4FAF83]/15 text-[#4FAF83] border border-[#4FAF83]/30">
                          TOKENIZE
                        </span>
                      );
                    } else if (field.action === 'REMOVE') {
                      actionBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-[#111B17] text-[#8D9A93] border border-[#16221D]">
                          REMOVE
                        </span>
                      );
                    } else if (field.action === 'BLOCK') {
                      actionBadge = (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-medium bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                          BLOCK
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={field.id}
                        className="hover:bg-[#111B17]/60 transition-colors"
                      >
                        <td className="py-4 px-6 font-medium text-[#F1F3EF]">
                          {field.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-[#111B17] border border-[#16221D] text-[#8D9A93]">
                            {field.classification}
                          </span>
                        </td>
                        <td className="py-4 px-6">{actionBadge}</td>
                        <td className="py-4 px-6 text-[#8D9A93] text-xs max-w-xs">
                          {field.reason}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {field.controlType === 'static' && (
                            <span
                              className={`inline-block font-mono text-xs px-3 py-1.5 rounded-xl border ${
                                field.action === 'ALLOW'
                                  ? 'bg-[#111B17] border-[#1C2923] text-[#72D6A0] font-medium'
                                  : 'bg-[#050806] border-[#16221D] text-[#8D9A93]'
                              }`}
                            >
                              {field.control}
                            </span>
                          )}

                          {field.controlType === 'select' && (
                            <select
                              value={field.control}
                              onChange={(e) => handleControlChange(field.id, e.target.value)}
                              className="inline-flex items-center gap-1 font-mono text-xs px-3 py-1.5 rounded-xl bg-[#111B17] border border-[#1C2923] text-[#4FAF83] hover:border-[#4FAF83] focus:outline-none focus:border-[#72D6A0] transition-colors cursor-pointer"
                            >
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#0D1512] text-[#F1F3EF]">
                                  {opt}
                                </option>
                              ))}
                            </select>
                          )}

                          {field.controlType === 'blocked' && (
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-xl bg-[#050806] border border-[#16221D] text-[#F59E0B]/90">
                              <span className="material-symbols-outlined text-[13px]">lock</span>
                              <span>Blocked by policy</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. APPROVAL CALLOUT AREA */}
          <div className="rounded-2xl border border-[#1C2923] bg-[#0D1512] p-7 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_12px_36px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <h3 className="font-headline text-lg sm:text-xl font-semibold text-[#F1F3EF]">
                Ready to prepare?
              </h3>
              <p className="text-sm text-[#8D9A93] leading-relaxed">
                The recipient will receive only the information shown in this exposure plan. No data is shared until validation passes.
              </p>
              {approveError && (
                <div className="mt-2 text-xs font-mono text-[#ff6b6b] bg-[#421b24]/80 p-2.5 rounded-lg border border-[#ff6b6b]/40">
                  Approval error: {approveError}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#1C2923] bg-[#111B17] hover:border-[#8D9A93] text-[#F1F3EF] font-mono text-xs tracking-wider uppercase transition-colors cursor-pointer"
              >
                Edit plan
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#F1F3EF] hover:bg-[#72D6A0] text-[#070B09] font-sans text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(241,243,239,0.15)] hover:shadow-[0_0_24px_rgba(114,214,160,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isApproving ? 'Approving Plan...' : 'Approve & Prepare'}</span>
                <span className="material-symbols-outlined text-[18px]">
                  {isApproving ? 'sync' : 'arrow_forward'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>

      {/* EDIT PLAN MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0D1512] border border-[#1C2923] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#1C2923] pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#72D6A0]">tune</span>
                <h3 className="font-headline font-semibold text-lg text-[#F1F3EF]">
                  Edit Exposure Parameters
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#8D9A93] hover:text-[#F1F3EF] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-[#8D9A93]">Dataset Source</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2.5 text-[#F1F3EF] focus:outline-none focus:border-[#72D6A0]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#8D9A93]">Stated Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2.5 text-[#F1F3EF] focus:outline-none focus:border-[#72D6A0]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[#8D9A93]">Target Recipient</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-[#070B09] border border-[#1C2923] rounded-xl px-3.5 py-2.5 text-[#F1F3EF] focus:outline-none focus:border-[#72D6A0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#111B17] border border-[#1C2923] text-xs font-mono text-[#8D9A93] hover:text-[#F1F3EF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#72D6A0] text-[#070B09] text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#4FAF83] cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL FOOTER */}
      <footer className="w-full border-t border-[#16221D] py-6 bg-[#070B09]">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#506057]">
          <span>ZeroLeak Finance · Exposure Plan Specification</span>
          <span>Policy Enforcement Verified</span>
        </div>
      </footer>
    </div>
  );
}
