import React, { useState, useEffect } from 'react';
import { Icons } from '../Icons';
import { fetchExamQuestions, fetchEssayQuestions, saveBulkEssayResponses } from '../../services/fetsService';
import { deepAnalyzeExam } from '../../services/geminiService';
import Markdown from 'react-markdown';
import { EssayInterface } from './EssayInterface';
import { triggerGoalAchievementConfetti, triggerStarConfetti } from '../../utils/confetti';

interface Question {
  id: string;
  type?: 'MCQ' | 'ESSAY';
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
  essayText?: string;
  flagged: boolean;
  timeSpent: number;
}

interface ExamSessionProps {
  testId: string;
  title: string;
  questionCount: number;
  durationMinutes: number;
  onExit: () => void;
}

type ExamPhase = 'LOADING' | 'CONFIRM' | 'TERMS' | 'INTRODUCTION' | 'TEST' | 'RESULTS';

export const ExamSession: React.FC<ExamSessionProps> = ({ testId, title, questionCount, durationMinutes, onExit }) => {
  const [phase, setPhase] = useState<ExamPhase>('LOADING');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  
  // Timers
  const [testTimeRemaining, setTestTimeRemaining] = useState(durationMinutes * 60);
  const [introTimeRemaining, setIntroTimeRemaining] = useState(15 * 60); // 15 Minutes for Introduction & Terms

  const [results, setResults] = useState({ correct: 0, total: 0, percentage: 0 });
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Overlays & Modes within TEST phase
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Intro/Tutorial State (16 Slides)
  const [introPage, setIntroPage] = useState(1);
  const TOTAL_INTRO_PAGES = 16;

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadQuestions = async () => {
      const mcqs = await fetchExamQuestions(questionCount);
      const shuffledMCQs = mcqs.sort(() => Math.random() - 0.5);
      
      const essays: Question[] = await fetchEssayQuestions(2);

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
      setPhase('CONFIRM');
    };
    loadQuestions();
  }, [questionCount]);

  // --- TIMERS ---
  useEffect(() => {
    let timer: any;
    if ((phase === 'INTRODUCTION' || phase === 'TERMS' || phase === 'CONFIRM') && introTimeRemaining > 0) {
        timer = setInterval(() => {
            setIntroTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);
    } else if (phase === 'TEST' && testTimeRemaining > 0) {
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

  // --- HANDLERS ---
  const handleSelectAnswer = (optionKey: string) => {
    const current = questions[currentIndex];
    if (current.type === 'ESSAY') return;

    const letter = optionKey.split('_')[1].toUpperCase();
    
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

  const handleFinishTest = () => {
    let correct = 0;
    const mcqs = questions.filter(q => q.type !== 'ESSAY');
    mcqs.forEach(q => {
      const answer = answers.get(q.id);
      if (answer?.selected === q.correct_answer) {
        correct++;
      }
    });

    const essays = questions.filter(q => q.type === 'ESSAY');
    const essayPayloads = essays.map(q => ({
      question_id: q.id,
      response_text: answers.get(q.id)?.essayText || ''
    })).filter(e => e.response_text.trim().length > 0);

    if (essayPayloads.length > 0) {
      saveBulkEssayResponses(essayPayloads, 'student_user');
    }
    
    const total = mcqs.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    setResults({ correct, total, percentage });
    setPhase('RESULTS');

    if (percentage >= 70) {
      triggerGoalAchievementConfetti();
    } else {
      triggerStarConfetti();
    }
  };

  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await deepAnalyzeExam(questions, answers);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis Error", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- 16-SLIDE ORIENTATION TUTORIAL MAPPING ---
  const renderIntroContent = (page: number) => {
      switch(page) {
          case 1:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 1 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Welcome & Exam Structure</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          This CMA Exam Simulation consists of two (2) content sections. You will have a total allotted duration of <strong>{formatTime(durationMinutes * 60).split(':')[0]} hours and {formatTime(durationMinutes * 60).split(':')[1]} minutes</strong> to complete the session.
                      </p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-3">
                          <p className="text-sm font-bold">
                              • Section 1 (MCQs): Multiple-Choice Questions (100 Items in official test center).
                          </p>
                          <p className="text-sm font-bold">
                              • Section 2 (Essays): Two (2) Comprehensive Scenario-Based Essay Case Studies.
                          </p>
                      </div>
                      <p className="text-sm italic text-slate-600 dark:text-slate-400">
                          Review this 16-slide Prometric orientation tutorial before proceeding to the active exam session.
                      </p>
                  </div>
              );
          case 2:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 2 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Screen Layout & Navigation</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          The exam screen features a top status panel displaying your section title, question progress, and remaining time.
                      </p>
                      <ul className="list-disc pl-6 space-y-3 text-sm">
                          <li><strong>Left Sidebar:</strong> Vertical panel with numbered buttons for instant question jumping.</li>
                          <li><strong>Bottom Toolbar:</strong> Contains <code>Previous</code>, <code>Next</code>, <code>Flag</code>, and <code>Section Review</code> buttons.</li>
                          <li><strong>Header:</strong> Displays real-time countdown clock and percentage complete bar.</li>
                      </ul>
                  </div>
              );
          case 3:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 3 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Flagging Questions for Review</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          If you want to review a question later, click the <strong>Flag</strong> button in the bottom control bar.
                      </p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-2">
                          <p className="text-sm font-bold">🚩 Flagged Items Indicator:</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                              A yellow flag icon will appear on the question button in the left sidebar and inside the Section Review matrix. Flagging does NOT prevent an answer from being submitted.
                          </p>
                      </div>
                  </div>
              );
          case 4:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 4 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">On-Screen Calculator Usage</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          An on-screen standard financial calculator is accessible at any time during the exam.
                      </p>
                      <ul className="list-disc pl-6 space-y-3 text-sm">
                          <li>Click the <strong>Calculator</strong> button in the upper header to toggle the floating calculator window.</li>
                          <li>Use keypads or numpad controls for mathematical computations (MC, MR, MS, M+, square roots, and basic operators).</li>
                          <li>Physical ICMA-approved Texas Instruments BA II Plus or HP 10bII calculators are also permitted at test centers.</li>
                      </ul>
                  </div>
              );
          case 5:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 5 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Answering Multiple-Choice Questions</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          Each multiple-choice question presents four option cards (A, B, C, D).
                      </p>
                      <div className="space-y-3 text-sm">
                          <p>• Click directly anywhere on an option card to record your selection.</p>
                          <p>• The selected option will highlight with a dark border and distinct shading.</p>
                          <p>• You may change your selected answer as many times as you like before submitting the section.</p>
                      </div>
                  </div>
              );
          case 6:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 6 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Essay Section Overview</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          The essay section evaluates your ability to synthesize managerial accounting principles, write structured analytical responses, and perform step-by-step calculations.
                      </p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-2 text-sm">
                          <p className="font-bold">Split-Screen Interface:</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                              The left panel contains the case scenario and rubric guidelines. The right panel contains the response text editor with word count tracking and auto-sync capabilities.
                          </p>
                      </div>
                  </div>
              );
          case 7:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 7 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Essay Word Processor Functions</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          The essay response editor simulates standard test center word processor tools:
                      </p>
                      <ul className="list-disc pl-6 space-y-3 text-sm">
                          <li><strong>Cut / Copy / Paste:</strong> Quick action buttons located on the top toolbar of the response box.</li>
                          <li><strong>Font Size Adjustment:</strong> Toggle between S, M, and L text sizes for maximum readability.</li>
                          <li><strong>Word & Character Counter:</strong> Live auto-counting bottom bar tracking response length.</li>
                      </ul>
                  </div>
              );
          case 8:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 8 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Time Management & Countdown Clock</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          The timer display in the top header counts down continually throughout the active session.
                      </p>
                      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 text-sm font-medium">
                          ⚠️ Warning Alert: When less than 5 minutes remain in the section, the timer numbers will illuminate red to signal imminent time completion.
                      </div>
                  </div>
              );
          case 9:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 9 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Section Review Grid</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          Clicking the <strong>Grid / Review</strong> icon opens the comprehensive Section Review panel.
                      </p>
                      <ul className="list-disc pl-6 space-y-3 text-sm">
                          <li>Filter your view by <code>Unattempted</code>, <code>Attempted</code>, or <code>Flagged</code> items.</li>
                          <li>Click any question number in the review matrix to jump straight to that question.</li>
                      </ul>
                  </div>
              );
          case 10:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 10 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Scratch Booklet & Test Center Rules</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          During official Prometric testing, you will receive physical scratch booklets and markers.
                      </p>
                      <p className="text-sm leading-relaxed">
                          All mathematical work, scratch calculations, and notes must be made on official test center scratch booklets. You must return all booklet sheets prior to exiting.
                      </p>
                  </div>
              );
          case 11:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 11 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Break Policies & Bathroom Protocol</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          Unscheduled breaks are permitted during the examination session.
                      </p>
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-900 dark:text-red-200 text-sm font-medium">
                          <strong>Note:</strong> The exam timer will NOT stop or pause during an unscheduled break. Plan your break times strategically between section transitions.
                      </div>
                  </div>
              );
          case 12:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 12 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Submitting Section 1 & Proceeding</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          Once you finish reviewing Multiple-Choice questions, click <strong>Finish Test</strong> or <strong>Proceed to Essays</strong>.
                      </p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                          ⚠️ Critical Rule: Once you submit Section 1 and enter Section 2 (Essays), you CANNOT return to modify any Multiple-Choice answers.
                      </p>
                  </div>
              );
          case 13:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 13 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Technical Support & Invigilator Help</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          If you experience hardware issues, screen freezing, or require assistance, click the <strong>Help</strong> button or raise your hand for a test center administrator.
                      </p>
                  </div>
              );
          case 14:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 14 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Academic Integrity & Ethics</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          Candidates are bound by the IMA Statement of Ethical Professional Practice and ICMA Candidate Rules.
                      </p>
                      <p className="text-sm italic">
                          Any attempt to copy, capture, transmit, or share exam questions is strictly prohibited and subject to immediate disqualification.
                      </p>
                  </div>
              );
          case 15:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 15 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Scoring Weightage & Pre-Test Items</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          Official CMA exam scores range from 0 to 500, with 360 required to pass.
                      </p>
                      <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl border border-slate-300 dark:border-slate-700 space-y-2 text-sm">
                          <p>• MCQs represent 75% of the total scaled score weightage.</p>
                          <p>• Essay case scenarios represent 25% of total score weightage.</p>
                          <p>• Unscored experimental pre-test questions may be interspersed and do not affect your final score.</p>
                      </div>
                  </div>
              );
          case 16:
          default:
              return (
                  <div className="space-y-6 text-slate-900 dark:text-slate-100">
                      <div className="border-b border-slate-300 dark:border-slate-700 pb-4">
                        <span className="text-xs font-black text-brand uppercase tracking-widest">Slide 16 of 16</span>
                        <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Tutorial Completed — Ready to Begin</h1>
                      </div>
                      <p className="text-sm leading-relaxed">
                          You have completed the 16-slide Prometric exam orientation tutorial.
                      </p>
                      <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-900 dark:text-emerald-200 text-sm font-bold">
                          Click "Start the Test" in the bottom toolbar when you are ready to begin Section 1. Good luck!
                      </div>
                  </div>
              );
      }
  };

  // --- RENDERERS ---

  if (phase === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Icons.CloudSync className="w-10 h-10 text-[#8dc63f] animate-spin" />
           <p className="text-slate-600 dark:text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Exam Content...</p>
        </div>
      </div>
    );
  }

  // 1. CONFIRM DETAILS
  if (phase === 'CONFIRM') {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-lg rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
          <div className="bg-[#4d4d4d] text-white px-6 py-3 flex justify-between items-center">
            <span className="font-bold text-lg">Confirm Details</span>
            <span className="font-mono text-sm">{formatTime(introTimeRemaining)}</span>
          </div>
          <div className="p-8 flex flex-col items-center text-slate-900 dark:text-slate-100">
             <div className="mb-8 w-40">
                <div className="border border-slate-300 dark:border-slate-700 p-2 rounded">
                   <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-2xl text-slate-800 dark:text-white">CMA</span>
                      <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                      <span className="text-[6px] uppercase leading-tight font-bold text-slate-500 dark:text-slate-400">IMA's Certification for<br/>Accountants and<br/>Financial Professionals<br/>in Business</span>
                   </div>
                </div>
             </div>
             <div className="border border-slate-300 dark:border-slate-700 p-6 w-full mb-8 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                <div className="grid grid-cols-3 gap-y-2 text-sm">
                   <span className="text-slate-500 dark:text-slate-400 font-bold">Last Name:</span>
                   <span className="col-span-2 font-bold text-slate-900 dark:text-white uppercase">User</span>
                   <span className="text-slate-500 dark:text-slate-400 font-bold">First Name:</span>
                   <span className="col-span-2 font-bold text-slate-900 dark:text-white">Demo Candidate</span>
                   <span className="text-slate-500 dark:text-slate-400 font-bold">Test Name:</span>
                   <span className="col-span-2 font-bold text-slate-900 dark:text-white">{title}</span>
                   <span className="text-slate-500 dark:text-slate-400 font-bold">Language:</span>
                   <span className="col-span-2 font-bold text-slate-900 dark:text-white">English (US)</span>
                </div>
             </div>
             <p className="mb-8 font-medium">Are the details above correct?</p>
             <div className="flex gap-4">
                <button onClick={() => setPhase('TERMS')} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2.5 rounded font-bold shadow-sm flex items-center gap-2">
                   <Icons.CheckBadge className="w-4 h-4" /> Confirm
                </button>
                <button onClick={onExit} className="bg-slate-600 hover:bg-slate-700 text-white px-8 py-2.5 rounded font-bold shadow-sm flex items-center gap-2">
                   <Icons.Plus className="w-4 h-4 rotate-45" /> Cancel
                </button>
             </div>
          </div>
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-950 text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200 dark:border-slate-800">
             Prometric
          </div>
        </div>
      </div>
    );
  }

  // 2. TERMS AND CONFIDENTIALITY AGREEMENT
  if (phase === 'TERMS') {
      return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
            <div className="bg-white dark:bg-slate-900 shadow-2xl w-full max-w-[1000px] h-[85vh] flex flex-col border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
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
                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-white dark:bg-slate-900 relative text-slate-900 dark:text-slate-100">
                    <div className="mb-6 flex flex-col items-center">
                        <div className="border border-slate-300 dark:border-slate-700 p-2 pr-4 bg-white dark:bg-slate-800 mb-6 inline-flex items-center gap-3 select-none rounded">
                            <div className="font-serif font-bold text-4xl text-slate-700 dark:text-slate-200 italic border-r border-slate-300 dark:border-slate-700 pr-3 tracking-tighter">CMA</div>
                            <div className="flex flex-col text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-tight text-left">
                                <span>IMA's Certification for</span>
                                <span>Accountants and</span>
                                <span>Financial Professionals</span>
                                <span>in Business</span>
                            </div>
                        </div>
                        
                        <p className="text-slate-800 dark:text-slate-200 text-lg text-center font-medium">
                            Please ensure you scroll down to read and accept<br/>the organization's Terms.
                        </p>
                    </div>

                    {/* Agreement Scroll Box */}
                    <div className="w-full max-w-4xl flex-1 border-[3px] border-[#f7b500] rounded-xl p-1 mb-8 relative bg-white dark:bg-slate-950">
                        <div className="h-full max-h-[400px] overflow-y-auto p-8 text-justify text-sm leading-relaxed text-slate-800 dark:text-slate-200 pr-6">
                            <h3 className="text-center font-bold text-slate-900 dark:text-white mb-8 uppercase text-base">CONFIDENTIALITY AGREEMENT</h3>
                            <p className="mb-6">
                                I hereby attest that I will not remove any examination materials, notes, or scratch work from the testing room. I affirm that I will not copy, reproduce, transmit, disclose, or share any examination questions or scenarios in whole or in part to any person or entity.
                            </p>
                            <p className="font-bold">
                                By clicking "I accept these terms" you affirm that you accept all rules, conduct policies, and terms of this agreement.
                            </p>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <div className="mb-8 flex items-center gap-3 cursor-pointer select-none" onClick={() => setTermsAccepted(!termsAccepted)}>
                        <div 
                            className={`w-6 h-6 border-2 rounded flex items-center justify-center transition-all ${termsAccepted ? 'border-[#8dc63f] bg-[#8dc63f]' : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'}`}
                        >
                            {termsAccepted && <Icons.CheckBadge className="w-4 h-4 text-white" />} 
                        </div>
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-base">I accept these terms.</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 mb-4">
                        <button onClick={onExit} className="bg-slate-600 hover:bg-slate-700 text-white px-10 py-3 rounded font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors">
                            <span className="font-bold text-xl leading-none">×</span> Exit
                        </button>
                        <button 
                            onClick={() => termsAccepted && setPhase('INTRODUCTION')} 
                            disabled={!termsAccepted}
                            className={`px-10 py-3 rounded font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors ${termsAccepted ? 'bg-[#8dc63f] hover:bg-[#7db536] text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed'}`}
                        >
                            <Icons.CheckBadge className="w-5 h-5" /> Continue
                        </button>
                    </div>
                </div>

                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-950 text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0 border-t border-slate-200 dark:border-slate-800">
                    Prometric
                </div>
            </div>
        </div>
      );
  }

  // 3. INTRODUCTION
  if (phase === 'INTRODUCTION') {
     const introProgress = Math.round((introPage / TOTAL_INTRO_PAGES) * 100);
     return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0b0f19] font-sans text-slate-900 dark:text-slate-100">
           <div className="bg-[#333333] dark:bg-slate-950 text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 border-b border-slate-700">
              <div className="text-sm font-bold leading-tight">Page: {introPage}<br/><span className="font-medium text-slate-300">Section: Introduction (Slide {introPage}/16)</span></div>
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
                       <div className="bg-[#8dc63f] h-full transition-all duration-300" style={{width: `${introProgress}%`}}></div>
                    </div>
                    Progress {introProgress}%
                 </div>
                 <button className="bg-slate-700 text-slate-400 px-6 py-2 rounded font-bold text-sm shadow-sm cursor-not-allowed border border-slate-600">Finish Test</button>
              </div>
           </div>
           
           <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
              <span className="font-bold text-sm">Test: {title}</span>
              <span className="font-bold text-sm">Candidate: USER Demo</span>
           </div>
           
           <div className="flex-1 flex overflow-hidden bg-white dark:bg-slate-900">
              <div className="w-16 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0 no-scrollbar">
                 {[...Array(TOTAL_INTRO_PAGES)].map((_, i) => (
                    <div 
                      key={i} 
                      onClick={() => setIntroPage(i+1)} 
                      className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer mb-1 border border-l-0 ${i+1 === introPage ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1 shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-[#8dc63f]/30'}`}
                    >
                      {i+1}
                    </div>
                 ))}
              </div>
              <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white dark:bg-slate-900">
                <div className="max-w-4xl mx-auto">
                  {renderIntroContent(introPage)}
                </div>
              </div>
           </div>
           
           <div className="bg-[#4d4d4d] dark:bg-slate-950 px-4 py-3 flex justify-between items-center border-t border-[#666] dark:border-slate-800 shrink-0">
              <div className="flex gap-2 text-xs font-bold text-slate-300">
                 Slide {introPage} of {TOTAL_INTRO_PAGES}
              </div>
              <div className="flex gap-3">
                 <button onClick={() => setIntroPage(Math.max(1, introPage - 1))} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 text-sm shadow-md">
                   <Icons.ChevronLeft className="w-4 h-4" /> Previous
                 </button>
                 <button onClick={() => setIntroPage(Math.min(TOTAL_INTRO_PAGES, introPage + 1))} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 text-sm shadow-md">
                   Next <Icons.ChevronRight className="w-4 h-4" />
                 </button>
                 <button className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 ml-4 text-sm shadow-lg border border-white/20" onClick={() => setPhase('TEST')}>
                   Start the Test <Icons.ChevronRight className="w-4 h-4" />
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // 4. MAIN EXAM INTERFACE (TEST)
  if (phase === 'TEST') {
    const currentQ = questions[currentIndex];
    const currentAns = answers.get(currentQ.id) as Answer | undefined;
    const answeredCount = Array.from(answers.values()).filter((a: Answer) => a.selected !== null).length;
    const progressPercent = Math.round((answeredCount / questions.length) * 100);
    const isEssay = currentQ.type === 'ESSAY';

    return (
      <div className="flex flex-col h-screen bg-white dark:bg-[#0b0f19] font-sans relative text-slate-900 dark:text-slate-100">
         <div className="bg-[#333333] dark:bg-slate-950 text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 z-20 relative border-b border-slate-800">
            <div className="text-sm font-bold leading-tight">
               Page: {currentIndex + 1}<br/>
               <span className="font-medium text-slate-300">Section: {currentQ.section}</span>
            </div>
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
               <Icons.Clock className="w-6 h-6 text-white" />
               <div className="text-left">
                  <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wide leading-none mb-0.5">Section Time Remaining</div>
                  <div className={`font-mono text-xl leading-none font-bold ${testTimeRemaining < 300 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                     {formatTime(testTimeRemaining)}
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-xs text-right hidden sm:block">
                  <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                     <div className="bg-[#8dc63f] h-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                  </div>
                  Progress {progressPercent}%
               </div>
               <button onClick={handleFinishTest} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-colors border border-slate-400 dark:border-slate-600">
                  Finish Test
               </button>
            </div>
         </div>

         <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
            <span className="font-bold text-sm">Test: {title}</span>
            <span className="font-bold text-sm">Candidate: USER Demo</span>
         </div>

         <div className="flex-1 flex overflow-hidden relative bg-white dark:bg-slate-900">
            
            {!isHelpOpen && (
                <div className="w-14 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0 no-scrollbar">
                    {questions.map((q, i) => {
                        const pageNum = i + 1;
                        const isCurrent = i === currentIndex;
                        const ans = answers.get(q.id) as Answer | undefined;
                        const isAnswered = ans?.selected !== null;
                        const isFlagged = ans?.flagged;
                        const isEssayItem = q.type === 'ESSAY';

                        return (
                            <div 
                                key={q.id} 
                                onClick={() => setCurrentIndex(i)}
                                className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold shadow-sm cursor-pointer transition-all border border-l-0 relative mb-1 ${
                                    isCurrent ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' : 
                                    isAnswered ? 'bg-slate-700 text-white border-slate-800' :
                                    isEssayItem ? 'bg-slate-800 text-amber-300 border-slate-900' : 
                                    'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                            >
                            {isEssayItem ? <span className="text-[8px] mr-0.5 font-black text-amber-300">E</span> : ''}{pageNum}
                            {isCurrent && <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-[#8dc63f]"></div>}
                            {isFlagged && <div className="absolute top-0 right-0 p-[1px]"><Icons.Flag className="w-2 h-2 fill-current text-amber-400" /></div>}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex-1 flex flex-col relative overflow-hidden">
                {showCalculator && (
                    <div className="absolute top-12 right-12 w-64 bg-slate-100 dark:bg-slate-800 border-2 border-slate-400 dark:border-slate-600 rounded-xl shadow-2xl z-50 p-3 select-none">
                        <div className="bg-slate-700 dark:bg-slate-900 text-white px-2 py-1 text-xs font-bold rounded flex justify-between cursor-move mb-2">
                            <span>Calculator</span>
                            <button onClick={() => setShowCalculator(false)} className="hover:text-red-400 font-bold">X</button>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 h-10 mb-2 text-right p-2 font-mono text-lg font-bold flex items-center justify-end rounded text-slate-900 dark:text-white">0</div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {['MC','MR','MS','M+','←','CE','C','±','√','7','8','9','/','%','4','5','6','*','1/x','1','2','3','-','=','0','.','+'].map((k, idx) => (
                                <button key={idx} className={`bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 p-2 text-xs font-bold rounded hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white ${k === '=' ? 'row-span-2 bg-[#8dc63f] text-white hover:bg-[#7db536]' : ''}`}>{k}</button>
                            ))}
                        </div>
                    </div>
                )}

                {isReviewOpen && (
                    <div className="absolute bottom-0 left-0 w-80 h-[450px] z-40 bg-slate-100 dark:bg-slate-900 border-t border-r border-slate-400 dark:border-slate-700 shadow-2xl flex flex-col">
                        <div className="bg-[#4d4d4d] dark:bg-slate-950 text-white px-4 py-2 font-bold text-xs flex justify-between items-center border-b border-[#666]">
                            <span>Section Review Matrix</span>
                            <button onClick={() => setIsReviewOpen(false)} className="hover:text-red-300 text-sm font-bold">✕</button>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-900 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2">
                                {questions.map((q, idx) => {
                                    const ans = answers.get(q.id) as Answer | undefined;
                                    return (
                                        <button 
                                            key={q.id}
                                            onClick={() => {
                                                setCurrentIndex(idx);
                                                setIsReviewOpen(false);
                                            }}
                                            className={`h-9 border-2 relative font-bold text-xs rounded flex items-center justify-center transition-all ${
                                                ans?.selected ? 'bg-[#8dc63f] text-white border-[#7db536]' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 hover:border-slate-500'
                                            }`}
                                        >
                                            {idx + 1}
                                            {ans?.flagged && <div className="absolute top-0 right-0 p-0.5"><Icons.Flag className="w-2 h-2 fill-current text-amber-400" /></div>}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {isHelpOpen ? (
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white dark:bg-slate-900">
                        <div className="max-w-4xl mx-auto">
                            {renderIntroContent(1)}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-white dark:bg-slate-900">
                        <div className="max-w-6xl mx-auto h-full flex flex-col">
                            <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                                <h2 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tight">{isEssay ? 'Essay Scenario & Response' : 'Multiple-Choice Question'}</h2>
                                <button onClick={() => setShowCalculator(!showCalculator)} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg shadow-sm">
                                    <Icons.Grid className="w-4 h-4 text-brand" /> Calculator
                                </button>
                            </div>

                            {isEssay ? (
                                <EssayInterface
                                    question={{
                                        id: currentQ.id,
                                        question_text: currentQ.question_text,
                                        section: currentQ.section,
                                        part: currentQ.part,
                                        rubric_guidelines: (currentQ as any).rubric_guidelines,
                                        difficulty_level: (currentQ as any).difficulty_level
                                    }}
                                    essayText={currentAns?.essayText || ''}
                                    onChange={(text) => handleEssayChange(text)}
                                />
                            ) : (
                                <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 p-8 min-h-[300px] mb-8 rounded-2xl shadow-sm">
                                    <p className="text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-8">
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
                                                <div className={`font-black text-sm w-5 ${isSelected ? 'text-brand scale-125' : 'text-slate-500 dark:text-slate-400'}`}>{letter}</div>
                                                <div className={`flex-1 p-4 border-2 rounded-xl transition-all ${isSelected ? 'border-slate-900 dark:border-amber-400 bg-[#fff9c4] dark:bg-amber-500/20 text-slate-900 dark:text-white font-bold' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-500 dark:hover:border-slate-500'}`}>
                                                    <span className={`text-base ${isSelected ? 'font-bold' : 'font-medium'}`}>{text}</span>
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

         <div className="bg-[#4d4d4d] dark:bg-slate-950 px-6 py-4 flex justify-between items-center border-t border-[#666] dark:border-slate-800 shrink-0 z-30 relative h-16">
            <div className="flex gap-2">
               <button 
                 onClick={() => setIsReviewOpen(!isReviewOpen)} 
                 className={`w-10 h-10 rounded flex items-center justify-center text-white border transition-colors ${isReviewOpen ? 'bg-white/20 border-white/40' : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/20'}`}
                 title="Toggle Section Review Grid"
               >
                  <Icons.Grid className="w-5 h-5" />
               </button>
               <button 
                 onClick={() => setIsHelpOpen(!isHelpOpen)}
                 className={`w-10 h-10 rounded flex items-center justify-center text-white border transition-colors ${isHelpOpen ? 'bg-white/20 border-white/40' : 'bg-transparent border-transparent hover:bg-white/10 hover:border-white/20'}`}
                 title="Help & Tutorial"
               >
                  <Icons.HelpCircle className="w-5 h-5" />
               </button>
            </div>
            
            {isHelpOpen ? (
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsHelpOpen(false)}
                        className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-8 py-2 rounded font-bold flex items-center gap-2 transition-colors text-sm shadow-md"
                    >
                        Continue the Test <Icons.ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-3 items-center">
                    <button 
                        onClick={handleFlagQuestion}
                        className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors text-sm ${currentAns?.flagged ? 'bg-[#8dc63f] text-white' : 'bg-[#666] text-slate-200 hover:bg-[#777]'}`}
                    >
                        <Icons.Flag className={`w-4 h-4 ${currentAns?.flagged ? 'fill-current text-amber-300' : ''}`} />
                        {currentAns?.flagged ? 'Flagged' : 'Flag'}
                    </button>

                    <div className="h-6 w-px bg-[#666] mx-2"></div>

                    <button 
                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                        disabled={currentIndex === 0}
                        className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-6 py-2 rounded font-bold flex items-center gap-1 transition-colors text-sm shadow-md"
                    >
                        <Icons.ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    
                    <button 
                        onClick={() => {
                            if (currentIndex < questions.length - 1) {
                                setCurrentIndex(currentIndex + 1);
                            }
                        }}
                        className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-6 py-2 rounded font-bold flex items-center gap-1 transition-colors text-sm shadow-md"
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
      <div className="min-h-screen bg-slate-100 dark:bg-[#0b0f19] flex items-center justify-center font-sans p-6 text-slate-900 dark:text-slate-100">
         <div className="bg-white dark:bg-slate-900 shadow-2xl max-w-2xl w-full border border-slate-300 dark:border-slate-800 rounded-3xl overflow-hidden">
            <div className="bg-[#4d4d4d] dark:bg-slate-950 text-white px-6 py-4 font-bold text-lg flex justify-between">
               <span>Examination Result</span>
               <span className="text-[#8dc63f] uppercase tracking-widest text-sm self-center font-black">Prometric</span>
            </div>
            
            <div className="p-10 flex flex-col items-center">
               <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${passed ? 'border-[#8dc63f] text-[#8dc63f]' : 'border-red-500 text-red-500'}`}>
                  {passed ? <Icons.CheckBadge className="w-12 h-12" /> : <Icons.AlertCircle className="w-12 h-12" />}
               </div>
               
               <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{passed ? 'Pass' : 'Did Not Pass'}</h2>
               <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium text-center">Your MCQs have been scored. Click below for Gemini AI Essay Evaluation & MCQ Diagnostics.</p>

               <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 p-8 grid grid-cols-3 gap-8 text-center mb-8 rounded-2xl">
                  <div>
                     <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{results.percentage}%</div>
                     <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">MCQ Score</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black text-[#8dc63f] mb-1">{results.correct}</div>
                     <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">Correct</div>
                  </div>
                  <div>
                     <div className="text-4xl font-black text-red-500 mb-1">{results.total - results.correct}</div>
                     <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-widest">Incorrect</div>
                  </div>
               </div>

               {analysis ? (
                 <div className="w-full mb-8 p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-3xl text-left max-h-[400px] overflow-y-auto no-scrollbar border-4 border-brand/20 shadow-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand/20 rounded-xl"><Icons.Sparkles className="w-5 h-5 text-brand" /></div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">Deep Reasoning Analysis</h3>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{analysis}</Markdown>
                    </div>
                 </div>
               ) : (
                 <button 
                  onClick={handleDeepAnalysis}
                  disabled={isAnalyzing}
                  className="w-full mb-8 py-6 bg-slate-900 dark:bg-brand text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isAnalyzing ? (
                      <><Icons.CloudSync className="w-5 h-5 animate-spin" /> Gemini Reasoning...</>
                    ) : (
                      <><Icons.Brain className="w-5 h-5" /> AI Essay Evaluation & Deep Diagnostic</>
                    )}
                 </button>
               )}

               <button onClick={onExit} className="bg-[#8dc63f] hover:bg-[#7db536] text-white px-12 py-3.5 rounded font-bold shadow-lg transition-all uppercase tracking-widest text-sm">
                  Return to Dashboard
               </button>
            </div>
         </div>
      </div>
     );
  }

  return null;
};
