import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-modal max-w-xl w-full p-6 relative border border-slate-200/90 animate-in fade-in duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">Create Task</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign workload item with AI-assisted breakdown and feasibility assessment
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Title */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Finalize syllabus revision and lab guidelines"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Deliverables & Context
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide context, required outcomes, and reference links..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Row: Assignee & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Assignee <span className="text-rose-500">*</span>
              </label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              <label className="block font-medium text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Row: Due Date & Priority with AI evaluation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-slate-700">Priority</label>
                <button
                  type="button"
                  onClick={handleAnalyzePriorityAI}
                  disabled={analyzingPriority}
                  className="text-[11px] text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  {analyzingPriority ? 'Assessing...' : 'AI Risk Check'}
                </button>
              </div>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white text-slate-900 capitalize focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* AI Priority & Deadline Suggestion Callout */}
          {aiAnalysisResult && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">Deadline Assessment: </span>
                    <span className="text-slate-700">{aiAnalysisResult.reasoning}</span>
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">
                        Suggested Priority:{' '}
                        <strong className="uppercase text-slate-900 font-semibold">
                          {aiAnalysisResult.suggestedPriority}
                        </strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">
                        Risk Score: <strong className="text-slate-900 font-semibold">{aiAnalysisResult.riskScore}/100</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applySuggestedPriority}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-[11px] shrink-0 transition-colors shadow-subtle"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Subtasks Section with AI Subtask Generator */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-slate-700">
                Action Items ({subtasks.length})
              </label>
              <button
                type="button"
                onClick={handleGenerateSubtasksAI}
                disabled={generatingSubtasks}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-subtle disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>{generatingSubtasks ? 'Analyzing...' : 'Suggest Subtasks with AI'}</span>
              </button>
            </div>

            {/* List of Subtasks */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto mb-2 pr-1">
              {subtasks.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No subtasks added. Use AI suggestions or type manually below.
                </div>
              ) : (
                subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {st.suggestedByAI && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                          AI
                        </span>
                      )}
                      <span className="text-slate-800 truncate">{st.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors"
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
                placeholder="Add subtask and press enter..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-subtle transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
