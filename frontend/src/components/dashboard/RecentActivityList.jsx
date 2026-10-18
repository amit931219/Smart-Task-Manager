import React from 'react';
import { History, CheckCircle, Mail, Sparkles, User, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentActivityList = ({ activities = [] }) => {
  const getActionIcon = (action) => {
    switch (action) {
      case 'GMAIL_SYNCED':
      case 'EMAIL_DRAFT_APPROVED':
        return <Mail className="w-3.5 h-3.5 text-purple-600" />;
      case 'AI_SUBTASKS_ADDED':
      case 'AI_PRIORITY_APPLIED':
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case 'OVERDUE_ALERT_SENT':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case 'UPDATED_STATUS':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <User className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent Activity & Audit Trail</h3>
          <p className="text-xs text-slate-500">Live operational events logged in MongoDB</p>
        </div>
        <Link
          to="/activity"
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
        >
          <span>View All Logs</span>
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">No activity recorded yet</p>
        ) : (
          activities.map((act) => (
            <div key={act._id} className="py-3 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-slate-100 mt-0.5">
                {getActionIcon(act.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 leading-snug">
                  {act.details}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                  <span>{act.user?.name || 'System Auto-Agent'}</span>
                  <span>•</span>
                  <span>{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivityList;

