import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import TaskCard from '../components/tasks/TaskCard';
import CreateTaskModal from '../components/tasks/CreateTaskModal';
import TaskDetailModal from '../components/tasks/TaskDetailModal';
import {
  Plus,
  Search,
  Kanban,
  List,
  RefreshCw,
  UserCheck,
  UserPlus,
  Layers,
} from 'lucide-react';

const TasksPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Scope filter: 'all' | 'assigned' (Individual dashboard) | 'created' (Creator dashboard)
  const [scope, setScope] = useState('all');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (departmentFilter !== 'All') params.department = departmentFilter;
      if (search) params.search = search;
      if (scope !== 'all') params.scope = scope;

      const res = await api.get('/tasks', { params });
      setTasks(res.data.data || []);
    } catch (err) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, departmentFilter, scope]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleTaskDeleted = (deletedId) => {
    setTasks((prev) => prev.filter((t) => t._id !== deletedId));
    setSelectedTask(null);
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.data : t)));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Group tasks by status for Kanban Board
  const kanbanColumns = [
    {
      id: 'pending',
      title: 'Pending',
      dotColor: 'bg-amber-500',
      tasks: tasks.filter((t) => t.status === 'pending'),
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      dotColor: 'bg-sky-500',
      tasks: tasks.filter((t) => t.status === 'in-progress'),
    },
    {
      id: 'overdue',
      title: 'Overdue',
      dotColor: 'bg-rose-500',
      tasks: tasks.filter((t) => t.status === 'overdue'),
    },
    {
      id: 'completed',
      title: 'Completed',
      dotColor: 'bg-emerald-500',
      tasks: tasks.filter((t) => t.status === 'completed'),
    },
  ];

  // Telemetry for creator/individual view (Points 2 & 4)
  const totalCount = tasks.length;
  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const dueTodayCount = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      new Date(t.dueDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Task Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track workload execution, assignees, and delivery timelines across teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Mode Toggle */}
          <div className="p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center gap-0.5 text-slate-600">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-subtle'
                  : 'hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Scope Navigation Tabs (Points 2 & 4: All, Assigned to Me, Created by Me) */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setScope('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            scope === 'all'
              ? 'bg-slate-900 text-white shadow-subtle'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Workspace Tasks</span>
        </button>

        <button
          onClick={() => setScope('assigned')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            scope === 'assigned'
              ? 'bg-slate-900 text-white shadow-subtle'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assigned to Me (Individual Dashboard)</span>
        </button>

        <button
          onClick={() => setScope('created')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            scope === 'created'
              ? 'bg-slate-900 text-white shadow-subtle'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tasks I Created (Creator View)</span>
        </button>
      </div>

      {/* Mini KPI Bar for Creator / Individual View (Point 4) */}
      {scope !== 'all' && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 bg-white border border-slate-200/80 rounded-lg text-center shadow-subtle">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Tasks</span>
            <p className="text-base font-bold text-slate-900 mt-0.5 tabular-nums">{totalCount}</p>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-lg text-center shadow-subtle">
            <span className="text-[10px] text-rose-700 font-semibold uppercase">🔴 Overdue</span>
            <p className="text-base font-bold text-rose-800 mt-0.5 tabular-nums">{overdueCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-lg text-center shadow-subtle">
            <span className="text-[10px] text-amber-700 font-semibold uppercase">🟠 Due Today</span>
            <p className="text-base font-bold text-amber-800 mt-0.5 tabular-nums">{dueTodayCount}</p>
          </div>
          <div className="p-2.5 bg-sky-50 border border-sky-200/80 rounded-lg text-center shadow-subtle">
            <span className="text-[10px] text-sky-700 font-semibold uppercase">🟡 In Progress</span>
            <p className="text-base font-bold text-sky-800 mt-0.5 tabular-nums">{inProgressCount}</p>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-center shadow-subtle">
            <span className="text-[10px] text-slate-600 font-semibold uppercase">🔵 Pending</span>
            <p className="text-base font-bold text-slate-800 mt-0.5 tabular-nums">{pendingCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-center shadow-subtle">
            <span className="text-[10px] text-emerald-700 font-semibold uppercase">🟢 Completed</span>
            <p className="text-base font-bold text-emerald-800 mt-0.5 tabular-nums">{completedCount}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID (e.g. TASK-2026), title..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="All">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="Management">Management</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => (
            <div
              key={col.id}
              className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/80 min-h-[480px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="font-semibold text-xs tracking-tight text-slate-800">
                    {col.title}
                  </h3>
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-600 tabular-nums">
                  {col.tasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {col.tasks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300/80 rounded-lg">
                    No {col.title.toLowerCase()} tasks
                  </div>
                ) : (
                  col.tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                      onStatusChange={handleQuickStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View (Point 2 & 4: Table with Task ID, Progress %, Status) */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-3.5">Task ID</th>
                <th className="py-2.5 px-3.5">Title</th>
                <th className="py-2.5 px-3.5">Assignee</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Priority</th>
                <th className="py-2.5 px-3.5">Progress</th>
                <th className="py-2.5 px-3.5">Due Date</th>
                <th className="py-2.5 px-3.5">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const completedSubtasks = t.subtasks ? t.subtasks.filter((s) => s.completed).length : 0;
                  const totalSubtasks = t.subtasks ? t.subtasks.length : 0;
                  const currentProgress =
                    t.progress !== undefined && t.progress !== null
                      ? t.progress
                      : totalSubtasks > 0
                      ? Math.round((completedSubtasks / totalSubtasks) * 100)
                      : t.status === 'completed'
                      ? 100
                      : 0;

                  return (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-mono text-[11px] font-semibold text-slate-700">
                        {t.taskId || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-900">{t.title}</td>
                      <td className="py-2.5 px-3.5 text-slate-600">{t.assignee?.name || 'Unassigned'}</td>
                      <td className="py-2.5 px-3.5">
                        <span className="capitalize px-1.5 py-0.2 rounded font-medium text-[10px] bg-slate-100 border border-slate-200 text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="uppercase px-1.5 py-0.2 rounded font-medium text-[10px] bg-sky-50 text-sky-700 border border-sky-200">
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                currentProgress === 100
                                  ? 'bg-emerald-500'
                                  : currentProgress > 50
                                  ? 'bg-sky-600'
                                  : 'bg-slate-700'
                              }`}
                              style={{ width: `${currentProgress}%` }}
                            />
                          </div>
                          <span className="tabular-nums font-semibold text-slate-700">{currentProgress}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 font-medium tabular-nums">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500">{t.department}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreated={() => fetchTasks()}
      />

      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
};

export default TasksPage;
