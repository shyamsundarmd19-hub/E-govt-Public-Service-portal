import React, { useState, useEffect } from 'react';
import { FilePlus2, CheckCircle, UploadCloud, AlertCircle, ArrowRight, ArrowLeft, FileText, Check, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { servicesAPI, applicationsAPI, documentsAPI } from '../api/client';

const ApplyServiceView = ({ onApplicationSubmitted, onCancel }) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    applicant_full_name: '',
    parent_or_spouse_name: '',
    annual_income: '',
    residential_address: '',
    district: 'Central',
    identification_number: '',
  });

  // Uploaded files
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    setLoading(true);
    servicesAPI.list()
      .then((res) => {
        setServices(res.data);
        if (res.data.length > 0) setSelectedService(res.data[0]);
      })
      .catch((err) => setError('Could not load service catalog.'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      // 1. Request presigned upload URL
      const presignedRes = await documentsAPI.requestUpload({
        file_name: file.name,
        doc_type: docType,
        content_type: file.type || 'application/pdf',
      });

      const { upload_url, file_key, is_direct_upload } = presignedRes.data;

      // 2. Upload file via presigned or local fallback
      let finalFileUrl = upload_url;
      if (is_direct_upload) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await documentsAPI.uploadLocalFile(file_key, formData);
        finalFileUrl = uploadRes.data.file_url;
      } else {
        // Direct PUT to AWS S3
        await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/pdf',
            'x-amz-server-side-encryption': 'AES256',
          },
          body: file,
        });
        finalFileUrl = `s3://${presignedRes.data.s3_bucket}/${file_key}`;
      }

      setUploadedDocs((prev) => [
        ...prev.filter((d) => d.doc_type !== docType),
        {
          file_name: file.name,
          file_url: finalFileUrl,
          doc_type: docType,
          file_size: file.size,
        },
      ]);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        service_id: selectedService.id,
        applicant_data: formData,
        documents: uploadedDocs,
      };

      const res = await applicationsAPI.create(payload);

      // Trigger Celebration Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#a7f3d0'],
      });

      if (onApplicationSubmitted) {
        onApplicationSubmitted(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Application filing failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
          Citizen e-Services Vault
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Apply for Statutory Government Certificate</h1>
        <p className="text-xs text-slate-500 mt-1">Multi-step verified submission under Public Service Delivery Guarantee</p>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { num: 1, label: 'Select Service' },
          { num: 2, label: 'Applicant Details' },
          { num: 3, label: 'Upload Documents' },
          { num: 4, label: 'Review & Submit' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
            {s.num < 4 && <div className="w-6 h-0.5 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step Container Card */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-soft-mint p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {step === 1 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">Choose Public Service:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                return (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedService(svc)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400/40 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {svc.department}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{svc.sla_days} Days SLA</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-2">{svc.name}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{svc.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      Requires: {svc.required_documents?.length || 0} proofs
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedService}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                Proceed to Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Applicant Data */}
        {step === 2 && (
          <div>
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 mb-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-700 font-semibold">Service Selected:</span>
                <h4 className="font-bold text-slate-900 text-base">{selectedService?.name}</h4>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-full">
                SLA: {selectedService?.sla_days} Days
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={formData.applicant_full_name}
                  onChange={(e) => setFormData({ ...formData, applicant_full_name: e.target.value })}
                  placeholder="As per Government ID"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Father / Spouse Full Name</label>
                <input
                  type="text"
                  value={formData.parent_or_spouse_name}
                  onChange={(e) => setFormData({ ...formData, parent_or_spouse_name: e.target.value })}
                  placeholder="Parent / Spouse Legal Name"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Annual Household Income (₹)</label>
                <input
                  type="number"
                  value={formData.annual_income}
                  onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                  placeholder="e.g. 450000"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrative District</label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Central">Central District</option>
                  <option value="North">North District</option>
                  <option value="South">South District</option>
                  <option value="East">East District</option>
                  <option value="West">West District</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Street Address</label>
                <textarea
                  rows={2}
                  value={formData.residential_address}
                  onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                  placeholder="Plot/Flat number, Street, Landmark, Pin code"
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Change Service
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                Document Uploads <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Document Vault Uploads */}
        {step === 3 && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">Document Vault Uploads</h3>
              <p className="text-xs text-slate-500">
                Uploaded attachments are stored in the AWS S3 Encrypted Vault (SSE-S3 AES-256).
              </p>
            </div>

            <div className="space-y-4">
              {(selectedService?.required_documents || ['Identity Proof', 'Address Proof']).map((reqDoc, idx) => {
                const uploaded = uploadedDocs.find((d) => d.doc_type === reqDoc);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-xs text-slate-800">{reqDoc}</span>
                        {uploaded && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Uploaded
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {uploaded ? uploaded.file_name : 'Format: PDF or JPG (Max 25MB)'}
                      </p>
                    </div>

                    <div>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                        <UploadCloud className="w-4 h-4" />
                        {uploaded ? 'Replace File' : 'Upload to Vault'}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => handleFileUpload(e, reqDoc)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                Review Application <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <div>
            <div className="text-center p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 mb-6">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Statutory Undertaking & Review</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto">
                Please verify your details. Once submitted, your application is encrypted, assigned an immutable tracking number, and routed to the department desk.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
              <div>
                <span className="text-slate-500 block">Service Name</span>
                <span className="font-bold text-slate-900 text-sm">{selectedService?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department</span>
                <span className="font-bold text-slate-900 text-sm">{selectedService?.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Applicant Name</span>
                <span className="font-semibold text-slate-800">{formData.applicant_full_name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">District</span>
                <span className="font-semibold text-slate-800">{formData.district}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Uploaded Attachments</span>
                <span className="font-semibold text-emerald-800">{uploadedDocs.length} files attached</span>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Edit Details
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitApplication}
                className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting to Registry...' : 'Submit Official Application'}
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyServiceView;
