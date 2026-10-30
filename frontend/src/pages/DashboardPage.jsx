import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MetricCards from '../components/dashboard/MetricCards';
import ChartsSection from '../components/dashboard/ChartsSection';
import UrgentAlertBanner from '../components/dashboard/UrgentAlertBanner';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { Plus, Mail, Bot, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading operations overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Welcome back, {user?.name}
            </h1>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {user?.department || 'Operations'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time department workload telemetry, automated Gmail queues, and milestone risk tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/gmail"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-subtle"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Gmail Pipeline</span>
          </Link>

          <Link
            to="/ai-summary"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-subtle"
          >
            <Bot className="w-3.5 h-3.5 text-slate-500" />
            <span>Executive Report</span>
          </Link>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <MetricCards metrics={data?.metrics} />

      {/* Overdue Tasks Alert Banner */}
      <UrgentAlertBanner
        urgentTasks={data?.urgentOverdueTasks}
        onRefresh={fetchDashboardData}
      />

      {/* Charts Section */}
      <ChartsSection
        statusData={data?.statusDistribution}
        departmentData={data?.departmentBreakdown}
        priorityData={data?.priorityBreakdown}
      />

      {/* Audit History Timeline */}
      <RecentActivityList activities={data?.recentActivities} />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default DashboardPage;
