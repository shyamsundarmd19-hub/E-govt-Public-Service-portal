import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const norm = (status || '').toLowerCase();

  if (norm === 'approved' || norm === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        {status.toUpperCase()}
      </span>
    );
  }

  if (norm === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
        <XCircle className="w-3.5 h-3.5 text-rose-600" />
        REJECTED
      </span>
    );
  }

  if (norm === 'pending_verification' || norm === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
        UNDER REVIEW
      </span>
    );
  }

  // submitted or open
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 shadow-sm">
      <AlertCircle className="w-3.5 h-3.5 text-teal-600" />
      SUBMITTED
    </span>
  );
};

export default StatusBadge;
