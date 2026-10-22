import React, { useState, useEffect } from 'react';
import { FilePlus2, RefreshCw, AlertCircle, FileText, Calendar, CheckCircle2, Award, QrCode } from 'lucide-react';
import { applicationsAPI } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import TimelineTracker from '../components/TimelineTracker';
import CertificateCard from '../components/CertificateCard';

const CitizenDashboard = ({ onApplyClick, onOpenVerify }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchApplications = () => {
    setLoading(true);
    applicationsAPI.list()
      .then((res) => {
        setApplications(res.data);
        if (res.data.length > 0 && !selectedApp) {
          setSelectedApp(res.data[0]);
        } else if (selectedApp) {
          // Keep current selection updated
          const updated = res.data.find((a) => a.id === selectedApp.id);
          if (updated) setSelectedApp(updated);
        }
      })
      .catch((err) => setError('Failed to load applications.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-emerald-100 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Citizen Dashboard
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">My Government Services & Applications</h1>
          <p className="text-xs text-slate-500">Track real-time departmental progress, verification logs, and digital certificates.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onApplyClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
          >
            <FilePlus2 className="w-4 h-4" /> Apply for New Service
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Grid: Applications List & Details Tracker */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Applications List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Submitted Applications ({applications.length})
            </h3>
          </div>

          {loading && applications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-emerald-100">
              Loading your applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-emerald-100/80 shadow-soft-mint">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">No applications filed yet</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">You have not submitted any service applications.</p>
              <button
                onClick={onApplyClick}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Start New Application
              </button>
            </div>
          ) : (
            applications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const service = app.service || {};
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-400/30 shadow-md shadow-emerald-500/10'
                      : 'bg-white border-slate-200/90 hover:border-emerald-200 hover:bg-emerald-50/20 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{app.application_number}</span>
                    <StatusBadge status={app.status} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2">{service.name || 'Government Service'}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{service.department || 'General Administration'}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </span>
                    {app.certificate && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Certificate Ready
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Application Timeline & Certificate */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApp ? (
            <>
              {/* Timeline Card */}
              <div className="bg-white rounded-3xl border border-emerald-100/90 shadow-soft-mint p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Tracking Number:</span>
                    <h3 className="font-mono font-bold text-slate-900 text-lg">{selectedApp.application_number}</h3>
                    <p className="text-xs text-emerald-800 font-semibold">{selectedApp.service?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedApp.status} />
                  </div>
                </div>

                {/* 4-Stage Visual Tracker */}
                <div className="my-4">
                  <TimelineTracker
                    status={selectedApp.status}
                    hasCertificate={!!selectedApp.certificate}
                    submittedAt={selectedApp.submitted_at}
                    updatedAt={selectedApp.updated_at}
                    remarks={selectedApp.remarks}
                  />
                </div>
              </div>

              {/* Digital Certificate Section (if issued) */}
              {selectedApp.certificate && (
                <div className="animate-fade-in">
                  <CertificateCard
                    certificate={selectedApp.certificate}
                    applicantName={selectedApp.applicant?.name}
                    serviceName={selectedApp.service?.name}
                    onOpenVerify={onOpenVerify}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-emerald-100 shadow-soft-mint">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Select an application from the list to track departmental lifecycle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
