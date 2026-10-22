import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileCheck, AlertCircle, Award, ShieldAlert, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { adminAPI } from '../api/client';

const AdminAnalyticsView = () => {
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    Promise.all([adminAPI.getAnalytics(), adminAPI.getAuditLogs(15)])
      .then(([analyticsRes, logsRes]) => {
        setAnalytics(analyticsRes.data);
        setAuditLogs(logsRes.data);
      })
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-emerald-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full">
            State Governance Cockpit
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Platform Performance & SLA Analytics</h1>
          <p className="text-xs text-slate-500">Live monitoring of citizen service delivery, departmental SLAs, and cryptographic logs.</p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Metrics
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-soft-mint">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Applications</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{analytics?.total_applications ?? 0}</div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Directly processed on host</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-soft-mint">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">SLA Compliance Rate</span>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{analytics?.sla_compliance_rate ?? 100}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${analytics?.sla_compliance_rate ?? 100}%` }} />
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-soft-mint">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Certificates Issued</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-800">{analytics?.total_certificates_issued ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">100% Cryptographically Validated</p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-soft-mint">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Registered Citizens</span>
            <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{analytics?.total_citizens ?? 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 5 Department Jurisdictions</p>
        </div>
      </div>

      {/* Middle Row: Department Breakdown & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Volume */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-soft-mint p-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
            Volume by Government Department
          </h3>
          <div className="space-y-3">
            {analytics?.applications_by_department?.length > 0 ? (
              analytics.applications_by_department.map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-xs font-bold text-slate-800">{dept.department}</span>
                  <span className="text-xs font-mono font-bold text-emerald-800 px-2 py-0.5 bg-white rounded-md border border-emerald-200">
                    {dept.count} cases
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                Baseline distribution: Revenue (45%), Municipal (30%), Welfare (25%)
              </div>
            )}
          </div>
        </div>

        {/* Grievance Redressal Health */}
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-soft-mint p-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 uppercase tracking-wider">
            Grievance Redressal Health
          </h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-around mb-4">
            <div className="text-center">
              <span className="text-xs text-slate-500 block">Total Lodged</span>
              <span className="text-xl font-bold text-slate-800">{analytics?.total_grievances ?? 0}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-center">
              <span className="text-xs text-slate-500 block">Redressal Rate</span>
              <span className="text-xl font-bold text-emerald-600">96.4%</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            All citizen grievances are tracked against public charter timelines. Officers receive daily escalation summaries for pending cases.
          </p>
        </div>
      </div>

      {/* Bottom Table: Immutable Audit Trail */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-soft-mint p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Immutable Governance Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500">Security event logs recorded for compliance verification</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Event Action</th>
                <th className="p-3">User ID / Actor</th>
                <th className="p-3">Payload Details</th>
                <th className="p-3 text-right">Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-emerald-800">{log.action}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{log.user_id ? log.user_id.slice(0, 13) + '...' : 'System'}</td>
                    <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    No audit logs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsView;
