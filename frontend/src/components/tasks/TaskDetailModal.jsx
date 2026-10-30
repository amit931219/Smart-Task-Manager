import React, { useState } from 'react';
import {
  X,
  Calendar,
  Trash2,
  Mail,
  Plus,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdated, onTaskDeleted }) => {
  const { user, isAdmin } = useAuth();
  const [currentTask, setCurrentTask] = useState(task);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  if (!isOpen || !currentTask) return null;

  // Toggle Subtask
  const handleToggleSubtask = async (subtaskId) => {
    try {
      const res = await api.patch(`/tasks/${currentTask._id}/subtasks/${subtaskId}`);
      setCurrentTask(res.data.data);
      if (onTaskUpdated) onTaskUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to toggle subtask', err);
    }
  };

  // Add new subtask
  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    setAddingSubtask(true);
    try {
      const res = await api.post(`/tasks/${currentTask._id}/subtasks`, {
        title: newSubtask.trim(),
      });
      setCurrentTask(res.data.data);
      setNewSubtask('');
      if (onTaskUpdated) onTaskUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to add subtask', err);
    } finally {
      setAddingSubtask(false);
    }
  };

  // Update Status
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/tasks/${currentTask._id}/status`, { status: newStatus });
      setCurrentTask(res.data.data);
      if (onTaskUpdated) onTaskUpdated(res.data.data);
    } catch (err) {
      console.error('Failed to change status', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete task "${currentTask.title}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/tasks/${currentTask._id}`);
      if (onTaskDeleted) onTaskDeleted(currentTask._id);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const isOverdue =
    currentTask.status === 'overdue' ||
    (new Date(currentTask.dueDate) < new Date() && currentTask.status !== 'completed');

  const priorityStyles = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-modal max-w-xl w-full p-6 relative border border-slate-200/90 animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded border ${priorityStyles[currentTask.priority] || priorityStyles.medium}`}>
                {currentTask.priority}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {currentTask.department}
              </span>
              {currentTask.source === 'gmail' && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5" /> Gmail Synced
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">{currentTask.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="mt-3.5 p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={currentTask.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="px-2 py-1 rounded-md border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-none capitalize"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Due:</span>
            <span className={`font-medium tabular-nums ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
              {new Date(currentTask.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Description
          </h4>
          <p className="text-xs text-slate-700 bg-slate-50/60 border border-slate-200/60 p-3 rounded-lg whitespace-pre-wrap leading-relaxed">
            {currentTask.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Subtask Checklist */}
        <div className="mt-4">
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Checklist ({currentTask.subtasks?.length || 0})
          </h4>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {(!currentTask.subtasks || currentTask.subtasks.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No checklist items for this task.</p>
            ) : (
              currentTask.subtasks.map((st) => (
                <div
                  key={st._id}
                  onClick={() => handleToggleSubtask(st._id)}
                  className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                    st.completed
                      ? 'bg-slate-50/60 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}} // handled by div click
                    className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
                  />
                  <span className="flex-1 font-medium">{st.title}</span>
                  {st.suggestedByAI && (
                    <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                      AI
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Subtask in Modal */}
          <div className="flex gap-2 mt-2.5">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Add checklist item..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button
              onClick={handleAddSubtask}
              disabled={addingSubtask}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Assignee</span>
            <p className="font-medium text-slate-800 mt-0.5 truncate">
              {currentTask.assignee?.name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{currentTask.assignee?.email}</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Origin</span>
            <p className="font-medium text-slate-800 mt-0.5 truncate">
              {currentTask.creator?.name || 'System / Gmail Automated'}
            </p>
            <p className="text-[10px] text-slate-400">Created via {currentTask.source || 'Manual entry'}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
          {(isAdmin || currentTask.creator?._id === user?._id) ? (
            <button
              onClick={handleDeleteTask}
              disabled={deleting}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 p-1 rounded hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting...' : 'Delete Task'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
