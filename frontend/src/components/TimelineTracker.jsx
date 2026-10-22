import React from 'react';
import { Check, Clock, FileCheck2, Award, X } from 'lucide-react';

const stages = [
  { id: 'submitted', label: 'Application Filed', icon: Clock },
  { id: 'pending_verification', label: 'Clerk Verification', icon: FileCheck2 },
  { id: 'approved', label: 'Officer Decision', icon: Check },
  { id: 'certificate', label: 'Digital Certificate', icon: Award },
];

const TimelineTracker = ({ status, hasCertificate, submittedAt, updatedAt, remarks }) => {
  const norm = (status || '').toLowerCase();
  const isRejected = norm === 'rejected';

  const getStageIndex = () => {
    if (isRejected) return 2; // Failed at decision stage
    if (hasCertificate) return 3;
    if (norm === 'approved') return 2;
    if (norm === 'pending_verification') return 1;
    return 0; // submitted
  };

  const currentIndex = getStageIndex();

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-100 -z-0" />

        {/* Active colored line */}
        <div
          className={`absolute left-6 top-1/2 -translate-y-1/2 h-1 transition-all duration-500 -z-0 ${
            isRejected ? 'bg-rose-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${(currentIndex / (stages.length - 1)) * 90}%` }}
        />

        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isCompleted = idx < currentIndex || (idx === 2 && norm === 'approved') || (idx === 3 && hasCertificate);
          const isCurrent = idx === currentIndex && !hasCertificate;
          const isFailed = isRejected && idx === 2;

          let circleStyle = 'bg-white border-2 border-slate-300 text-slate-400';
          if (isFailed) {
            circleStyle = 'bg-rose-600 border-2 border-rose-200 text-white shadow-md shadow-rose-200';
          } else if (isCompleted) {
            circleStyle = 'bg-emerald-600 border-2 border-emerald-200 text-white shadow-md shadow-emerald-200';
          } else if (isCurrent) {
            circleStyle = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-600 ring-4 ring-emerald-100 animate-pulse';
          }

          return (
            <div key={stage.id} className="flex flex-col items-center relative z-10">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${circleStyle}`}>
                {isFailed ? <X className="w-5 h-5" /> : isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-semibold mt-2 text-center max-w-[85px] leading-tight ${
                isFailed ? 'text-rose-700' : isCompleted || isCurrent ? 'text-emerald-900 font-bold' : 'text-slate-500'
              }`}>
                {isFailed && idx === 2 ? 'Application Rejected' : stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {remarks && (
        <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-950 flex items-start gap-2">
          <span className="font-semibold shrink-0">Official Desk Remarks:</span>
          <span>{remarks}</span>
        </div>
      )}
    </div>
  );
};

export default TimelineTracker;
