
import React, { useState } from 'react';
import { Icons } from '../Icons';
import { processUnifiedPayment, syncStudyTelemetry } from '../../services/fetsService';
import { STUDENT_PAGE_BG, StudentPageChrome } from '../student/StudentPageChrome';

export const StudentStore: React.FC = () => {
    const [payingId, setPayingId] = useState<string | null>(null);
    const walletBalance = 0; 

    const handlePurchase = async (item: any) => {
        setPayingId(item.id);
        const result: any = await processUnifiedPayment(item.price);
        setPayingId(null);
        if (result.status === 'success') {
            alert(`CoStudy Transaction Verified!\nReceipt: ${result.costudyTransactionId}\nSuccess!`);
            syncStudyTelemetry({ event: 'store_purchase', item: item.name, amount: item.price });
        }
    };

    const PRODUCTS = [
      { id: 'p1', name: 'Part 2 Mastery Bundle', price: 12000, desc: 'Complete course + 5000 MCQs. Professional curated content for Part 2.' },
      { id: 'p2', name: 'Expert Doubt Pass', price: 999, desc: 'Unlimited doubs for 30 days. Priority access in CoStudy feed.' },
      { id: 'p3', name: 'Exam Sim Pro', price: 2500, desc: '10 Full length timed mock exams with detailed analytics.' }
    ];

    return (
        <div className={`${STUDENT_PAGE_BG} flex flex-col`}>
            <StudentPageChrome
                eyebrow="Store"
                title="Marketplace"
                description="Premium resources and mentorship sessions to accelerate your mastery."
                icon={<Icons.DollarSign className="h-6 w-6" />}
            />
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-20 pt-2 sm:px-6">
                <div className="mb-10 inline-flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-brand/15 bg-white/90 px-6 py-4 shadow-clay-red-raised backdrop-blur-sm">
                    <div className="flex flex-col items-start pr-4 sm:border-r sm:border-slate-100">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Profile balance</span>
                        <span className="text-sm font-black text-slate-900">₹{walletBalance}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand">
                        <Icons.DollarSign className="h-4 w-4" />
                        Secure checkout
                    </div>
                </div>

            <div className="grid w-full max-w-6xl grid-cols-1 gap-10 md:grid-cols-3">
                {PRODUCTS.map(product => (
                    <div key={product.id} className="group flex flex-col rounded-[3rem] border border-brand/15 bg-white/95 p-12 shadow-clay-red-raised backdrop-blur-sm transition-all hover:border-brand/25 hover:shadow-md">
                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Official CoStudy Resource</span>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none group-hover:text-brand transition-colors">{product.name}</h3>
                        <p className="text-slate-500 font-medium mb-12 flex-1 leading-relaxed italic">"{product.desc}"</p>
                        
                        <div className="flex items-end justify-between mb-8 border-t border-slate-100 pt-8">
                            <div className="text-5xl font-black text-slate-900 tracking-tighter">₹{product.price}</div>
                        </div>

                        <button 
                            onClick={() => handlePurchase(product)}
                            disabled={!!payingId}
                            className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-brand transition-all shadow-2xl disabled:opacity-50 active:scale-95"
                        >
                            {payingId === product.id ? 'Processing...' : 'Unlock Content'}
                        </button>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
};
