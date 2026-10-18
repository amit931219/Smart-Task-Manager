import React, { useState } from 'react';
import { X, Send, Sparkles, Mail, FileText } from 'lucide-react';
import api from '../../services/api';

const QUICK_TEMPLATES = [
  {
    label: 'Course File (Rahul)',
    from: 'dr.sharma@college.edu',
    subject: 'BCS402 Course File Preparation',
    body: 'Please ask Rahul to prepare the BCS402 course file by Monday. This is high priority.',
  },
  {
    label: 'Accreditation Report (Priya)',
    from: 'dean.academics@college.edu',
    subject: 'Annual Department Accreditation Report',
    body: 'Need Priya to collate faculty research publications, student achievements, and placement data for the CSE annual report by next Friday. Important deliverable.',
  },
  {
    label: 'Urgent Server DB (Amit)',
    from: 'devops.lead@smarttask.com',
    subject: 'Action Required: Fix Staging Server Connection',
    body: 'Please ask Amit to investigate staging server database timeout issues immediately by tomorrow morning. This is urgent priority.',
  },
];

const SimulateEmailModal = ({ isOpen, onClose, onEmailReceived }) => {
  const [from, setFrom] = useState('dr.sharma@college.edu');
  const [subject, setSubject] = useState('BCS402 Course File Preparation');
  const [body, setBody] = useState(
    'Please ask Rahul to prepare the BCS402 course file by Monday. This is high priority.'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tpl) => {
    setFrom(tpl.from);
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !body) return;
    setLoading(true);
    try {
      const res = await api.post('/gmail/simulate', { from, subject, body });
      if (onEmailReceived) onEmailReceived(res.data.data);
      onClose();
    } catch (err) {
      alert('Failed to send simulated email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Simulate Central Gmail Message
              </h3>
              <p className="text-xs text-slate-500">
                Simulate inbound email to central account for AI extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick template chips */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Quick Project Plan Prompts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 transition-colors border border-slate-200"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sender Email</label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email Body (Natural Language Task Request)
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing via AI...' : 'Send & Parse with AI'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimulateEmailModal;
