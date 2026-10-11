import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Lock, Smartphone, Key, Copy, Check, AlertCircle, ArrowRight, CheckCircle2, Loader2, LogOut, RefreshCw } from 'lucide-react';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { totpMfaService } from '@/firebase/services/totpMfaService';
import { useAuth } from '@/contexts/AuthContext';

const MandatoryMfaEnrollmentModal = ({ onSuccess }) => {
  const { currentUser, activeRole, userRole, logout } = useAuth();
  const currentRole = activeRole || userRole || 'Faculty';

  // Step state: 'PROMPT' | 'SETUP' | 'SUCCESS'
  const [step, setStep] = useState('PROMPT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Setup data
  const [sessionData, setSessionData] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Verification code digits
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Format role name for presentation
  const roleDisplay = React.useMemo(() => {
    switch (currentRole) {
      case 'admin': return 'Administrator';
      case 'guide': return 'Project Guide';
      case 'classroom_faculty':
      case 'faculty': return 'Classroom Faculty';
      case 'reviewer': return 'Reviewer';
      default: return 'Faculty';
    }
  }, [currentRole]);

  /**
   * Start enrollment flow
   */
  const handleStartSetup = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await totpMfaService.startEnrollment(currentUser);
      setSessionData(data);

      // Generate visual QR code as data URI
      const dataUrl = await QRCode.toDataURL(data.qrCodeUri, {
        width: 220,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
      setStep('SETUP');
    } catch (err) {
      console.error('[MFA_ENROLLMENT] Setup initiation failed:', err);
      setErrorMsg(err.message || 'Unable to complete MFA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle digit inputs
   */
  const handleDigitChange = (index, value) => {
    const val = value.replace(/\D/g, '');
    const newDigits = [...codeDigits];
    newDigits[index] = val ? val.slice(-1) : '';
    setCodeDigits(newDigits);

    // Auto-advance
    if (val && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...codeDigits];
    pasted.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setCodeDigits(newDigits);

    if (inputRefs.current[Math.min(pasted.length, 5)]) {
      inputRefs.current[Math.min(pasted.length, 5)].focus();
    }
  };

  const handleCopyKey = () => {
    if (!sessionData?.manualKey) return;
    navigator.clipboard.writeText(sessionData.manualKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  /**
   * Verify entered code with Firebase Auth
   */
  const handleVerifyCode = async (e) => {
    if (e) e.preventDefault();
    const fullCode = codeDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await totpMfaService.completeEnrollment(currentUser, sessionData.totpSecret, fullCode);
      setStep('SUCCESS');
    } catch (err) {
      console.error('[MFA_ENROLLMENT] Verification failed:', err);
      setErrorMsg(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800 p-6 text-white text-center">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner mb-3">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Secure Your Account</h2>
          <p className="text-xs text-white/80 mt-1">KL CSE Capstone Portal Identity Protection</p>
          
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="primary" className="bg-white/20 text-white border border-white/30 text-[11px] font-semibold">
              {roleDisplay}
            </Badge>
            <span className="text-xs text-white/90 font-mono truncate max-w-[220px]">
              {currentUser?.email}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">

          {errorMsg && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* STATE 1: PROMPT */}
          {step === 'PROMPT' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900">
                  Two-Factor Authentication is Required
                </h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Two-factor authentication is required for this account. Set up an authenticator app to continue.
                </p>
              </div>

              {/* Requirement Checklist */}
              <div className="bg-surface-dim rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="flex items-start gap-3 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Your account requires MFA:</strong> Administrative and evaluator roles handle sensitive academic evaluations and require verified two-factor security.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Setup takes less than a minute:</strong> Simply scan a QR code using your mobile authenticator app.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Compatible Apps:</strong> Google Authenticator, Microsoft Authenticator, Authy, or any standard TOTP app.</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <Button
                  id="mfa-setup-btn"
                  onClick={handleStartSetup}
                  isLoading={loading}
                  fullWidth
                  size="lg"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  Set Up MFA <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Safe Exit: Logout */}
              <div className="text-center pt-1 border-t border-gray-100">
                <button
                  type="button"
                  id="mfa-modal-logout-btn"
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out of this account
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: SETUP FLOW */}
          {step === 'SETUP' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Step 1: Scan QR */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">1</span>
                  <h4 className="text-sm font-bold text-gray-900">Scan this QR code with your authenticator app</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3 ml-7">
                  Open Google Authenticator, Microsoft Authenticator, or Authy on your phone and tap (+) to scan.
                </p>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="TOTP MFA QR Code" 
                      className="w-44 h-44 rounded-lg shadow-sm border border-gray-100 bg-white p-2"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-gray-100 rounded-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                  )}

                  {/* Manual Key Fallback */}
                  <div className="mt-3 text-center w-full">
                    <button
                      type="button"
                      id="mfa-manual-key-toggle-btn"
                      onClick={() => setShowManualKey(prev => !prev)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-semibold focus:outline-none"
                    >
                      {showManualKey ? "Hide setup key" : "Can't scan? Use setup key"}
                    </button>

                    {showManualKey && sessionData?.manualKey && (
                      <div className="mt-2 p-2.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between gap-2 max-w-sm mx-auto">
                        <span id="mfa-manual-key-text" className="font-mono text-xs font-bold text-gray-800 tracking-wider truncate">
                          {sessionData.manualKey}
                        </span>
                        <button
                          type="button"
                          id="mfa-copy-key-btn"
                          onClick={handleCopyKey}
                          className="px-2 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center gap-1 shrink-0"
                          title="Copy setup key"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Verification Code Input */}
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">2</span>
                  <label className="text-sm font-bold text-gray-900">
                    Enter the 6-digit verification code from your authenticator app
                  </label>
                </div>

                <div className="flex justify-between gap-2 ml-7" onPaste={handlePaste}>
                  {codeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`mfa-digit-${idx}`}
                      ref={el => inputRefs.current[idx] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={e => handleDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleDigitKeyDown(idx, e)}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none transition-all shadow-sm"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="pt-2 ml-7 flex items-center gap-3">
                  <Button
                    type="submit"
                    id="mfa-verify-btn"
                    isLoading={loading}
                    disabled={codeDigits.join('').length !== 6 || loading}
                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl shadow-sm"
                  >
                    Verify & Continue
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('PROMPT')}
                    disabled={loading}
                    className="text-gray-600 border-gray-300"
                  >
                    Back
                  </Button>
                </div>
              </form>

            </div>
          )}

          {/* STATE 3: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-6 py-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Two-Factor Authentication Enabled
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Your account is now protected with MFA.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  On future logins, you will be prompted for your authenticator app code.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  id="mfa-continue-portal-btn"
                  onClick={onSuccess}
                  fullWidth
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  Continue to Portal <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 font-medium">
            Protected by Firebase Native TOTP Authentication • Capstone Portal
          </p>
        </div>

      </div>
    </div>
  );
};

export default MandatoryMfaEnrollmentModal;
