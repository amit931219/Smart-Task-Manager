import React, { useState } from 'react';
import {
  Mail,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Edit2,
  Check,
  Paperclip,
  Download,
  ExternalLink,
  FileText,
} from 'lucide-react';
import api from '../../services/api';

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

  // Client-side handlers for guaranteed view & download support
  const handleViewAttachment = async (att, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const targetUrl = att.url || `/api/gmail/attachments/${att.savedFilename || att.filename}`;
    try {
      const res = await api.get(targetUrl, { responseType: 'blob' });
      const mime = att.contentType || res.headers['content-type'] || 'application/pdf';
      const fileBlob = new Blob([res.data], { type: mime });
      const blobUrl = window.URL.createObjectURL(fileBlob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.warn('Blob preview fallback to direct tab navigation:', err);
      window.open(targetUrl, '_blank');
    }
  };

  const handleDownloadAttachment = async (att, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const downloadUrl =
      att.downloadUrl ||
      `/api/gmail/attachments/${att.savedFilename || att.filename}?download=true&name=${encodeURIComponent(
        att.filename || 'download'
      )}`;
    try {
      const res = await api.get(downloadUrl, { responseType: 'blob' });
      const blob = new Blob([res.data], {
        type: att.contentType || res.headers['content-type'] || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.filename || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Blob download fallback to direct navigation:', err);
      window.location.href = downloadUrl;
    }
  };

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
      className={`rounded-xl border bg-white shadow-subtle overflow-hidden transition-all ${
        isPending ? 'border-amber-200/90' : 'border-slate-200/80 opacity-80'
      }`}
    >
      {/* Top Banner: Incoming Raw Email */}
      <div className="bg-slate-50/80 p-3.5 border-b border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0 mt-0.5">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                From: {draft.from}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(draft.receivedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <h4 className="font-semibold text-slate-900 mt-0.5">
              Subject: {draft.subject}
            </h4>
          </div>
        </div>

        <div>
          {draft.extractedTask?.isTaskReply ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Task Reply Sync ({draft.extractedTask.replyTaskId})
            </span>
          ) : isPending ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Awaiting Approval
            </span>
          ) : draft.status === 'approved' ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Approved & Created
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              Discarded
            </span>
          )}
        </div>
      </div>

      {/* Raw Email Snippet */}
      <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100 text-xs text-slate-600">
        <span className="font-medium text-slate-500">Inbound Body: </span>
        <span className="italic text-slate-700">"{draft.body}"</span>
      </div>

      {/* Center: AI Extraction Breakdown */}
      <div className="p-4 text-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Extracted Task Entities</span>
            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              {Math.round((draft.extractedTask.confidence || 0.9) * 100)}% Confidence
            </span>
          </div>

          {isPending && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
            >
              <Edit2 className="w-3 h-3 text-slate-400" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Entities'}</span>
            </button>
          )}
        </div>

        {draft.extractedTask.aiExplanation && (
          <p className="text-xs text-slate-600 mb-3.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
            <strong className="text-slate-700">Inference:</strong> {draft.extractedTask.aiExplanation}
          </p>
        )}

        {/* Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Task Title</label>
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            ) : (
              <p className="font-medium text-slate-900">{editedTitle}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Assigned Employee</label>
            {isEditing ? (
              <select
                value={editedAssignee}
                onChange={(e) => setEditedAssignee(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.department})
                  </option>
                ))}
              </select>
            ) : (
              <p className="font-medium text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {users.find((u) => u._id === editedAssignee)?.name ||
                  draft.extractedTask.assigneeName ||
                  'Unassigned'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Due Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            ) : (
              <p className="font-medium text-slate-800 flex items-center gap-1.5 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(editedDueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Priority</label>
            {isEditing ? (
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white capitalize text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            ) : (
              <span className="font-semibold uppercase px-1.5 py-0.2 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                {editedPriority}
              </span>
            )}
          </div>
        </div>

        {/* Suggested Subtasks List */}
        {draft.extractedTask.suggestedSubtasks &&
          draft.extractedTask.suggestedSubtasks.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-slate-500 font-medium text-[11px] block mb-1.5">
                Suggested Action Items ({draft.extractedTask.suggestedSubtasks.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {draft.extractedTask.suggestedSubtasks.map((st, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                  >
                    • {st.title}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Email Attachments */}
        {draft.attachments && draft.attachments.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Paperclip className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-slate-700 font-semibold text-[11px]">
                Original Email Attachments ({draft.attachments.length})
              </span>
              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                Will be attached to task
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {draft.attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate" title={att.filename}>
                        {att.filename}
                      </p>
                      {att.size > 0 && (
                        <p className="text-[10px] text-slate-400">{formatSize(att.size)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleViewAttachment(att, e)}
                      className="px-2 py-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors shadow-subtle cursor-pointer"
                      title="View / Open in tab"
                    >
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadAttachment(att, e)}
                      className="px-2 py-1 text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-subtle cursor-pointer"
                      title="Download attachment"
                    >
                      <Download className="w-3 h-3 text-purple-600" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Approval Footer */}
      {isPending && (
        <div className="bg-slate-50/70 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={handleReject}
            disabled={rejecting || approving}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-medium flex items-center gap-1.5 transition-colors shadow-subtle"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{rejecting ? 'Discarding...' : 'Discard'}</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium flex items-center gap-1.5 transition-colors shadow-subtle disabled:opacity-60"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{approving ? 'Creating Task...' : 'Approve & Assign Task'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftReviewCard;
