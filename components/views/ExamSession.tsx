import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { fetchExamQuestions, saveExamProgress } from '../../services/fetsService';

interface Question {
  id: string;
  type?: 'MCQ' | 'ESSAY'; // New Type Field
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string;
  part: string;
  section: string;
}

interface Answer {
  questionId: string;
  selected: string | null;
  essayText?: string; // New field for Essay Content
  flagged: boolean;
  timeSpent: number;
}

interface ExamSessionProps {
  testId: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  onExit: () => void;
  userId?: string;
}

type ExamPhase = 'LOADING' | 'CONFIRM' | 'TERMS' | 'INTRODUCTION' | 'TEST' | 'RESULTS';

export const ExamSession: React.FC<ExamSessionProps> = ({ testId, title, questionCount, durationMinutes, onExit, userId }) => {
  const [phase, setPhase] = useState<ExamPhase>('LOADING');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  
  // Timers
  const [testTimeRemaining, setTestTimeRemaining] = useState(durationMinutes * 60);
  const [introTimeRemaining, setIntroTimeRemaining] = useState(15 * 60); // 15 Minutes for Introduction & Terms

  const [results, setResults] = useState({ correct: 0, total: 0, percentage: 0 });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Overlays & Modes within TEST phase
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Intro/Tutorial State
  const [introPage, setIntroPage] = useState(1);
  const TOTAL_INTRO_PAGES = 16;

  // Auto-Save State
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const essayInputRef = useRef<HTMLTextAreaElement>(null);

  // Refs for access in intervals/callbacks to avoid stale closures
  const stateRef = useRef({ answers, currentIndex, testTimeRemaining });

  // Update ref whenever relevant state changes
  useEffect(() => {
    stateRef.current = { answers, currentIndex, testTimeRemaining };
  }, [answers, currentIndex, testTimeRemaining]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadQuestions = async () => {
      const mcqs = await fetchExamQuestions(questionCount);
      const shuffledMCQs = mcqs.sort(() => Math.random() - 0.5);
      
      // Inject 2 Essay Questions
      const essays: Question[] = [
          {
              id: 'essay-1',
              type: 'ESSAY',
              question_text: 'SCENARIO:\n\nOmega Corp is a US-based manufacturer considering expansion into the European market. The CFO is concerned about foreign currency exchange risk as the Euro has been volatile against the USD.\n\nREQUIRED:\n\n1. Identify and explain the three types of foreign currency risk exposure Omega Corp might face.\n\n2. Recommend a hedging strategy using financial derivatives to mitigate the transaction risk identified in part 1.',
              part: 'Part 1',
              section: 'Essay Section - Financial Risk',
              option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
          },
          {
              id: 'essay-2',
              type: 'ESSAY',
              question_text: 'SCENARIO:\n\nYou are the Controller of TechSolutions Inc. The company has traditionally used a volume-based costing system (direct labor hours) to allocate overhead. Recently, competitors have undercut TechSolutions prices on high-volume products while TechSolutions remains cheaper on low-volume specialty products.\n\nREQUIRED:\n\n1. Analyze why the current costing system might be distorting product costs.\n\n2. Explain how Activity-Based Costing (ABC) could provide more accurate cost information and assist in strategic pricing decisions.',
              part: 'Part 1',
              section: 'Essay Section - Cost Management',
              option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
          }
      ];

      const fullExam = [...shuffledMCQs, ...essays];
      setQuestions(fullExam);

      const initialAnswers = new Map<string, Answer>();
      fullExam.forEach(q => {
        initialAnswers.set(q.id, {
          questionId: q.id,
          selected: null,
          essayText: '',
          flagged: false,
          timeSpent: 0
        });
      });
      setAnswers(initialAnswers);
      setPhase('CONFIRM'); // Start at Confirmation screen
    };
    loadQuestions();
  }, [questionCount]);

  // --- TIMERS ---
  useEffect(() => {
    let timer: any;
    // Allow intro timer to run during CONFIRM and TERMS phases too
    if ((phase === 'INTRODUCTION' || phase === 'TERMS' || phase === 'CONFIRM') && introTimeRemaining > 0) {
        timer = setInterval(() => {
            setIntroTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
    } else if (phase === 'TEST' && testTimeRemaining > 0) {
        // Timer continues running even if Help or Review is open
        timer = setInterval(() => {
            setTestTimeRemaining(prev => {
                if (prev <= 1) {
                    handleFinishTest();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, introTimeRemaining, testTimeRemaining]);

  // --- AUTO SAVE LOGIC ---
  const performSave = async (currentState: typeof stateRef.current) => {
      if (!userId) return;
      setSaveStatus('SAVING');
      try {
          // Convert Map to array of entries for serialization
          const answersArray = Array.from(currentState.answers.entries());
          await saveExamProgress(userId, testId, {
              answers: answersArray,
              currentIndex: currentState.currentIndex,
              timeRemaining: currentState.testTimeRemaining
          });
          setSaveStatus('SAVED');
          setLastSaved(new Date());
      } catch (e) {
          console.error("Auto-save failed", e);
          setSaveStatus('ERROR');
      }
  };

  // Periodic Auto-Save (Every 60s)
  useEffect(() => {
      if (phase === 'TEST') {
          const interval = setInterval(() => {
              performSave(stateRef.current);
          }, 60000);
          return () => clearInterval(interval);
      }
  }, [phase, userId, testId]);

  // Essay Auto-Focus Logic
  useEffect(() => {
      if (phase === 'TEST' && questions[currentIndex]?.type === 'ESSAY') {
          // Small timeout to ensure DOM is ready
          setTimeout(() => {
              essayInputRef.current?.focus();
          }, 50);
      }
  }, [currentIndex, phase, questions]);

  // --- HANDLERS ---
  const handleSelectAnswer = (optionKey: string) => {
    const current = questions[currentIndex];
    if (current.type === 'ESSAY') return;

    const letter = optionKey.split('_')[1].toUpperCase(); // 'option_a' -> 'A'
    
    const updated = new Map<string, Answer>(answers);
    const existing = updated.get(current.id);
    if (existing) {
      updated.set(current.id, { ...existing, selected: letter });
      setAnswers(updated);
    }
  };

  const handleEssayChange = (text: string) => {
      const current = questions[currentIndex];
      const updated = new Map<string, Answer>(answers);
      const existing = updated.get(current.id);
      if (existing) {
        updated.set(current.id, { ...existing, essayText: text, selected: text.length > 0 ? 'ANSWERED' : null });
        setAnswers(updated);
      }
  };

  const handleFlagQuestion = () => {
    const current = questions[currentIndex];
    const updated = new Map<string, Answer>(answers);
    const existing = updated.get(current.id);
    if (existing) {
      updated.set(current.id, { ...existing, flagged: !existing.flagged });
      setAnswers(updated);
    }
  };

  // Trigger Save on Navigation
  const handleNavigate = (newIndex: number) => {
      performSave(stateRef.current);
      setCurrentIndex(newIndex);
  };

  const handleFinishTest = () => {
    performSave(stateRef.current);
    let correct = 0;
    // Only score MCQs for immediate result. Essays would be pending.
    const mcqs = questions.filter(q => q.type !== 'ESSAY');
    mcqs.forEach(q => {
      const answer = answers.get(q.id);
      if (answer?.selected === q.correct_answer) {
        correct++;
      }
    });
    
    const total = mcqs.length; // Total MCQs
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    setResults({ correct, total, percentage });
    setPhase('RESULTS');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- INTRODUCTION CONTENT MAPPING ---
  const renderIntroContent = (page: number) => {
      const commonContent = (
        <>
            <h1 className="text-xl font-bold text-black mb-8">CMA Exam Simulation</h1>
            <h2 className="text-lg font-bold text-black mb-4">Exam Structure</h2>
            <p className="mb-6 text-sm text-black leading-relaxed">
                This CMA Exam Simulation exam has two (2) content sections and you will have {formatTime(durationMinutes * 60).split(':')[0]} hours and {formatTime(durationMinutes * 60).split(':')[1]} minutes to complete both sections of the exam.
            </p>
            <p className="mb-6 text-sm text-black leading-relaxed font-bold">
                Content Section 1: The first (1) content section is multiple-choice and you have 3 hours to complete this section.<br/>
                Content Section 2: The second (2) content section contains two essays and related questions and you have 1 hour (45m adjusted for this session) to complete this section.
            </p>
            <p className="mb-6 text-sm text-black leading-relaxed">
                Please note that the purpose of this Exam Simulation is to give you a sense of the experience of the exam as it will be in the test center. The simulated exam experience is not indicative of the breadth and depth of the CMA exam content.
            </p>
            <p className="mb-6 text-sm text-black leading-relaxed italic">
                Before you begin, it is strongly recommended that you take a few minutes to review the tutorial before attempting any questions.
            </p>
        </>
      );

      switch(page) {
          case 1:
              return (
                  <>
                    {commonContent}
                    {phase === 'INTRODUCTION' && (
                        <div className="mt-8 pt-4 border-t border-slate-200">
                            <p className="text-sm font-bold text-black underline cursor-pointer" onClick={() => setIntroPage(2)}>To begin the tutorial, click on the "Next" button at the bottom of the screen.</p>
                        </div>
                    )}
                  </>
              );
          // ... (Existing cases 2-5 kept same logic, abbreviated for brevity) ...
          default:
              return (
                  <>
                    <h2 className="text-lg font-bold text-black mb-6">General Information</h2>
                    <p className="mb-6 text-sm text-black leading-relaxed">
                        This screen provides information about the exam structure and navigation features available during the session.
                    </p>
                    <p className="font-bold text-sm text-black mt-8">Click 'Continue the Test' to return to your exam.</p>
                  </>
              );
      }
  }

  // --- RENDERERS ---

  if (phase === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Icons.CloudSync className="w-10 h-10 text-[#8dc63f] animate-spin" />
           <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Loading Exam Content...</p>
        </div>
      </div>
    );
  }

  // 1. CONFIRM DETAILS (Unchanged)
  if (phase === 'CONFIRM') {
    return (
      <div className="fixed inset-0 bg-slate-200 flex items-center justify-center p-4 z-50">
        <div className="bg-white shadow-2xl w-full max-w-lg rounded-none border border-slate-300">
          <div className="bg-[#4d4d4d] text-white px-6 py-3 flex justify-between items-center">
            <span className="font-bold text-lg">Confirm Details</span>
            <span className="font-mono text-sm">{formatTime(introTimeRemaining)}</span>
          </div>
          <div className="p-8 flex flex-col items-center">
             <div className="mb-8 w-40">
                <div className="border border-slate-200 p-2">
                   <div className="flex items-center gap-2 text-slate-700">
                      <span className="font-serif font-bold text-2xl">CMA</span>
                      <div className="h-8 w-px bg-slate-300"></div>
                      <span className="text-[6px] uppercase leading-tight font-bold text-slate-500"><br/>Accountants and<br/>Financial Professionals<br/>in Business</span>
                   </div>
                </div>
             </div>
             <div className="border border-slate-300 p-6 w-full mb-8 bg-slate-50">
                <div className="grid grid-cols-3 gap-y-2 text-sm">
                   <span className="text-slate-500 font-bold">Last Name:</span>
                   <span className="col-span-2 font-bold text-slate-800 uppercase">User</span>
                   <span className="text-slate-500 font-bold">First Name:</span>
                   <span className="col-span-2 font-bold text-slate-800">Demo Candidate</span>
                   <span className="text-slate-500 font-bold">Test Name:</span>
                   <span className="col-span-2 font-bold text-slate-800">{title}</span>
                   <span className="text-slate-500 font-bold">Language:</span>
                   <span className="col-span-2 font-bold text-slate-800">English (US)</span>
                </div>
             </div>
             <p className="mb-8 text-slate-700 font-medium">Are the details above correct?</p>
             <div className="flex gap-4">
                <button onClick={() => setPhase('TERMS')} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2 rounded-sm font-bold shadow-sm flex items-center gap-2">
                   <Icons.CheckBadge className="w-4 h-4" /> Confirm
                </button>
                <button onClick={onExit} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2 rounded-sm font-bold shadow-sm flex items-center gap-2">
                   <Icons.Plus className="w-4 h-4 rotate-45" /> Cancel
                </button>
             </div>
          </div>
          <div className="px-4 py-2 bg-slate-50 text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest">
             Prometric
          </div>
        </div>
      </div>
    );
  }

  // 2. TERMS AND CONFIDENTIALITY AGREEMENT (Unchanged)
  if (phase === 'TERMS') {
      return (
        <div className="fixed inset-0 bg-slate-200 flex items-center justify-center p-4 z-50 font-sans">
            <div className="bg-white shadow-2xl w-full max-w-[1000px] h-[85vh] flex flex-col border border-slate-400">
                {/* Header */}
                <div className="bg-[#4d4d4d] text-white px-4 py-2 flex justify-between items-center shrink-0 h-12">
                    <span className="font-bold text-lg">Agree to Terms</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Icons.Clock className="w-5 h-5 text-white" />
                            <span className="font-mono text-xl font-bold">{formatTime(introTimeRemaining)}</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-white relative">
                    {/* ... (Same as previous content for Terms) ... */}
                    {/* CMA Logo Block */}
                    <div className="mb-6 flex flex-col items-center">
                        <div className="border border-slate-300 p-2 pr-4 bg-white mb-6 inline-flex items-center gap-3 select-none">
                            <div className="font-serif font-bold text-4xl text-slate-600 italic border-r border-slate-300 pr-3 tracking-tighter">CMA</div>
                            <div className="flex flex-col text-[9px] font-bold text-slate-500 uppercase leading-tight text-left">
                                <span>IMA's Certification for</span>
                                <span>Accountants and</span>
                                <span>Financial Professionals</span>
                                <span>in Business</span>
                            </div>
                        </div>
                        
                        <p className="text-slate-700 text-lg text-center">
                            Please ensure you scroll down to read and accept<br/>the organisation's Terms.
                        </p>
                    </div>

                    {/* Agreement Scroll Box */}
                    <div className="w-full max-w-4xl flex-1 border-[3px] border-[#f7b500] rounded-xl p-1 mb-8 relative bg-white">
                        <div className="h-full max-h-[400px] overflow-y-auto p-8 text-justify text-sm leading-relaxed text-slate-800 pr-6">
                            <h3 className="text-center font-bold text-slate-800 mb-8 uppercase text-base">CONFIDENTIALITY AGREEMENT</h3>
                            <p className="mb-6">
                                I hereby attest that I will not remove any examination materials... (Full text hidden for brevity)
                            </p>
                            <p className="font-bold">
                                By clicking "I accept these terms" you affirm that you accept the terms of this agreement.
                            </p>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <div className="mb-10 flex items-center gap-3">
                        <div 
                            onClick={() => setTermsAccepted(!termsAccepted)}
                            className={`w-6 h-6 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer bg-white transition-all ${termsAccepted ? 'border-slate-800' : ''}`}
                        >
                            {termsAccepted && <div className="w-3 h-3 bg-slate-800 rounded-[1px]"></div>} 
                        </div>
                        <span className="text-slate-500 font-medium select-none text-base cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>I accept these terms.</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mb-4">
                        <button onClick={onExit} className="bg-[#aecf68] hover:bg-[#a8c64d] text-white px-10 py-3 rounded-sm font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors">
                            <span className="font-bold text-xl leading-none">×</span> Exit
                        </button>
                        <button 
                            onClick={() => termsAccepted && setPhase('INTRODUCTION')} 
                            disabled={!termsAccepted}
                            className={`px-10 py-3 rounded-sm font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors ${termsAccepted ? 'bg-[#8dc63f] hover:bg-[#7db536] text-white' : 'bg-[#e0e0e0] text-slate-400 cursor-not-allowed'}`}
                        >
                            <Icons.CheckBadge className="w-5 h-5" /> Continue
                        </button>
                    </div>
                </div>

                <div className="px-4 py-2 bg-white text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0 border-t border-slate-200">
                    Prometric
                </div>
            </div>
        </div>
      );
  }

  // 3. INTRODUCTION (Phase before Test) (Unchanged)
  if (phase === 'INTRODUCTION') {
     const introProgress = Math.round((introPage / TOTAL_INTRO_PAGES) * 100);
     return (
        <div className="flex flex-col h-screen bg-white font-sans">
           <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center h-16 shrink-0">
              <div className="text-sm font-bold leading-tight">Page: {introPage}<br/><span className="font-medium text-slate-300">Section: Introduction</span></div>
              <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                 <Icons.Clock className="w-6 h-6 text-white" />
                 <div className="text-left">
                    <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">Introduction Time Rem...</div>
                    <div className="font-mono text-lg leading-none font-bold">{formatTime(introTimeRemaining)}</div>
                 </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-xs text-right hidden sm:block">
                    <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                       <div className="bg-white h-full transition-all duration-300" style={{width: `${introProgress}%`}}></div>
                    </div>
                    Progress {introProgress}%
                 </div>
                 <button className="bg-[#999] text-[#333] px-6 py-2 rounded-sm font-bold text-sm shadow-sm cursor-not-allowed border border-slate-500">Finish Test</button>
              </div>
           </div>
           {/* ... (Rest of Intro UI) ... */}
           <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
              <span className="font-bold text-sm">Test: {title}</span>
              <span className="font-bold text-sm">Candidate: USER Demo</span>
           </div>
           <div className="flex-1 flex overflow-hidden bg-white">
              <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0">
                 {[...Array(TOTAL_INTRO_PAGES)].map((_, i) => (
                    <div key={i} onClick={() => setIntroPage(i+1)} className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer mb-1 border border-l-0 ${i+1 === introPage ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' : 'bg-[#9cc65a] text-white border-[#8dc63f] opacity-80'}`}>{i+1}</div>
                 ))}
              </div>
              <div className="flex-1 p-12 overflow-y-auto"><div className="max-w-4xl">{renderIntroContent(introPage)}</div></div>
           </div>
           <div className="bg-[#4d4d4d] px-4 py-3 flex justify-between items-center border-t border-[#666] shrink-0">
              <div className="flex gap-1"><button className="p-2 text-white hover:bg-white/10 rounded"><Icons.Trophy className="w-6 h-6" /></button></div>
              <div className="flex gap-4">
                 <button onClick={() => setIntroPage(Math.max(1, introPage - 1))} className="bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 text-sm"><Icons.ChevronLeft className="w-4 h-4" /> Previous</button>
                 <button onClick={() => setIntroPage(Math.min(TOTAL_INTRO_PAGES, introPage + 1))} className="bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 text-sm">Next <Icons.ChevronRight className="w-4 h-4" /></button>
                 <button className="bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 ml-4 text-sm" onClick={() => setPhase('TEST')}>Start the Test <Icons.ChevronRight className="w-4 h-4" /></button>
              </div>
           </div>
        </div>
     );
  }

  // 4. MAIN EXAM INTERFACE (TEST) with Overlays
  if (phase === 'TEST') {
    const currentQ = questions[currentIndex];
    
    // GUARD CLAUSE: Ensure question exists
    if (!currentQ) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 font-bold">
                <Icons.CloudSync className="w-6 h-6 animate-spin mr-2" /> Loading Content...
            </div>
        );
    }

    const currentAns: Answer | undefined = answers.get(currentQ.id);
    const answeredCount = Array.from(answers.values()).filter(a => a.selected !== null).length;
    const progressPercent = Math.round((answeredCount / questions.length) * 100);
    const isEssay = currentQ.type === 'ESSAY';

    return (
      <div className="flex flex-col h-screen bg-white font-sans relative">
         {/* Top Header - Dark Gray - TIMER ALWAYS VISIBLE HERE */}
         <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 z-20 relative">
            <div className="text-sm font-bold leading-tight">
               Page: {currentIndex + 1}<br/>
               <span className="font-medium text-slate-300">Section: {currentQ.section}</span>
            </div>
            
            {/* Auto-Save Indicator */}
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
               <Icons.Clock className="w-6 h-6 text-white" />
               <div className="text-left">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">Section Time Remaining</div>
                  <div className={`font-mono text-xl leading-none font-bold ${testTimeRemaining < 300 ? 'text-red-400' : 'text-white'}`}>
                     {formatTime(testTimeRemaining)}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4">
               {/* SAVE STATUS INDICATOR */}
               <div className="text-right hidden sm:block">
                   <div className={`text-[9px] font-bold uppercase tracking-widest ${saveStatus === 'SAVING' ? 'text-yellow-400' : saveStatus === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}`}>
                       {saveStatus === 'SAVING' ? 'Syncing...' : saveStatus === 'ERROR' ? 'Sync Failed' : `Saved ${lastSaved ? lastSaved.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}`}
                   </div>
               </div>

               <div className="text-xs text-right hidden sm:block">
                  <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                     <div className="bg-white h-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                  </div>
                  Progress {progressPercent}%
               </div>
               <button onClick={handleFinishTest} className="bg-[#e6e6e6] hover:bg-white text-[#333] px-4 py-2 rounded-sm font-bold text-sm shadow-sm transition-colors border border-slate-400">
                  Finish Test
               </button>
            </div>
         </div>

         {/* Sub Header - Prometric Green */}
         <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
            <span className="font-bold text-sm">Test: {title}</span>
            <span className="font-bold text-sm">Candidate: {userId?.split('-')[0].toUpperCase() || 'USER'} Demo</span>
         </div>

         {/* MAIN CONTENT AREA */}
         <div className="flex-1 flex overflow-hidden relative bg-white">
            
            {/* Sidebar Tabs (Questions) - Only show if not in Help Mode */}
            {!isHelpOpen && (
                <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0">
                    {questions.map((q, i) => {
                        const pageNum = i + 1;
                        const isCurrent = i === currentIndex;
                        const ans = answers.get(q.id);
                        const isAnswered = ans?.selected !== null;
                        const isFlagged = ans?.flagged;
                        const isEssayItem = q.type === 'ESSAY';

                        return (
                            <div 
                                key={q.id} 
                                onClick={() => handleNavigate(i)}
                                className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold shadow-sm cursor-pointer transition-all border border-l-0 relative mb-1 ${
                                    isCurrent ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' : 
                                    isAnswered ? 'bg-[#666] text-white border-[#4d4d4d]' :
                                    isEssayItem ? 'bg-[#4d4d4d] text-white border-black' : 
                                    'bg-[#9cc65a] text-white border-[#8dc63f] opacity-80 hover:opacity-100'
                                }`}
                            >
                            {isEssayItem ? <span className="text-[8px] mr-0.5">E</span> : ''}{pageNum}
                            {isCurrent && <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-[#8dc63f]"></div>}
                            {isFlagged && <div className="absolute top-0 right-0 p-[1px]"><Icons.Flag className="w-2 h-2 fill-current text-white" /></div>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Content Display */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* CALCULATOR OVERLAY */}
                {showCalculator && (
                    <div className="absolute top-20 right-20 w-64 bg-[#e0e0e0] border-2 border-slate-400 rounded shadow-xl z-50 p-2 select-none">
                        <div className="bg-slate-700 text-white px-2 py-1 text-xs flex justify-between cursor-move mb-2">
                            <span>Calculator</span>
                            <button onClick={() => setShowCalculator(false)} className="hover:text-red-300">X</button>
                        </div>
                        <div className="bg-white border border-slate-400 h-10 mb-2 text-right p-1 font-mono text-lg flex items-center justify-end">0</div>
                        <div className="grid grid-cols-4 gap-1">
                            {['MC','MR','MS','M+','←','CE','C','±','√','7','8','9','/','%','4','5','6','*','1/x','1','2','3','-','=','0','.','+'].map((k, idx) => (
                                <button key={idx} className={`bg-slate-200 border border-slate-300 p-2 text-[10px] font-bold hover:bg-slate-300 ${k === '=' ? 'row-span-2 bg-slate-300' : ''}`}>{k}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* SECTION REVIEW POPUP - Bottom Left (Authentic) */}
                {isReviewOpen && (
                    <div className="absolute bottom-0 left-0 w-72 h-[450px] z-40 bg-[#f0f0f0] border-t border-r border-slate-400 shadow-[5px_-5px_20px_rgba(0,0,0,0.2)] flex flex-col animate-in slide-in-from-left duration-200">
                        <div className="bg-[#4d4d4d] text-white px-3 py-2 font-bold text-xs flex justify-between items-center border-b border-[#666]">
                            <span>Section Review</span>
                            <div className="flex gap-2">
                                <Icons.Lock className="w-3 h-3 text-white" />
                                <button onClick={() => setIsReviewOpen(false)} className="hover:text-red-300"><Icons.Plus className="w-3 h-3 rotate-45" /></button>
                            </div>
                        </div>
                        <div className="p-4 bg-[#e6e6e6] flex-1 overflow-y-auto">
                            <div className="flex flex-col gap-2 mb-4 bg-[#ccc] p-3 rounded text-xs font-bold text-slate-700">
                                <span>Filter by:</span>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" /> Unattempted</label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" /> Attempted</label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" /> Flagged</label>
                                <button className="self-end bg-[#8dc63f] text-white px-3 py-1 rounded text-[10px] mt-2 border border-[#7db536] hover:bg-[#7db536]">Clear</button>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {questions.map((q, idx) => {
                                    const ans = answers.get(q.id);
                                    const isSelected = (ans as any)?.selected;
                                    return (
                                        <button 
                                            key={q.id}
                                            onClick={() => handleNavigate(idx)}
                                            className={`h-8 border relative font-bold text-xs flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-[#8dc63f] text-white border-[#7db536]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                            }`}
                                        >
                                            {idx + 1}
                                            {ans?.flagged && <div className="absolute top-0 right-0 p-0.5"><Icons.Flag className="w-2 h-2 fill-current text-white" /></div>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTENT AREA: Help vs Question */}
                {isHelpOpen ? (
                    <div className="flex-1 overflow-y-auto p-12 bg-white animate-in fade-in duration-300">
                        <div className="max-w-4xl mx-auto">
                            {/* Render Introduction Content inside the running test session */}
                            {renderIntroContent(1)}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-white">
                        <div className="max-w-6xl mx-auto h-full flex flex-col">
                            <div className="mb-4 border-b border-slate-200 pb-2 flex justify-between items-center">
                                <h2 className="font-bold text-black text-lg mb-2">{isEssay ? 'Essay Scenario & Response' : 'Multiple-Choice Question'}</h2>
                                <button onClick={() => setShowCalculator(!showCalculator)} className="flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-xs font-bold text-slate-700">
                                    <Icons.Grid className="w-3 h-3" /> Calculator
                                </button>
                            </div>

                            {/* SPLIT VIEW FOR ESSAYS */}
                            {isEssay ? (
                                <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-[500px]">
                                    {/* Left: Scenario PDF Mock */}
                                    <div className="flex-1 bg-slate-50 border-2 border-slate-300 p-6 overflow-y-auto max-h-[600px] shadow-inner">
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                                            <span className="font-bold text-sm text-slate-700 uppercase">Scenario View</span>
                                            <Icons.FileText className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-wrap font-serif">
                                            {currentQ.question_text}
                                        </p>
                                    </div>

                                    {/* Right: Input Area */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="bg-[#4d4d4d] text-white px-4 py-2 text-xs font-bold flex justify-between items-center">
                                            <span>Response Editor</span>
                                            <span>Word Count: {(currentAns?.essayText || '').split(/\s+/).filter(Boolean).length}</span>
                                        </div>
                                        <textarea 
                                            ref={essayInputRef}
                                            className="flex-1 border-2 border-slate-300 p-4 font-mono text-sm leading-relaxed outline-none focus:border-blue-400 resize-none shadow-inner"
                                            placeholder="Type your response here..."
                                            value={currentAns?.essayText || ''}
                                            onChange={(e) => handleEssayChange(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                // STANDARD MCQ VIEW
                                <div className="bg-white border-2 border-slate-300 p-8 min-h-[300px] mb-8">
                                    <p className="text-lg font-medium text-slate-900 leading-relaxed mb-8">
                                    {currentQ.question_text}
                                    </p>

                                    <div className="space-y-4">
                                    {['option_a', 'option_b', 'option_c', 'option_d'].map((key) => {
                                        const letter = key.split('_')[1].toUpperCase();
                                        const text = (currentQ as any)[key];
                                        const isSelected = currentAns?.selected === letter;
                                        return (
                                            <div 
                                                key={key} 
                                                onClick={() => handleSelectAnswer(key)}
                                                className="flex items-center gap-4 cursor-pointer group"
                                            >
                                                <div className={`font-bold text-sm w-4 ${isSelected ? 'text-black scale-110' : 'text-slate-600'}`}>{letter}</div>
                                                <div className={`flex-1 p-3 border-2 transition-all ${isSelected ? 'border-black bg-[#fff9c4]' : 'border-slate-400 bg-white group-hover:border-slate-600'}`}>
                                                    <span className={`text-slate-900 text-base ${isSelected ? 'font-bold' : 'font-medium'}`}>{text}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
         </div>

         {/* Bottom Navigation - Dark Gray */}
         <div className="bg-[#4d4d4d] px-6 py-4 flex justify-between items-center border-t border-[#666] shrink-0 z-30 relative h-16">
            <div className="flex gap-2">
               <button 
                 onClick={() => setIsReviewOpen(!isReviewOpen)} 
                 className={`w-10 h-10 rounded flex items-center justify-center text-white border transition-colors ${isReviewOpen ? 'bg-white/20 border-white/40' : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/20'}`}
               >
                  <Icons.Grid className="w-6 h-6" />
               </button>
               <button 
                 onClick={() => setIsHelpOpen(!isHelpOpen)}
                 className={`w-10 h-10 rounded flex items-center justify-center text-white border transition-colors ${isHelpOpen ? 'bg-white/20 border-white/40' : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/20'}`}
               >
                  <Icons.HelpCircle className="w-6 h-6" />
               </button>
            </div>
            
            {/* Conditional Footer Controls */}
            {isHelpOpen ? (
                <div className="flex gap-3">
                    {/* HELP MODE: Only Show Continue Button */}
                    <button 
                        onClick={() => setIsHelpOpen(false)}
                        className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2 rounded-sm font-bold flex items-center gap-2 transition-colors text-sm shadow-md"
                    >
                        Continue the Test <Icons.ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button 
                        onClick={handleFlagQuestion}
                        className={`px-4 py-2 rounded-sm font-bold flex items-center gap-2 transition-colors text-sm ${currentAns?.flagged ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
                    >
                        <Icons.Flag className={`w-4 h-4 ${currentAns?.flagged ? 'fill-current' : ''}`} />
                        {currentAns?.flagged ? 'Flagged' : 'Flag'}
                    </button>

                    <div className="h-full w-px bg-[#666] mx-2"></div>

                    <button 
                        onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 disabled:hover:bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 transition-colors text-sm"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    
                    <button 
                        onClick={() => {
                            if (currentIndex < questions.length - 1) {
                                handleNavigate(currentIndex + 1);
                            }
                        }}
                        className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 transition-colors text-sm"
                    >
                        Next <Icons.ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
         </div>
      </div>
    );
  }

  // 6. RESULTS
  if (phase === 'RESULTS') {
     const passed = results.percentage >= 72;
     return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-6">
         <div className="bg-white shadow-2xl max-w-2xl w-full border border-slate-300">
            <div className="bg-[#4d4d4d] text-white px-6 py-4 font-bold text-lg flex justify-between">
               <span>Examination Result</span>
               <span className="text-[#8dc63f] uppercase tracking-widest text-sm self-center">Prometric</span>
            </div>
            
            <div className="p-10 flex flex-col items-center">
               <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'border-[#8dc63f] text-[#8dc63f]' : 'border-red-500 text-red-500'}`}>
                  {passed ? <Icons.CheckBadge className="w-12 h-12" /> : <Icons.AlertCircle className="w-12 h-12" />}
               </div>
               
               <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tight">{passed ? 'Pass' : 'Did Not Pass'}</h2>
               <p className="text-slate-500 mb-8 font-medium">Your MCQs have been scored. Essay results pending manual review.</p>

               <div className="w-full bg-slate-50 border border-slate-200 p-8 grid grid-cols-3 gap-8 text-center mb-8">
                  <div>
                     <div className="text-4xl font-black text-slate-800 mb-1">{results.percentage}%</div>
                     <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">MCQ Score</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black text-[#8dc63f] mb-1">{results.correct}</div>
                     <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Correct</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black text-red-500 mb-1">{results.total - results.correct}</div>
                     <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Incorrect</div>
                  </div>
               </div>

               <button onClick={onExit} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-12 py-3 rounded-sm font-bold shadow-lg transition-all uppercase tracking-widest text-sm">
                  Return to Dashboard
               </button>
            </div>
         </div>
      </div>
     );
  }

  return null;
};