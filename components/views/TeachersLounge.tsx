import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { Mentor, User } from '../../types';
import { matchMentorForStudent } from '../../services/matchingService';
import { costudyService } from '../../services/costudyService';
import { getUserProfile } from '../../services/fetsService';

interface TeachersLoungeProps {
  userId?: string;
}

const MentorCard: React.FC<{ mentor: Mentor; matchReasons?: string[]; matchScore?: number }> = ({ mentor, matchReasons, matchScore }) => {
  const [hired, setHired] = useState(false);
  const rating = (mentor as any).rating;
  const sessions = (mentor as any).sessionsCompleted ?? (mentor as any).sessions_completed;
  const rate = (mentor as any).hourlyRate ?? (mentor as any).hourly_rate;

  return (
    <div className="post mentor-card">
      <div className="mentor-top">
        {mentor.img ? (
          <img src={mentor.img} alt={mentor.name} style={{ width: 52, height: 52, borderRadius: 16, objectFit: 'cover', flex: 'none', boxShadow: 'var(--nm-xs)' }} />
        ) : (
          <span style={{ width: 52, height: 52, borderRadius: 16, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 20 }}>
            {(mentor.name || 'M').charAt(0)}
          </span>
        )}
        <div className="mentor-id">
          <strong>
            {mentor.name}{' '}
            {mentor.isVerified && (
              <span className="mentor-verified"><Icons.CheckBadge className="w-[14px] h-[14px]" /></span>
            )}
          </strong>
          <span className="mentor-creds">
            {[rating ? `★ ${rating}` : null, sessions ? `${sessions} sessions` : null].filter(Boolean).join(' · ') || 'Verified specialist'}
          </span>
        </div>
        {typeof matchScore === 'number' && <span className="mentor-match">{matchScore}%</span>}
      </div>

      {mentor.specialties && mentor.specialties.length > 0 && (
        <div className="post-tags">
          {mentor.specialties.map(s => <span key={s} className="tag">{s}</span>)}
        </div>
      )}

      {matchReasons && matchReasons.length > 0 && (
        <ul className="mentor-reasons">
          {matchReasons.map((r) => (
            <li key={r}><Icons.CheckCircle className="w-3 h-3" /> {r}</li>
          ))}
        </ul>
      )}

      <div className="mentor-foot">
        <div className="mentor-rate">
          {rate ? (
            <>
              <strong>₹{rate}</strong><span>/session · split with your room</span>
            </>
          ) : (
            <span>Rate on request</span>
          )}
        </div>
        <button
          type="button"
          className={hired ? 'rooms-create' : 'btn-post mentor-hire'}
          onClick={() => setHired(!hired)}
        >
          {hired ? 'Request sent ✓' : 'Hire mentor'}
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
    <div className="proto wall-embedded">
      <div className="wall" data-page="mentors">
        <main className="shell-solo shell-wide">
          {/* Masthead with mode toggle */}
          <div className="rooms-hello feed-hello">
            <div>
              <h1 className="font-display">Mentors</h1>
              <p>Verified specialists. Hire solo, or split the fee with your study room.</p>
            </div>
            <div className="focus-presets">
              <button type="button" className={`seg ${!matchingMode ? 'seg-on' : ''}`} onClick={() => setMatchingMode(false)}>Explore all</button>
              <button type="button" className={`seg ${matchingMode ? 'seg-on' : ''}`} onClick={() => setMatchingMode(true)}>Smart match</button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : mentors.length === 0 ? (
            <div className="post dm-empty prof-empty">
              <Icons.GraduationCap className="w-[30px] h-[30px]" />
              <p>No mentors yet</p>
              <span>Verified specialists will appear here as they join CoStudy.</span>
            </div>
          ) : (
            <div className="rooms-grid">
              {matchingMode ? (
                matchResults.map(res => (
                  <MentorCard
                    key={res.item.id}
                    mentor={res.item}
                    matchReasons={res.reasons}
                    matchScore={(res as any).score}
                  />
                ))
              ) : (
                mentors.map(m => <MentorCard key={m.id} mentor={m} />)
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
