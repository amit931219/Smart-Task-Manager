import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Mail,
  Bot,
  History,
  Sparkles,
  Zap,
} from 'lucide-react';
import api from '../../services/api';

const Sidebar = () => {
  const [pendingDraftsCount, setPendingDraftsCount] = useState(0);

  // Poll pending drafts count for the Gmail badge
  useEffect(() => {
    const fetchPendingDrafts = async () => {
      try {
        const res = await api.get('/gmail/drafts?status=pending_review');
        setPendingDraftsCount(res.data.count || 0);
      } catch (err) {
        // silent fail
      }
    };
    fetchPendingDrafts();
    const interval = setInterval(fetchPendingDrafts, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tasks', label: 'Task Management', icon: CheckSquare },
    {
      to: '/gmail',
      label: 'Gmail Inbox Hub',
      icon: Mail,
      badge: pendingDraftsCount > 0 ? `${pendingDraftsCount} Draft` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      to: '/ai-summary',
      label: 'AI Summary Assistant',
      icon: Bot,
      pill: 'AI',
    },
    { to: '/activity', label: 'Activity History', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800">
      <div className="p-4 space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.pill && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.pill}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* AI Capabilities Card */}
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Orchestration</span>
          </div>
          <p className="text-slate-400 leading-relaxed mb-2.5">
            Automatic email task parsing, subtask generation & deadline risk analysis active.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <Zap className="w-3 h-3" />
            <span>Local NLP & LLM ready</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-400">Smart Task Manager v1.0</p>
        <p className="mt-0.5">MERN + Gmail API + AI</p>
      </div>
    </aside>
  );
};

export default Sidebar;
