import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import api from '../../services/api';

const CreateTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    department: 'General',
    assignee: '',
  });

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI State
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);
  const [analyzingPriority, setAnalyzingPriority] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch users for assignee dropdown
      const loadUsers = async () => {
        try {
          const res = await api.get('/auth/users');
          setUsers(res.data.data || []);
          if (res.data.data.length > 0 && !formData.assignee) {
            setFormData((prev) => ({
              ...prev,
              assignee: res.data.data[0]._id,
              department: res.data.data[0].department || 'General',
            }));
          }
        } catch (err) {
          console.error('Failed to load users');
        }
      };
      loadUsers();

      // Default due date to 3 days from now
      const defaultDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
      setFormData((prev) => ({ ...prev, dueDate: defaultDate }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'assignee') {
        const u = users.find((user) => user._id === value);
        if (u && u.department) next.department = u.department;
      }
      return next;
    });
  };

  // Add custom subtask manually
  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { title: newSubtaskInput.trim(), completed: false, suggestedByAI: false },
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  // 1. AI Feature: AI Subtask Generator
  const handleGenerateSubtasksAI = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a task title first so AI can suggest relevant subtasks.');
      return;
    }
    setError('');
    setGeneratingSubtasks(true);
    try {
      const res = await api.post('/ai/subtasks', {
        taskTitle: formData.title,
        taskDescription: formData.description,
      });
      const suggested = res.data.data || [];
      setSubtasks((prev) => [
        ...prev,
        ...suggested.map((s) => ({
          title: s.title,
          completed: false,
          suggestedByAI: true,
        })),
      ]);
    } catch (err) {
      setError('Failed to generate AI subtasks. Please try again.');
    } finally {
      setGeneratingSubtasks(false);
    }
  };

  // 2. AI Feature: AI Priority & Deadline Assistant
  const handleAnalyzePriorityAI = async () => {
    if (!formData.dueDate) {
      setError('Please select a due date to evaluate deadline feasibility.');
      return;
    }
    setError('');
    setAnalyzingPriority(true);
    setAiAnalysisResult(null);
    try {
      const res = await api.post('/ai/priority-deadline-check', {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        subtasks,
      });
      setAiAnalysisResult(res.data.data);
    } catch (err) {
      setError('Failed to run AI deadline evaluation.');
    } finally {
      setAnalyzingPriority(false);
    }
  };

  const applySuggestedPriority = () => {
    if (aiAnalysisResult?.suggestedPriority) {
      setFormData((prev) => ({ ...prev, priority: aiAnalysisResult.suggestedPriority }));
    }
  };

  // Submit Task Creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.assignee || !formData.dueDate) {
      setError('Title, Assignee, and Due Date are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/tasks', {
        ...formData,
        subtasks,
      });
      if (onTaskCreated) onTaskCreated(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create New Task</h3>
            <p className="text-xs text-slate-500">
              Assign task with AI-assisted subtasks and deadline analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Prepare the annual department report"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Deliverables
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline specific objectives and guidelines..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Row: Assignee & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignee <span className="text-red-500">*</span>
              </label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role} - {u.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Row: Due Date & Priority with AI evaluation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Priority</label>
                <button
                  type="button"
                  onClick={handleAnalyzePriorityAI}
                  disabled={analyzingPriority}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  {analyzingPriority ? 'Analyzing...' : 'AI Risk Check'}
                </button>
              </div>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* AI Priority & Deadline Suggestion Banner */}
          {aiAnalysisResult && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-blue-900">AI Deadline Assessment: </span>
                    <span className="text-blue-800">{aiAnalysisResult.reasoning}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-slate-600">
                        Suggested Priority:{' '}
                        <strong className="uppercase text-blue-700">
                          {aiAnalysisResult.suggestedPriority}
                        </strong>
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">
                        Risk Score: <strong>{aiAnalysisResult.riskScore}/100</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applySuggestedPriority}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-[11px] shrink-0"
                >
                  Apply Suggestion
                </button>
              </div>
            </div>
          )}

          {/* Subtasks Section with AI Subtask Generator */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Actionable Subtasks ({subtasks.length})
              </label>
              <button
                type="button"
                onClick={handleGenerateSubtasksAI}
                disabled={generatingSubtasks}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200 disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{generatingSubtasks ? 'AI Generating...' : '⚡ Suggest Subtasks with AI'}</span>
              </button>
            </div>

            {/* List of Subtasks */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto mb-2 pr-1">
              {subtasks.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No subtasks added yet. Use AI suggestions or add manually below.
                </div>
              ) : (
                subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {st.suggestedByAI && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 shrink-0">
                          AI
                        </span>
                      )}
                      <span className="text-slate-700 truncate">{st.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a custom subtask..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create & Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
