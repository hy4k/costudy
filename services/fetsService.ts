
import { supabase } from './supabaseClient';
import { CoStudyCloudStatus, User, UserRole, UserLevel } from '../types';

export const COSTUDY_CONFIG = {
  apiBase: 'https://api.costudy.cloud/v1',
  socketUrl: 'wss://realtime.costudy.cloud',
  merchantId: 'MID_COSTUDY_2025'
};

export const getCoStudyCloudStatus = (): CoStudyCloudStatus => ({
  connected: true,
  latency: Math.floor(Math.random() * 15) + 5,
  lastSync: new Date().toISOString(),
  authSession: 'costudy-live-session',
  dataCore: 'IDLE'
});

/**
 * CoStudy Authentication Service
 */
export const authService = {
  signUp: async (email: string, pass: string, name: string, role: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
          role: role // Critical: Pass role to metadata so the DB trigger can use it
        }
      }
    });

    if (error) {
      if (error.message.includes('Database error')) {
        throw new Error("Server synchronization issue. Please try signing in, or try again in a few moments.");
      }
      throw error;
    }

    if (data?.user) {
      try {
        await createUserProfile(data.user.id, {
          full_name: name,
          role: role
        });
      } catch (e) {
        console.warn("Manual seeding failed, but App.tsx JIT logic will recover it on mount.");
      }
    }

    return data;
  },

  signIn: async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
    if (error) throw error;
    return data;
  },

  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return true;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        // Fix for "Invalid Refresh Token" loop:
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
           console.warn("Detected stale session token. Clearing auth state...");
           await supabase.auth.signOut();
           return null;
        }
        return null;
      }
      return data?.session;
    } catch (e) {
      console.error("Critical Auth Error:", e);
      return null;
    }
  }
};

/**
 * CoStudy Profile Service
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (!userId) return null;
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); 

        if (error) {
          // Suppress 406/Not Acceptable errors which happen during race conditions or missing profiles
          if (!error.message.includes("JSON object requested") && !error.message.includes("0 rows")) {
             console.error("Profile Fetch Error:", error.message);
          }
          return null;
        }

        if (!data) return null;

        // Normalizing Role to Uppercase to match TypeScript Enums (DB often returns lowercase enum values)
        const normalizedRole = (data.role || 'STUDENT').toUpperCase() as UserRole;

        return {
            id: data.id,
            name: data.name,
            handle: data.handle || data.name?.toLowerCase().replace(/\s/g, '_') || 'aspirant',
            bio: data.bio || '',
            strategicMilestone: data.strategic_milestone || '',
            examFocus: data.exam_focus || 'CMA Part 1',
            avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.id}`,
            role: normalizedRole,
            level: data.level as UserLevel,
            learningStyle: data.learning_style || 'Visual',
            timezone: data.timezone || 'UTC',
            performance: data.performance || [],
            reputation: data.reputation || {
                studyScore: { total: 0, consistencyWeight: 0, attemptWeight: 0, improvementWeight: 0 },
                consistencyScore: { streak: 0, status: 'Active' },
                helpfulnessScore: { total: 0, answersVerified: 0, resourcesShared: 0, groupsLed: 0 }
            },
            costudyStatus: data.costudy_status || {
                subscription: 'Basic',
                walletBalance: 0,
                isVerified: false,
                globalRank: 0
            },
            learningWith: 0,
            learningFrom: 0,
            availableHours: 'Evening',
            // Specialist fields
            specialties: data.specialties || [],
            yearsExperience: data.years_experience || 0,
            hourlyRate: data.hourly_rate || 0,
            specialistSlug: data.specialist_slug,
            signalLevel: data.signal_level || 'ACTIVE_SOLVER'
        };
    } catch (e) {
        // Silent fail to allow app to self-heal via createUserProfile
        return null;
    }
};

/**
 * Manual Profile Creation (Self-Healing Logic)
 */
export const createUserProfile = async (userId: string, metadata: any): Promise<User | null> => {
    const name = metadata?.full_name || metadata?.display_name || 'New Aspirant';
    // Ensure role matches DB enum case if necessary, but we normalize on read
    const role = metadata?.role || 'STUDENT'; 
    const handle = name.toLowerCase().replace(/\s/g, '_') + '_' + Math.floor(Math.random() * 1000);

    const newProfile = {
        id: userId,
        name: name,
        handle: handle,
        avatar: `https://i.pravatar.cc/150?u=${userId}`,
        role: role,
        level: 'STARTER',
        bio: 'Just started my CMA journey.',
        strategic_milestone: 'Preparing for Part 1 Mock Session.',
        exam_focus: 'CMA Part 1',
        signal_level: 'ACTIVE_SOLVER',
        costudy_status: {
            subscription: 'Basic',
            walletBalance: 0,
            isVerified: false,
            globalRank: Math.floor(Math.random() * 5000) + 1000
        },
        performance: [
            { topic: 'Financial Reporting', score: 45, attempts: 1, lastScore: 45, trend: 'Stable', style: 'Conceptual' },
            { topic: 'Cost Management', score: 32, attempts: 1, lastScore: 32, trend: 'Stable', style: 'Calculation' }
        ],
        // Ensure mentor fields are initialized to prevent update errors
        specialties: [],
        years_experience: 0,
        hourly_rate: 0
    };

    const { error } = await supabase
        .from('user_profiles')
        .upsert(newProfile, { onConflict: 'id' });

    if (error) {
        console.error("Profile Upsert Failed:", error);
        throw error;
    }

    return getUserProfile(userId);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    // Transform frontend fields to snake_case for DB
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.handle !== undefined) dbUpdates.handle = updates.handle;
    if (updates.strategicMilestone !== undefined) dbUpdates.strategic_milestone = updates.strategicMilestone;
    if (updates.examFocus !== undefined) dbUpdates.exam_focus = updates.examFocus;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.signalLevel !== undefined) dbUpdates.signal_level = updates.signalLevel;
    if (updates.specialties !== undefined) dbUpdates.specialties = updates.specialties;
    if (updates.yearsExperience !== undefined) dbUpdates.years_experience = updates.yearsExperience;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.specialistSlug !== undefined) dbUpdates.specialist_slug = updates.specialistSlug;

    const { data, error } = await supabase
        .from('user_profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select();

    if (error) {
        console.error("Supabase Update Error:", error);
        
        // Handle session expiry explicitly
        if (error.message.includes("JWT") || error.message.includes("token")) {
             await authService.signOut();
             throw new Error("Session expired. Please log in again.");
        }

        // Handle missing column errors more gracefully
        if (error.message.includes("column") && error.message.includes("does not exist")) {
             throw new Error("Database schema out of sync. Please contact support or refresh schema.");
        }

        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
       // This happens if RLS blocks the update or ID doesn't exist
       throw new Error("Update failed: User record not found or permission denied.");
    }
    
    return true;
};

export const fetchMockTestData = async () => {
  return [
    { id: 't1', title: 'CMA Part 1 Full Mock', questions: 100, duration: '3h 45m', difficulty: 'Hard' }, // Updated Duration
    { id: 't2', title: 'Ethics Section Quiz', questions: 25, duration: '30m', difficulty: 'Medium' },
    { id: 't3', title: 'Costing Strategy Diagnostic', questions: 50, duration: '1h 30m', difficulty: 'Hard' }
  ];
};

export const fetchGlobalPerformance = async (userId: string) => {
  return {
    globalRank: 124,
    averageMockScore: 82,
    percentile: 94,
    weakTopics: ['Internal Controls', 'Ethics'],
    lastAttempt: new Date().toISOString()
  };
};

export const processUnifiedPayment = async (amount: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        costudyTransactionId: `CS_TXN_${Date.now()}`,
        gateway: 'Stripe',
        amount,
        status: 'success'
      });
    }, 1500);
  });
};

export const syncStudyTelemetry = (data: any) => {
  console.log('[CoStudy Telemetry]', data);
};

// --- EXAM MOCK GENERATOR (PROMETRIC STYLE) ---

// High-quality authentic baseline CMA question bank across all Part 1 and Part 2 ICMA domains
const AUTHENTIC_CMA_QUESTION_BANK = [
    {
        question_text: "Which of the following is classified as a contra-asset account under US GAAP?",
        option_a: "Accumulated Depreciation",
        option_b: "Accounts Payable",
        option_c: "Prepaid Expenses",
        option_d: "Retained Earnings",
        correct_answer: "A",
        part: "Part 1",
        section: "External Financial Reporting Decisions"
    },
    {
        question_text: "Under US GAAP, how should interest paid and interest received be classified in the Statement of Cash Flows?",
        option_a: "Interest paid is financing; interest received is investing.",
        option_b: "Both interest paid and interest received are operating cash flows.",
        option_c: "Interest paid is operating; interest received is investing.",
        option_d: "Both interest paid and interest received are financing cash flows.",
        correct_answer: "B",
        part: "Part 1",
        section: "External Financial Reporting Decisions"
    },
    {
        question_text: "Under ASC 606 (Revenue from Contracts with Customers), what is the third step in the five-step revenue recognition model?",
        option_a: "Identify the performance obligations in the contract.",
        option_b: "Determine the transaction price.",
        option_c: "Allocate the transaction price to performance obligations.",
        option_d: "Recognize revenue when a performance obligation is satisfied.",
        correct_answer: "B",
        part: "Part 1",
        section: "External Financial Reporting Decisions"
    },
    {
        question_text: "Which budgeting methodology requires managers to justify all budgeted expenditures from a zero baseline every period, helping to eliminate built-in budget slack?",
        option_a: "Incremental Budgeting",
        option_b: "Zero-Based Budgeting (ZBB)",
        option_c: "Continuous (Rolling) Budgeting",
        option_d: "Flexible Budgeting",
        correct_answer: "B",
        part: "Part 1",
        section: "Planning, Budgeting, and Forecasting"
    },
    {
        question_text: "If a company operates in a highly volatile market and requires continuous 12-month projections, which budgeting system continuously adds a future month as the current month expires?",
        option_a: "Static Annual Budget",
        option_b: "Kaizen Budget",
        option_c: "Continuous (Rolling) Budget",
        option_d: "Capital Budget",
        correct_answer: "C",
        part: "Part 1",
        section: "Planning, Budgeting, and Forecasting"
    },
    {
        question_text: "In simple linear regression analysis (Y = a + bX), what does the coefficient of determination (R-squared) measure?",
        option_a: "The slope coefficient 'b' of the cost driver.",
        option_b: "The proportion of variance in the dependent variable explained by the independent variable.",
        option_c: "The exact fixed cost intercept 'a'.",
        option_d: "The standard error of the estimate.",
        correct_answer: "B",
        part: "Part 1",
        section: "Planning, Budgeting, and Forecasting"
    },
    {
        question_text: "An unfavorable direct materials price variance combined with a favorable direct materials quantity variance most likely indicates that the purchasing department bought:",
        option_a: "Higher-quality materials than standard, resulting in less scrap and production waste.",
        option_b: "Lower-quality materials than standard, resulting in faster machine processing.",
        option_c: "Excess quantity of raw materials at a volume discount.",
        option_d: "Substandard materials that caused direct labor idle time.",
        correct_answer: "A",
        part: "Part 1",
        section: "Performance Management"
    },
    {
        question_text: "Which type of responsibility center manager is evaluated on both segment revenues and controllable segment expenses, but NOT on capital asset investment decisions?",
        option_a: "Cost Center Manager",
        option_b: "Profit Center Manager",
        option_c: "Investment Center Manager",
        option_d: "Revenue Center Manager",
        correct_answer: "B",
        part: "Part 1",
        section: "Performance Management"
    },
    {
        question_text: "In a Balanced Scorecard framework, metrics such as employee retention, training hours per technician, and IT system uptime are categorized under which perspective?",
        option_a: "Financial Perspective",
        option_b: "Customer Perspective",
        option_c: "Internal Business Processes Perspective",
        option_d: "Learning and Growth Perspective",
        correct_answer: "D",
        part: "Part 1",
        section: "Performance Management"
    },
    {
        question_text: "Compared to traditional volume-based overhead allocation, Activity-Based Costing (ABC) typically leads to:",
        option_a: "Higher cost allocation to high-volume standard products.",
        option_b: "More accurate product costing by tracing indirect costs via multiple cost drivers.",
        option_c: "A reduction in total fixed selling and administrative expenses.",
        option_d: "The elimination of all indirect manufacturing overhead.",
        correct_answer: "B",
        part: "Part 1",
        section: "Cost Management"
    },
    {
        question_text: "In process costing under the weighted-average method, equivalent units of production (EUP) are calculated for:",
        option_a: "Units started during the period only.",
        option_b: "Units completed and transferred out plus work-in-process ending inventory.",
        option_c: "Beginning work-in-process inventory units only.",
        option_d: "Spoiled units minus normal loss units.",
        correct_answer: "B",
        part: "Part 1",
        section: "Cost Management"
    },
    {
        question_text: "According to the COSO Internal Control - Integrated Framework, which component forms the foundational tone and structure for all other internal control elements?",
        option_a: "Risk Assessment",
        option_b: "Control Environment",
        option_c: "Control Activities",
        option_d: "Monitoring Activities",
        correct_answer: "B",
        part: "Part 1",
        section: "Internal Controls"
    },
    {
        question_text: "To enforce proper Segregation of Duties (SoD) and mitigate fraud risk in cash management, which two functions MUST be separated?",
        option_a: "Authorization of payments and custody of checks.",
        option_b: "Strategic planning and marketing execution.",
        option_c: "Financial statement audit and tax planning.",
        option_d: "Customer service and billing inquiries.",
        correct_answer: "A",
        part: "Part 1",
        section: "Internal Controls"
    },
    {
        question_text: "Which of the following ratios measures a firm's ability to settle short-term obligations using only its most liquid assets (cash, marketable securities, and net receivables)?",
        option_a: "Current Ratio",
        option_b: "Quick (Acid-Test) Ratio",
        option_c: "Cash Flow Coverage Ratio",
        option_d: "Debt-to-Equity Ratio",
        correct_answer: "B",
        part: "Part 2",
        section: "Financial Statement Analysis"
    },
    {
        question_text: "Using the Capital Asset Pricing Model (CAPM), if the risk-free rate is 4%, beta is 1.25, and the expected market return is 12%, what is the expected cost of equity?",
        option_a: "10.0%",
        option_b: "14.0%",
        option_c: "15.0%",
        option_d: "16.5%",
        correct_answer: "B",
        part: "Part 2",
        section: "Corporate Finance"
    },
    {
        question_text: "In a Make-or-Buy relevant cost decision, which of the following should be EXCLUDED from the incremental decision analysis?",
        option_a: "Avoidable fixed manufacturing overhead.",
        option_b: "Sunk costs incurred in past machinery purchases.",
        option_c: "Opportunity cost of plant capacity.",
        option_d: "Direct material costs offered by outside suppliers.",
        correct_answer: "B",
        part: "Part 2",
        section: "Decision Analysis"
    },
    {
        question_text: "If a company has fixed costs of $120,000, a selling price of $60 per unit, and variable costs of $36 per unit, how many units must be sold to break even?",
        option_a: "3,000 units",
        option_b: "5,000 units",
        option_c: "6,000 units",
        option_d: "10,000 units",
        correct_answer: "B",
        part: "Part 2",
        section: "Decision Analysis"
    },
    {
        question_text: "An organization decides to purchase business interruption insurance to handle severe weather risk. Which risk response strategy does this represent under enterprise risk management (ERM)?",
        option_a: "Risk Avoidance",
        option_b: "Risk Sharing / Transfer",
        option_c: "Risk Reduction / Mitigation",
        option_d: "Risk Acceptance",
        correct_answer: "B",
        part: "Part 2",
        section: "Enterprise Risk Management"
    },
    {
        question_text: "If a capital investment proposal has a Net Present Value (NPV) of exactly $0, it indicates that the project:",
        option_a: "Generates zero cash flows over its operating life.",
        option_b: "Yields an Internal Rate of Return (IRR) equal to the required rate of return (hurdle rate).",
        option_c: "Should be rejected immediately by financial managers.",
        option_d: "Has an accounting rate of return equal to zero.",
        correct_answer: "B",
        part: "Part 2",
        section: "Investment Decisions"
    },
    {
        question_text: "According to the IMA Statement of Ethical Professional Practice, which of the following is NOT one of the four overarching ethical principles?",
        option_a: "Honesty",
        option_b: "Fairness",
        option_c: "Profitability",
        option_d: "Responsibility",
        correct_answer: "C",
        part: "Part 2",
        section: "Professional Ethics"
    }
];

export const fetchExamQuestions = async (count: number = 100) => {
    let sourceBank: any[] = [];

    // 1. Query Supabase for dynamic questions
    try {
        const { data: dbQuestions, error } = await supabase
            .from('mcq_questions')
            .select('*');

        if (!error && dbQuestions && dbQuestions.length > 0) {
            console.log(`[CoStudy Question Engine] Retrieved ${dbQuestions.length} questions from Supabase mcq_questions.`);
            sourceBank = dbQuestions.map((q, idx) => ({
                id: q.id || `db-q-${idx + 1}`,
                type: 'MCQ',
                question_text: q.question_text || q.question || `CMA Question ${idx + 1}`,
                option_a: q.option_a || (q.options ? q.options[0] : 'Option A'),
                option_b: q.option_b || (q.options ? q.options[1] : 'Option B'),
                option_c: q.option_c || (q.options ? q.options[2] : 'Option C'),
                option_d: q.option_d || (q.options ? q.options[3] : 'Option D'),
                correct_answer: q.correct_answer || (q.correct !== undefined ? String.fromCharCode(65 + q.correct) : 'A'),
                part: q.part || (idx % 2 === 0 ? "Part 1" : "Part 2"),
                section: q.section || "CMA Exam Standard"
            }));
        }
    } catch (e) {
        console.warn("[CoStudy Question Engine] Supabase query fallback initiated:", e);
    }

    // 2. Fallback to hardcoded authentic bank if DB empty
    if (sourceBank.length === 0) {
        sourceBank = AUTHENTIC_CMA_QUESTION_BANK;
    }

    // If source bank has enough or more questions than requested, shuffle and return count
    if (sourceBank.length >= count) {
        const shuffled = [...sourceBank].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }

    // 3. If requested count is greater than source bank (e.g., 100 mock exam questions needed but only 20 in DB),
    // parameterize and cycle through the source bank to generate exact count
    console.log(`[CoStudy Question Engine] Source bank has ${sourceBank.length} items. Expanding to requested ${count} exam questions...`);
    
    const questions: any[] = [];
    const bankLength = sourceBank.length;

    for (let i = 0; i < count; i++) {
        const base = sourceBank[i % bankLength];
        const cycle = Math.floor(i / bankLength);

        if (cycle === 0) {
            // Pass 1: exact authentic items
            questions.push({
                ...base,
                id: `${base.id || 'q'}-${i + 1}`
            });
        } else {
            // Subsequent passes: Parameterized scenario variations
            const companyNames = ["Apex Manufacturing", "Vanguard Industries", "Nexus Logistics", "GlobalTech Corp", "Horizon Capital", "Starlight Systems"];
            const comp = companyNames[(i + cycle) % companyNames.length];
            
            const text = base.question_text || '';
            if (text.includes("break even") || text.includes("fixed costs") || text.includes("selling price")) {
                const fixedCosts = 100000 + (i * 25000);
                const price = 50 + (i * 5);
                const variableCost = 30 + (i * 3);
                const cm = price - variableCost;
                const breakevenUnits = Math.round(fixedCosts / cm);

                questions.push({
                    id: `cma-var-${i + 1}`,
                    type: 'MCQ',
                    question_text: `SCENARIO (${comp}): Total fixed manufacturing overhead is $${fixedCosts.toLocaleString()}. Selling price per unit is $${price} and variable cost per unit is $${variableCost}. How many units must ${comp} sell to break even?`,
                    option_a: `${(breakevenUnits - 1000).toLocaleString()} units`,
                    option_b: `${breakevenUnits.toLocaleString()} units`,
                    option_c: `${(breakevenUnits + 1500).toLocaleString()} units`,
                    option_d: `${(breakevenUnits + 3000).toLocaleString()} units`,
                    correct_answer: "B",
                    part: base.part || "Part 2",
                    section: base.section || "Decision Analysis"
                });
            } else if (text.includes("CAPM") || text.includes("risk-free rate") || text.includes("beta")) {
                const rf = 3 + (i % 3);
                const beta = (1.1 + (i % 5) * 0.1).toFixed(2);
                const rm = 10 + (i % 4);
                const costEquity = (rf + parseFloat(beta) * (rm - rf)).toFixed(1);

                questions.push({
                    id: `cma-var-${i + 1}`,
                    type: 'MCQ',
                    question_text: `SCENARIO: An analyst at ${comp} evaluates a project. If risk-free rate is ${rf}%, beta is ${beta}, and expected market return is ${rm}%, what is the cost of equity under CAPM?`,
                    option_a: `${(parseFloat(costEquity) - 2.5).toFixed(1)}%`,
                    option_b: `${costEquity}%`,
                    option_c: `${(parseFloat(costEquity) + 2.0).toFixed(1)}%`,
                    option_d: `${(parseFloat(costEquity) + 4.1).toFixed(1)}%`,
                    correct_answer: "B",
                    part: base.part || "Part 2",
                    section: base.section || "Corporate Finance"
                });
            } else {
                questions.push({
                    id: `cma-var-${i + 1}`,
                    type: 'MCQ',
                    question_text: `CASE STUDY (${comp}): ${text}`,
                    option_a: base.option_a,
                    option_b: base.option_b,
                    option_c: base.option_c,
                    option_d: base.option_d,
                    correct_answer: base.correct_answer,
                    part: base.part || "Part 1",
                    section: base.section || "CMA Exam Standard"
                });
            }
        }
    }

    return questions;
};

// --- ESSAY QUESTION SERVICE ---
export const fetchEssayQuestions = async (count: number = 2) => {
    try {
        const { data, error } = await supabase
            .from('essay_questions')
            .select('*')
            .limit(count);

        if (!error && data && data.length > 0) {
            console.log(`[CoStudy Question Engine] Retrieved ${data.length} essay questions from Supabase essay_questions.`);
            return data.map((eq, idx) => ({
                id: eq.id || `essay-db-${idx + 1}`,
                type: 'ESSAY' as const,
                question_text: eq.question_text || `CMA Essay Question ${idx + 1}`,
                rubric_guidelines: eq.rubric_guidelines || '',
                part: eq.part || 'Part 1',
                section: eq.section || 'Essay Section',
                difficulty_level: eq.difficulty_level || 'Medium',
                option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
            }));
        }
    } catch (e) {
        console.warn("[CoStudy Question Engine] Supabase essay_questions query error, using fallback:", e);
    }

    // Fallback default ICMA CMA Essays
    return [
        {
            id: 'essay-1',
            type: 'ESSAY' as const,
            question_text: 'SCENARIO:\n\nOmega Corp is a US-based manufacturer considering expansion into the European market. The CFO is concerned about foreign currency exchange risk as the Euro has been volatile against the USD.\n\nREQUIRED:\n\n1. Identify and explain the three types of foreign currency risk exposure Omega Corp might face.\n\n2. Recommend a hedging strategy using financial derivatives to mitigate the transaction risk identified in part 1.',
            part: 'Part 1',
            section: 'Essay Section - Financial Risk',
            rubric_guidelines: 'Focus on transaction, translation, and economic exposure along with currency futures/options.',
            difficulty_level: 'Hard',
            option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
        },
        {
            id: 'essay-2',
            type: 'ESSAY' as const,
            question_text: 'SCENARIO:\n\nYou are the Controller of TechSolutions Inc. The company has traditionally used a volume-based costing system (direct labor hours) to allocate overhead. Recently, competitors have undercut TechSolutions prices on high-volume products while TechSolutions remains cheaper on low-volume specialty products.\n\nREQUIRED:\n\n1. Analyze why the current costing system might be distorting product costs.\n\n2. Explain how Activity-Based Costing (ABC) could provide more accurate cost information and assist in strategic pricing decisions.',
            part: 'Part 1',
            section: 'Essay Section - Cost Management',
            rubric_guidelines: 'Analyze volume distortion vs activity drivers under ABC.',
            difficulty_level: 'Medium',
            option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: ''
        }
    ].slice(0, count);
};

// --- ESSAY RESPONSES PERSISTENCE SERVICE ---
export interface SaveEssayResponsePayload {
    user_id?: string;
    question_id: string;
    response_text: string;
    submitted_at?: string;
}

export const saveEssayResponse = async (payload: SaveEssayResponsePayload) => {
    try {
        const userId = payload.user_id || 'anonymous_student';
        const submittedAt = payload.submitted_at || new Date().toISOString();

        const { data, error } = await supabase
            .from('essay_responses')
            .insert([
                {
                    user_id: userId,
                    question_id: payload.question_id,
                    response_text: payload.response_text,
                    submitted_at: submittedAt
                }
            ]);

        if (error) {
            console.warn('[CoStudy Engine] Supabase essay_responses save warning:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`[CoStudy Engine] Saved response for essay question: ${payload.question_id}`);
        return { success: true, data };
    } catch (err: any) {
        console.error('[CoStudy Engine] Exception saving essay response:', err);
        return { success: false, error: err.message || 'Unknown error' };
    }
};

export const saveBulkEssayResponses = async (
    responses: Array<{ question_id: string; response_text: string }>,
    userId: string = 'anonymous_student'
) => {
    if (!responses || responses.length === 0) return { success: true, data: [] };

    try {
        const submittedAt = new Date().toISOString();
        const records = responses.map(r => ({
            user_id: userId,
            question_id: r.question_id,
            response_text: r.response_text,
            submitted_at: submittedAt
        }));

        const { data, error } = await supabase
            .from('essay_responses')
            .insert(records);

        if (error) {
            console.warn('[CoStudy Engine] Supabase bulk essay_responses save warning:', error.message);
            return { success: false, error: error.message };
        }

        console.log(`[CoStudy Engine] Saved ${responses.length} essay responses in bulk.`);
        return { success: true, data };
    } catch (err: any) {
        console.error('[CoStudy Engine] Exception saving bulk essay responses:', err);
        return { success: false, error: err.message || 'Unknown error' };
    }
};
