import React, { useState } from 'react';
import { X, Send, Mail } from 'lucide-react';
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
    label: 'Urgent Staging DB (Amit)',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-modal max-w-lg w-full p-6 relative border border-slate-200/90 animate-in fade-in duration-150 my-8">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <Mail className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                Simulate Inbound Email
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dispatch an email payload to the pipeline to test NLP entity extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick template chips */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Quick Test Scenarios:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-colors shadow-subtle"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSend} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Sender Email</label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Email Body (Natural Language Instruction)
            </label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-subtle flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Processing...' : 'Send to Pipeline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimulateEmailModal;
