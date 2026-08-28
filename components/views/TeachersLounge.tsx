
import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { Mentor, MentorStatus, User } from '../../types';
import { matchMentorForStudent } from '../../services/matchingService';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';
import { triggerConfetti } from '../../utils/confetti';

interface TeachersLoungeProps {
  userId?: string;
}

const StatusBadge: React.FC<{ status?: MentorStatus; lastActive?: string; responseTime?: string }> = ({ 
  status = 'offline', 
  lastActive,
  responseTime 
}) => {
  if (status === 'online') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Online</span>
        {responseTime && <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 opacity-80">({responseTime})</span>}
      </div>
    );
  }

  if (status === 'in_session') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span>In Live Session</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider">
      <span className="inline-flex rounded-full h-2 w-2 bg-slate-400 dark:bg-slate-500"></span>
      <span>Offline</span>
      {lastActive && <span className="text-[9px] lowercase font-medium opacity-80">({lastActive})</span>}
    </div>
  );
};

const MentorCard: React.FC<{ 
  mentor: Mentor; 
  matchReasons?: string[];
  onSelect: (mentor: Mentor) => void;
}> = ({ mentor, matchReasons, onSelect }) => {
  const isOnline = mentor.status === 'online';
  const isInSession = mentor.status === 'in_session';

  return (
    <div className={`bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl border ${
      matchReasons 
        ? 'border-brand/40 ring-1 ring-brand/20 shadow-2xl scale-[1.01]' 
        : 'border-slate-200 dark:border-slate-800 shadow-xl'
    } p-6 sm:p-8 rounded-[2.5rem] transition-all duration-300 group flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xl`}>
      <div>
        {/* Top Header Row with Avatar, Details & Dynamic Status */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="relative shrink-0">
              <img 
                src={mentor.img} 
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.75rem] object-cover ring-4 ${
                  isOnline 
                    ? 'ring-emerald-500/30 dark:ring-emerald-500/20' 
                    : isInSession 
                    ? 'ring-amber-500/30 dark:ring-amber-500/20' 
                    : 'ring-slate-100 dark:ring-slate-800'
                } shadow-md`} 
                alt={mentor.name} 
              />
              {mentor.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-brand text-white p-1 rounded-lg shadow-md border-2 border-white dark:border-slate-900" title="Verified Faculty">
                  <Icons.CheckBadge className="w-3.5 h-3.5" />
                </div>
              )}
              {/* Dynamic Status Dot Indicator on Avatar */}
              <div 
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  isOnline ? 'bg-emerald-500' : isInSession ? 'bg-amber-500' : 'bg-slate-400'
                }`}
                title={isOnline ? 'Online now' : isInSession ? 'In live session' : 'Offline'}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {mentor.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {mentor.learningStyle} • {mentor.timezone}
              </p>
              {mentor.rating && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-amber-500 text-xs font-black">★ {mentor.rating}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({mentor.reviewCount || 0} reviews)</span>
                </div>
              )}
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <StatusBadge 
              status={mentor.status} 
              lastActive={mentor.lastActive} 
              responseTime={mentor.responseTime} 
            />
          </div>
        </div>

        {/* Bio / Description */}
        {mentor.bio && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-5">
            {mentor.bio}
          </p>
        )}

        {/* Match Reasons Badge if in Smart Match Mode */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mb-5 p-3.5 bg-brand/5 dark:bg-brand/10 rounded-2xl border border-brand/15">
            <div className="flex items-center gap-1.5 text-brand text-[10px] font-black uppercase tracking-wider mb-1.5">
              <Icons.Sparkles className="w-3.5 h-3.5" /> High Affinity Match
            </div>
            <ul className="space-y-1">
              {matchReasons.map((reason, idx) => (
                <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Specialties Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {mentor.specialties.map(s => (
            <span 
              key={s} 
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase tracking-wider border border-slate-200/60 dark:border-slate-700/60"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Offerings & CTA */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Hourly Rate</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">₹{mentor.hourlyRate || 1800}<span className="text-xs text-slate-400 font-normal">/hr</span></span>
          </div>
          {mentor.offerings && mentor.offerings[0] && (
            <div className="text-right">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{mentor.offerings[0].type}</span>
              <span className="text-xs sm:text-sm font-bold text-brand">from ₹{mentor.offerings[0].price}</span>
            </div>
          )}
        </div>

        <button 
          onClick={() => onSelect(mentor)}
          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
            isOnline 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20' 
              : isInSession
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
              : 'bg-slate-900 hover:bg-brand dark:bg-slate-800 dark:hover:bg-brand text-white shadow-slate-900/20'
          }`}
        >
          {isOnline ? (
            <>
              <Icons.Sparkles className="w-3.5 h-3.5" />
              Connect Instantly (Online)
            </>
          ) : isInSession ? (
            <>
              <Icons.Clock className="w-3.5 h-3.5" />
              Queue Doubt (In Session)
            </>
          ) : (
            <>
              <Icons.Calendar className="w-3.5 h-3.5" />
              Book / Leave Ticket
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const TeachersLounge: React.FC<TeachersLoungeProps> = ({ userId }) => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchingMode, setMatchingMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'IN_SESSION' | 'OFFLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [sessionType, setSessionType] = useState<string>('Doubt Resolution');
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  // Filter mentors based on status and search query
  const filteredMentors = mentors.filter(m => {
    // Status filter
    if (statusFilter === 'ONLINE' && m.status !== 'online') return false;
    if (statusFilter === 'IN_SESSION' && m.status !== 'in_session') return false;
    if (statusFilter === 'OFFLINE' && m.status !== 'offline') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchSpecialty = m.specialties.some(s => s.toLowerCase().includes(q));
      const matchBio = m.bio?.toLowerCase().includes(q);
      if (!matchName && !matchSpecialty && !matchBio) return false;
    }
    return true;
  });

  const onlineCount = mentors.filter(m => m.status === 'online').length;
  const inSessionCount = mentors.filter(m => m.status === 'in_session').length;
  const offlineCount = mentors.filter(m => m.status === 'offline').length;

  const handleConfirmBooking = () => {
    setBookingSuccess(true);
    triggerConfetti();
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedMentor(null);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center">
      <header className="w-full text-center mb-12 sm:mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand/5 blur-[120px] pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-4">
          <Icons.GraduationCap className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Faculty Protocol & Specialists</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight uppercase mb-4">
          Hiring Built On <span className="text-brand">Trust</span>
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed mb-8">
          Connect with certified CMA faculty for 1:1 strategy calls, instant doubt clarification, and high-scoring essay audits with transparent real-time status.
        </p>

        {/* Main Mode Toggle: Explore All vs Smart Match */}
        <div className="flex justify-center gap-3 sm:gap-4 flex-wrap">
          <button 
            onClick={() => setMatchingMode(false)} 
            className={`px-6 sm:px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
              !matchingMode 
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xl border-transparent' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            Explore Directory ({mentors.length})
          </button>
          <button 
            onClick={() => setMatchingMode(true)} 
            className={`px-6 sm:px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
              matchingMode 
                ? 'bg-brand text-white shadow-brand/30 shadow-xl border-transparent' 
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Icons.Sparkles className="w-4 h-4" /> Smart Match
          </button>
        </div>
      </header>

      {/* Filter and Search Toolbar */}
      {!matchingMode && (
        <div className="w-full max-w-6xl mb-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Filter Tabs with Live Indicator Dots */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({mentors.length})
            </button>

            <button
              onClick={() => setStatusFilter('ONLINE')}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === 'ONLINE'
                  ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Online ({onlineCount})
            </button>

            <button
              onClick={() => setStatusFilter('IN_SESSION')}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === 'IN_SESSION'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              In Session ({inSessionCount})
            </button>

            <button
              onClick={() => setStatusFilter('OFFLINE')}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === 'OFFLINE'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Offline ({offlineCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search mentor or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand/40 transition-all shadow-sm"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-6 text-slate-300 py-20">
          <Icons.CloudSync className="w-16 h-16 animate-spin text-brand" />
          <span className="font-black uppercase tracking-widest text-xs sm:text-sm animate-pulse text-slate-500">
            Syncing Mentor Reputation & Live Presence...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
          {matchingMode ? (
            matchResults.length > 0 ? (
              matchResults.map(res => (
                <MentorCard 
                  key={res.item.id} 
                  mentor={res.item} 
                  matchReasons={res.reasons} 
                  onSelect={setSelectedMentor}
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
                <Icons.Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-2">No High Affinity Matches Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">Complete a mock exam or MCQ practice to generate precision topic diagnostics for Smart Match.</p>
              </div>
            )
          ) : filteredMentors.length > 0 ? (
            filteredMentors.map(m => (
              <MentorCard 
                key={m.id} 
                mentor={m} 
                onSelect={setSelectedMentor}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
              <Icons.Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-2">No Mentors Match This Filter</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">Try selecting another status tab or clearing your search term.</p>
            </div>
          )}
        </div>
      )}

      {/* Booking / Interaction Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <Icons.CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                  Session Confirmed!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {selectedMentor.status === 'online' 
                    ? `Direct channel opened with ${selectedMentor.name}. Average response time is ${selectedMentor.responseTime || '< 5 mins'}.`
                    : `Your consultation request has been queued with ${selectedMentor.name}. You will be notified via Doubt Desk when they accept.`}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <img src={selectedMentor.img} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">{selectedMentor.name}</h4>
                      <StatusBadge status={selectedMentor.status} responseTime={selectedMentor.responseTime} lastActive={selectedMentor.lastActive} />
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMentor(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">
                    Select Consultation Offering
                  </label>
                  <div className="space-y-2">
                    {selectedMentor.offerings?.map(o => (
                      <label 
                        key={o.type}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          sessionType === o.type 
                            ? 'bg-brand/10 border-brand text-slate-900 dark:text-white' 
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="offering" 
                            checked={sessionType === o.type}
                            onChange={() => setSessionType(o.type)}
                            className="text-brand accent-brand"
                          />
                          <span className="text-xs font-bold">{o.type}</span>
                        </div>
                        <span className="text-xs font-black text-brand">₹{o.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Estimated Response</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {selectedMentor.status === 'online' ? (selectedMentor.responseTime || 'Instant (< 5m)') : (selectedMentor.responseTime || 'Within a few hours')}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleConfirmBooking}
                  className="w-full py-4 bg-brand hover:bg-brand-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-brand/20 transition-all cursor-pointer"
                >
                  Confirm & Initiate ({sessionType})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

