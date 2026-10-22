import React, { useState } from 'react';
import { Award, Download, ExternalLink, QrCode, ShieldCheck, Copy, Check } from 'lucide-react';
import { verifyAPI } from '../api/client';

const CertificateCard = ({ certificate, applicantName, serviceName, onOpenVerify }) => {
  const [copied, setCopied] = useState(false);

  if (!certificate) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.hash_signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadUrl = verifyAPI.getDownloadUrl(certificate.certificate_number);

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-200/90 shadow-soft-mint overflow-hidden relative">
      {/* Top Emerald Header Ribbon */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900/50 rounded-xl border border-emerald-500/30">
            <Award className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h4 className="font-bold text-sm tracking-wide">DIGITAL CERTIFICATE OF COMPLIANCE</h4>
            <p className="text-xs text-emerald-200">National e-Governance Cryptographic Registry</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-xs font-semibold text-emerald-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          CRYPTOGRAPHICALLY SIGNED
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* QR Code and Scan info */}
          <div className="flex flex-col items-center p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            {certificate.qr_code_url ? (
              <img
                src={certificate.qr_code_url}
                alt="Verification QR Code"
                className="w-32 h-32 rounded-lg border border-emerald-200 shadow-sm bg-white p-1"
              />
            ) : (
              <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center border border-emerald-200">
                <QrCode className="w-12 h-12 text-emerald-600" />
              </div>
            )}
            <span className="text-[11px] font-semibold text-emerald-800 mt-2 text-center">
              Scan to Verify Authenticity
            </span>
            <button
              onClick={() => onOpenVerify && onOpenVerify(certificate.certificate_number)}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
            >
              Public Verify Link <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Certificate metadata */}
          <div className="md:col-span-2 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Issued</span>
              <h3 className="text-lg font-bold text-slate-900">{serviceName || 'Statutory Government Certificate'}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Certificate Identifier</span>
                <span className="font-mono font-bold text-emerald-800 text-sm">{certificate.certificate_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date of Issue</span>
                <span className="font-semibold text-slate-800">
                  {new Date(certificate.issued_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Beneficiary / Holder</span>
                <span className="font-semibold text-slate-800">{applicantName || 'Verified Citizen'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Issuing Authority</span>
                <span className="font-semibold text-slate-800">{certificate.issuer_name}</span>
              </div>
            </div>

            {/* SHA-256 Hash Display */}
            <div className="pt-2 border-t border-emerald-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Cryptographic SHA-256 Digest:</span>
                <button
                  onClick={handleCopyHash}
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg break-all select-all">
                {certificate.hash_signature}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                Download Official PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
