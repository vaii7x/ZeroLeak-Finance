import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Simple interactive demo presets
const PRESETS = [
  {
    id: 'fraud',
    title: 'Fraud Investigation',
    icon: 'shield',
    recipient: 'Fraud Detection AI',
    description: 'Precise dollar amounts are preserved for anomaly detection; customer names are tokenized and card numbers are masked.',
    fields: [
      { name: 'customer_name', raw: 'Eleanor Vance', action: 'TOKENIZE', safe: 'usr_9a4f21', color: 'bg-purple-900/40 text-purple-300 border-purple-700/60', note: 'Allows tracking transactions per user without knowing their identity' },
      { name: 'card_number', raw: '4532-8921-3310-9012', action: 'REDACT', safe: '••••-••••-••••-9012', color: 'bg-blue-900/40 text-blue-300 border-blue-700/60', note: 'PCI-DSS compliant masking; preserves last 4 digits' },
      { name: 'ssn', raw: '987-65-4321', action: 'REMOVE', safe: '[EXCLUDED]', color: 'bg-red-900/40 text-red-300 border-red-700/60', note: 'High-risk identifier not needed for fraud scoring' },
      { name: 'amount', raw: '$14,850.00', action: 'ALLOW', safe: '$14,850.00', color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60', note: 'Precise amount required for statistical anomaly models' },
    ],
  },
  {
    id: 'marketing',
    title: 'Customer Analytics',
    icon: 'group',
    recipient: 'Marketing Agency',
    description: 'All personal identifiers are excluded; transaction amounts and locations are binned into general ranges.',
    fields: [
      { name: 'customer_name', raw: 'Eleanor Vance', action: 'REMOVE', safe: '[EXCLUDED]', color: 'bg-red-900/40 text-red-300 border-red-700/60', note: 'Individual identity is irrelevant for cohort analysis' },
      { name: 'card_number', raw: '4532-8921-3310-9012', action: 'REMOVE', safe: '[EXCLUDED]', color: 'bg-red-900/40 text-red-300 border-red-700/60', note: 'Payment information prohibited for marketing partners' },
      { name: 'amount', raw: '$14,850.00', action: 'GENERALIZE', safe: '$10,000 – $15,000', color: 'bg-amber-900/40 text-amber-300 border-amber-700/60', note: 'Grouped into income tiers to preserve trends without exact balances' },
      { name: 'zip_code', raw: '94107', action: 'GENERALIZE', safe: '941xx', color: 'bg-amber-900/40 text-amber-300 border-amber-700/60', note: '3-digit prefix gives regional trends while protecting individual home address' },
    ],
  },
  {
    id: 'audit',
    title: 'Tax Audit',
    icon: 'fact_check',
    recipient: 'External CPA Firm',
    description: 'Exact ledger figures and dates are retained for balance verification; customer records are pseudonymized.',
    fields: [
      { name: 'customer_name', raw: 'Eleanor Vance', action: 'TOKENIZE', safe: 'usr_9a4f21', color: 'bg-purple-900/40 text-purple-300 border-purple-700/60', note: 'Allows matching across invoices without revealing personal name' },
      { name: 'tax_id', raw: '987-65-4321', action: 'TOKENIZE', safe: 'tax_hash_e8c1', color: 'bg-purple-900/40 text-purple-300 border-purple-700/60', note: 'Verifiable cryptographic hash for tax reconciliation' },
      { name: 'amount', raw: '$14,850.00', action: 'ALLOW', safe: '$14,850.00', color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60', note: 'Exact ledger accounting balance down to the cent' },
      { name: 'date', raw: '2026-03-15', action: 'ALLOW', safe: '2026-03-15', color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60', note: 'Required for fiscal period posting verification' },
    ],
  },
];

const FAQS = [
  {
    q: 'Does the AI ever see my raw customer records?',
    a: 'No. The advisory AI only inspects column names, data types, and your declared purpose. The actual data rows are parsed and transformed locally in temporary memory.',
  },
  {
    q: 'What are the different transformation actions?',
    a: 'ZeroLeak supports 5 actions: ALLOW (keep safe data intact), TOKENIZE (replace IDs with consistent codes to preserve joins), GENERALIZE (group into ranges like age brackets or $10k-$15k tiers), REDACT (mask parts like card last 4 digits), and REMOVE (completely drop high-risk fields).',
  },
  {
    q: 'Can I change the recommended policies?',
    a: 'Yes. The Exposure Plan is fully interactive. You can inspect every field and override any recommendation before approving it.',
  },
  {
    q: 'How does Bring Your Own Key (BYOK) work?',
    a: 'You can connect your own API key for Google Gemini, Groq, OpenRouter, Anthropic, or OpenAI. Your keys remain encrypted and private to your account.',
  },
];

export default function About() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activePreset, setActivePreset] = useState('fraud');
  const [openFaq, setOpenFaq] = useState(null);

  const currentPreset = PRESETS.find((p) => p.id === activePreset) || PRESETS[0];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="bg-[#070B09] text-[#F1F3EF] font-body min-h-screen flex flex-col selection:bg-[#72D6A0] selection:text-[#070B09] antialiased">
      {/* 1. STICKY HEADER */}
      <header className="w-full border-b border-[#1C2923]/70 bg-[#070B09]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] group-hover:scale-125 transition-transform" />
            <span className="font-headline font-semibold text-base tracking-tight text-[#F1F3EF]">
              ZeroLeak Finance
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]" />
                  <span className="text-[#F1F3EF] truncate max-w-[140px]">{user?.email || 'Operator'}</span>
                </div>
                <Link
                  to="/upload"
                  className="px-4 py-1.5 rounded-full bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-semibold uppercase tracking-wider transition"
                >
                  Workspace
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-full bg-[#0D1512] border border-[#1C2923] text-[#8D9A93] hover:text-[#ff6b6b] transition cursor-pointer"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-[16px] block">logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full bg-[#0D1512] border border-[#1C2923] hover:border-[#72D6A0]/40 text-[#F1F3EF] hover:text-[#72D6A0] font-mono text-xs transition"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 rounded-full bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-semibold uppercase tracking-wider transition shadow-[0_0_14px_rgba(114,214,160,0.3)]"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="w-full pt-12 pb-14 px-4 sm:px-6 max-w-4xl mx-auto text-center flex flex-col items-center gap-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1512] border border-[#1C2923]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]" />
          <span className="font-mono text-[11px] tracking-widest text-[#72D6A0] uppercase font-semibold">
            How It Works
          </span>
        </div>

        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F1F3EF] leading-tight">
          Share what they need. <span className="text-[#72D6A0]">Nothing more.</span>
        </h1>

        <p className="font-body text-base text-[#8D9A93] max-w-xl font-light leading-relaxed">
          Sharing financial data with AI or external partners usually risks leaking private customer details. ZeroLeak automatically inspects your dataset schema, recommends least-privilege privacy treatments, and lets you approve an Exposure Plan before transforming data in memory.
        </p>

        {/* Operating Principle Card */}
        <div className="mt-2 px-5 py-3 rounded-2xl bg-[#0D1512] border border-[#72D6A0]/30 shadow-[0_0_20px_rgba(114,214,160,0.06)] flex items-center gap-3 text-left">
          <span className="material-symbols-outlined text-[20px] text-[#72D6A0]">gavel</span>
          <div>
            <span className="text-[11px] font-mono text-[#72D6A0] uppercase tracking-wider block font-medium">Core Principle</span>
            <span className="text-sm font-headline font-semibold text-[#F1F3EF]">AI recommends. User approves. Policies enforce.</span>
          </div>
        </div>
      </section>

      {/* 3. 4-STEP WORKFLOW (SIMPLE & VISUAL) */}
      <section className="w-full py-12 px-4 sm:px-6 max-w-4xl mx-auto border-t border-[#1C2923]/60">
        <h2 className="font-headline text-xl sm:text-2xl font-semibold text-[#F1F3EF] text-center mb-8">
          The 4-Step Pipeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#1C2923] flex flex-col gap-2">
            <span className="font-mono text-xs text-[#72D6A0] font-bold">01 / UPLOAD</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">Declare Context</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              Upload your CSV and select who receives the data and for what specific purpose.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#1C2923] flex flex-col gap-2">
            <span className="font-mono text-xs text-[#72D6A0] font-bold">02 / ANALYZE</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">AI Advice</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              AI evaluates column names and data types. Zero raw rows are ever sent to the model.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#72D6A0]/40 flex flex-col gap-2 shadow-[0_0_15px_rgba(114,214,160,0.05)]">
            <span className="font-mono text-xs text-[#72D6A0] font-bold">03 / APPROVE</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">Exposure Plan</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              Review and customize the proposed actions (Allow, Tokenize, Generalize, Redact, Remove).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#1C2923] flex flex-col gap-2">
            <span className="font-mono text-xs text-[#72D6A0] font-bold">04 / SAFE EXPORT</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">Clean Output</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              Transformations run deterministically in memory. Download the sanitized dataset or pipe it to your AI.
            </p>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE DEMO TABLE */}
      <section className="w-full py-12 px-4 sm:px-6 bg-[#0B100E] border-y border-[#1C2923]/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-[#F1F3EF]">
              Interactive Transformation Preview
            </h2>
            <p className="text-xs text-[#8D9A93] mt-1 font-light">
              See how the same financial record changes based on the recipient and purpose:
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {PRESETS.map((p) => {
              const isActive = p.id === activePreset;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePreset(p.id)}
                  className={`px-3.5 py-1.5 rounded-lg font-mono text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#163D2D] border border-[#72D6A0] text-[#72D6A0] font-semibold'
                      : 'bg-[#0D1512] border border-[#1C2923] text-[#8D9A93] hover:text-[#F1F3EF]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{p.icon}</span>
                  <span>{p.title}</span>
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="rounded-xl bg-[#0D1512] border border-[#1C2923] overflow-hidden">
            <div className="px-4 py-3 bg-[#070B09]/80 border-b border-[#1C2923] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8D9A93]">Recipient: <strong className="text-[#F1F3EF]">{currentPreset.recipient}</strong></span>
              <span className="text-[#72D6A0] hidden sm:inline">{currentPreset.description}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1C2923] bg-[#070B09]/40 text-[#8D9A93]">
                    <th className="py-2.5 px-4 font-medium uppercase">Field</th>
                    <th className="py-2.5 px-4 font-medium uppercase">Original Value</th>
                    <th className="py-2.5 px-4 font-medium uppercase">Action</th>
                    <th className="py-2.5 px-4 font-medium uppercase">Safe Output</th>
                    <th className="py-2.5 px-4 font-medium uppercase hidden md:table-cell">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2923]/40">
                  {currentPreset.fields.map((f, i) => (
                    <tr key={i} className="hover:bg-[#121E19]/30">
                      <td className="py-2.5 px-4 text-[#F1F3EF] font-semibold">{f.name}</td>
                      <td className="py-2.5 px-4 text-[#8D9A93] line-through">{f.raw}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${f.color}`}>
                          {f.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#72D6A0]">{f.safe}</td>
                      <td className="py-2.5 px-4 text-[11px] text-[#8D9A93] font-body hidden md:table-cell">{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3 KEY GUARANTEES */}
      <section className="w-full py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <h2 className="font-headline text-xl sm:text-2xl font-semibold text-[#F1F3EF] text-center mb-6">
          Key Protections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#1C2923] flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#72D6A0] text-[24px]">lock</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">Zero Raw Rows to AI</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              Advisory AI never receives your records or values. Only column names and schema patterns are analyzed.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#1C2923] flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#72D6A0] text-[24px]">verified_user</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">You Have Full Control</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              No automatic leaks. You inspect the Exposure Plan and approve every action before anything is exported.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#0D1512] border border-[#1C2923] flex flex-col gap-2">
            <span className="material-symbols-outlined text-[#72D6A0] text-[24px]">memory</span>
            <h3 className="font-headline text-sm font-semibold text-[#F1F3EF]">Ephemeral Execution</h3>
            <p className="text-xs text-[#8D9A93] leading-relaxed">
              Data is transformed in volatile memory during your session. Raw customer records are never stored on disk.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SHORT FAQ */}
      <section className="w-full py-12 px-4 sm:px-6 bg-[#0B100E] border-t border-[#1C2923]/60">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-headline text-xl font-semibold text-[#F1F3EF] text-center mb-6">
            Quick Questions
          </h2>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-xl bg-[#0D1512] border border-[#1C2923] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-[#121E19]/30 transition"
                  >
                    <span className="font-headline text-xs sm:text-sm font-semibold text-[#F1F3EF]">{faq.q}</span>
                    <span className="material-symbols-outlined text-[#72D6A0] text-[18px]">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#8D9A93] leading-relaxed font-body border-t border-[#1C2923]/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. SIMPLE CALL TO ACTION */}
      <section className="w-full py-12 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
          <h2 className="font-headline text-2xl font-bold text-[#F1F3EF]">
            Ready to test your dataset?
          </h2>
          <p className="text-xs text-[#8D9A93] max-w-md font-light">
            Upload a CSV and generate your first exposure plan in seconds.
          </p>
          <Link
            to={isAuthenticated ? "/upload" : "/signup"}
            className="px-6 py-2.5 rounded-full bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(114,214,160,0.3)]"
          >
            {isAuthenticated ? "Open Workspace" : "Get Started"}
          </Link>
        </div>
      </section>
    </div>
  );
}
