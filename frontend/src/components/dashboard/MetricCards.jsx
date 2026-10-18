import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, Mail } from 'lucide-react';

const MetricCards = ({ metrics }) => {
  if (!metrics) return null;

  const cards = [
    {
      title: 'Total Tasks',
      value: metrics.totalTasks || 0,
      icon: ListTodo,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      subtitle: `${metrics.pendingTasks || 0} pending start`,
    },
    {
      title: 'In Progress',
      value: metrics.inProgressTasks || 0,
      icon: Clock,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      subtitle: 'Active execution',
    },
    {
      title: 'Overdue Tasks',
      value: metrics.overdueTasks || 0,
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-100',
      subtitle: metrics.overdueTasks > 0 ? 'Requires immediate action' : 'No overdue tasks',
      isDanger: metrics.overdueTasks > 0,
    },
    {
      title: 'Completed',
      value: metrics.completedTasks || 0,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      subtitle: `${metrics.completionRate || 0}% completion rate`,
    },
    {
      title: 'Gmail Synced Tasks',
      value: metrics.emailTasksCount || 0,
      icon: Mail,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      subtitle: `${metrics.pendingDraftsCount || 0} pending review`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-white border ${c.borderColor} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {c.title}
              </span>
              <div className={`p-2 rounded-xl ${c.bgColor} ${c.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold tracking-tight ${
                    c.isDanger ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {c.value}
                </span>
              </div>
              <p className={`text-xs mt-1 ${c.isDanger ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
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

