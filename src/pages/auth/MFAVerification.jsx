import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, RefreshCw, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/common/Button';

const MFAVerification = () => {
  const { currentUser, activeRole, verifyMfaOTP, requestMfaOTP, lastGeneratedOtp } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Redirect if not logged in or already verified
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleInputChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the security verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetPath = await verifyMfaOTP(fullOtp, rememberDevice);
      setSuccessMsg('Security code verified! Loading workspace...');
      setTimeout(() => {
        navigate(targetPath || '/');
      }, 800);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await requestMfaOTP();
      setTimeLeft(300);
      setOtp(['', '', '', '', '', '']);
      setSuccessMsg('A new 6-digit verification code has been generated and sent.');
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate a new verification code.');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Header Branding */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary-600/10 rounded-2xl border border-primary-500/20 shadow-xl backdrop-blur-sm">
            <ShieldCheck className="w-12 h-12 text-primary-400" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Identity Security Verification
        </h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Privileged Account Protection for <span className="font-semibold text-white">{currentUser?.email}</span>
        </p>

        {/* Demo OTP Helper Pill */}
        {lastGeneratedOtp && (
          <div className="mt-4 mx-auto w-fit bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
            <span>Demo Security Code:</span>
            <span className="text-sm tracking-wider underline">{lastGeneratedOtp}</span>
          </div>
        )}

      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          
          <form onSubmit={handleVerify} className="space-y-6">
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* OTP Input Boxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 text-center uppercase tracking-wider mb-4">
                Enter 6-Digit Verification Code
              </label>
              
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={e => handleInputChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold text-white bg-slate-900/80 border border-slate-600 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 focus:outline-none transition-all"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Timer & Resend */}
            <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
              <span>
                Code expires in: <strong className="text-white font-mono">{formatTime(timeLeft)}</strong>
              </span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-primary-400 hover:text-primary-300 font-semibold flex items-center gap-1 disabled:opacity-50 focus:outline-none"
              >
                {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Resend Code
              </button>
            </div>

            {/* Trust Device Checkbox */}
            <div className="pt-2 border-t border-slate-700/50">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={e => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 text-primary-600 focus:ring-primary-500 bg-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-300 group-hover:text-white transition-colors">
                  Trust this device for 30 days (Bypass OTP on this browser)
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                isLoading={loading}
                fullWidth
                size="lg"
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                Verify & Proceed <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

          </form>

        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Protected by Enterprise Identity Security • Capstone System v2.0
        </p>

      </div>
    </div>
  );
};

export default MFAVerification;
