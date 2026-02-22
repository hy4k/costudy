
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { Mentor, User } from '../../types';
import { matchMentorForStudent } from '../../services/matchingService';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';

interface TeachersLoungeProps {
  userId?: string;
}

const MentorCard: React.FC<{ mentor: Mentor; matchReasons?: string[] }> = ({ mentor, matchReasons }) => {
  return (
    <div className={`bg-white/70 backdrop-blur-3xl border ${matchReasons ? 'border-brand/40 ring-1 ring-brand/10 shadow-2xl scale-[1.02]' : 'border-slate-200 shadow-xl'} p-8 rounded-xl transition-all duration-500 group flex flex-col gap-8`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <img src={mentor.img} className="w-20 h-20 rounded-xl object-cover ring-4 ring-white shadow-lg" alt={mentor.name} />
            {mentor.isVerified && <div className="absolute -bottom-1 -right-1 bg-brand text-white p-1 rounded-lg shadow-xl border-2 border-white"><Icons.CheckBadge className="w-4 h-4" /></div>}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{mentor.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">{mentor.specialties.map(s => <span key={s} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s} •</span>)}</div>
          </div>
        </div>
      </div>
      <button className="w-full py-4 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-xl px-4">Hire Specialist</button>
    </div>
  );
};

export const TeachersLounge: React.FC<TeachersLoungeProps> = ({ userId }) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchingMode, setMatchingMode] = useState(false);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const [mentorData, userData] = await Promise.all([
            costudyService.getMentors(),
            userId ? getUserProfile(userId) : Promise.resolve(null)
        ]);
        setMentors(mentorData);
        setCurrentUser(userData);
        setLoading(false);
    };
    load();
  }, [userId]);

  const matchResults = currentUser ? matchMentorForStudent(currentUser, mentors) : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center">
      <header className="w-full text-center mb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand/5 blur-[120px] pointer-events-none"></div>
        <h2 className="text-7xl font-black text-slate-900 tracking-tighter leading-[0.7] mb-8 scale-y-110 uppercase">Hiring Built On Trust</h2>
        <div className="mt-16 flex justify-center gap-6">
          <button onClick={() => setMatchingMode(false)} className={`px-10 py-5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${!matchingMode ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-400 border-slate-200'}`}>Explore All</button>
          <button onClick={() => setMatchingMode(true)} className={`px-10 py-5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${matchingMode ? 'bg-brand text-white shadow-brand/30 shadow-2xl' : 'bg-white text-slate-400 border-slate-200'}`}><Icons.Sparkles className="w-4 h-4 px-4 py-2 transition-all" /> Smart Match</button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center gap-6 text-slate-300 py-20">
            <Icons.CloudSync className="w-20 h-20 animate-spin text-brand" />
            <span className="font-black uppercase tracking-widest text-sm animate-pulse">Syncing Reputations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl">
            {matchingMode ? (
            matchResults.map(res => <MentorCard key={res.item.id} mentor={res.item} matchReasons={res.reasons} />)
            ) : (
            mentors.map(m => <MentorCard key={m.id} mentor={m} />)
            )}
        </div>
      )}
    </div>
  );
};
