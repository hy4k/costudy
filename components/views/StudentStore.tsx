import React, { useState } from 'react';
import { Icons } from '../Icons';
import { processUnifiedPayment, syncStudyTelemetry } from '../../services/fetsService';

export const StudentStore: React.FC = () => {
    const [payingId, setPayingId] = useState<string | null>(null);
    const [isGroupBuy, setIsGroupBuy] = useState(false);
    const [groupEmails, setGroupEmails] = useState('');
    const walletBalance = 0; 

    const handlePurchase = async (item: any) => {
        if (isGroupBuy && !groupEmails.trim()) {
            alert("Please provide member emails for the Strategic Group Pack.");
            return;
        }

        setPayingId(item.id);
        const result: any = await processUnifiedPayment(item.price);
        setPayingId(null);
        if (result.status === 'success') {
            const msg = isGroupBuy 
                ? `Strategic Group Pack Activated!\nEach member will receive a neural link invite shortly. A private study room has been pre-initialized for your cluster.`
                : `CoStudy Pro Verified!\nSuccess! AI Tutor and Full Bank unlocked.`;
            alert(msg);
            syncStudyTelemetry({ event: 'store_purchase', item: item.name, amount: item.price, type: isGroupBuy ? 'GROUP' : 'INDIVIDUAL' });
        }
    };

    const PLANS = [
      { 
        id: 'pro_indiv', 
        name: 'CoStudy Pro (Individual)', 
        price: 3999, 
        billing: 'billed ₹3999/year', 
        desc: 'Unlimited AI Tutor, full question bank, and strategic essay audit tool.',
        features: ["AI Tutor Chat (Unlimited)", "MCQ Practice (Unlimited)", "Full Question Bank", "Mock Test Simulations", "Priority 24/7 Support"]
      },
      { 
        id: 'pro_group', 
        name: 'Strategic Group Pack', 
        price: 9999, 
        billing: 'billed once', 
        desc: 'Up to 5 students. Automated study room pre-creation, combined tracking, and priority faculty booking.',
        features: ["5x Pro Subscriptions", "Private Cluster Room", "Shared Ledger View", "Priority Mentor Enlistment", "Bulk Price Efficiency"]
      }
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
            <header className="w-full text-center mb-16 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand/5 blur-[100px] pointer-events-none"></div>
                <div className="inline-flex items-center gap-4 mb-8 bg-white/80 backdrop-blur-md px-6 py-3 rounded-[2rem] border border-slate-200 shadow-xl">
                    <div className="flex flex-col items-start pr-4 border-r border-slate-100">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Profile Balance</span>
                        <span className="text-sm font-black text-slate-900">₹{walletBalance}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-[0.3em]">
                        <Icons.DollarSign className="w-4 h-4" />
                        Strategic Checkout
                    </div>
                </div>
                <h2 className="text-8xl font-black text-slate-900 tracking-tighter uppercase mb-4 scale-y-110">Marketplace</h2>
                <p className="text-xl text-slate-500 font-medium italic">"Invest in your strategic certification trajectory."</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl">
                {PLANS.map(product => (
                    <div key={product.id} className={`bg-white/70 backdrop-blur-2xl border ${product.id === 'pro_group' ? 'border-emerald-400 shadow-emerald-500/5' : 'border-slate-200'} p-12 rounded-[5rem] shadow-2xl transition-all flex flex-col group relative overflow-hidden`}>
                        {product.id === 'pro_group' && <div className="absolute top-8 right-10 bg-emerald-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest">Collective Value</div>}
                        
                        <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-4">Tactical Plan</span>
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 leading-none group-hover:text-brand transition-colors">{product.name}</h3>
                        <p className="text-slate-500 font-medium mb-12 flex-1 leading-relaxed italic">"{product.desc}"</p>
                        
                        <ul className="space-y-3 mb-12">
                            {product.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                    <Icons.CheckBadge className="w-4 h-4 text-emerald-500" /> {f}
                                </li>
                            ))}
                        </ul>

                        {product.id === 'pro_group' && (
                            <div className="mb-10 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Team Member Emails (comma separated)</label>
                                <textarea 
                                    value={groupEmails}
                                    onChange={(e) => {
                                        setGroupEmails(e.target.value);
                                        setIsGroupBuy(true);
                                    }}
                                    placeholder="friend1@example.com, friend2@example.com..."
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-6 text-xs font-bold outline-none focus:border-brand/30 transition-all resize-none"
                                />
                            </div>
                        )}

                        <div className="flex items-end justify-between mb-8 border-t border-slate-100 pt-8">
                            <div className="flex flex-col">
                                <div className="text-5xl font-black text-slate-900 tracking-tighter">₹{product.price}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{product.billing}</div>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setIsGroupBuy(product.id === 'pro_group');
                                handlePurchase(product);
                            }}
                            disabled={!!payingId}
                            className={`w-full py-5 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${product.id === 'pro_group' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-900'}`}
                        >
                            {payingId === product.id ? 'Establishing Sync...' : 'Authorize Purchase'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};