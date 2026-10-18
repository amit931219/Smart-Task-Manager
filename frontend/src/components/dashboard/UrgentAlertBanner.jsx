import React, { useState } from 'react';
import { AlertCircle, Clock, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const UrgentAlertBanner = ({ urgentTasks = [], onRefresh }) => {
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleRunOverdueCheck = async () => {
    setChecking(true);
    setFeedback(null);
    try {
      const res = await api.post('/tasks/check-overdue');
      setFeedback(res.data.message || 'Overdue check completed.');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback('Failed to execute overdue scan.');
    } finally {
      setChecking(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (!urgentTasks || urgentTasks.length === 0) return null;

  return (
    <div className="mt-6 bg-red-50/80 border border-red-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-900">
              Immediate Attention Required: {urgentTasks.length} Urgent or Overdue Task(s)
            </h4>
            <p className="text-xs text-red-700 mt-0.5">
              Automated overdue alerts have been dispatched to assignees via email.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRunOverdueCheck}
            disabled={checking}
            className="px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Scanning...' : 'Trigger Overdue Scan'}</span>
          </button>
          <Link
            to="/tasks?status=overdue"
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <span>View Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="mt-3 text-xs font-medium text-red-800 bg-red-100/80 px-3 py-1.5 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Task pills preview */}
      <div className="mt-3.5 pt-3 border-t border-red-200/60 flex flex-wrap gap-2">
        {urgentTasks.map((t) => (
          <div
            key={t._id}
            className="bg-white/90 border border-red-200 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2"
          >
            <span className="font-semibold text-slate-800 truncate max-w-xs">{t.title}</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              {t.status === 'overdue' ? 'Overdue' : 'Urgent'}
            </span>
            <span className="text-slate-500 text-[11px]">
              Assigned: {t.assignee?.name || 'Unassigned'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UrgentAlertBanner;

