import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, FileText, ExternalLink, ShieldAlert, Send } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ReviewModal = ({ application, isOpen, onClose, onUpdateStatus }) => {
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleAction = async (newStatus) => {
    if (newStatus === 'rejected' && !remarks.trim()) {
      alert('Please specify the reason for rejection in the remarks field.');
      return;
    }
    setSubmitting(true);
    try {
      await onUpdateStatus(application.id, newStatus, remarks);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const applicant = application.applicant || {};
  const service = application.service || {};
  const applicantData = application.applicant_data || {};
  const documents = application.documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-emerald-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700/50 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Application Review Desk</h3>
              <p className="text-xs text-emerald-200">{application.application_number} • {service.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status & Citizen Summary */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Applicant Name</span>
              <p className="font-bold text-slate-800 text-base">{applicant.name || 'Citizen'}</p>
              <p className="text-xs text-slate-600">{applicant.email} • {applicant.phone || 'No phone recorded'}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block mb-1">Current Status</span>
              <StatusBadge status={application.status} />
            </div>
          </div>

          {/* Form Application Attributes */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Citizen Declarations & Form Fields
            </h4>
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              {Object.entries(applicantData).length > 0 ? (
                Object.entries(applicantData).map(([k, v]) => (
                  <div key={k} className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 capitalize block">{k.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-800">{String(v)}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-slate-500 italic p-2">Standard application baseline data recorded.</div>
              )}
            </div>
          </div>

          {/* Uploaded Documents Vault */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Attached Documents ({documents.length})
            </h4>
            <div className="space-y-2">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-white border border-emerald-100 rounded-xl flex items-center justify-between hover:bg-emerald-50/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-slate-800">{doc.file_name}</p>
                        <p className="text-[11px] text-slate-500">{doc.doc_type}</p>
                      </div>
                    </div>
                    <a
                      href={doc.file_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200"
                    >
                      Inspect <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                  No attachments linked to this application.
                </p>
              )}
            </div>
          </div>

          {/* Official Remarks Input */}
          <div>
            <label className="block font-bold text-xs uppercase tracking-wider text-slate-600 mb-1">
              Officer Remarks & Justification
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Record verification notes, discrepancy details, or approval remarks..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAction('rejected')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject Application
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAction('pending_verification')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Mark Under Review
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleAction('approved')}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Issue Certificate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
