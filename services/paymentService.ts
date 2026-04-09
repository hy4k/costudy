/**
 * CoStudy Payment Service
 * Handles Razorpay integration for Pro subscriptions and credits
 */

import { supabase } from './supabaseClient';

// Razorpay config (set in .env)
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo';
const RAZORPAY_KEY_SECRET = import.meta.env.VITE_RAZORPAY_KEY_SECRET;

// Pricing plans
export const PRICING_PLANS = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    price: 0,
    currency: 'INR',
    features: [
      '20 AI questions/day',
      '10 MCQ practice/day',
      'Wall access',
      'Basic study rooms'
    ]
  },
  PRO_MONTHLY: {
    id: 'PRO_MONTHLY',
    name: 'Pro',
    price: 333,
    currency: 'INR',
    interval: 'month',
    features: [
      'Unlimited AI questions',
      'Unlimited MCQ',
      'Mock exams',
      'Essay evaluation',
      'Priority support'
    ]
  },
  PRO_ANNUAL: {
    id: 'PRO_ANNUAL',
    name: 'Pro Annual',
    price: 3333,
    currency: 'INR',
    interval: 'year',
    discount: 17,
    monthlyEquivalent: 278,
    features: [
      'Everything in Pro',
      '17% discount (₹278/month)',
      '2 months free'
    ]
  },
  MENTOR: {
    id: 'MENTOR',
    name: 'Mentor',
    price: 1999,
    currency: 'INR',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Verified badge',
      'Student dashboard',
      'Revenue share (87.5%)',
      'Analytics'
    ]
  }
};

// Transaction types
export type TransactionType = 'SUBSCRIPTION' | 'CREDIT_PURCHASE' | 'SESSION_PAYMENT' | 'REFUND' | 'MENTOR_PAYOUT';

export interface PaymentIntent {
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  error?: string;
}

/**
 * Load Razorpay SDK dynamically
 */
const loadRazorpaySDK = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve((window as any).Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve((window as any).Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order on backend
 */
const createRazorpayOrder = async (amount: number, currency: string, description: string) => {
  const apiBase = import.meta.env.VITE_COSTUDY_API_URL || 'http://localhost:8080';
  
  const response = await fetch(`${apiBase}/api/payment/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({ amount, currency, description })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment order');
  }

  return response.json();
};

/**
 * Verify payment on backend
 */
const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  const apiBase = import.meta.env.VITE_COSTUDY_API_URL || 'http://localhost:8080';
  
  const response = await fetch(`${apiBase}/api/payment/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payment verification failed');
  }

  return response.json();
};

/**
 * Main payment service
 */
export const paymentService = {
  /**
   * Initiate subscription payment
   */
  async purchaseSubscription(
    userId: string,
    userEmail: string,
    userName: string,
    planId: string
  ): Promise<PaymentResult> {
    try {
      const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
      if (!plan) throw new Error('Invalid plan');

      // Load Razorpay SDK
      const Razorpay = await loadRazorpaySDK();

      // Create order on backend
      const orderData = await createRazorpayOrder(
        plan.price * 100, // Convert to paise
        plan.currency,
        `${plan.name} Subscription`
      );

      // Show Razorpay checkout
      return new Promise((resolve) => {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'CoStudy',
          description: `${plan.name} Subscription`,
          order_id: orderData.id,
          prefill: {
            email: userEmail,
            name: userName
          },
          theme: {
            color: '#8B5CF6' // Brand purple
          },
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              const verification = await verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verification.verified) {
                // Update user subscription in DB
                await paymentService.updateUserSubscription(userId, planId, response.razorpay_payment_id);

                resolve({
                  success: true,
                  transactionId: verification.transactionId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id
                });
              } else {
                resolve({ success: false, error: 'Payment verification failed' });
              }
            } catch (error: any) {
              resolve({ success: false, error: error.message });
            }
          },
          modal: {
            ondismiss: () => {
              resolve({ success: false, error: 'Payment cancelled by user' });
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update user subscription after successful payment
   */
  async updateUserSubscription(userId: string, planId: string, paymentId: string): Promise<boolean> {
    try {
      const plan = PRICING_PLANS[planId as keyof typeof PRICING_PLANS];
      const now = new Date();
      const expiresAt = new Date(now);
      
      // Calculate expiry
      if ('interval' in plan && plan.interval === 'year') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Update user_profiles.costudy_status
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          costudy_status: {
            subscription: plan.name.includes('Mentor') ? 'Elite' : 'Pro',
            subscriptionPlan: planId,
            subscriptionStartedAt: now.toISOString(),
            subscriptionExpiresAt: expiresAt.toISOString(),
            isVerified: true,
            walletBalance: 0
          }
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Record transaction
      await paymentService.recordTransaction({
        userId,
        type: 'SUBSCRIPTION',
        amount: plan.price,
        description: `${plan.name} Subscription`,
        referenceType: 'SUBSCRIPTION',
        referenceId: paymentId,
        status: 'COMPLETED'
      });

      return true;
    } catch (error) {
      console.error('Subscription update error:', error);
      return false;
    }
  },

  /**
   * Purchase credits
   */
  async purchaseCredits(
    userId: string,
    userEmail: string,
    userName: string,
    amount: number
  ): Promise<PaymentResult> {
    try {
      const Razorpay = await loadRazorpaySDK();

      const orderData = await createRazorpayOrder(
        amount * 100,
        'INR',
        `₹${amount} Credits Purchase`
      );

      return new Promise((resolve) => {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'CoStudy',
          description: 'Credits Purchase',
          order_id: orderData.id,
          prefill: { email: userEmail, name: userName },
          theme: { color: '#8B5CF6' },
          handler: async (response: any) => {
            try {
              const verification = await verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              if (verification.verified) {
                await paymentService.addCreditsToWallet(userId, amount, response.razorpay_payment_id);
                resolve({
                  success: true,
                  transactionId: verification.transactionId,
                  razorpayPaymentId: response.razorpay_payment_id
                });
              } else {
                resolve({ success: false, error: 'Verification failed' });
              }
            } catch (error: any) {
              resolve({ success: false, error: error.message });
            }
          },
          modal: {
            ondismiss: () => resolve({ success: false, error: 'Payment cancelled' })
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Add credits to user wallet
   */
  async addCreditsToWallet(userId: string, amount: number, paymentId: string): Promise<boolean> {
    try {
      // Get current balance
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('costudy_status')
        .eq('id', userId)
        .single();

      const currentBalance = profile?.costudy_status?.walletBalance || 0;
      const newBalance = currentBalance + amount;

      // Update wallet
      const { error } = await supabase
        .from('user_profiles')
        .update({
          costudy_status: {
            ...profile?.costudy_status,
            walletBalance: newBalance
          }
        })
        .eq('id', userId);

      if (error) throw error;

      // Record transaction
      await paymentService.recordTransaction({
        userId,
        type: 'CREDIT_PURCHASE',
        amount,
        description: `₹${amount} credits purchased`,
        referenceType: 'TOPUP',
        referenceId: paymentId,
        status: 'COMPLETED',
        balanceAfter: newBalance
      });

      return true;
    } catch (error) {
      console.error('Add credits error:', error);
      return false;
    }
  },

  /**
   * Record transaction in wallet_transactions table
   */
  async recordTransaction(transaction: {
    userId: string;
    type: string;
    amount: number;
    description: string;
    referenceType?: string;
    referenceId?: string;
    status?: string;
    balanceAfter?: number;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: transaction.userId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          reference_type: transaction.referenceType,
          reference_id: transaction.referenceId,
          balance_after: transaction.balanceAfter || 0,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Transaction record error:', error);
    }
  },

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Transaction history error:', error);
      return [];
    }
  },

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('costudy_status')
        .eq('id', userId)
        .single();

      if (!data?.costudy_status?.subscriptionExpiresAt) return false;

      const expiresAt = new Date(data.costudy_status.subscriptionExpiresAt);
      return expiresAt > new Date();
    } catch (error) {
      return false;
    }
  },

  /**
   * Cancel subscription (mark as cancelled, doesn't refund)
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('costudy_status')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('user_profiles')
        .update({
          costudy_status: {
            ...data?.costudy_status,
            subscription: 'Basic',
            subscriptionPlan: null,
            subscriptionCancelledAt: new Date().toISOString()
          }
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return false;
    }
  }
};
