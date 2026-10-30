import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, Shield, UserCheck, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@smarttask.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const demoAccounts = [
    {
      name: 'Dr. Vikrant Verma',
      email: 'admin@smarttask.com',
      role: 'Administrator',
      roleBadge: 'Admin Access',
      department: 'Management',
      icon: Shield,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      name: 'Rahul Sharma',
      email: 'rahul@smarttask.com',
      role: 'Faculty / Staff',
      roleBadge: 'CSE Dept',
      department: 'CSE',
      icon: UserCheck,
      accent: 'text-sky-700 bg-sky-50 border-sky-200',
    },
    {
      name: 'Priya Patel',
      email: 'priya@smarttask.com',
      role: 'Faculty / Staff',
      roleBadge: 'CSE Dept',
      department: 'CSE',
      icon: UserCheck,
      accent: 'text-purple-700 bg-purple-50 border-purple-200',
    },
    {
      name: 'Amit Tomar',
      email: 'amit@smarttask.com',
      role: 'Specialist',
      roleBadge: 'IT Dept',
      department: 'IT',
      icon: UserCheck,
      accent: 'text-slate-700 bg-slate-50 border-slate-200',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white shadow-subtle mb-3">
          <Sparkles className="w-5 h-5 text-sky-400" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Sign in to SmartTask
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enterprise Task Orchestration & Gmail Automation Pipeline
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-slate-200/90 py-7 px-6 sm:px-8 rounded-2xl shadow-subtle">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-subtle disabled:opacity-60 mt-1"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins Bar */}
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                1-Click Fast Switch (Testing Profiles)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {demoAccounts.map((account) => {
                const isSelected = email === account.email;
                const IconComponent = account.icon;
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => setDemoUser(account.email)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${account.accent}`}>
                        {account.roleBadge}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-900" />}
                    </div>
                    <p className="font-medium text-slate-900 truncate text-xs">{account.name}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{account.email}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Enterprise Security • Grounded in MongoDB & Google Cloud APIs
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
