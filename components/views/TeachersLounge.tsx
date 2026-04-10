
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { Mentor, User } from '../../types';
import { matchMentorForStudent } from '../../services/matchingService';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { STUDENT_PAGE_BG, StudentPageChrome } from '../student/StudentPageChrome';

interface TeachersLoungeProps {
  userId?: string;
}

const MentorCard: React.FC<{ mentor: Mentor; matchReasons?: string[] }> = ({ mentor, matchReasons }) => {
  return (
    <div className={`bg-white/70 backdrop-blur-3xl border ${matchReasons ? 'border-brand/40 ring-1 ring-brand/10 shadow-2xl scale-[1.02]' : 'border-slate-200 shadow-xl'} p-8 rounded-[4rem] transition-all duration-500 group flex flex-col gap-8`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="relative">
            <img src={mentor.img} className="w-20 h-20 rounded-[2rem] object-cover ring-4 ring-white shadow-lg" alt={mentor.name} />
            {mentor.isVerified && <div className="absolute -bottom-1 -right-1 bg-brand text-white p-1 rounded-lg shadow-xl border-2 border-white"><Icons.CheckBadge className="w-4 h-4" /></div>}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{mentor.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">{mentor.specialties.map(s => <span key={s} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s} •</span>)}</div>
          </div>
        </div>
      </div>
      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-xl">Hire Specialist</button>
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
    <div className={`${STUDENT_PAGE_BG} flex flex-col`}>
      <StudentPageChrome
        eyebrow="Mentors"
        title="Hiring built on trust"
        description="Browse verified specialists or use smart match to align with your exam focus and study style."
        icon={<Icons.GraduationCap className="h-6 w-6" />}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-20 pt-2 sm:px-6">
        <div className="mb-12 flex flex-wrap justify-center gap-4">
          <button onClick={() => setMatchingMode(false)} className={`rounded-2xl border px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${!matchingMode ? 'border-brand/20 bg-brand text-white shadow-clay-red-raised' : 'border-slate-200 bg-white/90 text-slate-500 shadow-sm hover:border-brand/20'}`}>Explore All</button>
          <button onClick={() => setMatchingMode(true)} className={`flex items-center gap-3 rounded-2xl border px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${matchingMode ? 'border-brand/20 bg-brand text-white shadow-clay-red-raised' : 'border-slate-200 bg-white/90 text-slate-500 shadow-sm hover:border-brand/20'}`}><Icons.Sparkles className="h-4 w-4" /> Smart Match</button>
        </div>

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
    </div>
  );
};
