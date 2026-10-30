import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Key,
  Globe,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';

const ConnectGmailModal = ({ isOpen, onClose, onConnected, statusInfo }) => {
  const [activeTab, setActiveTab] = useState('oauth'); // 'oauth' | 'manual'
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [copied, setCopied] = useState(false);

  // Manual inputs
  const [refreshToken, setRefreshToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [centralEmail, setCentralEmail] = useState(
    statusInfo?.centralEmail || ''
  );

  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const handleLaunchGoogleOAuth = async () => {
    setLoadingAuth(true);
    setMessage(null);
    try {
      const res = await api.get('/gmail/auth-url');
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        setMessage({ type: 'error', text: 'Could not generate Google authorization link.' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to start Google OAuth process.',
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleSaveManualConfig = async (e) => {
    e.preventDefault();
    if (!refreshToken.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid Refresh Token.' });
      return;
    }

    setSavingConfig(true);
    setMessage(null);
    try {
      const res = await api.post('/gmail/config', {
        refreshToken: refreshToken.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        centralEmail: centralEmail.trim(),
      });
      setMessage({ type: 'success', text: 'Connected to Live Gmail successfully!' });
      if (onConnected) onConnected();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save configuration.',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyRedirectUri = () => {
    navigator.clipboard.writeText('http://localhost:5000/api/gmail/oauth2callback');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-modal max-w-xl w-full p-6 relative border border-slate-200/90 animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
              <Globe className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                Connect Real Gmail Mailbox
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorize Google Cloud OAuth 2.0 to sync tasks from live emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status message */}
        {message && (
          <div
            className={`mt-3.5 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {message.type === 'error' ? (
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 mt-3.5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Google Sign-In Flow</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>Direct Token Configuration</span>
          </button>
        </div>

        {activeTab === 'oauth' ? (
          /* TAB 1: 1-Click OAuth with Error 403 Troubleshooting */
          <div className="mt-3.5 space-y-3.5 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-xs">Authorize Google Account</p>
                <p className="text-slate-500 mt-0.5 text-[11px]">
                  Opens Google's secure authorization consent window.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLaunchGoogleOAuth}
                disabled={loadingAuth}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-subtle flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60"
              >
                <span>{loadingAuth ? 'Opening...' : 'Launch Google Sign-In'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Error 403 Resolution Guide */}
            <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>Notice on "Error 403: access_denied"</span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                Google limits unverified apps in Testing mode to pre-approved tester emails.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white rounded-md border border-amber-200/80">
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Option A (Add Test User):
                  </span>
                  <p className="text-slate-600">
                    Add <strong>amit392191@gmail.com</strong> under Test Users in your Google Cloud OAuth Consent Screen.
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-md border border-amber-200/80">
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Option B (Publish App):
                  </span>
                  <p className="text-slate-600">
                    Click <strong>PUBLISH APP</strong> in OAuth Consent Screen to make it immediately accessible.
                  </p>
                </div>
              </div>
            </div>

            {/* Redirect URI verification */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-500">Authorized Redirect URI: </span>
                <code className="text-slate-800 font-mono font-medium">http://localhost:5000/api/gmail/oauth2callback</code>
              </div>
              <button
                type="button"
                onClick={handleCopyRedirectUri}
                className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1 font-medium transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: Direct Token Paste */
          <form onSubmit={handleSaveManualConfig} className="mt-3.5 space-y-3 text-xs">
            <p className="text-slate-500 text-[11px]">
              If you have already generated a Refresh Token via Google OAuth Playground or CLI, save it directly below:
            </p>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Gmail Refresh Token <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Paste 1//... token here"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Central Mailbox</label>
                <input
                  type="email"
                  value={centralEmail}
                  onChange={(e) => setCentralEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://developers.google.com/oauthplayground"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Google OAuth Playground</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="submit"
                disabled={savingConfig}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs shadow-subtle transition-colors disabled:opacity-60"
              >
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConnectGmailModal;
