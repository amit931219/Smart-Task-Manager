import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ListTodo, Mail } from 'lucide-react';

const MetricCards = ({ metrics }) => {
  if (!metrics) return null;

  const cards = [
    {
      title: 'Total Tasks',
      value: metrics.totalTasks || 0,
      icon: ListTodo,
      subtitle: `${metrics.pendingTasks || 0} pending start`,
    },
    {
      title: 'In Progress',
      value: metrics.inProgressTasks || 0,
      icon: Clock,
      subtitle: metrics.dueTodayTasks ? `${metrics.dueTodayTasks} due today` : 'Active execution',
    },
    {
      title: 'Overdue Tasks',
      value: metrics.overdueTasks || 0,
      icon: AlertCircle,
      subtitle: metrics.overdueTasks > 0 ? 'Action required' : 'All deadlines met',
      isDanger: metrics.overdueTasks > 0,
    },
    {
      title: 'Completed',
      value: metrics.completedTasks || 0,
      icon: CheckCircle2,
      subtitle: `${metrics.completionRate || 0}% overall rate`,
    },
    {
      title: 'Gmail Synced',
      value: metrics.emailTasksCount || 0,
      icon: Mail,
      subtitle: `${metrics.pendingDraftsCount || 0} pending review`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-card hover:border-slate-300 transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {c.title}
              </span>
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center ${
                  c.isDanger
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-2xl font-semibold tracking-tight ${
                    c.isDanger ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {c.value}
                </span>
              </div>
              <p
                className={`text-[11px] mt-1 font-normal ${
                  c.isDanger ? 'text-rose-600 font-medium' : 'text-slate-500'
                }`}
              >
                {c.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MetricCards;

