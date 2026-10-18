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
  Filter,
  Kanban,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const TasksPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [myTasksOnly, setMyTasksOnly] = useState(false);

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
      if (myTasksOnly) params.scope = 'assigned';

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
  }, [statusFilter, priorityFilter, departmentFilter, myTasksOnly]);

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

  // Group tasks by status for Kanban Board
  const kanbanColumns = [
    {
      id: 'pending',
      title: 'Pending',
      color: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800',
      tasks: tasks.filter((t) => t.status === 'pending'),
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-800',
      tasks: tasks.filter((t) => t.status === 'in-progress'),
    },
    {
      id: 'overdue',
      title: 'Overdue',
      color: 'bg-red-500',
      badge: 'bg-red-100 text-red-800',
      tasks: tasks.filter((t) => t.status === 'overdue'),
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800',
      tasks: tasks.filter((t) => t.status === 'completed'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize, prioritize, and track deadlines across your team.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="p-1 rounded-xl bg-slate-200 flex items-center gap-1 text-slate-600">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, deliverables..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium text-slate-700 focus:outline-none"
          >
            <option value="All">All Depts</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="Management">Management</option>
            <option value="General">General</option>
          </select>

          {/* My Tasks Toggle */}
          <button
            type="button"
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              myTasksOnly
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            My Tasks Only
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => (
            <div
              key={col.id}
              className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200/80 min-h-[500px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`}></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    {col.title}
                  </h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {col.tasks.length}
                </span>
              </div>

              {/* Tasks List in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {col.tasks.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                    No {col.title.toLowerCase()} tasks
                  </div>
                ) : (
                  col.tasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3.5">Task Title</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Subtasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => {
                  const completedSubtasks = t.subtasks ? t.subtasks.filter((s) => s.completed).length : 0;
                  const totalSubtasks = t.subtasks ? t.subtasks.length : 0;
                  return (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5 font-semibold text-slate-900">{t.title}</td>
                      <td className="p-3.5 text-slate-700">{t.assignee?.name || 'Unassigned'}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 text-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="uppercase px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-700">
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{t.department}</td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '-'}
                      </td>
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

