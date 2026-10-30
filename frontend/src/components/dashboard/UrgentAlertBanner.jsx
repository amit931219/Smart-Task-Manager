import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ArrowRight, Clock } from 'lucide-react';
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
    <div className="bg-rose-50/70 border border-rose-200/90 rounded-xl p-4 transition-all shadow-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-900">
                Action Required
              </h4>
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-rose-200/70 text-rose-800">
                {urgentTasks.length} {urgentTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <p className="text-xs text-rose-700/90 mt-0.5">
              Urgent deliverables past due or pending immediate escalation. Automated alerts dispatched.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={handleRunOverdueCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors shadow-subtle disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Scanning...' : 'Trigger Scan'}</span>
          </button>
          <Link
            to="/tasks?status=overdue"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-subtle"
          >
            <span>Review Tasks</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="mt-2.5 text-xs font-medium text-rose-800 bg-white/80 border border-rose-200 px-3 py-1.5 rounded-lg">
          {feedback}
        </div>
      )}

      {/* Task pills preview */}
      <div className="mt-3 pt-3 border-t border-rose-200/60 flex flex-wrap gap-2">
        {urgentTasks.map((t) => (
          <div
            key={t._id}
            className="bg-white border border-rose-200/80 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2 shadow-subtle"
          >
            <span className="font-medium text-slate-800 truncate max-w-xs">{t.title}</span>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
              {t.status === 'overdue' ? 'Overdue' : 'Urgent'}
            </span>
            <span className="text-slate-400 text-[11px]">
              {t.assignee?.name || 'Unassigned'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UrgentAlertBanner;
