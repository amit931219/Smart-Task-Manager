import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MetricCards from '../components/dashboard/MetricCards';
import ChartsSection from '../components/dashboard/ChartsSection';
import UrgentAlertBanner from '../components/dashboard/UrgentAlertBanner';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import { Plus, Mail, Bot, RefreshCw, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
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
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Smart Task Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of department workloads, automated Gmail tasks, and delivery milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/gmail"
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-purple-200"
          >
            <Mail className="w-4 h-4" />
            <span>Gmail Inbox Hub</span>
          </Link>

          <Link
            to="/ai-summary"
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200"
          >
            <Bot className="w-4 h-4" />
            <span>AI Summary</span>
          </Link>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
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
