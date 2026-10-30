import React from 'react';
import { History, CheckCircle2, Mail, Sparkles, User, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentActivityList = ({ activities = [] }) => {
  const getActionConfig = (action) => {
    switch (action) {
      case 'GMAIL_SYNCED':
      case 'EMAIL_DRAFT_APPROVED':
        return {
          icon: Mail,
          color: 'text-purple-600 bg-purple-50 border-purple-200/60',
        };
      case 'AI_SUBTASKS_ADDED':
      case 'AI_PRIORITY_APPLIED':
        return {
          icon: Sparkles,
          color: 'text-sky-600 bg-sky-50 border-sky-200/60',
        };
      case 'OVERDUE_ALERT_SENT':
        return {
          icon: AlertTriangle,
          color: 'text-rose-600 bg-rose-50 border-rose-200/60',
        };
      case 'UPDATED_STATUS':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200/60',
        };
      default:
        return {
          icon: User,
          color: 'text-slate-600 bg-slate-50 border-slate-200/60',
        };
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Audit Trail & Operational Events</h3>
          <p className="text-xs text-slate-500 mt-0.5">Automated workflow logs and team state updates</p>
        </div>
        <Link
          to="/activity"
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <span>View Audit Log</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No recent events recorded</p>
        ) : (
          activities.map((act) => {
            const { icon: Icon, color } = getActionConfig(act.action);
            return (
              <div key={act._id} className="py-2.5 flex items-start gap-3 group">
                <div className={`p-1.5 rounded-md border ${color} shrink-0 mt-0.5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-800 leading-snug">
                    {act.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-500">{act.user?.name || 'Automated Daemon'}</span>
                    <span>•</span>
                    <span className="tabular-nums">{new Date(act.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivityList;
