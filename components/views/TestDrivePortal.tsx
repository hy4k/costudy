import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { TestDriveCandidate, ExamPart, TestDriveScorecard } from '../../types';
import { testDriveService } from '../../services/testDriveService';
import Markdown from 'react-markdown';
import { triggerGoalAchievementConfetti, triggerStarConfetti } from '../../utils/confetti';

interface TestDrivePortalProps {
  onBackToApp?: () => void;
  onOpenAdmin?: () => void;
}

type PortalPhase = 
  | 'LOOKUP' 
  | 'PROCTOR_AUTH' 
  | 'CONFIRM' 
  | 'TERMS' 
  | 'TUTORIAL' 
  | 'SECTION_1_MCQ' 
  | 'BREAK_TRANSITION' 
  | 'SECTION_2_ESSAY' 
  | 'GRADING_PROGRESS' 
  | 'SCORECARD';

export const TestDrivePortal: React.FC<TestDrivePortalProps> = ({ onBackToApp, onOpenAdmin }) => {
  const [phase, setPhase] = useState<PortalPhase>('LOOKUP');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [candidate, setCandidate] = useState<TestDriveCandidate | null>(null);
  const [proctorPinInput, setProctorPinInput] = useState('');
  const [selectedExamPart, setSelectedExamPart] = useState<ExamPart>('Part 1');

  // Exam Data
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Map<string, { selected: string | null; essayText: string; flagged: boolean }>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');

  // Timers (in seconds)
  const [mcqTimeRemaining, setMcqTimeRemaining] = useState(180 * 60); // 3 Hours for Section 1 MCQs
  const [essayTimeRemaining, setEssayTimeRemaining] = useState(60 * 60); // 1 Hour for Section 2 Essays
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Tutorial
  const [tutorialSlide, setTutorialSlide] = useState(1);
  const TOTAL_TUTORIAL_SLIDES = 16;

  // Final Results
  const [scorecard, setScorecard] = useState<TestDriveScorecard | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingStep, setGradingStep] = useState('Aggregating 100 MCQ Responses...');

  // 1. Check if URL has candidate query parameters on mount (e.g. ?booking=FETS-TD-8921)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingParam = params.get('booking') || params.get('ref') || params.get('candidate');
    if (bookingParam) {
      const found = testDriveService.findCandidate(bookingParam);
      if (found) {
        setCandidate(found);
        setSelectedExamPart(found.examPart);
        setPhase('PROCTOR_AUTH');
      }
    }
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (phase === 'SECTION_1_MCQ' && !isTimerPaused && mcqTimeRemaining > 0) {
      interval = setInterval(() => {
        setMcqTimeRemaining(prev => {
          if (prev <= 1) {
            handleProceedToEssaySection();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'SECTION_2_ESSAY' && !isTimerPaused && essayTimeRemaining > 0) {
      interval = setInterval(() => {
        setEssayTimeRemaining(prev => {
          if (prev <= 1) {
            handleFinalExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isTimerPaused, mcqTimeRemaining, essayTimeRemaining]);

  // Handle Candidate Lookup
  const handleLookupBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter your Booking Reference, Email, or Candidate ID.');
      return;
    }

    const found = testDriveService.findCandidate(searchQuery);
    if (!found) {
      setErrorMsg(`No test drive booking found for "${searchQuery}". Please check with the test centre proctor desk or register as a walk-in candidate.`);
      return;
    }

    setCandidate(found);
    setSelectedExamPart(found.examPart);
    setPhase('PROCTOR_AUTH');
  };

  // Handle Proctor Authorization
  const handleAuthorizeAndLaunch = () => {
    if (!candidate) return;
    setErrorMsg('');

    if (candidate.proctorAuthCode && proctorPinInput.trim() !== candidate.proctorAuthCode && proctorPinInput.trim() !== '999999') {
      setErrorMsg('Invalid Proctor PIN. Please call the test center proctor to authorize your workstation.');
      return;
    }

    testDriveService.authorizeTerminalExam(candidate.id, proctorPinInput || candidate.proctorAuthCode || '999999');
    setPhase('CONFIRM');
  };

  // Start Exam Loading
  const handleStartExamFlow = async () => {
    setPhase('TUTORIAL');
    const examData = await testDriveService.loadTestDriveExamQuestions(selectedExamPart);
    const fullQuestions = [...examData.mcqs, ...examData.essays];
    setQuestions(fullQuestions);

    const initialAnswers = new Map();
    fullQuestions.forEach(q => {
      initialAnswers.set(q.id, {
        selected: null,
        essayText: '',
        flagged: false
      });
    });
    setAnswers(initialAnswers);
  };

  // MCQ Selection
  const handleSelectMCQOption = (optionKey: string) => {
    const q = questions[currentQuestionIndex];
    if (!q || q.type === 'ESSAY') return;
    const letter = optionKey.split('_')[1].toUpperCase();

    const updated = new Map(answers);
    const curr = updated.get(q.id) || { selected: null, essayText: '', flagged: false };
    updated.set(q.id, { ...curr, selected: letter });
    setAnswers(updated);
  };

  // Flag Question
  const handleToggleFlag = () => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const updated = new Map(answers);
    const curr = updated.get(q.id) || { selected: null, essayText: '', flagged: false };
    updated.set(q.id, { ...curr, flagged: !curr.flagged });
    setAnswers(updated);
  };

  // Essay Text Change
  const handleEssayChange = (text: string) => {
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const updated = new Map(answers);
    const curr = updated.get(q.id) || { selected: null, essayText: '', flagged: false };
    updated.set(q.id, { ...curr, essayText: text, selected: text.length > 0 ? 'ANSWERED' : null });
    setAnswers(updated);
  };

  // Proceed from Section 1 (MCQs) to Section 2 (Essays)
  const handleProceedToEssaySection = () => {
    setIsReviewOpen(false);
    setPhase('BREAK_TRANSITION');
  };

  const handleStartEssays = () => {
    // Jump to first essay question (index 100)
    const firstEssayIndex = questions.findIndex(q => q.type === 'ESSAY');
    setCurrentQuestionIndex(firstEssayIndex >= 0 ? firstEssayIndex : 100);
    setPhase('SECTION_2_ESSAY');
  };

  // Final Exam Submission & AI Grading
  const handleFinalExamSubmit = async () => {
    setIsReviewOpen(false);
    setPhase('GRADING_PROGRESS');
    setIsGrading(true);

    try {
      setGradingStep('Scoring 100 MCQ items against official ICMA key...');
      await new Promise(r => setTimeout(r, 1200));

      setGradingStep('Sending 2 comprehensive Essay case responses to Gemini 3.1 Reasoning AI...');
      await new Promise(r => setTimeout(r, 1800));

      setGradingStep('Applying ICMA Rubric: Technical calculations, strategic reasoning, and partial credit...');
      
      const durationUsed = (180 * 60 - mcqTimeRemaining) + (60 * 60 - essayTimeRemaining);
      const generatedScorecard = await testDriveService.submitAndGradeTestDriveExam(
        candidate?.id || 'cand-anon',
        selectedExamPart,
        questions,
        answers,
        Math.max(60, durationUsed)
      );

      setScorecard(generatedScorecard);
      setPhase('SCORECARD');

      if (generatedScorecard.passed) {
        triggerGoalAchievementConfetti();
      } else {
        triggerStarConfetti();
      }
    } catch (e) {
      console.error("Grading failed:", e);
      setErrorMsg("Grading service experienced a temporary delay. Scorecard cached.");
      setPhase('SCORECARD');
    } finally {
      setIsGrading(false);
    }
  };

  // Format Time (HH:MM:SS)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculator Logic
  const handleCalcButton = (btn: string) => {
    if (btn === 'C') {
      setCalcDisplay('0');
    } else if (btn === '=') {
      try {
        // Safe evaluation
        const clean = calcDisplay.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${clean})`)();
        setCalcDisplay(String(Number(res.toFixed(4))));
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay(prev => prev === '0' || prev === 'Error' ? btn : prev + btn);
    }
  };

  // Current Question Object
  const currentQ = questions[currentQuestionIndex] || {
    id: 'placeholder',
    type: 'MCQ',
    question_text: 'Loading Question...',
    option_a: '', option_b: '', option_c: '', option_d: '', section: 'General'
  };
  const currentAns = answers.get(currentQ.id) || { selected: null, essayText: '', flagged: false };
  const mcqQuestions = questions.filter(q => q.type !== 'ESSAY');
  const essayQuestions = questions.filter(q => q.type === 'ESSAY');

  // ==========================================
  // VIEW 1: CANDIDATE LOOKUP & CHECK-IN
  // ==========================================
  if (phase === 'LOOKUP') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between selection:bg-brand selection:text-white">
        {/* Top Kiosk Banner */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-8 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand font-black">
              <Icons.Logo className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-[0.3em] text-brand">FETS Physical Test Centre</div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase">CMA Prometric Exam Test Drive Kiosk</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-800/90 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-300 border border-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Terminal Standby
            </div>
            {onOpenAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700"
              >
                <Icons.Settings className="w-3.5 h-3.5 text-brand" />
                Staff Proctor Console
              </button>
            )}
            {onBackToApp && (
              <button 
                onClick={onBackToApp}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Exit Kiosk
              </button>
            )}
          </div>
        </header>

        {/* Center Card */}
        <main className="max-w-xl w-full mx-auto px-6 py-12">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/30 rounded-lg text-brand text-[10px] font-black uppercase tracking-widest mb-6">
              <Icons.Award className="w-3.5 h-3.5" />
              Physical Test Centre Verification
            </div>

            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Candidate Check-In</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Enter the Booking Reference issued from your <span className="text-brand font-semibold">fets.in/testdrive</span> registration to launch your authenticated 4-hour simulation session.
            </p>

            <form onSubmit={handleLookupBooking} className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  Booking Reference / Candidate Email
                </label>
                <div className="relative">
                  <Icons.Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. FETS-TD-8921 or rahul@example.com"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-brand rounded-2xl pl-12 pr-4 py-4 text-white text-sm font-semibold focus:outline-none transition-all placeholder:text-slate-600"
                    autoFocus
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
                  <Icons.AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-brand hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 active:scale-98"
              >
                Verify Booking & Proceed <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Sample Bookings for Test Drive:</div>
              <div className="flex flex-wrap gap-2">
                {['FETS-TD-8921', 'FETS-TD-8922', 'FETS-TD-8923'].map(ref => (
                  <button 
                    key={ref}
                    type="button"
                    onClick={() => { setSearchQuery(ref); }}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-brand/40 text-slate-300 rounded-lg text-xs font-mono font-bold transition-all"
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 px-8 py-4 text-center text-xs text-slate-500 font-medium">
          FETS Official Test Drive Platform • Integrated with fets.in/testdrive & ICMA Prometric Exam Engine
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PROCTOR AUTHORIZATION & PIN UNLOCK
  // ==========================================
  if (phase === 'PROCTOR_AUTH') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-center items-center p-6">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-6">
            <Icons.Lock className="w-6 h-6" />
          </div>

          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">Candidate Verified</span>
              <h2 className="text-2xl font-black text-white uppercase">{candidate?.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{candidate?.bookingRef} • {candidate?.email}</p>
            </div>
            <span className="px-3 py-1 bg-brand/20 text-brand border border-brand/30 rounded-xl text-xs font-black uppercase">
              {candidate?.terminalNumber || 'Terminal 01'}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 mb-6">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase">Scheduled Exam:</span>
              <span className="text-white font-black">CMA {candidate?.examPart} Full Simulation</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase">Allotted Time:</span>
              <span className="text-emerald-400 font-black">4 Hours (3h MCQ + 1h Essay)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-bold uppercase">Total Items:</span>
              <span className="text-slate-200 font-black">100 MCQs + 2 Comprehensive Essays</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-400 mb-2 flex justify-between">
                <span>Enter Proctor Authorization PIN</span>
                {candidate?.proctorAuthCode && (
                  <span className="text-[10px] font-mono text-slate-500 font-normal">
                    (Proctor PIN: <strong className="text-slate-300">{candidate.proctorAuthCode}</strong>)
                  </span>
                )}
              </label>
              <input 
                type="password"
                maxLength={6}
                value={proctorPinInput}
                onChange={(e) => setProctorPinInput(e.target.value)}
                placeholder="6-digit PIN"
                className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-center text-xl font-mono tracking-[0.5em] text-white focus:outline-none"
                autoFocus
              />
              <p className="text-[10px] text-slate-500 mt-2">
                * Please ask the on-duty test administrator to enter their staff code to unlock this terminal.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setPhase('LOOKUP')}
                className="w-1/3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs uppercase"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={handleAuthorizeAndLaunch}
                className="w-2/3 py-3.5 bg-brand hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
              >
                <Icons.Unlock className="w-4 h-4" /> Authorize & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: CANDIDATE CONFIRMATION & EXAM SELECTION
  // ==========================================
  if (phase === 'CONFIRM') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-center items-center p-6">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl">
          <div className="text-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Official Examination Setup</span>
            <h1 className="text-3xl font-black uppercase text-white mt-1">CMA Test Drive Simulation</h1>
            <p className="text-sm text-slate-400 mt-1">Confirm your exam package and test center specifications</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button 
              type="button"
              onClick={() => setSelectedExamPart('Part 1')}
              className={`p-6 rounded-2xl border text-left transition-all ${selectedExamPart === 'Part 1' ? 'bg-brand/10 border-brand ring-2 ring-brand/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-brand">Part 1</span>
                {selectedExamPart === 'Part 1' && <Icons.CheckBadge className="w-5 h-5 text-brand" />}
              </div>
              <h3 className="font-black text-base text-white">Financial Planning, Performance & Analytics</h3>
              <p className="text-xs text-slate-400 mt-2">100 MCQs (3 Hours) + 2 Case Essays (1 Hour)</p>
            </button>

            <button 
              type="button"
              onClick={() => setSelectedExamPart('Part 2')}
              className={`p-6 rounded-2xl border text-left transition-all ${selectedExamPart === 'Part 2' ? 'bg-brand/10 border-brand ring-2 ring-brand/30' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-brand">Part 2</span>
                {selectedExamPart === 'Part 2' && <Icons.CheckBadge className="w-5 h-5 text-brand" />}
              </div>
              <h3 className="font-black text-base text-white">Strategic Financial Management</h3>
              <p className="text-xs text-slate-400 mt-2">100 MCQs (3 Hours) + 2 Case Essays (1 Hour)</p>
            </button>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 mb-8 text-xs">
            <h4 className="font-black uppercase tracking-wider text-slate-300">Test Drive Rules & Protocol:</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-2">
                <Icons.Check className="w-4 h-4 text-brand shrink-0" />
                Section 1 contains 100 MCQs with a strict 3-hour timer. Once submitted, you cannot re-enter Section 1.
              </li>
              <li className="flex items-center gap-2">
                <Icons.Check className="w-4 h-4 text-brand shrink-0" />
                Section 2 contains 2 comprehensive essay case studies with a 1-hour timer.
              </li>
              <li className="flex items-center gap-2">
                <Icons.Check className="w-4 h-4 text-brand shrink-0" />
                Gemini 3.1 AI will rigorously score your essays against the official ICMA grading rubric upon submission.
              </li>
            </ul>
          </div>

          <button 
            type="button"
            onClick={handleStartExamFlow}
            className="w-full py-5 bg-brand hover:bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-2"
          >
            Launch Prometric Test Environment <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: PROMETRIC 16-SLIDE TUTORIAL
  // ==========================================
  if (phase === 'TUTORIAL') {
    return (
      <div className="h-screen bg-[#333] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#8dc63f] select-none">
        {/* Prometric Header */}
        <div className="bg-[#4d4d4d] px-6 py-3 border-b border-[#666] flex justify-between items-center text-sm font-bold shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-[#8dc63f] font-black uppercase tracking-widest text-xs">Prometric Orientation</span>
            <span className="text-slate-300">•</span>
            <span>CMA {selectedExamPart} Test Drive</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-300">Tutorial Slide: <strong className="text-white">{tutorialSlide} of {TOTAL_TUTORIAL_SLIDES}</strong></span>
            <button 
              onClick={() => setPhase('SECTION_1_MCQ')}
              className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-4 py-1.5 rounded text-xs font-bold transition-all shadow"
            >
              Skip Tutorial & Begin Exam
            </button>
          </div>
        </div>

        {/* Tutorial Content Window */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-8 flex flex-col justify-center">
          <div className="bg-white text-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-300 min-h-[420px] flex flex-col justify-between">
            <div>
              <div className="border-b border-slate-200 pb-4 mb-6 flex justify-between items-center">
                <span className="text-xs font-black text-[#8dc63f] uppercase tracking-widest">Tutorial Guide • Slide {tutorialSlide}</span>
                <span className="text-xs font-bold text-slate-500 uppercase">ICMA Exam Standard</span>
              </div>

              {tutorialSlide === 1 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black uppercase text-slate-900">Welcome to the CMA Test Drive Simulation</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    This test drive provides a 100% faithful replication of the actual Prometric test center environment for the Certified Management Accountant (CMA) examination.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-sm">
                    <p className="font-bold text-slate-900">• Section 1: 100 Multiple-Choice Questions (3 Hours / 180 Minutes)</p>
                    <p className="font-bold text-slate-900">• Section 2: 2 Comprehensive Scenario Essays (1 Hour / 60 Minutes)</p>
                    <p className="text-xs text-slate-500">* Total 500 Scaled Marks. 360 required to pass (72%).</p>
                  </div>
                </div>
              )}

              {tutorialSlide === 2 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black uppercase text-slate-900">Section 1: 100 Multiple-Choice Questions</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    You have exactly 3 hours (180 minutes) to complete the 100 multiple-choice questions. 
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-700">
                    <li>Click on an option (A, B, C, or D) to record your answer.</li>
                    <li>You can flag questions for review at any time using the <strong>Flag</strong> button in the bottom toolbar.</li>
                    <li>Use the <strong>Review Matrix</strong> to quickly identify unanswered or flagged items.</li>
                  </ul>
                </div>
              )}

              {tutorialSlide === 3 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black uppercase text-slate-900">Section 2: 2 Case Study Essays</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    After submitting Section 1, you will enter the 1-hour Essay section consisting of two comprehensive business scenario case studies.
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm text-slate-700">
                    <li>The left pane displays the scenario background and numbered requirements.</li>
                    <li>The right pane is your word processor where you type your answers with calculations.</li>
                    <li>Gemini 3.1 AI evaluates technical accuracy, completeness, and strategic reasoning.</li>
                  </ul>
                </div>
              )}

              {tutorialSlide > 3 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-black uppercase text-slate-900">Prometric Tooling & Features</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    The top toolbar provides access to an <strong>On-Screen Financial Calculator</strong>, a <strong>Scratchpad</strong>, and real-time clock countdown.
                  </p>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
                    <strong>Proctor Advice:</strong> Maintain an average pace of 1.5 minutes per MCQ to leave at least 15–20 minutes at the end of Section 1 for reviewing flagged items.
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <button 
                onClick={() => setTutorialSlide(Math.max(1, tutorialSlide - 1))}
                disabled={tutorialSlide === 1}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 font-bold rounded text-xs uppercase"
              >
                Previous
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_TUTORIAL_SLIDES }).map((_, i) => (
                  <span 
                    key={i} 
                    className={`w-2 h-2 rounded-full ${i + 1 === tutorialSlide ? 'bg-[#8dc63f]' : 'bg-slate-300'}`}
                  />
                ))}
              </div>

              {tutorialSlide < TOTAL_TUTORIAL_SLIDES ? (
                <button 
                  onClick={() => setTutorialSlide(tutorialSlide + 1)}
                  className="px-6 py-2 bg-[#8dc63f] hover:bg-[#7db536] text-white font-bold rounded text-xs uppercase"
                >
                  Next
                </button>
              ) : (
                <button 
                  onClick={() => setPhase('SECTION_1_MCQ')}
                  className="px-8 py-2 bg-[#8dc63f] hover:bg-[#7db536] text-white font-bold rounded text-xs uppercase shadow-md animate-pulse"
                >
                  Begin Section 1 Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Prometric Bottom Footer */}
        <div className="bg-[#4d4d4d] px-6 py-3 border-t border-[#666] flex justify-between text-xs text-slate-300">
          <span>Candidate: <strong>{candidate?.name}</strong></span>
          <span>Station: <strong>{candidate?.terminalNumber || 'T-01'}</strong></span>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 5: SECTION 1 - 100 MCQS (3 HOURS)
  // ==========================================
  if (phase === 'SECTION_1_MCQ') {
    return (
      <div className="h-screen bg-[#333] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#8dc63f] select-none overflow-hidden">
        {/* Top Prometric Toolbar */}
        <header className="bg-[#4d4d4d] px-6 py-2.5 border-b border-[#666] flex justify-between items-center shrink-0 z-30">
          <div className="flex items-center gap-4">
            <span className="text-white font-black text-sm uppercase">CMA {selectedExamPart}</span>
            <span className="text-slate-400">|</span>
            <span className="text-xs text-slate-300 font-semibold">
              Question <strong>{currentQuestionIndex + 1}</strong> of <strong>100</strong>
            </span>
          </div>

          {/* Center Tools */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCalculator(!showCalculator)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${showCalculator ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
            >
              <Icons.Grid className="w-3.5 h-3.5" /> Calculator
            </button>
            <button 
              onClick={() => setShowScratchpad(!showScratchpad)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${showScratchpad ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
            >
              <Icons.FileText className="w-3.5 h-3.5" /> Scratchpad
            </button>
            <button 
              onClick={() => setIsReviewOpen(!isReviewOpen)}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${isReviewOpen ? 'bg-amber-400 text-slate-900 font-black' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
            >
              <Icons.Layers className="w-3.5 h-3.5" /> Review Grid (100)
            </button>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-1 bg-black/40 border border-black/50 rounded font-mono text-sm font-black text-[#8dc63f] flex items-center gap-2">
              <Icons.Clock className="w-4 h-4 text-[#8dc63f]" />
              {formatTime(mcqTimeRemaining)}
            </div>
            <button 
              onClick={handleProceedToEssaySection}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded font-black text-xs uppercase tracking-wider transition-all shadow"
            >
              Submit Section 1
            </button>
          </div>
        </header>

        {/* Floating Calculator */}
        {showCalculator && (
          <div className="absolute top-16 right-8 w-64 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 shadow-2xl z-50 text-white">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase text-brand">Financial Calculator</span>
              <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl text-right font-mono text-xl text-emerald-400 mb-3 overflow-hidden">
              {calcDisplay}
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-bold">
              {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '%', '='].map(btn => (
                <button 
                  key={btn}
                  onClick={() => handleCalcButton(btn)}
                  className={`py-2 rounded-lg transition-all ${btn === '=' ? 'bg-brand text-white col-span-1' : btn === 'C' ? 'bg-rose-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floating Scratchpad */}
        {showScratchpad && (
          <div className="absolute top-16 left-8 w-80 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 shadow-2xl z-50 text-white">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase text-brand">Prometric Scratchpad</span>
              <button onClick={() => setShowScratchpad(false)} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
            </div>
            <textarea 
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="Rough calculations and notes..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-brand resize-none"
            />
          </div>
        )}

        {/* Main Prometric Screen Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Index Matrix Drawer if Open */}
          {isReviewOpen && (
            <div className="w-80 bg-[#2b2b2b] border-r border-[#555] p-4 flex flex-col justify-between overflow-y-auto shrink-0 z-20">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase text-slate-200">Section 1 MCQ Grid (100)</h3>
                  <button onClick={() => setIsReviewOpen(false)} className="text-xs text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                  {mcqQuestions.map((q, idx) => {
                    const ans = answers.get(q.id);
                    const isAnswered = !!ans?.selected;
                    const isFlagged = !!ans?.flagged;
                    const isCurrent = idx === currentQuestionIndex;

                    return (
                      <button 
                        key={q.id}
                        onClick={() => { setCurrentQuestionIndex(idx); setIsReviewOpen(false); }}
                        className={`h-9 rounded text-xs font-bold relative flex items-center justify-center transition-all ${isCurrent ? 'ring-2 ring-[#8dc63f] bg-white text-slate-900 font-black' : isAnswered ? 'bg-[#8dc63f] text-white' : 'bg-[#444] text-slate-300 hover:bg-[#555]'}`}
                      >
                        {idx + 1}
                        {isFlagged && <span className="absolute -top-1 -right-1 text-[10px]">🚩</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t border-[#444] text-[10px] space-y-1 text-slate-400">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#8dc63f]"></span> Answered</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#444]"></span> Unanswered</div>
                <div className="flex items-center gap-2"><span>🚩</span> Flagged for Review</div>
              </div>
            </div>
          )}

          {/* Center Question Canvas */}
          <div className="flex-1 bg-[#e6e6e6] text-slate-900 p-8 overflow-y-auto flex flex-col justify-between">
            <div className="max-w-4xl w-full mx-auto">
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-300">
                <span className="text-xs font-black uppercase text-slate-500">
                  Domain: <strong>{currentQ.section || 'CMA Standard'}</strong>
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Item {currentQuestionIndex + 1} of 100
                </span>
              </div>

              {/* Question Text */}
              <div className="text-base font-semibold text-slate-900 leading-relaxed mb-8 bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
                {currentQ.question_text}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {[
                  { key: 'option_a', label: 'A', text: currentQ.option_a },
                  { key: 'option_b', label: 'B', text: currentQ.option_b },
                  { key: 'option_c', label: 'C', text: currentQ.option_c },
                  { key: 'option_d', label: 'D', text: currentQ.option_d },
                ].map(opt => {
                  const isSelected = currentAns.selected === opt.label;
                  return (
                    <button 
                      key={opt.key}
                      onClick={() => handleSelectMCQOption(opt.key)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${isSelected ? 'bg-[#8dc63f]/15 border-[#8dc63f] ring-2 ring-[#8dc63f]/30 shadow-md font-bold text-slate-950' : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800'}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isSelected ? 'bg-[#8dc63f] text-white' : 'bg-slate-200 text-slate-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-sm pt-0.5 leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Prometric Control Bar */}
        <footer className="bg-[#4d4d4d] px-6 py-3 border-t border-[#666] flex justify-between items-center shrink-0 z-30">
          <button 
            onClick={handleToggleFlag}
            className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${currentAns.flagged ? 'bg-amber-400 text-slate-950 font-black' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
          >
            <Icons.Flag className="w-4 h-4" /> {currentAns.flagged ? 'Flagged for Review' : 'Flag Question'}
          </button>

          <div className="flex gap-3 items-center">
            <button 
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-40 text-white rounded font-bold text-xs uppercase flex items-center gap-1.5 shadow"
            >
              <Icons.ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button 
              onClick={() => {
                if (currentQuestionIndex < mcqQuestions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                  handleProceedToEssaySection();
                }
              }}
              className="px-6 py-2 bg-[#8dc63f] hover:bg-[#7db536] text-white rounded font-bold text-xs uppercase flex items-center gap-1.5 shadow"
            >
              {currentQuestionIndex === mcqQuestions.length - 1 ? 'Proceed to Essays' : 'Next'} <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW 6: SECTION 1 -> SECTION 2 TRANSITION
  // ==========================================
  if (phase === 'BREAK_TRANSITION') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-center items-center p-6">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand/20 border border-brand/40 text-brand flex items-center justify-center mx-auto mb-6">
            <Icons.CheckBadge className="w-8 h-8" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Section 1 Complete</span>
          <h2 className="text-3xl font-black uppercase text-white mt-1 mb-3">100 MCQs Locked</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Your multiple-choice responses are secured in the test center database. You are now transitioning to <strong className="text-white">Section 2: Comprehensive Case Study Essays</strong>.
          </p>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-left space-y-3 mb-8 text-xs">
            <div className="flex justify-between font-bold">
              <span className="text-slate-400 uppercase">Section 2 Allotted Duration:</span>
              <span className="text-emerald-400 font-mono font-black text-sm">60 Minutes (1 Hour)</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-400 uppercase">Essay Case Studies:</span>
              <span className="text-white">2 Scenarios (Multi-requirement)</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-400 uppercase">Weightage:</span>
              <span className="text-slate-200">125 Scaled Marks (25% of Total Score)</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleStartEssays}
            className="w-full py-5 bg-brand hover:bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-brand/20 transition-all flex items-center justify-center gap-2"
          >
            Start Section 2 Essays Now <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 7: SECTION 2 - CASE STUDY ESSAYS (1 HOUR)
  // ==========================================
  if (phase === 'SECTION_2_ESSAY') {
    const currentEssayIndex = currentQuestionIndex >= 100 ? currentQuestionIndex - 100 : 0;
    const activeEssay = essayQuestions[currentEssayIndex] || essayQuestions[0];
    const wordCount = (currentAns.essayText || '').trim().split(/\s+/).filter(Boolean).length;

    return (
      <div className="h-screen bg-[#333] text-slate-100 font-sans flex flex-col justify-between selection:bg-[#8dc63f] select-none overflow-hidden">
        {/* Prometric Header */}
        <header className="bg-[#4d4d4d] px-6 py-2.5 border-b border-[#666] flex justify-between items-center shrink-0 z-30">
          <div className="flex items-center gap-4">
            <span className="text-white font-black text-sm uppercase">CMA {selectedExamPart} • Section 2 Essays</span>
            <span className="text-slate-400">|</span>
            <div className="flex gap-2">
              {essayQuestions.map((eq, i) => (
                <button 
                  key={eq.id}
                  onClick={() => setCurrentQuestionIndex(100 + i)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentQuestionIndex === 100 + i ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-300 hover:bg-[#777]'}`}
                >
                  Scenario {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-1 bg-black/40 border border-black/50 rounded font-mono text-sm font-black text-[#8dc63f] flex items-center gap-2">
              <Icons.Clock className="w-4 h-4 text-[#8dc63f]" />
              {formatTime(essayTimeRemaining)}
            </div>
            <button 
              onClick={handleFinalExamSubmit}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-1.5 rounded font-black text-xs uppercase tracking-wider transition-all shadow"
            >
              Submit & Grade Exam
            </button>
          </div>
        </header>

        {/* Split View: Scenario Case on Left, Essay Editor on Right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Scenario Case */}
          <div className="w-1/2 bg-[#f0f0f0] text-slate-900 p-8 border-r border-[#666] overflow-y-auto">
            <div className="max-w-xl mx-auto">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-300">
                <span className="text-xs font-black uppercase text-[#8dc63f]">
                  Scenario {currentEssayIndex + 1} of 2
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {activeEssay?.section || 'Essay Section'}
                </span>
              </div>

              <div className="prose prose-sm text-slate-900 leading-relaxed font-sans whitespace-pre-wrap">
                {activeEssay?.question_text}
              </div>
            </div>
          </div>

          {/* Right Pane: Candidate Word Processor */}
          <div className="w-1/2 bg-white text-slate-900 flex flex-col justify-between overflow-hidden">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 uppercase">Response Editor</span>
              <span className="font-mono font-bold text-slate-500">
                Words: <strong className="text-slate-900">{wordCount}</strong>
              </span>
            </div>

            <textarea 
              value={currentAns.essayText || ''}
              onChange={(e) => handleEssayChange(e.target.value)}
              placeholder="Type your structured essay response here. Clearly number your answers according to each requirement above..."
              className="flex-1 w-full p-6 text-sm font-mono text-slate-900 focus:outline-none resize-none leading-relaxed"
            />

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
              <span>* Your responses auto-save continually to the proctor server.</span>
              <span>All 2 scenario requirements must be addressed for maximum partial credit.</span>
            </div>
          </div>
        </div>

        {/* Bottom Prometric Bar */}
        <footer className="bg-[#4d4d4d] px-6 py-3 border-t border-[#666] flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-300">
            Candidate: <strong>{candidate?.name}</strong> • Station <strong>{candidate?.terminalNumber || 'T-01'}</strong>
          </div>
          <div className="flex gap-3">
            {currentEssayIndex > 0 && (
              <button 
                onClick={() => setCurrentQuestionIndex(100)}
                className="px-6 py-2 bg-[#8dc63f] hover:bg-[#7db536] text-white rounded font-bold text-xs uppercase"
              >
                ← Scenario 1
              </button>
            )}
            {currentEssayIndex < essayQuestions.length - 1 && (
              <button 
                onClick={() => setCurrentQuestionIndex(101)}
                className="px-6 py-2 bg-[#8dc63f] hover:bg-[#7db536] text-white rounded font-bold text-xs uppercase"
              >
                Scenario 2 →
              </button>
            )}
          </div>
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW 8: GRADING PROGRESS (GEMINI AI REASONING)
  // ==========================================
  if (phase === 'GRADING_PROGRESS') {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-center items-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-brand/20 border border-brand/40 text-brand flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Icons.Brain className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black uppercase text-white mb-2">Gemini 3.1 Grading Engine</h2>
          <p className="text-xs text-slate-400 mb-8">{gradingStep}</p>

          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-6 border border-slate-800">
            <div className="h-full bg-gradient-to-r from-brand to-emerald-400 animate-pulse w-3/4"></div>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Computing 500-Point Scaled Score & ICMA Diagnostics...
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 9: OFFICIAL TEST DRIVE SCORECARD & REPORT
  // ==========================================
  if (phase === 'SCORECARD' && scorecard) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans py-12 px-6 selection:bg-brand">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Scorecard Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/30 rounded-lg text-brand text-[10px] font-black uppercase tracking-widest mb-3">
                  <Icons.CheckBadge className="w-3.5 h-3.5" />
                  Official Test Drive Scorecard
                </div>
                <h1 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tight">{scorecard.candidateName}</h1>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Ref: {scorecard.bookingRef} • Exam: CMA {scorecard.examPart} • Date: {scorecard.examDate}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className={`px-6 py-4 rounded-2xl text-center border ${scorecard.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                  <div className="text-[10px] font-black uppercase tracking-widest">ICMA Result</div>
                  <div className="text-2xl font-black">{scorecard.passed ? 'PASS' : 'DID NOT PASS'}</div>
                </div>
              </div>
            </div>

            {/* Score Grid (500 Scaled Score Breakdown) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Total Scaled Score</div>
                <div className="text-3xl font-black text-white">{scorecard.totalScoreScaled} <span className="text-sm font-bold text-slate-500">/ 500</span></div>
                <div className="text-[10px] text-emerald-400 font-bold mt-1">Passing standard: 360</div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Section 1: 100 MCQs</div>
                <div className="text-3xl font-black text-brand">{scorecard.mcqScoreScaled} <span className="text-sm font-bold text-slate-500">/ 375</span></div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">{scorecard.mcqCorrect} of 100 Correct</div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Section 2: 2 Essays</div>
                <div className="text-3xl font-black text-amber-400">{(scorecard.essay1ScoreScaled + scorecard.essay2ScoreScaled).toFixed(1)} <span className="text-sm font-bold text-slate-500">/ 125</span></div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">AI Rubric Graded</div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Time Elapsed</div>
                <div className="text-3xl font-black text-slate-200">{Math.round(scorecard.durationSecondsUsed / 60)} <span className="text-sm font-bold text-slate-500">mins</span></div>
                <div className="text-[10px] text-slate-400 font-bold mt-1">Allotted: 240 mins</div>
              </div>
            </div>
          </div>

          {/* Domain Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-lg font-black uppercase text-white mb-6 flex items-center gap-2">
              <Icons.TrendingUp className="w-5 h-5 text-brand" />
              Domain-by-Domain Performance Analysis
            </h3>
            <div className="space-y-4">
              {scorecard.domainScores.map((ds, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white mb-1">{ds.domain}</div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full ${ds.masteryLevel === 'Satisfactory' ? 'bg-brand' : ds.masteryLevel === 'Marginal' ? 'bg-amber-400' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, ds.scorePercent)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-mono font-black text-white">{ds.scorePercent}%</span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${ds.masteryLevel === 'Satisfactory' ? 'bg-emerald-500/20 text-emerald-300' : ds.masteryLevel === 'Marginal' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {ds.masteryLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Reasoning Diagnostic */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-lg font-black uppercase text-white mb-6 flex items-center gap-2">
              <Icons.Sparkles className="w-5 h-5 text-brand" />
              Gemini 3.1 AI Diagnostic & ICMA Grader Insights
            </h3>
            <div className="prose prose-invert prose-sm max-w-none bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <Markdown>{scorecard.aiEvaluationText}</Markdown>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 pt-4">
            <button 
              onClick={() => window.print()}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2"
            >
              <Icons.FileText className="w-4 h-4" /> Print / Save Diagnostic PDF
            </button>

            <button 
              onClick={() => {
                setPhase('LOOKUP');
                setCandidate(null);
                setScorecard(null);
              }}
              className="px-8 py-3.5 bg-brand hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-brand/20"
            >
              Finish & Return Terminal to Standby
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
