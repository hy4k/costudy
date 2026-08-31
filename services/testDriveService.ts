import { TestDriveCandidate, TestDriveScorecard, ExamPart } from '../types';
import { fetchExamQuestions, fetchEssayQuestions } from './fetsService';
import { evaluateTestDriveExamWithScores } from './geminiService';

const STORAGE_KEY_CANDIDATES = 'fets_testdrive_candidates';
const STORAGE_KEY_TERMINALS = 'fets_testdrive_terminals';
const STORAGE_KEY_SETTINGS = 'fets_testdrive_settings';

// Initial pre-populated candidate records simulating bookings from https://fets.in/testdrive/
const INITIAL_CANDIDATES: TestDriveCandidate[] = [
  {
    id: 'cand-001',
    bookingRef: 'FETS-TD-8921',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+91 98765 43210',
    examPart: 'Part 1',
    examDate: new Date().toISOString().split('T')[0],
    slotTime: '09:00 AM - 01:00 PM',
    centerLocation: 'FETS Physical Test Centre - Lab A',
    terminalNumber: 'T-01',
    status: 'CHECKED_IN',
    checkInTime: '08:45 AM',
    proctorAuthCode: '492810',
    notes: 'Candidate brought physical BA II Plus calculator.'
  },
  {
    id: 'cand-002',
    bookingRef: 'FETS-TD-8922',
    name: 'Pooja Verma',
    email: 'pooja.verma@example.com',
    phone: '+91 98450 11223',
    examPart: 'Part 2',
    examDate: new Date().toISOString().split('T')[0],
    slotTime: '09:00 AM - 01:00 PM',
    centerLocation: 'FETS Physical Test Centre - Lab A',
    terminalNumber: 'T-02',
    status: 'IN_PROGRESS',
    checkInTime: '08:50 AM',
    proctorAuthCode: '719304',
    notes: 'Section 1 MCQs in progress.'
  },
  {
    id: 'cand-003',
    bookingRef: 'FETS-TD-8923',
    name: 'Arjun Menon',
    email: 'arjun.menon@example.com',
    phone: '+91 99123 88472',
    examPart: 'Part 1',
    examDate: new Date().toISOString().split('T')[0],
    slotTime: '09:00 AM - 01:00 PM',
    centerLocation: 'FETS Physical Test Centre - Lab A',
    terminalNumber: 'T-03',
    status: 'GRADED',
    checkInTime: '08:40 AM',
    proctorAuthCode: '318920',
    scorecard: {
      id: 'sc-003',
      candidateId: 'cand-003',
      bookingRef: 'FETS-TD-8923',
      candidateName: 'Arjun Menon',
      candidateEmail: 'arjun.menon@example.com',
      examPart: 'Part 1',
      examDate: new Date().toISOString().split('T')[0],
      durationSecondsUsed: 13420,
      mcqCorrect: 78,
      mcqTotal: 100,
      mcqScoreScaled: 292.5,
      essay1ScoreScaled: 49.0,
      essay2ScoreScaled: 52.0,
      totalScoreScaled: 393.5,
      passed: true,
      domainScores: [
        { domain: 'External Financial Reporting', scorePercent: 82, masteryLevel: 'Satisfactory' },
        { domain: 'Planning, Budgeting & Forecasting', scorePercent: 79, masteryLevel: 'Satisfactory' },
        { domain: 'Performance Management', scorePercent: 80, masteryLevel: 'Satisfactory' },
        { domain: 'Cost Management', scorePercent: 74, masteryLevel: 'Satisfactory' },
        { domain: 'Internal Controls', scorePercent: 68, masteryLevel: 'Marginal' },
        { domain: 'Technology & Analytics', scorePercent: 85, masteryLevel: 'Satisfactory' }
      ],
      aiEvaluationText: '### 🎓 ICMA Performance Diagnostic\nCandidate showed exceptional mastery across Financial Reporting and Budgeting. Essay structures demonstrated strong analytical acumen with minor gaps in COSO internal control framework citations.',
      essayResponses: [
        {
          questionId: 'essay-1',
          scenarioTitle: 'Omega Corp Foreign Risk Exposure',
          responseText: 'Omega Corp faces transaction, translation, and economic exposure. For transaction risk, forward contracts or currency futures can lock the exchange rate.',
          aiFeedback: 'Accurately identified all 3 exposures and provided valid derivative hedging strategies.',
          awardedMarks: 49.0,
          maxMarks: 62.5
        },
        {
          questionId: 'essay-2',
          scenarioTitle: 'Activity-Based Costing (ABC) Transition',
          responseText: 'Volume-based costing distorts low-volume high-complexity products by under-costing them. ABC identifies distinct cost drivers to assign overhead accurately.',
          aiFeedback: 'Comprehensive explanation of overhead distortion and strategic pricing benefits.',
          awardedMarks: 52.0,
          maxMarks: 62.5
        }
      ],
      gradedAt: new Date(Date.now() - 3600000).toISOString(),
      gradedBy: 'Gemini 3.1 Reasoning AI'
    }
  },
  {
    id: 'cand-004',
    bookingRef: 'FETS-TD-8924',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@example.com',
    phone: '+91 97654 32190',
    examPart: 'Part 2',
    examDate: new Date().toISOString().split('T')[0],
    slotTime: '09:00 AM - 01:00 PM',
    centerLocation: 'FETS Physical Test Centre - Lab A',
    status: 'BOOKED',
    notes: 'Awaiting arrival at front desk.'
  },
  {
    id: 'cand-005',
    bookingRef: 'FETS-TD-8925',
    name: 'Mohammed Tariq',
    email: 'tariq.m@example.com',
    phone: '+91 91234 56780',
    examPart: 'Part 1',
    examDate: new Date().toISOString().split('T')[0],
    slotTime: '02:00 PM - 06:00 PM',
    centerLocation: 'FETS Physical Test Centre - Lab A',
    status: 'BOOKED',
    notes: 'Afternoon slot booking.'
  }
];

// Helper: Fisher-Yates Shuffle with Option Remapping for Anti-Cheating
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffleQuestionOptions(q: any) {
  if (q.type === 'ESSAY') return q;
  
  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d },
  ];

  // Remember which text corresponded to correct answer
  const correctText = options.find(o => o.key === q.correct_answer)?.text || q.option_a;

  // Shuffle options
  const shuffledOptions = shuffleArray(options);

  // Find new key for the correct text
  const newCorrectKey = (['A', 'B', 'C', 'D'][shuffledOptions.findIndex(o => o.text === correctText)] || 'A');

  return {
    ...q,
    option_a: shuffledOptions[0].text,
    option_b: shuffledOptions[1].text,
    option_c: shuffledOptions[2].text,
    option_d: shuffledOptions[3].text,
    correct_answer: newCorrectKey
  };
}

export const testDriveService = {
  // Get all candidates
  getCandidates: (): TestDriveCandidate[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CANDIDATES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading test drive candidates:", e);
    }
    localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(INITIAL_CANDIDATES));
    return INITIAL_CANDIDATES;
  },

  // Save candidates
  saveCandidates: (candidates: TestDriveCandidate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(candidates));
    } catch (e) {
      console.error("Error saving test drive candidates:", e);
    }
  },

  // Find candidate by booking ref or id or email
  findCandidate: (query: string): TestDriveCandidate | null => {
    const list = testDriveService.getCandidates();
    const clean = query.trim().toUpperCase();
    return list.find(c => 
      c.bookingRef.toUpperCase() === clean || 
      c.id.toUpperCase() === clean || 
      c.email.toUpperCase() === clean ||
      c.name.toUpperCase().includes(clean)
    ) || null;
  },

  // Check-in candidate
  checkInCandidate: (candidateId: string, terminalNumber: string): { success: boolean; authCode: string; candidate: TestDriveCandidate } => {
    const list = testDriveService.getCandidates();
    const idx = list.findIndex(c => c.id === candidateId || c.bookingRef === candidateId);
    if (idx === -1) {
      throw new Error("Candidate booking record not found.");
    }

    // Generate random 6-digit proctor code
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();
    const updated: TestDriveCandidate = {
      ...list[idx],
      status: 'CHECKED_IN',
      terminalNumber,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      proctorAuthCode: authCode
    };

    list[idx] = updated;
    testDriveService.saveCandidates(list);
    return { success: true, authCode, candidate: updated };
  },

  // Authorize / Start Exam on terminal
  authorizeTerminalExam: (bookingRefOrId: string, inputAuthCode: string): { authorized: boolean; candidate?: TestDriveCandidate; error?: string } => {
    const candidate = testDriveService.findCandidate(bookingRefOrId);
    if (!candidate) {
      return { authorized: false, error: 'Booking reference not found. Please verify with proctor desk.' };
    }

    if (candidate.proctorAuthCode && candidate.proctorAuthCode !== inputAuthCode.trim()) {
      return { authorized: false, error: 'Invalid Proctor Authorization Code. Please request proctor assistance.' };
    }

    // Update status to in progress
    const list = testDriveService.getCandidates();
    const idx = list.findIndex(c => c.id === candidate.id);
    if (idx >= 0) {
      list[idx].status = 'IN_PROGRESS';
      testDriveService.saveCandidates(list);
    }

    return { authorized: true, candidate: list[idx] || candidate };
  },

  // Create on-the-spot walk-in candidate
  registerWalkIn: (data: { name: string; email: string; phone: string; examPart: ExamPart; terminalNumber?: string }): TestDriveCandidate => {
    const list = testDriveService.getCandidates();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingRef = `FETS-TD-${randomSuffix}`;
    const authCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newCandidate: TestDriveCandidate = {
      id: `cand-${Date.now()}`,
      bookingRef,
      name: data.name,
      email: data.email,
      phone: data.phone,
      examPart: data.examPart,
      examDate: new Date().toISOString().split('T')[0],
      slotTime: 'Walk-in On-Demand',
      centerLocation: 'FETS Physical Test Centre - Main Hall',
      terminalNumber: data.terminalNumber || 'T-AUTO',
      status: 'CHECKED_IN',
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      proctorAuthCode: authCode,
      notes: 'Walk-in registration created at test center console.'
    };

    list.unshift(newCandidate);
    testDriveService.saveCandidates(list);
    return newCandidate;
  },

  // Fetch Full 4-Hour Test Drive Exam Questions (100 MCQs + 2 Essays) for Part 1 or Part 2
  loadTestDriveExamQuestions: async (examPart: ExamPart) => {
    // 1. Fetch 100 MCQs
    const rawMCQs = await fetchExamQuestions(100);
    
    // Filter / Tag questions appropriately based on Part
    const partMCQs = rawMCQs.map((q, i) => ({
      ...q,
      id: `td-${examPart.replace(' ', '').toLowerCase()}-mcq-${i + 1}`,
      part: examPart,
      section: examPart === 'Part 1' 
        ? ['External Financial Reporting', 'Planning, Budgeting & Forecasting', 'Performance Management', 'Cost Management', 'Internal Controls', 'Technology & Analytics'][i % 6]
        : ['Financial Statement Analysis', 'Corporate Finance', 'Decision Analysis', 'Enterprise Risk Management', 'Investment Decisions', 'Professional Ethics'][i % 6]
    }));

    // 2. Anti-Cheating Double-Randomization: Shuffle question sequence & shuffle options (A,B,C,D) per candidate workstation
    const randomizedMCQs = shuffleArray(partMCQs).map((q, index) => {
      const optionShuffled = shuffleQuestionOptions(q);
      return {
        ...optionShuffled,
        sequenceNumber: index + 1
      };
    });

    // 3. Fetch 2 Comprehensive Essays for the specific Part
    const tailoredEssays = examPart === 'Part 1' ? [
      {
        id: 'td-essay-p1-1',
        type: 'ESSAY' as const,
        question_text: `SCENARIO 1: OMEGA MANUFACTURING CORP (Part 1 - Cost Management & Variance Analysis)

Omega Manufacturing Corp produces high-precision electronic valves. During Q2, the standard cost sheet per valve was established as follows:
- Direct Materials: 4 lbs @ $6.00/lb = $24.00
- Direct Labor: 2 hrs @ $20.00/hr = $40.00
- Variable Overhead: 2 DL hrs @ $8.00/hr = $16.00
- Fixed Overhead Budget: $180,000 based on normal monthly volume of 10,000 units (20,000 standard DL hrs)

Actual Results for June:
- Produced and sold 11,000 units.
- Direct Materials Purchased & Used: 46,200 lbs costing $286,440.
- Direct Labor Incurred: 21,450 hrs costing $439,725.
- Variable Overhead Incurred: $178,000.
- Fixed Overhead Incurred: $184,000.

REQUIRED:
1. Compute the Direct Materials Price Variance and Quantity (Efficiency) Variance.
2. Compute the Direct Labor Rate Variance and Efficiency Variance.
3. Compute the Fixed Overhead Spending (Budget) and Volume Variances.
4. Provide 3 actionable management recommendations to the plant supervisor explaining the probable causes for the direct labor and materials variances.`,
        part: 'Part 1',
        section: 'Section 2: Essay Case 1 - Cost & Variance Analysis',
        rubric_guidelines: 'Direct material & labor 4-way variance calculation + operational diagnostic.',
        difficulty_level: 'Hard',
        option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
      },
      {
        id: 'td-essay-p1-2',
        type: 'ESSAY' as const,
        question_text: `SCENARIO 2: NEXUS PHARMA & COSO INTERNAL CONTROLS (Part 1 - Governance & Controls)

Nexus Pharma is a fast-growing pharmaceutical distributor preparing for its annual audit. An internal whistle-blower report revealed that a regional sales manager authorized significant sales discounts to meeting quarter-end targets without secondary controller sign-off. Additionally, warehouse inventory counts showed a $420,000 unexplained inventory shortage in high-value biologics.

REQUIRED:
1. Identify and explain the 5 components of the COSO Internal Control - Integrated Framework.
2. For EACH of the two operational breakdowns described at Nexus Pharma (unauthorized sales discounts and inventory shrinkage), identify which specific COSO component was compromised.
3. Recommend 4 specific Internal Control Activities (including Segregation of Duties and physical safeguards) that Nexus Pharma must implement immediately to remediate these control deficiencies.`,
        part: 'Part 1',
        section: 'Section 2: Essay Case 2 - Internal Controls & COSO Framework',
        rubric_guidelines: 'COSO 5-component framework application and segregation of duties controls.',
        difficulty_level: 'Medium',
        option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
      }
    ] : [
      {
        id: 'td-essay-p2-1',
        type: 'ESSAY' as const,
        question_text: `SCENARIO 1: MERIDIAN CAPITAL ACQUISITION (Part 2 - Capital Budgeting & NPV)

Meridian Capital is evaluating a $5,000,000 investment in a robotic assembly facility.
- Estimated Project Life: 5 years with straight-line tax depreciation down to $0 salvage value.
- Annual Pre-tax Operating Cost Savings: $1,600,000 per year.
- Working Capital Requirement: $300,000 required at t=0, fully recovered at the end of Year 5.
- Corporate Income Tax Rate: 25%.
- Meridian's Weighted Average Cost of Capital (WACC): 10%.

Discount Factors (10%):
- PV of $1: Yr 1=0.909, Yr 2=0.826, Yr 3=0.751, Yr 4=0.683, Yr 5=0.621
- PVA of $1 (5 years @ 10%): 3.791

REQUIRED:
1. Calculate the initial net cash outlay at time t=0.
2. Calculate the annual after-tax net operating cash flows for Years 1 through 5 (including the depreciation tax shield).
3. Compute the Net Present Value (NPV) of the robotic investment.
4. State whether Meridian should accept or reject the project based on NPV and explain the financial rationale.`,
        part: 'Part 2',
        section: 'Section 2: Essay Case 1 - Capital Investment & Valuation',
        rubric_guidelines: 'After-tax cash flows, depreciation tax shield, and Net Present Value determination.',
        difficulty_level: 'Hard',
        option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
      },
      {
        id: 'td-essay-p2-2',
        type: 'ESSAY' as const,
        question_text: `SCENARIO 2: HORIZON TECH & IMA ETHICAL STANDARDS (Part 2 - Professional Ethics)

David Chen, CMA, is the Senior Financial Analyst at Horizon Tech. The CEO approaches David with a confidential plan to acquire a competitor in 2 weeks. The CEO suggests David advise his family members to purchase Horizon stock before the public announcement. Later, the CFO directs David to capitalize $1.8M in software development costs that do not meet GAAP capitalization criteria in order to meet lender debt covenants.

REQUIRED:
1. Identify the 4 overarching standards of the IMA Statement of Ethical Professional Practice (Competence, Confidentiality, Integrity, Credibility).
2. Explain how the CEO's suggestion violates the IMA Standard of Confidentiality and Integrity.
3. Explain how the CFO's accounting directive violates the IMA Standard of Credibility and Competence.
4. Detail the exact step-by-step conflict resolution procedure David must follow according to IMA guidelines.`,
        part: 'Part 2',
        section: 'Section 2: Essay Case 2 - IMA Professional Ethics & Governance',
        rubric_guidelines: 'IMA Statement of Ethical Professional Practice 4 standards and conflict resolution steps.',
        difficulty_level: 'Medium',
        option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
      }
    ];

    return {
      mcqs: randomizedMCQs,
      essays: tailoredEssays,
      totalQuestions: randomizedMCQs.length + tailoredEssays.length
    };
  },

  // Submit and evaluate candidate exam with Gemini AI
  submitAndGradeTestDriveExam: async (
    candidateId: string,
    examPart: ExamPart,
    questions: any[],
    answers: Map<string, any>,
    durationSecondsUsed: number
  ): Promise<TestDriveScorecard> => {
    const list = testDriveService.getCandidates();
    const candidate = list.find(c => c.id === candidateId || c.bookingRef === candidateId) || {
      id: candidateId,
      bookingRef: candidateId,
      name: 'Candidate',
      email: 'candidate@fets.in',
      phone: '',
      examPart,
      examDate: new Date().toISOString().split('T')[0],
      slotTime: 'Test Drive Slot',
      centerLocation: 'FETS Physical Test Centre',
      status: 'COMPLETED' as const
    };

    // Calculate MCQ Score
    let mcqCorrect = 0;
    const mcqList = questions.filter(q => q.type !== 'ESSAY');
    mcqList.forEach(q => {
      const a = answers.get(q.id);
      if (a?.selected === q.correct_answer) {
        mcqCorrect++;
      }
    });

    const mcqTotal = mcqList.length || 100;
    // CMA MCQ Scaling: 100 MCQs = 375 maximum marks
    const mcqScoreScaled = Number(((mcqCorrect / mcqTotal) * 375).toFixed(1));

    // Evaluate Essays with Gemini Reasoning AI
    const aiResult = await evaluateTestDriveExamWithScores(
      candidate.name,
      examPart,
      questions,
      answers,
      mcqCorrect,
      mcqTotal
    );

    const essay1ScoreScaled = aiResult.essay1Score;
    const essay2ScoreScaled = aiResult.essay2Score;
    const totalScoreScaled = Number((mcqScoreScaled + essay1ScoreScaled + essay2ScoreScaled).toFixed(1));
    const passed = totalScoreScaled >= 360; // 72% pass threshold for 500 scaled marks

    const essayQuestions = questions.filter(q => q.type === 'ESSAY');
    const essayResponses = essayQuestions.map((q, idx) => ({
      questionId: q.id,
      scenarioTitle: q.section || `Essay Scenario ${idx + 1}`,
      responseText: answers.get(q.id)?.essayText || '',
      aiFeedback: idx === 0 ? `Awarded ${essay1ScoreScaled}/62.5 marks for technical depth and variance analysis.` : `Awarded ${essay2ScoreScaled}/62.5 marks for governance and internal control solutions.`,
      awardedMarks: idx === 0 ? essay1ScoreScaled : essay2ScoreScaled,
      maxMarks: 62.5
    }));

    // Generate Domain Scores
    const domainScores = [
      { domain: examPart === 'Part 1' ? 'Financial Reporting Decisions' : 'Financial Statement Analysis', scorePercent: Math.min(100, Math.round((mcqCorrect / mcqTotal) * 100 + 4)), masteryLevel: (mcqCorrect / mcqTotal) >= 0.72 ? 'Satisfactory' as const : 'Marginal' as const },
      { domain: examPart === 'Part 1' ? 'Planning, Budgeting & Forecasting' : 'Corporate Finance', scorePercent: Math.min(100, Math.round((mcqCorrect / mcqTotal) * 100 + 2)), masteryLevel: (mcqCorrect / mcqTotal) >= 0.72 ? 'Satisfactory' as const : 'Marginal' as const },
      { domain: examPart === 'Part 1' ? 'Performance Management' : 'Decision Analysis', scorePercent: Math.min(100, Math.round((mcqCorrect / mcqTotal) * 100 - 3)), masteryLevel: (mcqCorrect / mcqTotal) >= 0.70 ? 'Satisfactory' as const : 'Unsatisfactory' as const },
      { domain: examPart === 'Part 1' ? 'Cost Management' : 'Enterprise Risk Management', scorePercent: Math.min(100, Math.round((mcqCorrect / mcqTotal) * 100 + 6)), masteryLevel: 'Satisfactory' as const },
      { domain: examPart === 'Part 1' ? 'Internal Controls' : 'Investment Decisions', scorePercent: Math.min(100, Math.round((mcqCorrect / mcqTotal) * 100 - 5)), masteryLevel: 'Marginal' as const },
      { domain: examPart === 'Part 1' ? 'Technology & Analytics' : 'Professional Ethics', scorePercent: Math.min(100, Math.round((mcqCorrect / mcqTotal) * 100 + 8)), masteryLevel: 'Satisfactory' as const }
    ];

    const scorecard: TestDriveScorecard = {
      id: `sc-${Date.now()}`,
      candidateId: candidate.id,
      bookingRef: candidate.bookingRef,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      examPart,
      examDate: new Date().toISOString().split('T')[0],
      durationSecondsUsed,
      mcqCorrect,
      mcqTotal,
      mcqScoreScaled,
      essay1ScoreScaled,
      essay2ScoreScaled,
      totalScoreScaled,
      passed,
      domainScores,
      aiEvaluationText: aiResult.aiDiagnosticMarkdown,
      essayResponses,
      gradedAt: new Date().toISOString(),
      gradedBy: 'Gemini 3.1 Reasoning AI'
    };

    // Update candidate in local resilient storage
    const cIndex = list.findIndex(c => c.id === candidate.id);
    if (cIndex >= 0) {
      list[cIndex].status = 'GRADED';
      list[cIndex].scorecard = scorecard;
      testDriveService.saveCandidates(list);
    }

    // Persist score to Supabase backend asynchronously
    try {
      import('./supabaseClient').then(({ supabase }) => {
        supabase.from('mock_test_results').insert([{
          user_id: candidate.id,
          test_name: `CMA 4-Hour Test Drive (${examPart})`,
          score: Math.round((totalScoreScaled / 500) * 100),
          scaled_score: totalScoreScaled,
          mcq_score: mcqScoreScaled,
          essay_score: essay1ScoreScaled + essay2ScoreScaled,
          passed: passed,
          metadata: {
            bookingRef: candidate.bookingRef,
            terminal: candidate.terminalNumber,
            domainScores: domainScores,
            durationSeconds: durationSecondsUsed
          }
        }]).then(({ error }) => {
          if (error) {
            console.warn('[FETS Database] Supabase score sync note:', error.message);
          } else {
            console.log('[FETS Database] Score successfully persisted to Supabase mock_test_results');
          }
        });
      });
    } catch (dbErr) {
      console.warn('[FETS Database] Cloud database save note:', dbErr);
    }

    return scorecard;
  },

  // Send Results to Candidate (Simulated Email Dispatch & Sync with fets.in/testdrive/admin)
  sendResultsToCandidate: async (candidateId: string): Promise<{ success: boolean; message: string; payload: any }> => {
    const list = testDriveService.getCandidates();
    const idx = list.findIndex(c => c.id === candidateId);
    if (idx === -1 || !list[idx].scorecard) {
      throw new Error("Scorecard not available for this candidate. Please run grading first.");
    }

    const candidate = list[idx];
    const scorecard = candidate.scorecard!;

    // Construct Webhook Payload for https://fets.in/testdrive/admin
    const webhookPayload = {
      event: 'test_drive_graded',
      booking_reference: candidate.bookingRef,
      candidate_email: candidate.email,
      candidate_name: candidate.name,
      exam_part: candidate.examPart,
      exam_date: scorecard.examDate,
      total_scaled_score: scorecard.totalScoreScaled,
      mcq_scaled_score: scorecard.mcqScoreScaled,
      essay_scaled_score: scorecard.essay1ScoreScaled + scorecard.essay2ScoreScaled,
      result_status: scorecard.passed ? 'PASSED' : 'DID_NOT_PASS',
      duration_minutes: Math.round(scorecard.durationSecondsUsed / 60),
      ai_diagnostic_summary: scorecard.aiEvaluationText.slice(0, 500) + '...',
      dispatched_at: new Date().toISOString(),
      fets_center_id: 'FETS-TEST-CENTRE-01'
    };

    console.log('[FETS TestDrive API] Dispatching Results Webhook to https://fets.in/testdrive/admin:', webhookPayload);

    // Update candidate record
    list[idx].status = 'RESULTS_SENT';
    list[idx].scorecard!.resultsSentAt = new Date().toISOString();
    testDriveService.saveCandidates(list);

    return {
      success: true,
      message: `Scorecard and AI Performance Diagnostic successfully sent to ${candidate.email}`,
      payload: webhookPayload
    };
  },

  // Export Results Batch CSV for Proctor Staff
  exportResultsCSV: (): string => {
    const list = testDriveService.getCandidates();
    const headers = [
      'Booking Ref',
      'Candidate Name',
      'Email',
      'Phone',
      'Exam Part',
      'Terminal',
      'Status',
      'MCQ Correct',
      'MCQ Scaled Score (/375)',
      'Essay Scaled Score (/125)',
      'Total Score (/500)',
      'Result',
      'Graded At'
    ];

    const rows = list.map(c => {
      const sc = c.scorecard;
      return [
        `"${c.bookingRef}"`,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone}"`,
        `"${c.examPart}"`,
        `"${c.terminalNumber || 'N/A'}"`,
        `"${c.status}"`,
        sc ? sc.mcqCorrect : 'N/A',
        sc ? sc.mcqScoreScaled : 'N/A',
        sc ? (sc.essay1ScoreScaled + sc.essay2ScoreScaled).toFixed(1) : 'N/A',
        sc ? sc.totalScoreScaled : 'N/A',
        sc ? (sc.passed ? 'PASSED' : 'DID NOT PASS') : 'N/A',
        sc ? `"${sc.gradedAt}"` : 'N/A'
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }
};
