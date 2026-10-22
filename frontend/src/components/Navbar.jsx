import React, { useState } from 'react';
import { ShieldCheck, LogOut, User as UserIcon, LayoutDashboard, FilePlus2, CheckCircle, AlertTriangle, BarChart3, Menu, X, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout, isCitizen, isOfficer, isClerk, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">ADMIN</span>;
      case 'officer':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">OFFICER</span>;
      case 'clerk':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">CLERK</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">CITIZEN</span>;
    }
  };

  const navItem = (tabId, label, Icon) => {
    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => {
          setActiveTab(tabId);
          setMobileMenuOpen(false);
        }}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
          isActive
            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
            : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(isCitizen ? 'dashboard' : isStaff ? 'officer-queue' : 'public-verify')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 border border-emerald-400/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-emerald-950">CloudGov</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">AWS t2</span>
              </div>
              <p className="text-[11px] font-medium text-emerald-700/80 -mt-0.5">National e-Governance Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isCitizen && (
              <>
                {navItem('dashboard', 'Citizen Portal', LayoutDashboard)}
                {navItem('apply', 'Apply Service', FilePlus2)}
                {navItem('grievances', 'Lodge Grievance', AlertTriangle)}
              </>
            )}

            {(isOfficer || isClerk) && (
              <>
                {navItem('officer-queue', 'Officer Desk', CheckCircle)}
                {navItem('grievances', 'Grievance Resolution', AlertTriangle)}
              </>
            )}

            {isAdmin && (
              <>
                {navItem('officer-queue', 'Work Queue', CheckCircle)}
                {navItem('admin-analytics', 'State Analytics', BarChart3)}
                {navItem('grievances', 'Grievances', AlertTriangle)}
              </>
            )}

            {navItem('public-verify', 'Public QR Verify', QrCode)}
          </nav>

          {/* Right User Bar */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-emerald-100">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{user.name}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <span className="text-[10px] text-slate-500">{user.email}</span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('auth')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30"
              >
                <UserIcon className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white p-4 space-y-2">
          {isCitizen && (
            <>
              {navItem('dashboard', 'Citizen Portal', LayoutDashboard)}
              {navItem('apply', 'Apply Service', FilePlus2)}
              {navItem('grievances', 'Lodge Grievance', AlertTriangle)}
            </>
          )}

          {(isOfficer || isClerk) && (
            <>
              {navItem('officer-queue', 'Officer Desk', CheckCircle)}
              {navItem('grievances', 'Grievance Resolution', AlertTriangle)}
            </>
          )}

          {isAdmin && (
            <>
              {navItem('officer-queue', 'Work Queue', CheckCircle)}
              {navItem('admin-analytics', 'State Analytics', BarChart3)}
              {navItem('grievances', 'Grievances', AlertTriangle)}
            </>
          )}

          {navItem('public-verify', 'Public QR Verify', QrCode)}

          {user && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="text-xs font-bold text-rose-600 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
