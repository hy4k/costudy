
import React, { useState } from 'react';
import { Icons } from '../Icons';
import { processUnifiedPayment, syncStudyTelemetry } from '../../services/fetsService';

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
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
            <header className="w-full text-center mb-16 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand/5 blur-[100px] pointer-events-none"></div>
                <div className="inline-flex items-center gap-4 mb-8 bg-white/80 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-200 shadow-xl">
                    <div className="flex flex-col items-start pr-4 border-r border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profile Balance</span>
                        <span className="text-sm font-black text-slate-900">₹{walletBalance}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-[0.3em]">
                        <Icons.DollarSign className="w-4 h-4" />
                        Secure Checkout
                    </div>
                </div>
                <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase mb-4 scale-y-110">Marketplace</h2>
                <p className="text-xl text-slate-500 font-medium">Premium resources and mentorship sessions to accelerate your mastery.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl">
                {PRODUCTS.map(product => (
                    <div key={product.id} className="bg-white/70 backdrop-blur-2xl border border-slate-200 p-12 rounded-xl shadow-xl hover:shadow-2xl transition-all flex flex-col group">
                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Official CoStudy Resource</span>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none group-hover:text-brand transition-colors">{product.name}</h3>
                        <p className="text-slate-500 font-medium mb-12 flex-1 leading-relaxed italic">"{product.desc}"</p>
                        
                        <div className="flex items-end justify-between mb-8 border-t border-slate-100 pt-8">
                            <div className="text-5xl font-black text-slate-900 tracking-tighter">₹{product.price}</div>
                        </div>

                        <button 
                            onClick={() => handlePurchase(product)}
                            disabled={!!payingId}
                            className="w-full py-5 bg-slate-900 text-white rounded-lg font-black text-xs uppercase tracking-[0.3em] hover:bg-brand transition-all shadow-2xl disabled:opacity-50 active:scale-95 px-4"
                        >
                            {payingId === product.id ? 'Processing...' : 'Unlock Content'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
