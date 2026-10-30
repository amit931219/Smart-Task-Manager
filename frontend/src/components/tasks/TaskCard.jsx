import React from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Mail,
  User,
  CheckSquare,
  CheckCircle2,
} from 'lucide-react';

const TaskCard = ({ task, onClick, onStatusChange }) => {
  const isOverdue = task.status === 'overdue' || (new Date(task.dueDate) < new Date() && task.status !== 'completed');

  const priorityStyles = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  };

  const statusStyles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'in-progress': 'bg-sky-50 text-sky-700 border-sky-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const currentProgress =
    task.progress !== undefined && task.progress !== null
      ? task.progress
      : totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : task.status === 'completed'
      ? 100
      : 0;

  const handleQuickComplete = (e) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(task._id, 'completed');
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-3.5 rounded-lg bg-white border transition-all duration-150 cursor-pointer shadow-subtle hover:border-slate-300 hover:shadow-card relative group ${
        isOverdue ? 'border-rose-200/90' : 'border-slate-200/90'
      }`}
    >
      {/* Header Badges & Task ID */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.taskId && (
            <span className="text-[10px] font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
              {task.taskId}
            </span>
          )}
          <span
            className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border ${
              priorityStyles[task.priority] || priorityStyles.medium
            }`}
          >
            {task.priority}
          </span>
          {task.source === 'gmail' && (
            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
              <Mail className="w-2.5 h-2.5" /> Gmail
            </span>
          )}
        </div>

        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.2 rounded">
          {task.department || 'General'}
        </span>
      </div>

      {/* Title & Description */}
      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Progress & Subtasks Bar */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <CheckSquare className="w-2.5 h-2.5 text-slate-400" />
            {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks} subtasks` : 'Progress'}
          </span>
          <span className="font-semibold text-slate-700 tabular-nums">
            {currentProgress}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              currentProgress === 100
                ? 'bg-emerald-500'
                : currentProgress > 50
                ? 'bg-sky-600'
                : 'bg-slate-700'
            }`}
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>

      {/* Footer Info: Assignee, Due Date & Quick Complete */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-[9px] font-medium text-slate-700 shrink-0">
            {task.assignee?.avatar ? (
              <img src={task.assignee.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              (task.assignee?.name || 'U').charAt(0)
            )}
          </div>
          <span className="font-medium text-slate-600 text-[11px] truncate max-w-[85px]">
            {task.assignee?.name || 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 text-[11px] font-medium tabular-nums ${
              isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>

          {task.status !== 'completed' && onStatusChange && (
            <button
              onClick={handleQuickComplete}
              title="Mark Task Complete"
              className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
