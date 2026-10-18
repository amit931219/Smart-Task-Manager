import React, { useState } from 'react';
import {
  X,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Trash2,
  Mail,
  Sparkles,
  Plus,
  AlertTriangle,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                {currentTask.priority} Priority
              </span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {currentTask.department}
              </span>
              {currentTask.source === 'gmail' && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Gmail Synced
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900">{currentTask.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Current Status:</span>
            <select
              value={currentTask.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:outline-none capitalize"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Due Date:</span>
            <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
              {new Date(currentTask.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Task Description
          </h4>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl whitespace-pre-wrap leading-relaxed">
            {currentTask.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Subtask Checklist */}
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Subtask Checklist ({currentTask.subtasks?.length || 0})
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(!currentTask.subtasks || currentTask.subtasks.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No subtasks created for this task.</p>
            ) : (
              currentTask.subtasks.map((st) => (
                <div
                  key={st._id}
                  onClick={() => handleToggleSubtask(st._id)}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer text-xs transition-colors ${
                    st.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-500 line-through'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => {}} // handled by div click
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="flex-1 font-medium">{st.title}</span>
                  {st.suggestedByAI && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      AI Suggested
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Subtask in Modal */}
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              placeholder="Add next action item..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddSubtask}
              disabled={addingSubtask}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Assignee & Creator Info */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Assignee:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {currentTask.assignee?.name} ({currentTask.assignee?.email})
            </p>
          </div>
          <div>
            <span className="text-slate-400">Created by:</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {currentTask.creator?.name || 'System / Gmail'}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          {(isAdmin || currentTask.creator?._id === user?._id) ? (
            <button
              onClick={handleDeleteTask}
              disabled={deleting}
              className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting...' : 'Delete Task'}</span>
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
