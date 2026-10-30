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
} from 'lucide-react';

const TasksPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

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

  return (
    <div className="space-y-5">
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
              <span className="hidden sm:inline">List</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, keywords..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </form>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
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

          {/* Priority Filter */}
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

          {/* Department Filter */}
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

          {/* My Tasks Toggle */}
          <button
            type="button"
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              myTasksOnly
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
            }`}
          >
            My Tasks Only
          </button>
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
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table / List View */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
              <tr>
                <th className="py-2.5 px-3.5">Title</th>
                <th className="py-2.5 px-3.5">Assignee</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Priority</th>
                <th className="py-2.5 px-3.5">Department</th>
                <th className="py-2.5 px-3.5">Due Date</th>
                <th className="py-2.5 px-3.5">Subtasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No tasks found matching your filter criteria.
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
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
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
                      <td className="py-2.5 px-3.5 text-slate-500">{t.department}</td>
                      <td className="py-2.5 px-3.5 text-slate-700 font-medium tabular-nums">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500 tabular-nums">
                        {totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : '—'}
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
