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
  const COLORS = {
    Completed: '#16a34a',
    'In Progress': '#2563eb',
    Pending: '#f59e0b',
    Overdue: '#dc2626',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* 1. Status Breakdown Donut Chart */}
      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Task Status Distribution</h3>
          <p className="text-xs text-slate-500">Live breakdown of all active and resolved tasks</p>
        </div>

        <div className="h-64 my-2">
          {statusData.length === 0 || statusData.every((d) => d.value === 0) ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No task data to display
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Tasks`, name]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          {statusData.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color || COLORS[s.name] }}
              ></span>
              <span className="text-slate-600 truncate">{s.name}:</span>
              <span className="font-semibold text-slate-900 ml-auto">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Department Workload & Velocity Bar Chart */}
      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Department Workload & Delivery</h3>
          <p className="text-xs text-slate-500">Total vs completed and overdue tasks per department</p>
        </div>

        <div className="h-64 my-2">
          {departmentData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No department data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Total Tasks" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Active Departments: {departmentData.length}</span>
          <span className="text-slate-400">Auto-aggregated via MongoDB Pipeline</span>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
