import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../Icons';
import { getUserProfile } from '../../services/fetsService';
import { ExamConfig, saveExamProgress } from '../../services/examService';

interface Question {
  id: string;
  type: 'MCQ' | 'ESSAY';
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
  session: any;
  config: ExamConfig;
  mcqQuestions: any[];
  essayQuestions: any[];
  userId: string;
  onExit: () => void;
}

type ExamPhase = 'CONFIRM' | 'TERMS' | 'INTRODUCTION' | 'TEST' | 'RESULTS';

export const ExamSession: React.FC<ExamSessionProps> = ({ session, config, mcqQuestions, essayQuestions, userId, onExit }) => {
  const title = config.title;
  const sessionId = session?.id || 'local';
  const durationMinutes = config.mcqDurationMinutes + config.essayDurationMinutes;

  // Build questions array from pre-fetched data
  const buildQuestions = (): Question[] => {
    const mcqs: Question[] = mcqQuestions.map((q: any) => ({
      id: q.id,
      type: 'MCQ' as const,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
      part: config.part,
      section: q.section || 'General',
    }));
    const essays: Question[] = essayQuestions.map((q: any) => ({
      id: q.id,
      type: 'ESSAY' as const,
      question_text: q.scenario_text || q.question_text,
      part: config.part,
      section: `Essay - ${q.topic || 'General'}`,
    }));
    return [...mcqs, ...essays];
  };

  const [questions] = useState<Question[]>(buildQuestions);
  const [phase, setPhase] = useState<ExamPhase>('CONFIRM');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(() => {
    const init = new Map<string, Answer>();
    buildQuestions().forEach(q => {
      init.set(q.id, { questionId: q.id, selected: null, essayText: '', flagged: false, timeSpent: 0 });
    });
    return init;
  });

  // Candidate name from profile
  const [candidateName, setCandidateName] = useState({ first: '', last: '' });

  // Timers
  const [testTimeRemaining, setTestTimeRemaining] = useState(durationMinutes * 60);
  const [introTimeRemaining, setIntroTimeRemaining] = useState(15 * 60);

  const [results, setResults] = useState({ correct: 0, total: 0, percentage: 0 });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [introPage, setIntroPage] = useState(1);
  const TOTAL_INTRO_PAGES = 16;

  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'>('IDLE');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const essayInputRef = useRef<HTMLTextAreaElement>(null);

  const stateRef = useRef({ answers, currentIndex, testTimeRemaining });

  useEffect(() => {
    stateRef.current = { answers, currentIndex, testTimeRemaining };
  }, [answers, currentIndex, testTimeRemaining]);

  // Fetch real candidate name
  useEffect(() => {
    if (!userId || userId === 'anonymous') return;
    getUserProfile(userId).then(profile => {
      if (profile?.name) {
        const parts = profile.name.trim().split(/\s+/);
        const last = parts.length > 1 ? parts[parts.length - 1] : '';
        const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
        setCandidateName({ first, last });
      }
    });
  }, [userId]);

  const candidateDisplay = candidateName.last
    ? `${candidateName.last.toUpperCase()}, ${candidateName.first}`
    : candidateName.first || userId?.split('-')[0]?.toUpperCase() || 'Candidate';

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

  // --- AUTO SAVE ---
  const performSave = async (currentState: typeof stateRef.current) => {
    if (!userId || userId === 'anonymous') return;
    setSaveStatus('SAVING');
    try {
      const mcqAnswers: Record<string, any> = {};
      const essayAnswers: Record<string, any> = {};
      currentState.answers.forEach((ans, qId) => {
        const q = questions.find(qq => qq.id === qId);
        if (q?.type === 'ESSAY') {
          essayAnswers[qId] = { text: ans.essayText || '', wordCount: (ans.essayText || '').split(/\s+/).filter(Boolean).length, timeSpent: ans.timeSpent };
        } else {
          mcqAnswers[qId] = { selected: ans.selected, flagged: ans.flagged, timeSpent: ans.timeSpent };
        }
      });
      await saveExamProgress(sessionId, {
        currentQuestionIndex: currentState.currentIndex,
        mcqAnswers,
        essayAnswers,
      });
      setSaveStatus('SAVED');
      setLastSaved(new Date());
    } catch (e) {
      console.error('Auto-save failed', e);
      setSaveStatus('ERROR');
    }
  };

  useEffect(() => {
    if (phase === 'TEST') {
      const interval = setInterval(() => {
        performSave(stateRef.current);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [phase, userId, sessionId]);

  useEffect(() => {
    if (phase === 'TEST' && questions[currentIndex]?.type === 'ESSAY') {
      setTimeout(() => essayInputRef.current?.focus(), 50);
    }
  }, [currentIndex, phase, questions]);

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

  const handleNavigate = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    performSave(stateRef.current);
    setCurrentIndex(newIndex);
  };

  const handleFinishTest = () => {
    performSave(stateRef.current);
    let correct = 0;
    const mcqs = questions.filter(q => q.type !== 'ESSAY');
    mcqs.forEach(q => {
      const answer = answers.get(q.id);
      if (answer?.selected === q.correct_answer) correct++;
    });
    const total = mcqs.length;
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

  // --- INTRODUCTION CONTENT ---
  const renderIntroContent = (page: number) => {
    const commonContent = (
      <>
        <h1 className="text-xl font-bold text-black mb-8">CMA Exam Simulation</h1>
        <h2 className="text-lg font-bold text-black mb-4">Exam Structure</h2>
        <p className="mb-6 text-sm text-black leading-relaxed">
          This CMA Exam Simulation has two (2) content sections and you will have {Math.floor(durationMinutes / 60)} hours and {durationMinutes % 60} minutes to complete both sections.
        </p>
        <p className="mb-6 text-sm text-black leading-relaxed font-bold">
          Content Section 1: The first section is multiple-choice ({config.mcqCount} questions) and you have {Math.floor(config.mcqDurationMinutes / 60)} hours to complete it.<br/>
          Content Section 2: The second section contains {config.essayCount} essays and you have {config.essayDurationMinutes} minutes to complete it.
        </p>
        <p className="mb-6 text-sm text-black leading-relaxed">
          Please note that the purpose of this Exam Simulation is to give you a sense of the experience of the exam as it will be in the test center.
        </p>
        <p className="mb-6 text-sm text-black leading-relaxed italic">
          Before you begin, it is strongly recommended that you take a few minutes to review the tutorial before attempting any questions.
        </p>
      </>
    );

    switch (page) {
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
      case 2:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Navigation</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">You can navigate through the exam using the following controls:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li><strong>Previous / Next buttons:</strong> Move between questions sequentially using the buttons at the bottom of the screen.</li>
              <li><strong>Question sidebar:</strong> Click any numbered tab on the left to jump directly to that question.</li>
              <li><strong>Section Review:</strong> Click the grid icon at the bottom-left to see all questions at a glance.</li>
            </ul>
          </>
        );
      case 3:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Answering Questions</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">For multiple-choice questions:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Click on the answer option (A, B, C, or D) to select it.</li>
              <li>Your selected answer will be highlighted in yellow.</li>
              <li>You can change your answer at any time by clicking a different option.</li>
              <li>Answered questions appear as dark tabs in the sidebar.</li>
            </ul>
          </>
        );
      case 4:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Flagging Questions</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">You can flag questions for later review:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Click the <strong>Flag</strong> button at the bottom of the screen to flag the current question.</li>
              <li>Flagged questions display a small flag icon on their sidebar tab.</li>
              <li>Use the Section Review to filter and find flagged questions.</li>
              <li>Flagging does not affect your score — it is a personal study aid.</li>
            </ul>
          </>
        );
      case 5:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Calculator</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">A basic calculator is available during the exam:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Click the <strong>Calculator</strong> button at the top of the question area to open it.</li>
              <li>The calculator supports basic arithmetic operations.</li>
              <li>You can close the calculator by clicking the X in its title bar.</li>
            </ul>
          </>
        );
      case 6:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Timer</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">The exam is timed. The countdown timer is displayed at the top center of the screen.</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>The timer shows hours, minutes, and seconds remaining.</li>
              <li>When less than 5 minutes remain, the timer turns red as a warning.</li>
              <li>When time expires, the exam auto-submits with your current answers.</li>
              <li>Your progress is auto-saved every 60 seconds.</li>
            </ul>
          </>
        );
      case 7:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Essay Section</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">If your exam includes essays:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Essay questions appear after all MCQ questions.</li>
              <li>A split-screen view shows the scenario on the left and your response editor on the right.</li>
              <li>Word count is tracked automatically in the editor header.</li>
              <li>Essay responses are saved automatically along with MCQ answers.</li>
            </ul>
          </>
        );
      case 8:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Section Review</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">The Section Review panel helps you track your progress:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Click the grid icon (bottom-left) to open the review panel.</li>
              <li>Green squares = answered questions. White squares = unanswered.</li>
              <li>Filter by: Unattempted, Attempted, or Flagged.</li>
              <li>Click any question number to jump directly to it.</li>
            </ul>
          </>
        );
      case 9:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Help & Tutorial</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">During the exam, you can access help at any time:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Click the <strong>?</strong> (help) icon at the bottom-left to view this tutorial again.</li>
              <li>The timer continues while help is open.</li>
              <li>Click "Continue the Test" to return to your exam.</li>
            </ul>
          </>
        );
      case 10:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Auto-Save</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">Your exam progress is saved automatically:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Progress saves every 60 seconds and when you navigate between questions.</li>
              <li>The save status indicator appears in the top-right corner of the header.</li>
              <li>Green = saved successfully. Yellow = saving in progress. Red = save error.</li>
            </ul>
          </>
        );
      case 11:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Finishing the Exam</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">When you're ready to submit:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Click the <strong>Finish Test</strong> button in the top-right corner.</li>
              <li>All your answers are submitted and MCQs are scored immediately.</li>
              <li>Essay responses are recorded for review.</li>
              <li>You'll see your MCQ results on the score screen.</li>
            </ul>
          </>
        );
      case 12:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Scoring</h2>
            <p className="mb-4 text-sm text-black leading-relaxed">How your exam is scored:</p>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>MCQ questions are scored immediately — each correct answer counts equally.</li>
              <li>A passing score is typically 72% on the MCQ section.</li>
              <li>Essay responses are pending review and are not scored immediately.</li>
              <li>Unanswered questions are marked as incorrect.</li>
            </ul>
          </>
        );
      case 13:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Tips for Success</h2>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>Read each question carefully before selecting an answer.</li>
              <li>Flag difficult questions and return to them later.</li>
              <li>Manage your time — don't spend too long on any single question.</li>
              <li>For essays, outline your response before writing.</li>
              <li>Use the calculator for any calculations.</li>
              <li>Review your answers using Section Review before finishing.</li>
            </ul>
          </>
        );
      case 14:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Important Reminders</h2>
            <ul className="list-disc pl-6 space-y-3 text-sm text-black leading-relaxed">
              <li>The exam timer does not pause for any reason.</li>
              <li>Do not close or navigate away from the browser during the exam.</li>
              <li>All answers are final once submitted.</li>
              <li>If you experience technical issues, your progress has been auto-saved.</li>
            </ul>
          </>
        );
      case 15:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Question Types Summary</h2>
            <div className="space-y-4 text-sm text-black leading-relaxed">
              <div className="border border-slate-200 p-4">
                <h3 className="font-bold mb-2">Multiple-Choice Questions (MCQ)</h3>
                <p>Select one answer from four options (A, B, C, D). Your selection is highlighted. You can change your answer at any time before submitting.</p>
              </div>
              <div className="border border-slate-200 p-4">
                <h3 className="font-bold mb-2">Essay Questions</h3>
                <p>Read the scenario on the left panel. Type your response in the editor on the right. Address all requirements listed. Word count is tracked.</p>
              </div>
            </div>
          </>
        );
      case 16:
        return (
          <>
            <h2 className="text-lg font-bold text-black mb-6">Ready to Begin</h2>
            <p className="mb-6 text-sm text-black leading-relaxed">
              You have completed the tutorial. When you are ready, click <strong>"Start the Test"</strong> at the bottom of the screen.
            </p>
            <p className="mb-6 text-sm text-black leading-relaxed">
              Your exam contains <strong>{config.mcqCount} MCQ questions</strong>
              {config.essayCount > 0 && <> and <strong>{config.essayCount} essay scenarios</strong></>}.
              Total time: <strong>{Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m</strong>.
            </p>
            <p className="font-bold text-sm text-black">Good luck!</p>
          </>
        );
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
  };

  // --- RENDERERS ---

  // 1. CONFIRM DETAILS
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
                <span className="col-span-2 font-bold text-slate-800 uppercase">{candidateName.last || '—'}</span>
                <span className="text-slate-500 font-bold">First Name:</span>
                <span className="col-span-2 font-bold text-slate-800">{candidateName.first || '—'}</span>
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

  // 2. TERMS AND CONFIDENTIALITY AGREEMENT
  if (phase === 'TERMS') {
    return (
      <div className="fixed inset-0 bg-slate-200 flex items-center justify-center p-4 z-50 font-sans">
        <div className="bg-white shadow-2xl w-full max-w-[1000px] h-[90vh] flex flex-col border border-slate-400">
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

          {/* Content — flex-1 so it fills available space */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-white min-h-0">
            {/* CMA Logo Block */}
            <div className="mb-6 flex flex-col items-center shrink-0">
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

            {/* Agreement Scroll Box — use flex-1 so it expands to fill space */}
            <div className="w-full max-w-4xl flex-1 min-h-[200px] border-[3px] border-[#f7b500] rounded-xl p-1 mb-8 relative bg-white flex flex-col">
              <div className="flex-1 overflow-y-auto p-8 text-justify text-sm leading-relaxed text-slate-800 pr-6">
                <h3 className="text-center font-bold text-slate-800 mb-8 uppercase text-base">CONFIDENTIALITY AGREEMENT</h3>
                <p className="mb-6">
                  I hereby attest that I will not remove any examination materials, notes, or other unauthorized items from the testing facility. I understand that doing so is a violation of the testing rules and may result in the invalidation of my examination scores.
                </p>
                <p className="mb-6">
                  I further agree that I will not disclose the contents of the examination to any third party, whether through oral, written, electronic, or any other means of communication. This includes, but is not limited to:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Sharing specific questions or answers with other candidates, study groups, or online forums.</li>
                  <li>Reproducing or paraphrasing examination content in any format.</li>
                  <li>Using any recording device, camera, or other electronic equipment to capture examination content.</li>
                  <li>Discussing examination questions or content via social media, email, messaging apps, or any other communication platform.</li>
                </ul>
                <p className="mb-6">
                  I acknowledge that the examination content is the proprietary and confidential property of the Institute of Management Accountants (IMA). Any unauthorized disclosure or reproduction constitutes a breach of this agreement and may result in:
                </p>
                <ul className="list-disc pl-6 mb-6 space-y-2">
                  <li>Cancellation of my examination scores.</li>
                  <li>Prohibition from sitting for future examinations.</li>
                  <li>Revocation of any certification previously granted.</li>
                  <li>Legal action to recover damages and protect intellectual property rights.</li>
                </ul>
                <p className="mb-6">
                  I understand that IMA reserves the right to conduct statistical analyses of examination results to detect irregularities. If irregularities are detected, IMA may take appropriate action, including score cancellation and reporting to relevant authorities.
                </p>
                <p className="mb-6">
                  I certify that I am the individual whose name appears on the admission document, and that I am taking this examination for the sole purpose of obtaining certification.
                </p>
                <p className="font-bold">
                  By clicking "I accept these terms" you affirm that you accept the terms of this agreement and understand the consequences of non-compliance.
                </p>
              </div>
            </div>

            {/* Checkbox */}
            <div className="mb-6 flex items-center gap-3 shrink-0">
              <div
                onClick={() => setTermsAccepted(!termsAccepted)}
                className={`w-6 h-6 border-2 border-slate-300 rounded flex items-center justify-center cursor-pointer bg-white transition-all ${termsAccepted ? 'border-slate-800' : ''}`}
              >
                {termsAccepted && <div className="w-3 h-3 bg-slate-800 rounded-[1px]"></div>}
              </div>
              <span className="text-slate-500 font-medium select-none text-base cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>I accept these terms.</span>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 mb-4 shrink-0">
              <button onClick={onExit} className="bg-[#aecf68] hover:bg-[#a8c64d] text-white px-10 py-3 rounded-sm font-bold shadow-sm flex items-center gap-2 text-sm uppercase transition-colors">
                <span className="font-bold text-xl leading-none">&times;</span> Exit
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

  // 3. INTRODUCTION
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
                <div className="bg-white h-full transition-all duration-300" style={{ width: `${introProgress}%` }}></div>
              </div>
              Progress {introProgress}%
            </div>
            <button className="bg-[#999] text-[#333] px-6 py-2 rounded-sm font-bold text-sm shadow-sm cursor-not-allowed border border-slate-500">Finish Test</button>
          </div>
        </div>
        <div className="bg-[#8dc63f] text-white px-4 py-1.5 flex justify-between items-center shadow-md z-10 h-8 shrink-0 border-b border-[#7db536]">
          <span className="font-bold text-sm">Test: {title}</span>
          <span className="font-bold text-sm">Candidate: {candidateDisplay}</span>
        </div>
        <div className="flex-1 flex overflow-hidden bg-white">
          <div className="w-14 bg-white border-r border-slate-200 flex flex-col gap-1 p-1 pt-4 overflow-y-auto shrink-0">
            {[...Array(TOTAL_INTRO_PAGES)].map((_, i) => (
              <div key={i} onClick={() => setIntroPage(i + 1)} className={`h-7 w-full rounded-r-md flex items-center justify-center text-[10px] font-bold cursor-pointer mb-1 border border-l-0 ${i + 1 === introPage ? 'bg-[#8dc63f] text-white border-[#7db536] ml-1' : 'bg-[#9cc65a] text-white border-[#8dc63f] opacity-80'}`}>{i + 1}</div>
            ))}
          </div>
          <div className="flex-1 p-12 overflow-y-auto"><div className="max-w-4xl">{renderIntroContent(introPage)}</div></div>
        </div>
        <div className="bg-[#4d4d4d] px-4 py-3 flex justify-between items-center border-t border-[#666] shrink-0">
          <div className="flex gap-1"><button className="p-2 text-white hover:bg-white/10 rounded"><Icons.Trophy className="w-6 h-6" /></button></div>
          <div className="flex gap-4">
            <button onClick={() => setIntroPage(Math.max(1, introPage - 1))} disabled={introPage === 1} className="bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 text-sm disabled:opacity-50"><Icons.ChevronLeft className="w-4 h-4" /> Previous</button>
            <button onClick={() => setIntroPage(Math.min(TOTAL_INTRO_PAGES, introPage + 1))} disabled={introPage === TOTAL_INTRO_PAGES} className="bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 text-sm disabled:opacity-50">Next <Icons.ChevronRight className="w-4 h-4" /></button>
            <button className="bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 ml-4 text-sm" onClick={() => setPhase('TEST')}>Start the Test <Icons.ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // 4. MAIN EXAM INTERFACE (TEST)
  if (phase === 'TEST') {
    const currentQ = questions[currentIndex];

    if (!currentQ) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 font-bold">
          <Icons.CloudSync className="w-6 h-6 animate-spin mr-2" /> Loading Content...
        </div>
      );
    }

    const currentAns: Answer | undefined = answers.get(currentQ.id);
    const answeredCount = Array.from(answers.values()).filter((a: Answer) => a.selected !== null).length;
    const progressPercent = Math.round((answeredCount / questions.length) * 100);
    const isEssay = currentQ.type === 'ESSAY';

    return (
      <div className="flex flex-col h-screen bg-white font-sans relative">
        {/* Top Header - Dark Gray */}
        <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center h-16 shrink-0 z-20 relative">
          <div className="text-sm font-bold leading-tight">
            Page: {currentIndex + 1} of {questions.length}<br/>
            <span className="font-medium text-slate-300">Section: {currentQ.section}</span>
          </div>

          {/* Timer — always visible at center */}
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
            {/* SAVE STATUS */}
            <div className="text-right hidden sm:block">
              <div className={`text-[9px] font-bold uppercase tracking-widest ${saveStatus === 'SAVING' ? 'text-yellow-400' : saveStatus === 'ERROR' ? 'text-red-400' : 'text-emerald-400'}`}>
                {saveStatus === 'SAVING' ? 'Syncing...' : saveStatus === 'ERROR' ? 'Sync Failed' : `Saved ${lastSaved ? lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`}
              </div>
            </div>

            <div className="text-xs text-right hidden sm:block">
              <div className="bg-slate-600 h-3 w-32 rounded-full overflow-hidden mb-1 border border-slate-500">
                <div className="bg-white h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
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
          <span className="font-bold text-sm">Candidate: {candidateDisplay}</span>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden relative bg-white">

          {/* Sidebar Tabs (Questions) */}
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
                  {['MC', 'MR', 'MS', 'M+', '\u2190', 'CE', 'C', '\u00b1', '\u221a', '7', '8', '9', '/', '%', '4', '5', '6', '*', '1/x', '1', '2', '3', '-', '=', '0', '.', '+'].map((k, idx) => (
                    <button key={idx} className={`bg-slate-200 border border-slate-300 p-2 text-[10px] font-bold hover:bg-slate-300 ${k === '=' ? 'row-span-2 bg-slate-300' : ''}`}>{k}</button>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION REVIEW POPUP */}
            {isReviewOpen && (
              <div className="absolute bottom-0 left-0 w-72 h-[450px] z-40 bg-[#f0f0f0] border-t border-r border-slate-400 shadow-[5px_-5px_20px_rgba(0,0,0,0.2)] flex flex-col">
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
                      const isSelected = ans?.selected !== null;
                      return (
                        <button
                          key={q.id}
                          onClick={() => { handleNavigate(idx); setIsReviewOpen(false); }}
                          className={`h-8 border relative font-bold text-xs flex items-center justify-center transition-all ${
                            isSelected ? 'bg-[#8dc63f] text-white border-[#7db536]' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {idx + 1}
                          {ans?.flagged && <div className="absolute top-0 right-0 p-0.5"><Icons.Flag className="w-2 h-2 fill-current text-white" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT AREA: Help vs Question */}
            {isHelpOpen ? (
              <div className="flex-1 overflow-y-auto p-12 bg-white">
                <div className="max-w-4xl mx-auto">
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
                      <div className="flex-1 bg-slate-50 border-2 border-slate-300 p-6 overflow-y-auto max-h-[600px] shadow-inner">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                          <span className="font-bold text-sm text-slate-700 uppercase">Scenario View</span>
                          <Icons.FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-wrap font-serif">
                          {currentQ.question_text}
                        </p>
                      </div>
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
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
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

          {isHelpOpen ? (
            <div className="flex gap-3">
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
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 disabled:hover:bg-[#8dc63f] text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 transition-colors text-sm"
              >
                <Icons.ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                onClick={() => handleNavigate(currentIndex + 1)}
                disabled={currentIndex >= questions.length - 1}
                className="bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white px-6 py-2 rounded-sm font-bold flex items-center gap-1 transition-colors text-sm"
              >
                Next <Icons.ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 5. RESULTS
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
            <p className="text-slate-500 mb-2 font-medium">Candidate: {candidateDisplay}</p>
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
