import React, { useState } from 'react';
import {
  Mail,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  ArrowRight,
  Edit2,
  Check,
} from 'lucide-react';
import api from '../../services/api';

const DraftReviewCard = ({ draft, users = [], onApproved, onRejected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Editable fields
  const [editedTitle, setEditedTitle] = useState(draft.extractedTask.title);
  const [editedAssignee, setEditedAssignee] = useState(
    draft.extractedTask.matchedUserId?._id || draft.extractedTask.matchedUserId || ''
  );
  const [editedPriority, setEditedPriority] = useState(draft.extractedTask.priority || 'medium');
  const [editedDueDate, setEditedDueDate] = useState(
    draft.extractedTask.dueDate
      ? new Date(draft.extractedTask.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [editedDepartment, setEditedDepartment] = useState(
    draft.extractedTask.department || 'General'
  );

  const handleApprove = async () => {
    setApproving(true);
    try {
      const payload = {
        title: editedTitle,
        assigneeId: editedAssignee || (users[0] ? users[0]._id : null),
        priority: editedPriority,
        dueDate: editedDueDate,
        department: editedDepartment,
      };
      const res = await api.post(`/gmail/drafts/${draft._id}/approve`, payload);
      if (onApproved) onApproved(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve draft');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Discard this draft email task?')) return;
    setRejecting(true);
    try {
      const res = await api.post(`/gmail/drafts/${draft._id}/reject`);
      if (onRejected) onRejected(res.data.data);
    } catch (err) {
      alert('Failed to reject draft');
    } finally {
      setRejecting(false);
    }
  };

  const isPending = draft.status === 'pending_review';

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all ${
        isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-200 opacity-80'
      }`}
    >
      {/* Top Banner: Incoming Raw Email */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">
                From: {draft.from}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(draft.receivedAt).toLocaleString()}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900 mt-0.5">
              Subject: {draft.subject}
            </h4>
          </div>
        </div>

        <div>
          {isPending ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Awaiting Human Approval
            </span>
          ) : draft.status === 'approved' ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Approved & Created
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Raw Email Snippet */}
      <div className="px-4 py-3 bg-purple-50/40 border-b border-purple-100/60 text-xs text-purple-900">
        <span className="font-semibold text-purple-700">Original Email Body: </span>
        <span className="italic">"{draft.body}"</span>
      </div>

      {/* Center: AI Extraction Breakdown */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>AI Extracted Task Fields</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700">
              {Math.round((draft.extractedTask.confidence || 0.9) * 100)}% Confidence
            </span>
          </div>

          {isPending && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Fields'}</span>
            </button>
          )}
        </div>

        {draft.extractedTask.aiExplanation && (
          <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <strong>AI Rationale:</strong> {draft.extractedTask.aiExplanation}
          </p>
        )}

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Task Title</label>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="font-semibold text-slate-800 text-sm">{editedTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Assigned Employee</label>
            {isEditing ? (
              <select
                value={editedAssignee}
                onChange={(e) => setEditedAssignee(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {users.find((u) => u._id === editedAssignee)?.name ||
                  draft.extractedTask.assigneeName ||
                  'Unassigned'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Due Date / Deadline</label>
            {isEditing ? (
              <input
                type="date"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(editedDueDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Priority</label>
            {isEditing ? (
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            ) : (
              <span className="font-bold uppercase px-2 py-0.5 rounded text-[11px] bg-red-100 text-red-700">
                {editedPriority}
              </span>
            )}
          </div>
        </div>

        {/* Suggested Subtasks List */}
        {draft.extractedTask.suggestedSubtasks &&
          draft.extractedTask.suggestedSubtasks.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-slate-500 font-semibold text-xs block mb-1.5">
                AI Suggested Subtasks ({draft.extractedTask.suggestedSubtasks.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {draft.extractedTask.suggestedSubtasks.map((st, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-1 rounded-md"
                  >
                    • {st.title}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Bottom Approval Footer (Flow Diagram 5.2) */}
      {isPending && (
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleReject}
            disabled={rejecting || approving}
            className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{rejecting ? 'Discarding...' : 'Discard Draft'}</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{approving ? 'Creating Task...' : 'Approve & Create Task'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftReviewCard;
