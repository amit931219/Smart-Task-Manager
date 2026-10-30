import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Mail,
  Bot,
  History,
  Sparkles,
  CheckCircle2,
  Cpu,
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
      badge: pendingDraftsCount > 0 ? `${pendingDraftsCount}` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-200/60',
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
    <aside className="w-60 bg-white text-slate-700 flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)] border-r border-slate-200/90">
      <div className="p-3 space-y-5">
        {/* Navigation Section */}
        <div>
          <div className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-600" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.pill && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.pill}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* System Engine Status Card */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              Intelligence Core
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-2">
            Automated email parsing, subtask generation & deadline risk analysis active.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium pt-1.5 border-t border-slate-200/60">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Gmail Sync & LLM Connected</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-medium text-slate-500">SmartTask Platform</span>
        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200/60">
          v1.2.0
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;

