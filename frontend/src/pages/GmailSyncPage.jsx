import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DraftReviewCard from '../components/gmail/DraftReviewCard';
import SimulateEmailModal from '../components/gmail/SimulateEmailModal';
import ConnectGmailModal from '../components/gmail/ConnectGmailModal';
import {
  Mail,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings,
  ExternalLink,
} from 'lucide-react';

const GmailSyncPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending_review'); // 'pending_review' | 'all'
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [draftsRes, usersRes, statusRes] = await Promise.all([
        api.get(`/gmail/drafts?status=${activeTab}`),
        api.get('/auth/users'),
        api.get('/gmail/status'),
      ]);
      setDrafts(draftsRes.data.data || []);
      setUsers(usersRes.data.data || []);
      setStatusInfo(statusRes.data.data || {});
    } catch (err) {
      console.error('Failed to load Gmail data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSyncInbox = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await api.post('/gmail/sync');
      setFeedback({ type: 'success', message: res.data.message });
      fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.message || 'Failed to sync Gmail inbox. Please check server connection.',
      });
    } finally {
      setSyncing(false);
      setTimeout(() => setFeedback(null), 8000);
    }
  };

  const handleDraftApproved = () => {
    fetchData();
    setFeedback({
      type: 'success',
      message: 'Draft approved! Task has been assigned and confirmation notification dispatched.',
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  const handleDraftRejected = () => {
    fetchData();
    setFeedback({ type: 'info', message: 'Email draft was discarded.' });
    setTimeout(() => setFeedback(null), 4000);
  };

  const pendingCount = drafts.filter((d) => d.status === 'pending_review').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Gmail Ingestion Pipeline
            </h1>
            <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Flow 5.2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Convert formatted incoming task emails into validated tickets with human-in-the-loop review.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-subtle"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulate Inbound Email</span>
          </button>

          <button
            onClick={handleSyncInbox}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-subtle disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Central Gmail'}</span>
          </button>
        </div>
      </div>

      {/* Gmail Account Status Card */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
            <Mail className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">Monitored Mailbox:</span>
              <span className="font-mono text-xs font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {statusInfo?.centralEmail || 'tasks@smarttaskmanager.com'}
              </span>
            </div>
            <p className="text-slate-500 mt-1 text-xs">
              {statusInfo?.isOAuthConnected ? (
                <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Connected to Google Cloud Gmail API (OAuth 2.0 Active)
                </span>
              ) : (
                <span className="text-slate-500">
                  Operating in <strong>Interactive Simulator Mode</strong>. Direct Google Cloud credentials can be configured anytime.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-subtle"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>{statusInfo?.isOAuthConnected ? 'Manage Integration' : 'Connect Real Gmail'}</span>
          </button>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
              statusInfo?.isOAuthConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {statusInfo?.isOAuthConnected ? 'Live Gmail Active' : 'Simulator Mode'}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          <div className="flex items-start gap-2.5 flex-1">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="leading-relaxed">
              <span className="font-semibold block mb-0.5">
                {feedback.type === 'error' ? 'Sync Notice' : 'Success'}
              </span>
              <span>{feedback.message}</span>
            </div>
          </div>

          {feedback.message?.includes('console.developers.google.com') && (
            <a
              href="https://console.cloud.google.com/apis/library/gmail.googleapis.com?project=smarttaskmanager-512018"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-lg shadow-subtle shrink-0 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Enable Gmail API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Segmented Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('pending_review')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'pending_review'
              ? 'bg-slate-900 text-white shadow-subtle'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Review</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold tabular-nums ${
              activeTab === 'pending_review' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-subtle'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Processed Drafts
        </button>
      </div>

      {/* Drafts Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200/80 text-xs text-slate-500 shadow-subtle">
          <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-slate-800">No Drafts In This Category</h4>
          <p className="mt-1 text-slate-400">
            Click <strong>"Sync Central Gmail"</strong> or <strong>"Simulate Inbound Email"</strong> above to populate incoming task drafts.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {drafts.map((draft) => (
            <DraftReviewCard
              key={draft._id}
              draft={draft}
              users={users}
              onApproved={handleDraftApproved}
              onRejected={handleDraftRejected}
            />
          ))}
        </div>
      )}

      {/* Simulate Inbound Email Modal */}
      <SimulateEmailModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onEmailReceived={() => {
          fetchData();
          setFeedback({
            type: 'success',
            message: 'Inbound email received and parsed by NLP parser into a draft task ticket.',
          });
          setTimeout(() => setFeedback(null), 5000);
        }}
      />

      {/* Connect Gmail Modal */}
      <ConnectGmailModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={() => {
          fetchData();
          setFeedback({
            type: 'success',
            message: 'Live Gmail connected successfully! Mailbox synchronization is active.',
          });
          setTimeout(() => setFeedback(null), 6000);
        }}
        statusInfo={statusInfo}
      />
    </div>
  );
};

export default GmailSyncPage;
