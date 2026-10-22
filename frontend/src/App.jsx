import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthView from './views/AuthView';
import CitizenDashboard from './views/CitizenDashboard';
import ApplyServiceView from './views/ApplyServiceView';
import GrievancesView from './views/GrievancesView';
import OfficerQueueView from './views/OfficerQueueView';
import AdminAnalyticsView from './views/AdminAnalyticsView';
import PublicVerifyView from './views/PublicVerifyView';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { user, isAuthenticated, isCitizen, isStaff, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [verifyCertId, setVerifyCertId] = useState('');

  // Check URL pathname for direct verification links (e.g. /verify/certificate/CG-PUB-2026-XXXXXX)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/verify/certificate/')) {
      const id = path.split('/verify/certificate/')[1];
      if (id) {
        setVerifyCertId(id);
        setActiveTab('public-verify');
      }
    } else if (path.includes('/verify')) {
      setActiveTab('public-verify');
    }
  }, []);

  // Update default tab based on logged-in user role
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        setActiveTab('admin-analytics');
      } else if (isStaff) {
        setActiveTab('officer-queue');
      } else {
        setActiveTab('dashboard');
      }
    } else if (activeTab !== 'public-verify') {
      setActiveTab('auth');
    }
  }, [isAuthenticated, user?.role]);

  const handleOpenVerify = (certNumber) => {
    setVerifyCertId(certNumber);
    setActiveTab('public-verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplicationSubmitted = (newApp) => {
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-800 flex flex-col font-sans">
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'auth' && (
          <AuthView onLoginSuccess={() => {}} />
        )}

        {activeTab === 'dashboard' && isAuthenticated && (
          <CitizenDashboard
            onApplyClick={() => setActiveTab('apply')}
            onOpenVerify={handleOpenVerify}
          />
        )}

        {activeTab === 'apply' && isAuthenticated && (
          <ApplyServiceView
            onApplicationSubmitted={handleApplicationSubmitted}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'grievances' && isAuthenticated && (
          <GrievancesView />
        )}

        {activeTab === 'officer-queue' && isAuthenticated && (
          <OfficerQueueView />
        )}

        {activeTab === 'admin-analytics' && isAuthenticated && (
          <AdminAnalyticsView />
        )}

        {activeTab === 'public-verify' && (
          <PublicVerifyView initialCertId={verifyCertId} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-emerald-950">
            CloudGov National Platform • Built for AWS Free Tier Architecture
          </p>
          <div className="flex items-center gap-4 text-emerald-800 font-medium">
            <span>Direct Systemd Host</span>
            <span>•</span>
            <span>Nginx Reverse Proxy</span>
            <span>•</span>
            <span>SSE-S3 Cryptographic Vault</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
