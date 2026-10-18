import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import api from '../../services/api';

const AISummaryAssistant = () => {
  const [department, setDepartment] = useState('CSE');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/summary', { department });
      setReport(res.data.data);
    } catch (err) {
      setError('Failed to generate summary report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">AI Task Summary Assistant</h2>
              <p className="text-xs text-slate-500">
                Grounded executive reports synthesised from verified MongoDB task records
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE Department</option>
            <option value="IT">IT Department</option>
            <option value="Management">Management</option>
            <option value="General">General</option>
          </select>

          <button
            onClick={generateReport}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Synthesizing...' : 'Generate AI Report'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Generated Report Card */}
      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
          {/* Report Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
                Automated Departmental Audit
              </span>
              <h3 className="text-xl font-bold mt-0.5">
                {report.department} Executive Summary
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Generated: {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export / Print PDF</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* KPI Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total</span>
                <p className="text-xl font-bold text-slate-900 mt-1">{report.metrics.total}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-600 uppercase font-semibold">Completed</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">{report.metrics.completed}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] text-blue-600 uppercase font-semibold">In Progress</span>
                <p className="text-xl font-bold text-blue-700 mt-1">{report.metrics.inProgress}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                <span className="text-[10px] text-red-600 uppercase font-semibold">Overdue</span>
                <p className="text-xl font-bold text-red-700 mt-1">{report.metrics.overdue}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-indigo-600 uppercase font-semibold">Velocity</span>
                <p className="text-xl font-bold text-indigo-700 mt-1">{report.metrics.completionRate}</p>
              </div>
            </div>

            {/* AI Executive Summary Block */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Executive AI Synthesis</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            {/* Overdue Work & Responsible Users */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Overdue Work Requiring Attention</span>
              </h4>

              {report.overdueTasks.length === 0 ? (
                <div className="p-4 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100 font-medium">
                  ✓ No overdue tasks in {report.department}. All active work is on schedule!
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="p-3">Task Title</th>
                        <th className="p-3">Responsible User</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.overdueTasks.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-semibold text-slate-800">{t.title}</td>
                          <td className="p-3 text-slate-600">{t.assignee}</td>
                          <td className="p-3 text-red-600 font-semibold">{t.dueDate}</td>
                          <td className="p-3 uppercase text-[10px] font-bold text-red-700">
                            {t.priority}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Upcoming Deadlines */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Upcoming Milestones</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {report.upcomingDeadlines.length === 0 ? (
                  <p className="text-slate-400 italic">No pending upcoming deadlines.</p>
                ) : (
                  report.upcomingDeadlines.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-500">Owner: {t.assignee}</p>
                      </div>
                      <span className="text-[11px] font-bold text-blue-600 shrink-0">
                        {t.dueDate}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Action Recommendations */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Operational Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummaryAssistant;
