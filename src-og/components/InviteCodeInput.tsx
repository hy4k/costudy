import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { validateInviteCode, ValidateResult } from '../services/inviteService';

interface InviteCodeInputProps {
  onValidCode: (code: string, ownerId: string) => void;
  onInvalidCode?: () => void;
  initialCode?: string; // From URL param
  required?: boolean;
}

export const InviteCodeInput: React.FC<InviteCodeInputProps> = ({
  onValidCode,
  onInvalidCode,
  initialCode = '',
  required = true
}) => {
  const [code, setCode] = useState(initialCode);
  const [validation, setValidation] = useState<ValidateResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [touched, setTouched] = useState(false);

  // Auto-validate if initial code provided
  useEffect(() => {
    if (initialCode) {
      checkCode(initialCode);
    }
  }, [initialCode]);

  const checkCode = async (codeToCheck: string) => {
    if (!codeToCheck || codeToCheck.length < 6) {
      setValidation(null);
      return;
    }

    setChecking(true);
    const result = await validateInviteCode(codeToCheck);
    setValidation(result);
    setChecking(false);

    if (result.valid && result.owner_id) {
      onValidCode(codeToCheck.toUpperCase(), result.owner_id);
    } else {
      onInvalidCode?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    setTouched(true);

    // Auto-check when 6 characters entered
    if (value.length === 6) {
      checkCode(value);
    } else {
      setValidation(null);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (code.length === 6) {
      checkCode(code);
    }
  };

  const isValid = validation?.valid === true;
  const isInvalid = touched && validation?.valid === false;
  const isEmpty = touched && !code && required;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-slate-700">
        Invite Code {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={code}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="XXXXXX"
          maxLength={6}
          className={`
            w-full px-4 py-3 text-center text-xl font-mono font-bold tracking-[0.3em] uppercase
            border-2 rounded-xl transition-all
            ${isValid ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : ''}
            ${isInvalid || isEmpty ? 'border-red-500 bg-red-50 text-red-700' : ''}
            ${!isValid && !isInvalid && !isEmpty ? 'border-slate-200 bg-white text-slate-900' : ''}
            focus:outline-none focus:ring-2 focus:ring-red-500/20
          `}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checking && (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
          )}
          {!checking && isValid && (
            <Icons.CheckCircle className="w-6 h-6 text-emerald-600" />
          )}
          {!checking && isInvalid && (
            <Icons.XCircle className="w-6 h-6 text-red-600" />
          )}
        </div>
      </div>

      {/* Status Message */}
      {isValid && validation && (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <Icons.CheckCircle className="w-4 h-4" />
          <span>Valid invite code! {validation.uses_remaining} uses remaining.</span>
        </div>
      )}

      {isInvalid && validation?.error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <Icons.AlertCircle className="w-4 h-4" />
          <span>{validation.error}</span>
        </div>
      )}

      {isEmpty && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <Icons.AlertCircle className="w-4 h-4" />
          <span>Invite code is required to sign up</span>
        </div>
      )}

      {!touched && !code && (
        <p className="text-sm text-slate-500">
          Enter the 6-character invite code you received from a friend
        </p>
      )}
    </div>
  );
};
