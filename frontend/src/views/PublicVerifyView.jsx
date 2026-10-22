import React, { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Search, Award, CheckCircle2, Download, ExternalLink, Hash, Calendar, Building2, User } from 'lucide-react';
import { verifyAPI } from '../api/client';

const PublicVerifyView = ({ initialCertId }) => {
  const [certInput, setCertInput] = useState(initialCertId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performVerification = async (idToVerify) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await verifyAPI.verifyCertificate(idToVerify.trim());
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({
        valid: false,
        status: 'ERROR',
        message: 'Could not contact the national registry server. Please check your internet connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      performVerification(initialCertId);
    }
  }, [initialCertId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performVerification(certInput);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Top Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 border border-emerald-400">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full">
          Public e-Registry
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">National Certificate Verification Portal</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Verify digital authenticity, statutory validity, and cryptographic SHA-256 signatures of government instruments.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="flex gap-2 p-2 bg-white rounded-2xl border-2 border-emerald-200 shadow-soft-mint focus-within:border-emerald-500 transition-all">
          <input
            type="text"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            placeholder="Enter Certificate Number (e.g. CG-PUB-2026-967874) or Scan QR..."
            className="flex-1 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !certInput.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Verify Instrument'}
          </button>
        </div>
      </form>

      {/* Verification Result Card */}
      {searched && verificationResult && (
        <div className="animate-fade-in">
          {verificationResult.valid ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-400 shadow-xl overflow-hidden">
              {/* Green Verified Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-6 text-white text-center">
                <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black tracking-wide uppercase">Digitally Authentic & Verified</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Official Record Confirmed by Government of Digital State
                </p>
              </div>

              {/* Certificate Verification Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Certificate Identifier:</span>
                    <p className="text-base font-mono font-extrabold text-emerald-950">
                      {verificationResult.certificate_number}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-extrabold rounded-full">
                    ACTIVE & BINDING
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                      <Award className="w-3.5 h-3.5 text-emerald-700" /> Statutory Service
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{verificationResult.service_name}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-emerald-700" /> Beneficiary Holder
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{verificationResult.applicant_name}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" /> Date & Time of Issuance
                    </span>
                    <span className="font-semibold text-slate-800">
                      {verificationResult.issued_at
                        ? new Date(verificationResult.issued_at).toLocaleString()
                        : 'Official Record'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" /> Issuing Authority
                    </span>
                    <span className="font-semibold text-slate-800">{verificationResult.issuer_name}</span>
                  </div>
                </div>

                {/* Cryptographic SHA-256 Digest Verification */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Hash className="w-4 h-4" /> Cryptographic Integrity Fingerprint:
                    </span>
                    <span className="text-[10px] text-slate-400">SHA-256 Matching</span>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 break-all select-all bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {verificationResult.hash_signature}
                  </div>
                </div>

                {/* PDF Download Button */}
                <div className="flex justify-center pt-2">
                  <a
                    href={verifyAPI.getDownloadUrl(verificationResult.certificate_number)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Official Stamped PDF Certificate
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Fraud / Not Found Warning */
            <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-xl overflow-hidden p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-rose-900 uppercase">Verification Failed: Unrecognized Instrument</h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                {verificationResult.message || 'No matching record exists in the Central Electronic Governance Registry.'}
              </p>
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs inline-block">
                Caution: If presented with a physical copy bearing this identifier, report it to the Anti-Fraud Vigilance Wing.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicVerifyView;
