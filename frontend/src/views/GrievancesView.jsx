import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, CheckCircle2, Clock, Check, RefreshCw, MessageSquare } from 'lucide-react';
import { grievancesAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const GrievancesView = () => {
  const { isStaff, user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    department: 'Revenue',
    subject: '',
    description: '',
    priority: 'medium',
  });

  // Resolution modal for staff
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  const fetchGrievances = () => {
    setLoading(true);
    grievancesAPI.list()
      .then((res) => setGrievances(res.data))
      .catch((err) => setError('Could not load grievances.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await grievancesAPI.create(formData);
      setSuccess('Grievance logged successfully. A confirmation tracking number has been issued.');
      setFormData({ department: 'Revenue', subject: '', description: '', priority: 'medium' });
      fetchGrievances();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id, newStatus) => {
    try {
      await grievancesAPI.updateStatus(id, {
        status: newStatus,
        resolution_remarks: resolutionRemarks,
      });
      setResolvingId(null);
      setResolutionRemarks('');
      fetchGrievances();
    } catch (err) {
      alert('Error updating grievance: ' + (err.response?.data?.detail || err.message));
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200">LOW</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-emerald-100 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Public Grievance Redressal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Grievances & Citizen Appeals</h1>
          <p className="text-xs text-slate-500">Fast-track redressal mechanism with SLA accountability.</p>
        </div>
        <button
          onClick={fetchGrievances}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Filing Form (Visible to citizen or all) */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-soft-mint p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Lodge Official Grievance</h3>
              <p className="text-[11px] text-slate-500">Directly routed to Department Officer</p>
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">{error}</div>}
          {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="Revenue">Department of Revenue</option>
                <option value="Municipal Corporation">Municipal Corporation</option>
                <option value="Social Welfare">Social Welfare</option>
                <option value="Public Health">Public Health & Sanitation</option>
                <option value="Urban Planning">Urban Planning & Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`py-1.5 rounded-lg font-bold uppercase text-[10px] border transition-all ${
                      formData.priority === p
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject Title</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Delay in verification of Income Certificate"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
              <textarea
                rows={4}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="State the application number, dates, and issues encountered..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Register Grievance Ticket'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Column: Grievance Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Registered Grievances ({grievances.length})
          </h3>

          {loading && grievances.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-emerald-100">
              Loading grievances...
            </div>
          ) : grievances.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-emerald-100 shadow-soft-mint text-xs text-slate-500">
              No grievances on record. Everything is running smoothly!
            </div>
          ) : (
            grievances.map((grv) => (
              <div
                key={grv.id}
                className="p-5 bg-white rounded-2xl border border-emerald-100/90 shadow-soft-mint space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-slate-500">{grv.grievance_number}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">{grv.subject || 'Grievance'}</h4>
                    <p className="text-xs text-emerald-800 font-medium">{grv.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(grv.priority)}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      grv.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : grv.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {grv.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  {grv.description}
                </p>

                {grv.resolution_remarks && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                    <span className="font-bold">Official Resolution:</span> {grv.resolution_remarks}
                  </div>
                )}

                {/* Staff Action Button */}
                {isStaff && grv.status !== 'resolved' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {resolvingId === grv.id ? (
                      <div className="w-full space-y-2 pt-2">
                        <textarea
                          rows={2}
                          value={resolutionRemarks}
                          onChange={(e) => setResolutionRemarks(e.target.value)}
                          placeholder="Type officer resolution remarks..."
                          className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setResolvingId(null)}
                            className="px-3 py-1 text-xs border border-slate-200 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResolve(grv.id, 'resolved')}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm"
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setResolvingId(grv.id); setResolutionRemarks(''); }}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition-colors"
                      >
                        Resolve Grievance
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GrievancesView;
