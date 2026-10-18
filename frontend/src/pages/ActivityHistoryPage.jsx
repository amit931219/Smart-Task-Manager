import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  History,
  CheckCircle,
  Mail,
  Sparkles,
  AlertTriangle,
  User,
  Filter,
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
          bg: 'bg-purple-100 text-purple-700',
          border: 'border-purple-200',
        };
      case 'AI_SUBTASKS_ADDED':
      case 'AI_PRIORITY_APPLIED':
        return {
          icon: Sparkles,
          bg: 'bg-blue-100 text-blue-700',
          border: 'border-blue-200',
        };
      case 'OVERDUE_ALERT_SENT':
        return {
          icon: AlertTriangle,
          bg: 'bg-red-100 text-red-700',
          border: 'border-red-200',
        };
      case 'UPDATED_STATUS':
        return {
          icon: CheckCircle,
          bg: 'bg-emerald-100 text-emerald-700',
          border: 'border-emerald-200',
        };
      default:
        return {
          icon: User,
          bg: 'bg-slate-100 text-slate-700',
          border: 'border-slate-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Activity & Audit History
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable log of all user updates, AI operations, and Gmail conversions.
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
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Event Types</option>
            <option value="CREATED_TASK">Task Created</option>
            <option value="UPDATED_STATUS">Status Updated</option>
            <option value="GMAIL_SYNCED">Gmail Synced</option>
            <option value="EMAIL_DRAFT_APPROVED">Email Task Approved</option>
            <option value="OVERDUE_ALERT_SENT">Overdue Alert Sent</option>
            <option value="AI_SUBTASKS_ADDED">AI Subtasks Generated</option>
            <option value="USER_LOGIN">User Logins</option>
          </select>
        </div>
      </div>

      {/* Main Table / Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No activity logs match your filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              return (
                <div
                  key={log._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${badge.bg} shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${badge.bg} ${badge.border}`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {log.user?.name || 'System Automation'}
                        </span>
                        {log.user?.department && (
                          <span className="text-[10px] text-slate-400">
                            ({log.user.department})
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 text-slate-400 text-[11px] self-end sm:self-center">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-100"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 disabled:opacity-50 hover:bg-slate-100"
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

