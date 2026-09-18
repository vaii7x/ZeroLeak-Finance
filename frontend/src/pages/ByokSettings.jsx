import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserByok, saveUserByok, deleteUserByok, testUserByok } from '../services/api';

const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Recommended default)' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash (Ultra fast latency)' },
    { value: 'gemini-1.5-pro', label: 'gemini-1.5-pro (Extended reasoning window)' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile (Recommended)' },
    { value: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768 (Low Latency)' },
  ],
  openrouter: [
    { value: 'google/gemini-2.0-flash-001', label: 'google/gemini-2.0-flash-001 (Recommended)' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'anthropic/claude-3.5-sonnet' },
    { value: 'meta-llama/llama-3.3-70b-instruct', label: 'meta-llama/llama-3.3-70b-instruct' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'claude-3-5-sonnet (Recommended)' },
    { value: 'claude-3-5-haiku-20241022', label: 'claude-3-5-haiku (Fast)' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'gpt-4o (Omni multimodal)' },
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini (Lightweight)' },
  ],
};

export default function ByokSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Status & Telemetry
  const [isConfigured, setIsConfigured] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Loading & Action states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification banners
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success'|'error'|'info', title: '', text: '' }

  // Load user's saved key on component mount
  useEffect(() => {
    let mounted = true;

    async function loadKey() {
      setIsLoading(true);
      try {
        const config = await fetchUserByok();
        if (!mounted) return;

        if (config && config.configured) {
          setIsConfigured(true);
          setProvider(config.provider || 'gemini');
          setModel(config.model || 'gemini-2.5-flash');
          setApiKey(config.api_key || '');
          setMaskedKey(config.masked_key || '');
          setLastUpdated(config.updated_at);
        } else {
          setIsConfigured(false);
        }
      } catch (err) {
        console.warn('Could not fetch BYOK settings:', err.message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadKey();
    return () => {
      mounted = false;
    };
  }, []);

  // Update model default when provider changes
  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    const models = PROVIDER_MODELS[newProvider] || [];
    if (models.length > 0) {
      setModel(models[0].value);
    }
  };

  // Test live API key handshake
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setStatusMessage({
        type: 'error',
        title: 'Missing Key',
        text: 'Please input an API key to test the connection.',
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const result = await testUserByok({ provider, model, api_key: apiKey.trim() });
      if (result.success) {
        setStatusMessage({
          type: 'success',
          title: 'Handshake Succeeded',
          text: `${result.message || 'Provider connection verified'} // Latency: ${result.latency_ms}ms`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          title: 'Handshake Failed',
          text: result.message || 'Verification rejected by provider.',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        title: 'Connection Error',
        text: err.message || 'Failed contacting provider test endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save key to user account in Supabase
  const handleSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatusMessage({
        type: 'error',
        title: 'Validation Error',
        text: 'API key cannot be empty.',
      });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const saved = await saveUserByok({ provider, model, api_key: apiKey.trim() });
      setIsConfigured(true);
      setMaskedKey(saved.masked_key || '');
      setLastUpdated(saved.updated_at);
      setStatusMessage({
        type: 'success',
        title: 'Key Encrypted & Stored',
        text: `${provider.toUpperCase()} credentials linked to your enclave account (${user?.email}).`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        title: 'Save Failed',
        text: err.message || 'Could not persist BYOK key.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Remove key from user account
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your saved BYOK key from the enclave?')) {
      return;
    }

    setIsDeleting(true);
    setStatusMessage(null);

    try {
      await deleteUserByok();
      setIsConfigured(false);
      setApiKey('');
      setMaskedKey('');
      setLastUpdated(null);
      setStatusMessage({
        type: 'info',
        title: 'Key Removed',
        text: 'Your stored API key has been securely purged from your account profile.',
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        title: 'Removal Error',
        text: err.message || 'Could not clear key.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#070B09] text-[#F1F3EF] font-body min-h-screen flex flex-col selection:bg-[#72D6A0] selection:text-[#070B09] antialiased">
      {/* 1. TOP HEADER (Focused Back-to-Main principle matching Stitch & DataUpload) */}
      <header className="w-full border-b border-[#1C2923]/60 bg-[#070B09]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-2.5 h-2.5 rounded-full bg-[#72D6A0] shadow-[0_0_10px_#72D6A0] group-hover:scale-125 transition-transform animate-pulse" />
              <span className="font-headline font-semibold text-sm tracking-tight text-[#F1F3EF]">
                ZeroLeak Finance
              </span>
            </Link>
            <span className="text-[#3E4942] font-mono text-xs">/</span>
            <span className="text-[#8D9A93] font-mono text-xs hidden sm:inline">Settings</span>
            <span className="text-[#3E4942] font-mono text-xs hidden sm:inline">/</span>
            <span className="text-[#72D6A0] font-mono text-xs">AI Provider (BYOK)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0D1512] border border-[#1C2923] text-xs font-mono text-[#8D9A93]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse" />
              <span className="text-[#F1F3EF] truncate max-w-[140px] sm:max-w-[200px]">
                {user?.email || 'Enclave Operator'}
              </span>
            </div>

            <Link
              to="/upload"
              className="px-3 py-1.5 rounded-lg bg-[#163D2D] hover:bg-[#72D6A0] text-[#72D6A0] hover:text-[#070B09] font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-200 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">upload_file</span>
              <span className="hidden sm:inline">Data Workspace</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="p-1.5 rounded-lg bg-[#0D1512] border border-[#1C2923] hover:border-[#ff6b6b]/40 text-[#8D9A93] hover:text-[#ff6b6b] transition cursor-pointer"
              title="Sign Out"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN BODY CONTAINER */}
      <main className="w-full flex-1 max-w-[880px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        
        {/* Title & Subheader */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D1512] border border-[#1C2923]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0] animate-pulse" />
            <span className="font-mono text-[11px] tracking-widest text-[#72D6A0] uppercase font-semibold">
              AI CONFIGURATION
            </span>
          </div>
          <h1 className="font-headline text-[#F1F3EF] text-3xl sm:text-4xl font-medium tracking-tight">
            AI Provider (BYOK)
          </h1>
          <p className="font-body text-[#8D9A93] text-sm sm:text-base max-w-lg">
            Connect your personal or institutional model key to power sovereign field necessity recommendations.
          </p>
        </div>

        {/* Status Toast / Alert Box */}
        {statusMessage && (
          <div
            role="alert"
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm font-mono transition-all duration-300 ${
              statusMessage.type === 'success'
                ? 'bg-[#163D2D]/70 border-[#72D6A0]/40 text-[#72D6A0]'
                : statusMessage.type === 'error'
                ? 'bg-[#421b24]/70 border-[#ff6b6b]/40 text-[#ffb4b4]'
                : 'bg-[#0D1512] border-[#1C2923] text-[#8D9A93]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
              {statusMessage.type === 'success'
                ? 'check_circle'
                : statusMessage.type === 'error'
                ? 'error'
                : 'info'}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold uppercase tracking-wider">{statusMessage.title}</span>
              <span className="font-body text-xs text-[#F1F3EF]/90">{statusMessage.text}</span>
            </div>
          </div>
        )}

        {/* Active Key Status Card */}
        <div className="bg-[#0D1512] border border-[#1C2923] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isConfigured
                  ? 'bg-[#163D2D]/60 border-[#72D6A0]/40 text-[#72D6A0]'
                  : 'bg-[#151D1A] border-[#1C2923] text-[#8D9A93]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isConfigured ? 'key' : 'key_off'}
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-headline text-base font-medium text-[#F1F3EF]">
                  {isConfigured ? `${provider.toUpperCase()} Key Active` : 'No Active Key Configured'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    isConfigured
                      ? 'bg-[#163D2D]/80 border-[#72D6A0]/30 text-[#72D6A0]'
                      : 'bg-[#070B09] border-[#1C2923] text-[#8D9A93]'
                  }`}
                >
                  {isConfigured ? 'Connected' : 'Mock Baseline'}
                </span>
              </div>
              <p className="font-mono text-xs text-[#8D9A93]">
                {isConfigured
                  ? `Active key: ${maskedKey || '••••••••'} · Model: ${model}`
                  : 'ZeroLeak defaults to deterministic mock fallback until you provide your key.'}
              </p>
            </div>
          </div>

          {isConfigured && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-transparent border border-[#ff6b6b]/30 text-[#ffb4b4] hover:bg-[#ff6b6b]/10 hover:border-[#ff6b6b] text-xs font-mono font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="w-3.5 h-3.5 border-2 border-[#ffb4b4] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                )}
                <span>Disconnect Key</span>
              </button>
            </div>
          )}
        </div>

        {/* Configuration Card Form (Matching Stitch Design) */}
        <div className="bg-[#0D1512] border border-[#1C2923] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            
            {/* 1. LLM Provider Selector */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-[#8D9A93] font-medium" htmlFor="provider-select">
                LLM Provider
              </label>
              <div className="relative">
                <select
                  id="provider-select"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full bg-[#070B09] text-[#F1F3EF] font-body text-sm px-4 py-3 rounded-xl border border-[#1C2923] appearance-none focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-colors pr-10 cursor-pointer"
                >
                  <option value="gemini">Google Gemini (Default // Fast Native Tool Calling)</option>
                  <option value="groq">Groq Cloud (Ultra Low Latency Llama 3.3)</option>
                  <option value="openrouter">OpenRouter (Multi-Model Gateway)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8D9A93] flex items-center">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* 2. Model Identifier */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-[#8D9A93] font-medium" htmlFor="model-select">
                Model Architecture
              </label>
              <div className="relative">
                <select
                  id="model-select"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#070B09] text-[#F1F3EF] font-body text-sm px-4 py-3 rounded-xl border border-[#1C2923] appearance-none focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-colors pr-10 cursor-pointer"
                >
                  {(PROVIDER_MODELS[provider] || []).map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8D9A93] flex items-center">
                  <span className="material-symbols-outlined text-[20px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* 3. API Key Input with Visibility Toggle */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs uppercase tracking-wider text-[#8D9A93] font-medium" htmlFor="provider-api-key">
                  Provider API Key
                </label>
                <span className="font-mono text-[10px] text-[#72D6A0] uppercase tracking-wider px-2 py-0.5 rounded bg-[#163D2D]/40 border border-[#72D6A0]/20">
                  ENCRYPTED
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="provider-api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === 'gemini'
                      ? 'AIzaSy••••••••••••••••••••'
                      : provider === 'groq'
                      ? 'gsk_••••••••••••••••••••'
                      : 'sk-or-••••••••••••••••••••'
                  }
                  required
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full bg-[#070B09] text-[#F1F3EF] font-mono text-sm px-4 py-3 rounded-xl border border-[#1C2923] focus:outline-none focus:border-[#72D6A0] focus:ring-1 focus:ring-[#72D6A0] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 text-[#8D9A93] hover:text-[#F1F3EF] transition-colors p-1 cursor-pointer"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showKey ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="font-mono text-[11px] text-[#8D9A93]/80">
                Key is stored encrypted and bound to account: <span className="text-[#F1F3EF]">{user?.email}</span>.
              </p>
            </div>

            {/* 4. Controls & Execution Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-[#1C2923]/60">
              <div className="flex items-center gap-2 text-xs font-mono text-[#8D9A93]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#72D6A0]" />
                <span>Encrypted at Rest &amp; In Transit</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKey.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#070B09] hover:bg-[#163D2D]/60 border border-[#1C2923] hover:border-[#72D6A0]/40 text-[#F1F3EF] hover:text-[#72D6A0] font-mono text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#72D6A0] border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Handshake...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">sensors</span>
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !apiKey.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#72D6A0] hover:bg-[#4FAF83] text-[#070B09] font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(114,214,160,0.3)] hover:shadow-[0_0_28px_rgba(114,214,160,0.5)] flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#070B09] border-t-transparent rounded-full animate-spin" />
                      <span>Encrypting Key...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      <span>Save Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Disclosure Footer Card */}
        <div className="p-5 rounded-2xl bg-[#0D1512]/50 border border-[#1C2923]/80 flex items-start gap-3.5 text-xs font-mono text-[#8D9A93]">
          <span className="material-symbols-outlined text-[#72D6A0] text-[20px] shrink-0 mt-0.5">
            verified_user
          </span>
          <div className="space-y-1">
            <p className="text-[#F1F3EF] font-medium">Privacy Architecture Guarantee</p>
            <p className="leading-relaxed text-[#8D9A93]/90">
              Only field metadata and stated recipient context are transmitted during analysis. Raw financial figures, customer names, card numbers, and CSV records are stripped at the privacy boundary and are never sent to your AI provider.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
