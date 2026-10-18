import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DraftReviewCard from '../components/gmail/DraftReviewCard';
import SimulateEmailModal from '../components/gmail/SimulateEmailModal';
import {
  Mail,
  RefreshCw,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings,
} from 'lucide-react';

const GmailSyncPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusInfo, setStatusInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending_review'); // 'pending_review' | 'all'
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
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
      setFeedback({ type: 'error', message: 'Failed to sync Gmail inbox.' });
    } finally {
      setSyncing(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDraftApproved = () => {
    fetchData();
    setFeedback({
      type: 'success',
      message: 'Draft approved! Official task created and email notification sent to assignee.',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Central Gmail Inbox & AI Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
              Flow 5.2
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Convert formatted emails into tasks automatically with human-in-the-loop approval.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSimulateOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-purple-200"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulate Incoming Email</span>
          </button>

          <button
            onClick={handleSyncInbox}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-500/20 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Fetching from Gmail...' : 'Sync Central Gmail'}</span>
          </button>
        </div>
      </div>

      {/* Gmail Status Card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <Mail className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">Central Gmail Account:</span>
              <span className="font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded">
                {statusInfo?.centralEmail || 'tasks@smarttaskmanager.com'}
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              {statusInfo?.isOAuthConnected ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected to live Google Cloud Gmail API
                </span>
              ) : (
                <span>
                  Running in <strong>Interactive Simulator Mode</strong>. (To connect real Gmail, set{' '}
                  <code className="text-slate-700">GMAIL_CLIENT_ID</code> &{' '}
                  <code className="text-slate-700">GMAIL_REFRESH_TOKEN</code> in <code className="text-slate-700">.env</code>).
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            Mode: {statusInfo?.mode || 'Interactive Simulator'}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending_review')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'pending_review'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pending Review</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'pending_review' ? 'bg-white text-blue-700' : 'bg-slate-200'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Processed Drafts
        </button>
      </div>

      {/* Drafts Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No Drafts In This Category</h4>
          <p className="mt-1">
            Click <strong>"Sync Central Gmail"</strong> or <strong>"Simulate Incoming Email"</strong>{' '}
            above to test AI extraction!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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

      {/* Simulate Modal */}
      <SimulateEmailModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onEmailReceived={() => {
          fetchData();
          setFeedback({
            type: 'success',
            message: 'Inbound email received and parsed by AI into a draft task!',
          });
          setTimeout(() => setFeedback(null), 5000);
        }}
      />
    </div>
  );
};

export default GmailSyncPage;
