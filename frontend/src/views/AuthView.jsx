import React, { useState } from 'react';
import { ShieldCheck, UserCheck, KeyRound, Mail, Lock, Phone, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthView = ({ onLoginSuccess }) => {
  const { login, register, quickDemoLogin, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('citizen');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register({ ...formData, role });
      } else {
        await login(formData.email, formData.password);
      }
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleDemo = async (targetRole) => {
    setError('');
    try {
      await quickDemoLogin(targetRole);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError('Demo login failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 px-4">
      <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-soft-mint overflow-hidden">
        {/* Card Header */}
        <div className="p-6 bg-gradient-to-b from-emerald-500/10 to-transparent text-center border-b border-emerald-50">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 border border-emerald-400/40">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">CloudGov National Portal</h2>
          <p className="text-xs text-emerald-800 font-medium mt-1">Single Sign-On & Digital Citizen Identification</p>

          {/* Quick Demo Login Bar */}
          <div className="mt-4 pt-3 border-t border-emerald-100/80">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 1-Click Sandbox Fast Login:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemo('citizen')}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-100/70 hover:bg-emerald-200 text-emerald-900 transition-colors"
              >
                👤 Citizen
              </button>
              <button
                type="button"
                onClick={() => handleDemo('officer')}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-100/70 hover:bg-blue-200 text-blue-900 transition-colors"
              >
                ⚖️ Officer
              </button>
              <button
                type="button"
                onClick={() => handleDemo('admin')}
                className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-100/70 hover:bg-purple-200 text-purple-900 transition-colors"
              >
                👑 Admin
              </button>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-emerald-100">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${
              !isRegister ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Citizen / Staff Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold text-center transition-colors ${
              isRegister ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New Citizen Registration
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {isRegister && (
            <>
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['citizen', 'clerk', 'officer'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                        role === r
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Official / Personal Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@domain.gov / user@email.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Complete Registration' : 'Authenticate to Portal'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-4 bg-emerald-50/40 border-t border-emerald-100 text-center">
          <p className="text-[11px] text-emerald-800">
            Protected by CloudGov Cryptographic Identity • AWS Free Tier Ready
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
