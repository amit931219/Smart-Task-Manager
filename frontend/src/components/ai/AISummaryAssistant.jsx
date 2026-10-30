import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Printer,
  AlertTriangle,
  Clock,
  Search,
  MessageSquare,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';
import api from '../../services/api';

const QUICK_PROMPTS = [
  'Show me all high-priority NBA tasks that are overdue.',
  'What work is pending with the CSE department?',
  'Which faculty have tasks due this week?',
  "Prepare today's task summary for me.",
];

const AISummaryAssistant = () => {
  const [department, setDepartment] = useState('CSE');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  // Command Center Query State (Point 11)
  const [commandQuery, setCommandQuery] = useState('');
  const [queryingCommand, setQueryingCommand] = useState(false);
  const [commandResult, setCommandResult] = useState(null);

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

  const handleRunCommand = async (queryText) => {
    const q = queryText || commandQuery;
    if (!q.trim()) return;
    setCommandQuery(q);
    setQueryingCommand(true);
    try {
      const res = await api.post('/ai/command-center', { query: q });
      setCommandResult(res.data.data);
    } catch (err) {
      console.error('Command center error', err);
    } finally {
      setQueryingCommand(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Point 11: AI College Task Operating System & Command Center */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-900 text-white">
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              AI Command Center & Natural Language Querying
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask operational questions grounded in verified MongoDB task telemetry (Point 11)
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              placeholder="e.g. Show high-priority NBA tasks, or pending work with CSE..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={queryingCommand || !commandQuery.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-subtle disabled:opacity-60 shrink-0"
          >
            {queryingCommand ? 'Analyzing...' : 'Ask AI'}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Queries:</span>
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleRunCommand(p)}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Command Center Live Results Box */}
        {commandResult && (
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/90 rounded-lg text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                AI Inference: {commandResult.explanation}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                {commandResult.matchCount} task(s) matched
              </span>
            </div>

            {commandResult.tasks && commandResult.tasks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {commandResult.tasks.map((t) => (
                  <div
                    key={t._id}
                    className="p-2.5 bg-white border border-slate-200 rounded-md shadow-subtle space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                        {t.taskId || 'TASK'}
                      </span>
                      <span className="text-[10px] font-semibold uppercase text-slate-500">
                        {t.status}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 truncate">{t.title}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Owner: {t.assignee?.name || 'Unassigned'}</span>
                      <span className="tabular-nums">{new Date(t.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No matching tasks found in database.</p>
            )}
          </div>
        )}
      </div>

      {/* 2. Top Departmental Briefing Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
            <Bot className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Departmental Briefing & Audit</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Synthesized executive audits grounded in MongoDB operational records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
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
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-subtle disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Synthesizing...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      {/* Generated Report Card */}
      {report && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden print:border-none print:shadow-none">
          {/* Report Header */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Automated Department Audit
              </span>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight mt-0.5">
                {report.department} Executive Brief
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                Generated {new Date(report.generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-subtle"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Export / Print</span>
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* KPI Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Tasks</span>
                <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">{report.metrics.total}</p>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200/60 text-center">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold">Completed</span>
                <p className="text-lg font-semibold text-emerald-800 mt-0.5 tabular-nums">{report.metrics.completed}</p>
              </div>
              <div className="p-3 bg-sky-50/70 rounded-lg border border-sky-200/60 text-center">
                <span className="text-[10px] text-sky-700 uppercase font-semibold">In Progress</span>
                <p className="text-lg font-semibold text-sky-800 mt-0.5 tabular-nums">{report.metrics.inProgress}</p>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200/60 text-center">
                <span className="text-[10px] text-rose-700 uppercase font-semibold">Overdue</span>
                <p className="text-lg font-semibold text-rose-800 mt-0.5 tabular-nums">{report.metrics.overdue}</p>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/70 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Completion</span>
                <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">{report.metrics.completionRate}</p>
              </div>
            </div>

            {/* AI Executive Summary Block */}
            <div className="p-4 rounded-lg bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center gap-1.5 mb-1.5 text-slate-900 font-semibold text-xs tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Executive Synthesis</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            {/* Overdue Work & Responsible Users */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Overdue Milestones Requiring Escalation</span>
              </h4>

              {report.overdueTasks.length === 0 ? (
                <div className="p-3.5 text-center text-xs text-emerald-700 bg-emerald-50/60 rounded-lg border border-emerald-200/60 font-medium">
                  ✓ No overdue deliverables in {report.department}. Operations are on schedule.
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                      <tr>
                        <th className="py-2.5 px-3.5">Task Title</th>
                        <th className="py-2.5 px-3.5">Assignee</th>
                        <th className="py-2.5 px-3.5">Due Date</th>
                        <th className="py-2.5 px-3.5">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.overdueTasks.map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3.5 font-medium text-slate-800">{t.title}</td>
                          <td className="py-2.5 px-3.5 text-slate-600">{t.assignee}</td>
                          <td className="py-2.5 px-3.5 text-rose-600 font-medium tabular-nums">{t.dueDate}</td>
                          <td className="py-2.5 px-3.5 uppercase text-[10px] font-semibold text-rose-700">
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
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Upcoming Milestones</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {report.upcomingDeadlines.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No pending milestones in this timeframe.</p>
                ) : (
                  report.upcomingDeadlines.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200/80 bg-white flex items-center justify-between shadow-subtle"
                    >
                      <div className="truncate pr-2">
                        <p className="font-medium text-slate-900 truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Assignee: {t.assignee}</p>
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0 tabular-nums">
                        {t.dueDate}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Action Recommendations */}
            <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200/80">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-2">
                Operational Recommendations
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span className="leading-relaxed">{rec}</span>
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
