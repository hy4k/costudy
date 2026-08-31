import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { TestDriveCandidate, ExamPart } from '../../types';
import { testDriveService } from '../../services/testDriveService';
import Markdown from 'react-markdown';

interface TestDriveAdminProps {
  onLaunchCandidateKiosk?: () => void;
  onBackToApp?: () => void;
}

export const TestDriveAdmin: React.FC<TestDriveAdminProps> = ({ onLaunchCandidateKiosk, onBackToApp }) => {
  const [candidates, setCandidates] = useState<TestDriveCandidate[]>([]);
  const [activeTab, setActiveTab] = useState<'TERMINALS' | 'CANDIDATES' | 'GRADING' | 'INTEGRATION'>('TERMINALS');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<TestDriveCandidate | null>(null);

  // Check-In Modal
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInBookingRef, setCheckInBookingRef] = useState('');
  const [checkInTerminal, setCheckInTerminal] = useState('T-01');
  const [checkInMsg, setCheckInMsg] = useState<{ type: 'success' | 'error'; text: string; pin?: string } | null>(null);

  // Walk-In Registration Form
  const [walkInName, setWalkInName] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInPart, setWalkInPart] = useState<ExamPart>('Part 1');

  // Dispatch Notification
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // Load Candidates
  const loadData = () => {
    const data = testDriveService.getCandidates();
    setCandidates(data);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Auto-refresh every 5s for live proctoring
    return () => clearInterval(interval);
  }, []);

  // Filtered List
  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.bookingRef.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.terminalNumber && c.terminalNumber.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Stats
  const totalBooked = candidates.length;
  const checkedInCount = candidates.filter(c => c.status === 'CHECKED_IN' || c.status === 'IN_PROGRESS').length;
  const inProgressCount = candidates.filter(c => c.status === 'IN_PROGRESS').length;
  const gradedCount = candidates.filter(c => c.status === 'GRADED' || c.status === 'RESULTS_SENT').length;
  const passedCount = candidates.filter(c => c.scorecard?.passed).length;

  // Handle Check-In
  const handlePerformCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInMsg(null);

    try {
      const result = testDriveService.checkInCandidate(checkInBookingRef.trim(), checkInTerminal);
      setCheckInMsg({
        type: 'success',
        text: `Candidate ${result.candidate.name} checked in successfully to ${checkInTerminal}.`,
        pin: result.authCode
      });
      loadData();
    } catch (err: any) {
      setCheckInMsg({
        type: 'error',
        text: err.message || 'Check-in failed. Please verify booking ID.'
      });
    }
  };

  // Handle Walk-in Register
  const handleWalkInRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckInMsg(null);

    if (!walkInName || !walkInEmail) {
      setCheckInMsg({ type: 'error', text: 'Candidate name and email are required.' });
      return;
    }

    const newCandidate = testDriveService.registerWalkIn({
      name: walkInName,
      email: walkInEmail,
      phone: walkInPhone || '+91 99999 00000',
      examPart: walkInPart,
      terminalNumber: checkInTerminal
    });

    setCheckInMsg({
      type: 'success',
      text: `Walk-in candidate registered: ${newCandidate.name} (${newCandidate.bookingRef})`,
      pin: newCandidate.proctorAuthCode
    });

    setWalkInName('');
    setWalkInEmail('');
    setWalkInPhone('');
    loadData();
  };

  // Handle Send Results Email & Webhook
  const handleSendResults = async (candidateId: string) => {
    setIsDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await testDriveService.sendResultsToCandidate(candidateId);
      setDispatchStatus(res.message);
      loadData();
    } catch (e: any) {
      setDispatchStatus(e.message || 'Failed to dispatch results.');
    } finally {
      setIsDispatching(false);
    }
  };

  // Export Batch CSV
  const handleDownloadCSV = () => {
    const csvContent = testDriveService.exportResultsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FETS_TestDrive_Results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Total 24 Physical Testing Stations
  const ALL_TERMINALS = Array.from({ length: 24 }, (_, i) => {
    const tId = `T-${(i + 1).toString().padStart(2, '0')}`;
    const occupant = candidates.find(c => c.terminalNumber === tId && (c.status === 'IN_PROGRESS' || c.status === 'CHECKED_IN'));
    return {
      terminalId: tId,
      occupant,
      isOccupied: !!occupant
    };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand">
      {/* Top Proctor Staff Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-8 py-4 sticky top-0 z-40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black shadow-lg">
            <Icons.Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Physical Centre Admin Console • Live
            </div>
            <h1 className="text-xl font-black uppercase text-white tracking-tight">FETS CMA Test Drive Manager</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => setShowCheckInModal(true)}
            className="px-4 py-2 bg-brand hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-brand/20 flex items-center gap-2"
          >
            <Icons.UserCheck className="w-4 h-4" /> Check-In Candidate
          </button>

          <button 
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
          >
            <Icons.CloudSync className="w-4 h-4 text-brand" /> Export Batch CSV
          </button>

          {onLaunchCandidateKiosk && (
            <button 
              onClick={onLaunchCandidateKiosk}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-2"
            >
              <Icons.Lock className="w-3.5 h-3.5" /> Launch Terminal Kiosk
            </button>
          )}

          {onBackToApp && (
            <button 
              onClick={onBackToApp}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition-all"
            >
              Exit Admin
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Test Center Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Registrations</div>
            <div className="text-2xl font-black text-white">{totalBooked}</div>
            <div className="text-[10px] text-slate-400 mt-1">From fets.in/testdrive</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Checked-In</div>
            <div className="text-2xl font-black text-amber-400">{checkedInCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">At physical test center</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Live In-Progress</div>
            <div className="text-2xl font-black text-brand animate-pulse">{inProgressCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">Active on terminals</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Exams Graded</div>
            <div className="text-2xl font-black text-white">{gradedCount}</div>
            <div className="text-[10px] text-slate-400 mt-1">AI Evaluated (500 pts)</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 md:col-span-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Pass Rate (&ge;360)</div>
            <div className="text-2xl font-black text-emerald-400">
              {gradedCount > 0 ? `${Math.round((passedCount / gradedCount) * 100)}%` : '0%'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{passedCount} Passed candidates</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-6 text-xs font-black uppercase tracking-wider">
          {[
            { id: 'TERMINALS', label: 'Live Terminal Matrix (24 Seats)', icon: <Icons.Grid className="w-4 h-4" /> },
            { id: 'CANDIDATES', label: 'Candidate Roster & Check-In', icon: <Icons.UserCheck className="w-4 h-4" /> },
            { id: 'GRADING', label: 'AI Grading & Results Dispatch', icon: <Icons.Brain className="w-4 h-4" /> },
            { id: 'INTEGRATION', label: 'fets.in/testdrive Integration Hub', icon: <Icons.CloudSync className="w-4 h-4" /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 flex items-center gap-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-brand text-brand font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: LIVE TERMINAL MATRIX */}
        {activeTab === 'TERMINALS' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase text-white">Workstation Status Grid</h2>
                <p className="text-xs text-slate-400">Real-time status of physical testing terminals in Lab A</p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Active Exam</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> Checked-In Standby</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-700"></span> Available</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ALL_TERMINALS.map(t => {
                const occ = t.occupant;
                const isExam = occ?.status === 'IN_PROGRESS';
                const isStandby = occ?.status === 'CHECKED_IN';

                return (
                  <div 
                    key={t.terminalId}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-36 relative overflow-hidden ${isExam ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10' : isStandby ? 'bg-amber-950/40 border-amber-500/40' : 'bg-slate-900/60 border-slate-800 opacity-60 hover:opacity-100'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black font-mono text-slate-300">{t.terminalId}</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isExam ? 'bg-emerald-400 animate-ping' : isStandby ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                    </div>

                    <div>
                      {occ ? (
                        <>
                          <div className="text-xs font-black text-white truncate">{occ.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{occ.bookingRef}</div>
                          <div className="text-[10px] text-brand font-bold mt-1">CMA {occ.examPart}</div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ready / Idle</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-slate-800/80 pt-2 text-slate-400">
                      {occ ? (
                        <span>PIN: <strong className="text-amber-400 font-mono">{occ.proctorAuthCode}</strong></span>
                      ) : (
                        <button 
                          onClick={() => { setCheckInTerminal(t.terminalId); setShowCheckInModal(true); }}
                          className="text-brand hover:underline font-bold"
                        >
                          + Assign
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CANDIDATE ROSTER */}
        {activeTab === 'CANDIDATES' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full md:w-96">
                <Icons.Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search by name, booking ref, or terminal..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong>{filteredCandidates.length}</strong> candidates
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-4">Booking Ref</th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Exam Part</th>
                    <th className="p-4">Station</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Proctor PIN</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredCandidates.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-300">{c.bookingRef}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-brand/10 text-brand font-black text-[10px]">
                          CMA {c.examPart}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-300">{c.terminalNumber || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${c.status === 'IN_PROGRESS' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'CHECKED_IN' ? 'bg-amber-500/20 text-amber-400' : c.status === 'GRADED' || c.status === 'RESULTS_SENT' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-amber-400">{c.proctorAuthCode || '—'}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => { setSelectedCandidate(c); }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: AI GRADING & RESULTS DISPATCH */}
        {activeTab === 'GRADING' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black uppercase text-white">AI Grading & Scorecard Dispatch Hub</h2>
                <p className="text-xs text-slate-400">Review Gemini 3.1 AI essay evaluations and transmit official scorecards to candidates</p>
              </div>

              {dispatchStatus && (
                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <Icons.CheckBadge className="w-4 h-4" />
                  {dispatchStatus}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.filter(c => c.scorecard).map(c => {
                const sc = c.scorecard!;
                return (
                  <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-brand tracking-widest">CMA {sc.examPart} Scorecard</span>
                        <h3 className="text-xl font-black text-white">{sc.candidateName}</h3>
                        <p className="text-xs text-slate-400">{sc.candidateEmail} • {sc.bookingRef}</p>
                      </div>

                      <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${sc.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'}`}>
                        {sc.passed ? 'PASSED (360+)' : 'DID NOT PASS'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                      <div>
                        <div className="text-lg font-black text-white">{sc.totalScoreScaled} <span className="text-xs font-normal text-slate-500">/ 500</span></div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">Total Scaled</div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-brand">{sc.mcqScoreScaled} <span className="text-xs font-normal text-slate-500">/ 375</span></div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">100 MCQs ({sc.mcqCorrect})</div>
                      </div>
                      <div>
                        <div className="text-lg font-black text-amber-400">{(sc.essay1ScoreScaled + sc.essay2ScoreScaled).toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 125</span></div>
                        <div className="text-[9px] uppercase font-bold text-slate-400">2 Essays</div>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-40 overflow-y-auto text-xs text-slate-300">
                      <div className="font-bold text-brand text-[10px] uppercase mb-1">Gemini AI Grader Insight:</div>
                      <div className="prose prose-invert prose-xs max-w-none">
                        <Markdown>{sc.aiEvaluationText.slice(0, 350) + '...'}</Markdown>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => setSelectedCandidate(c)}
                        className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                      >
                        Inspect Full Exam
                      </button>
                      <button 
                        onClick={() => handleSendResults(c.id)}
                        disabled={isDispatching}
                        className={`w-1/2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${c.status === 'RESULTS_SENT' ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-brand hover:bg-emerald-600 text-white shadow-brand/20'}`}
                      >
                        <Icons.Send className="w-3.5 h-3.5" /> 
                        {c.status === 'RESULTS_SENT' ? 'Resend Scorecard' : 'Email Scorecard'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: INTEGRATION HUB (fets.in/testdrive) */}
        {activeTab === 'INTEGRATION' && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Physical Centre Sync Architecture</span>
                <h2 className="text-2xl font-black uppercase text-white mt-1">Connecting CoStudy Test Drive with fets.in/testdrive</h2>
                <p className="text-sm text-slate-400 mt-1">
                  How your physical test centre links booking registrations, candidate check-in, and automated AI results.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-brand/20 text-brand flex items-center justify-center font-black text-sm">1</div>
                  <h3 className="text-sm font-black uppercase text-white">Candidate Booking</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Candidates book their test slot at <strong className="text-white">https://fets.in/testdrive/</strong> and receive a unique Booking Reference (e.g. <code>FETS-TD-8921</code>).
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">2</div>
                  <h3 className="text-sm font-black uppercase text-white">Physical Centre Check-In</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Staff at the proctor desk enter the Booking Reference, assign terminal <code>T-01 to T-24</code>, and generate the 6-digit Proctor Authorization PIN.
                  </p>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">3</div>
                  <h3 className="text-sm font-black uppercase text-white">AI Grading & Sync</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upon submission, Gemini 3.1 grades both 100 MCQs and 2 Essays (500 pts), dispatches email scorecards, and sends a REST webhook to <strong className="text-white">https://fets.in/testdrive/admin</strong>.
                  </p>
                </div>
              </div>

              {/* Direct Webhook Payload Specification */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-300">REST Webhook Payload format sent to fets.in/testdrive/admin:</h4>
                <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
{`POST https://fets.in/testdrive/admin/api/v1/exam-results
Headers: { "Content-Type": "application/json", "Authorization": "Bearer FETS_PROCTOR_KEY" }

{
  "event": "test_drive_graded",
  "booking_reference": "FETS-TD-8921",
  "candidate_email": "rahul.sharma@example.com",
  "candidate_name": "Rahul Sharma",
  "exam_part": "Part 1",
  "total_scaled_score": 393.5,
  "mcq_scaled_score": 292.5,
  "essay_scaled_score": 101.0,
  "result_status": "PASSED",
  "duration_minutes": 224,
  "fets_center_id": "FETS-TEST-CENTRE-01"
}`}
                </pre>
              </div>

              {/* Direct Standalone Terminal Kiosk URL */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-300">Direct Workstation Kiosk URL for Test Center PCs:</h4>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/?mode=testdrive`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none"
                  />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?mode=testdrive`); }}
                    className="px-4 py-2.5 bg-brand hover:bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    Copy Link
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Bookmark this link on physical centre computers (or set as browser homepage) to lock them in Exam Kiosk mode.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand">Physical Centre Desk</span>
                <h3 className="text-2xl font-black uppercase text-white">Check-In Candidate</h3>
              </div>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            {checkInMsg && (
              <div className={`p-4 rounded-2xl text-xs border ${checkInMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                <div>{checkInMsg.text}</div>
                {checkInMsg.pin && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 flex justify-between items-center font-bold">
                    <span>Proctor Unlock PIN:</span>
                    <span className="text-lg font-mono text-white bg-emerald-950 px-3 py-1 rounded-lg">{checkInMsg.pin}</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handlePerformCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Booking Ref / Candidate Email
                </label>
                <input 
                  type="text"
                  value={checkInBookingRef}
                  onChange={(e) => setCheckInBookingRef(e.target.value)}
                  placeholder="e.g. FETS-TD-8921"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                  Assign Testing Station
                </label>
                <select 
                  value={checkInTerminal}
                  onChange={(e) => setCheckInTerminal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand font-mono"
                >
                  {Array.from({ length: 24 }).map((_, i) => {
                    const tid = `T-${(i + 1).toString().padStart(2, '0')}`;
                    return <option key={tid} value={tid}>{tid} (Lab A)</option>;
                  })}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-brand hover:bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/20"
              >
                Confirm & Issue Proctor PIN
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-2">Or Quick Walk-In Registration:</h4>
              <div className="space-y-2">
                <input 
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <input 
                  type="email"
                  value={walkInEmail}
                  onChange={(e) => setWalkInEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
                <div className="flex gap-2">
                  <select 
                    value={walkInPart}
                    onChange={(e) => setWalkInPart(e.target.value as ExamPart)}
                    className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Part 1">CMA Part 1</option>
                    <option value="Part 2">CMA Part 2</option>
                  </select>
                  <button 
                    type="button"
                    onClick={handleWalkInRegister}
                    className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase"
                  >
                    Register Walk-In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAIL INSPECTOR MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-brand tracking-widest">Candidate Inspection</span>
                <h3 className="text-2xl font-black uppercase text-white">{selectedCandidate.name}</h3>
                <p className="text-xs text-slate-400">{selectedCandidate.bookingRef} • {selectedCandidate.email}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div><span className="text-slate-500 uppercase font-bold">Exam:</span> <strong className="text-white">CMA {selectedCandidate.examPart}</strong></div>
              <div><span className="text-slate-500 uppercase font-bold">Terminal:</span> <strong className="text-white">{selectedCandidate.terminalNumber || 'Unassigned'}</strong></div>
              <div><span className="text-slate-500 uppercase font-bold">Status:</span> <strong className="text-amber-400">{selectedCandidate.status}</strong></div>
              <div><span className="text-slate-500 uppercase font-bold">Proctor PIN:</span> <strong className="text-emerald-400 font-mono">{selectedCandidate.proctorAuthCode || 'N/A'}</strong></div>
            </div>

            {selectedCandidate.scorecard && (
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-300">Exam Results & AI Diagnostics:</h4>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-sm font-black">
                    <span className="text-white">Total Scaled Score:</span>
                    <span className="text-2xl text-brand">{selectedCandidate.scorecard.totalScoreScaled} / 500</span>
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none">
                    <Markdown>{selectedCandidate.scorecard.aiEvaluationText}</Markdown>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              {selectedCandidate.scorecard && (
                <button 
                  onClick={() => handleSendResults(selectedCandidate.id)}
                  className="px-6 py-2.5 bg-brand hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Send Scorecard to Candidate Email
                </button>
              )}
              <button 
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
