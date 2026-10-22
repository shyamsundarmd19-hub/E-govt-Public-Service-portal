import React, { useState, useEffect } from 'react';
import { CheckCircle, Filter, Search, RefreshCw, FileText, ExternalLink, Award, Clock } from 'lucide-react';
import { applicationsAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import ReviewModal from '../components/ReviewModal';

const OfficerQueueView = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchQueue = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    applicationsAPI.list(params)
      .then((res) => setApplications(res.data))
      .catch((err) => console.error('Failed to load queue:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleUpdateStatus = async (appId, newStatus, remarks) => {
    await applicationsAPI.updateStatus(appId, {
      status: newStatus,
      remarks,
    });
    fetchQueue();
  };

  const filtered = applications.filter((app) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      app.application_number.toLowerCase().includes(term) ||
      (app.applicant?.name || '').toLowerCase().includes(term) ||
      (app.service?.name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-emerald-100 gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Officer Verification Desk
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Application Processing Queue</h1>
          <p className="text-xs text-slate-500">Inspect statutory documentation, record findings, and issue digitally signed certificates.</p>
        </div>

        <button
          onClick={fetchQueue}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-soft-mint mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Tracking ID, Citizen, Service..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: '', label: 'All Queue' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'pending_verification', label: 'Under Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-soft-mint overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-emerald-50/60 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-emerald-100">
              <tr>
                <th className="p-4">Tracking Number</th>
                <th className="p-4">Citizen Name</th>
                <th className="p-4">Service & Dept</th>
                <th className="p-4">Submitted At</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Desk Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading queue applications...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No applications matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-900">{app.application_number}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{app.applicant?.name || 'Citizen'}</div>
                      <div className="text-[11px] text-slate-500">{app.applicant?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{app.service?.name}</div>
                      <div className="text-[11px] text-emerald-800">{app.service?.department}</div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl text-xs transition-colors"
                      >
                        Inspect & Review <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={modalOpen}
        application={selectedApp}
        onClose={() => setModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default OfficerQueueView;
