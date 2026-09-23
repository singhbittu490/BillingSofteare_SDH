'use client';

import React, { useState, useEffect } from 'react';
import { CustomerRegister } from './CustomerRegister';
import { CustomerOtpVerify } from './CustomerOtpVerify';
import { CustomerLogin } from './CustomerLogin';
import { CustomerForgotPassword } from './CustomerForgotPassword';
import { CustomerDashboard } from './CustomerDashboard';
import { AdminCustomerPanel } from './AdminCustomerPanel';
import { SetupInstructionsModal } from './SetupInstructionsModal';
import {
  UserPlus,
  LogIn,
  KeyRound,
  ShieldCheck,
  Users,
  FileCode2,
  Sparkles,
  ArrowLeft,
  Server,
  Lock,
} from 'lucide-react';

export type PortalScreen =
  | 'REGISTER'
  | 'VERIFY_OTP'
  | 'LOGIN'
  | 'FORGOT_PASSWORD'
  | 'DASHBOARD'
  | 'ADMIN_MANAGEMENT';

interface CustomerPortalViewProps {
  onBackToErp?: () => void;
  defaultScreen?: PortalScreen;
}

export function CustomerPortalView({ onBackToErp, defaultScreen = 'REGISTER' }: CustomerPortalViewProps) {
  const [currentScreen, setCurrentScreen] = useState<PortalScreen>(defaultScreen);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [pendingVerificationData, setPendingVerificationData] = useState<{
    customerId: number;
    email: string;
    maskedMobile: string;
  } | null>(null);

  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check if customer already has an active session cookie
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await fetch('/api/customer/profile');
        const data = await res.json();
        if (data.success && data.customer) {
          setActiveCustomer(data.customer);
          setCurrentScreen('DASHBOARD');
        }
      } catch {
        // No active session
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkActiveSession();
  }, []);

  const handleRegisterSuccess = (data: { customerId: number; email: string; maskedMobile: string }) => {
    setPendingVerificationData(data);
    setCurrentScreen('VERIFY_OTP');
  };

  const handleMobileVerified = (customerCode: string) => {
    setCurrentScreen('LOGIN');
  };

  const handleLoginSuccess = (customer: any) => {
    setActiveCustomer(customer);
    setCurrentScreen('DASHBOARD');
  };

  const handleNeedsVerification = (data: { customerId: number; maskedMobile: string; email: string }) => {
    setPendingVerificationData(data);
    setCurrentScreen('VERIFY_OTP');
  };

  const handleLogout = () => {
    setActiveCustomer(null);
    setCurrentScreen('LOGIN');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToErp && (
              <button
                type="button"
                onClick={onBackToErp}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to ERP</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 text-sm tracking-tight">SmartBill</span>
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-black rounded uppercase">
                    Customer Auth Portal
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Mandatory Mobile OTP Verification</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!activeCustomer ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('REGISTER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentScreen === 'REGISTER' || currentScreen === 'VERIFY_OTP'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('LOGIN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentScreen === 'LOGIN' || currentScreen === 'FORGOT_PASSWORD'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentScreen('DASHBOARD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentScreen === 'DASHBOARD'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard ({activeCustomer.customerCode})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentScreen('ADMIN_MANAGEMENT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentScreen === 'ADMIN_MANAGEMENT'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Admin Management</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSetupModal(true)}
              title="View Setup & SMS Credentials Guide"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden lg:inline">Setup &amp; SMS Guide</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        {currentScreen === 'REGISTER' && (
          <CustomerRegister
            onSuccess={handleRegisterSuccess}
            onNavigateLogin={() => setCurrentScreen('LOGIN')}
          />
        )}

        {currentScreen === 'VERIFY_OTP' && (
          <CustomerOtpVerify
            customerId={pendingVerificationData?.customerId || 101}
            email={pendingVerificationData?.email || ''}
            maskedMobile={pendingVerificationData?.maskedMobile || '******1234'}
            onVerified={handleMobileVerified}
            onBackToRegister={() => setCurrentScreen('REGISTER')}
          />
        )}

        {currentScreen === 'LOGIN' && (
          <CustomerLogin
            onLoginSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentScreen('REGISTER')}
            onNavigateForgot={() => setCurrentScreen('FORGOT_PASSWORD')}
            onNeedsVerification={handleNeedsVerification}
          />
        )}

        {currentScreen === 'FORGOT_PASSWORD' && (
          <CustomerForgotPassword onBackToLogin={() => setCurrentScreen('LOGIN')} />
        )}

        {currentScreen === 'DASHBOARD' && (
          <div className="w-full">
            <CustomerDashboard initialCustomer={activeCustomer} onLogout={handleLogout} />
          </div>
        )}

        {currentScreen === 'ADMIN_MANAGEMENT' && (
          <div className="w-full">
            <AdminCustomerPanel />
          </div>
        )}
      </main>

      {/* Setup Documentation Modal */}
      {showSetupModal && <SetupInstructionsModal onClose={() => setShowSetupModal(false)} />}
    </div>
  );
}
