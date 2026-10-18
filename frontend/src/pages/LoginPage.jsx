import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, Shield, UserCheck } from 'lucide-react';

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
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail, demoPass = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 mb-4">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Smart Task Manager</h2>
        <p className="mt-1 text-sm text-slate-400">
          Intelligent Task Management with Central Gmail & AI Integration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Bar */}
          <div className="mt-6 pt-6 border-t border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              One-Click Demo Profiles (Grading & Testing)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoUser('admin@smarttask.com')}
                className={`p-2 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                  email === 'admin@smarttask.com'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <div className="truncate">
                  <p className="font-semibold truncate">Dr. Vikrant</p>
                  <p className="text-[10px] text-slate-400">Admin</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('rahul@smarttask.com')}
                className={`p-2 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                  email === 'rahul@smarttask.com'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                <div className="truncate">
                  <p className="font-semibold truncate">Rahul Sharma</p>
                  <p className="text-[10px] text-slate-400">Employee (CSE)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('priya@smarttask.com')}
                className={`p-2 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                  email === 'priya@smarttask.com'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                <div className="truncate">
                  <p className="font-semibold truncate">Priya Patel</p>
                  <p className="text-[10px] text-slate-400">Employee (CSE)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDemoUser('amit@smarttask.com')}
                className={`p-2 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                  email === 'amit@smarttask.com'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                <div className="truncate">
                  <p className="font-semibold truncate">Amit Tomar</p>
                  <p className="text-[10px] text-slate-400">Employee (IT)</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

