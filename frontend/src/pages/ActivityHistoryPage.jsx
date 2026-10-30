import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  CheckCircle2,
  Mail,
  Sparkles,
  AlertTriangle,
  User,
  RefreshCw,
} from 'lucide-react';

const ActivityHistoryPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/activity', { params });
      setLogs(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'GMAIL_SYNCED':
      case 'EMAIL_DRAFT_APPROVED':
        return {
          icon: Mail,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'AI_SUBTASKS_ADDED':
      case 'AI_PRIORITY_APPLIED':
        return {
          icon: Sparkles,
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'OVERDUE_ALERT_SENT':
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'UPDATED_STATUS':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      default:
        return {
          icon: User,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Audit Trail & Event Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable system record of user operations, automated Gmail conversions, and AI telemetry.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">All Event Categories</option>
            <option value="CREATED_TASK">Task Created</option>
            <option value="UPDATED_STATUS">Status Updated</option>
            <option value="GMAIL_SYNCED">Gmail Synced</option>
            <option value="EMAIL_DRAFT_APPROVED">Email Task Approved</option>
            <option value="OVERDUE_ALERT_SENT">Overdue Alert Sent</option>
            <option value="AI_SUBTASKS_ADDED">AI Subtasks Generated</option>
            <option value="USER_LOGIN">User Authentications</option>
          </select>
        </div>
      </div>

      {/* Main Table / Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden text-xs">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No audit records matching selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              return (
                <div
                  key={log._id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-md border ${badge.bg} shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${badge.bg}`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-slate-900">
                          {log.user?.name || 'System Daemon'}
                        </span>
                        {log.user?.department && (
                          <span className="text-[10px] text-slate-400">
                            • {log.user.department}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 leading-snug">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-slate-400 text-[11px] self-end sm:self-center tabular-nums">
                    {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-50 transition-colors shadow-subtle"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium disabled:opacity-50 transition-colors shadow-subtle"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityHistoryPage;
