import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const ChartsSection = ({ statusData = [], departmentData = [], priorityData = [] }) => {
  const STATUS_COLORS = {
    Completed: '#10b981',
    'In Progress': '#0284c7',
    Pending: '#f59e0b',
    Overdue: '#f43f5e',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Status Breakdown Donut Chart */}
      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Status Distribution</h3>
            <span className="text-[11px] font-medium text-slate-400">Live Breakdown</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Active and resolved deliverables across all departments</p>
        </div>

        <div className="h-60 my-2">
          {statusData.length === 0 || statusData.every((d) => d.value === 0) ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No task records available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || STATUS_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Tasks`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
          {statusData.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: s.color || STATUS_COLORS[s.name] || '#94a3b8' }}
              />
              <span className="text-slate-600 truncate">{s.name}</span>
              <span className="font-semibold text-slate-900 ml-auto tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Department Workload & Velocity Bar Chart */}
      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Workload & Completion</h3>
            <span className="text-[11px] font-medium text-slate-400">By Department</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Total assignments versus completed and overdue milestones</p>
        </div>

        <div className="h-60 my-2">
          {departmentData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No department telemetry available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 12, right: 10, left: -24, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="total" name="Total Tasks" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="overdue" name="Overdue" fill="#f43f5e" radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <span>Active Units: <strong className="text-slate-700">{departmentData.length}</strong></span>
          <span className="text-slate-400">Grounded in MongoDB Pipeline</span>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
