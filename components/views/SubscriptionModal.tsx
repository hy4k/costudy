/**
 * Subscription Upgrade Modal Component
 * Handles Pro/Mentor subscription purchases via Razorpay
 */

import React, { useState } from 'react';
import { paymentService, PRICING_PLANS } from '../services/paymentService';
import { Icons } from './Icons';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  currentPlan: string;
  onSuccess: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  currentPlan,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'PRO_MONTHLY' | 'PRO_ANNUAL' | 'MENTOR'>('PRO_MONTHLY');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.purchaseSubscription(
        userId,
        userEmail,
        userName,
        selectedPlan
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderPlanCard = (planKey: 'PRO_MONTHLY' | 'PRO_ANNUAL' | 'MENTOR') => {
    const plan = PRICING_PLANS[planKey];
    const isSelected = selectedPlan === planKey;
    const isCurrent = currentPlan === plan.name;

    return (
      <button
        key={planKey}
        onClick={() => !isCurrent && setSelectedPlan(planKey)}
        disabled={isCurrent}
        className={`
          relative border-2 rounded-xl p-6 text-left transition-all
          ${isSelected && !isCurrent ? 'border-brand bg-brand/5 shadow-lg' : 'border-slate-200 hover:border-brand/50'}
          ${isCurrent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {planKey === 'PRO_ANNUAL' && (
          <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            SAVE {plan.discount}%
          </div>
        )}

        {isCurrent && (
          <div className="absolute -top-3 right-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full">
            CURRENT
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
          {isSelected && !isCurrent && (
            <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
              <Icons.Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="mb-4">
          <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
          {plan.interval && <span className="text-slate-500 ml-2">/{plan.interval}</span>}
          {plan.monthlyEquivalent && (
            <div className="text-sm text-emerald-600 mt-1">
              Just ₹{plan.monthlyEquivalent}/month
            </div>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
              <Icons.Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Upgrade Your Plan</h2>
            <p className="text-sm text-slate-500 mt-1">Unlock unlimited access to all features</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {renderPlanCard('PRO_MONTHLY')}
            {renderPlanCard('PRO_ANNUAL')}
            {renderPlanCard('MENTOR')}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <Icons.AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900">Payment Error</p>
                <p className="text-sm text-rose-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Benefits Banner */}
          <div className="bg-gradient-to-r from-brand/10 to-blue-500/10 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Icons.Sparkles className="w-5 h-5 text-brand" />
              What You'll Get
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Unlimited AI-powered Q&A and essay grading</span>
              </div>
              <div className="flex items-start gap-2">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Full access to Prometric-style mock exams</span>
              </div>
              <div className="flex items-start gap-2">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Advanced study room features</span>
              </div>
              <div className="flex items-start gap-2">
                <Icons.CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Priority email support (24h response)</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm text-slate-600">
            <div className="flex items-center gap-2 mb-2">
              <Icons.Shield className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-900">Secure Payment</span>
            </div>
            <p>Powered by Razorpay. Your payment information is encrypted and secure.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition"
            >
              Maybe Later
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading || currentPlan === PRICING_PLANS[selectedPlan].name}
              className="px-8 py-3 bg-brand hover:bg-brand/90 text-white rounded-lg font-bold shadow-lg shadow-brand/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icons.CreditCard className="w-5 h-5" />
                  Upgrade Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
