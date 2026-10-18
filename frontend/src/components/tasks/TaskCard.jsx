import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  User,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

const TaskCard = ({ task, onClick, onStatusChange }) => {
  const isOverdue = task.status === 'overdue' || (new Date(task.dueDate) < new Date() && task.status !== 'completed');

  const priorityStyles = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    urgent: 'bg-red-50 text-red-700 border-red-200 font-bold',
  };

  const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  };

  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-white border transition-all duration-200 hover:shadow-md cursor-pointer relative group ${
        isOverdue ? 'border-red-300 shadow-sm shadow-red-50' : 'border-slate-200'
      }`}
    >
      {/* Header Badges */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
              priorityStyles[task.priority] || priorityStyles.medium
            }`}
          >
            {task.priority}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${
              statusStyles[task.status] || statusStyles.pending
            }`}
          >
            {task.status}
          </span>
          {task.source === 'gmail' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Mail className="w-2.5 h-2.5" /> Gmail
            </span>
          )}
        </div>

        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
          {task.department || 'General'}
        </span>
      </div>

      {/* Title & Description */}
      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtasks Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              Subtasks
            </span>
            <span className="font-semibold text-slate-700">
              {completedSubtasks}/{totalSubtasks} ({subtaskPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                subtaskPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${subtaskPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer Info: Assignee & Due Date */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[10px] font-semibold text-slate-700">
            {task.assignee?.avatar ? (
              <img src={task.assignee.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              (task.assignee?.name || 'U').charAt(0)
            )}
          </div>
          <span className="font-medium text-slate-700 text-[11px] truncate max-w-[90px]">
            {task.assignee?.name || 'Unassigned'}
          </span>
        </div>

        <div
          className={`flex items-center gap-1 text-[11px] font-medium ${
            isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
