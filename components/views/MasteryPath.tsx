import React, { useState, useEffect } from 'react';
import { costudyService } from '../../services/costudyService';
import { supabase } from '../../services/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  TrendingUp, 
  BarChart2, 
  Calculator, 
  ShieldCheck, 
  Database, 
  Percent, 
  Coins, 
  Layers, 
  FileText, 
  Sparkles, 
  Lock, 
  Check, 
  ChevronRight, 
  Award, 
  Trophy, 
  Compass, 
  Play, 
  Flame, 
  BookMarked,
  Info,
  RotateCcw
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Module {
  id: string;
  title: string;
  subtitle: string;
  part: 1 | 2;
  weight: string;
  difficulty: 'Starter' | 'Learner' | 'Scholar' | 'Expert';
  description: string;
  topics: string[];
  estHours: number;
  icon: string;
  questions: Question[];
}

const CMA_MODULES: Module[] = [
  // PART 1
  {
    id: 'p1-a',
    title: 'External Financial Reporting Decisions',
    subtitle: 'Part 1 • Section A',
    part: 1,
    weight: '15%',
    difficulty: 'Learner',
    description: 'Master the preparation and analysis of financial statements. Gain a rigorous understanding of asset valuation, liability measurement, equity presentation, and crucial US GAAP & IFRS disclosure standards.',
    topics: ['Balance Sheet & Income Statement', 'Statement of Cash Flows', 'Revenue Recognition Standards', 'Asset & Liability Valuation'],
    estHours: 25,
    icon: 'BookOpen',
    questions: [
      {
        id: 'p1-a-q1',
        question: 'Which of the following is classified as a contra-asset account under US GAAP?',
        options: [
          'Accumulated Depreciation',
          'Accounts Payable',
          'Prepaid Expenses',
          'Retained Earnings'
        ],
        correct: 0,
        explanation: 'Accumulated Depreciation is a contra-asset account that offsets the carrying value of property, plant, and equipment on the balance sheet.'
      },
      {
        id: 'p1-a-q2',
        question: 'Under US GAAP, which of the following is correct regarding the presentation of cash flows from operating activities?',
        options: [
          'Interest paid must be classified as a financing activity.',
          'Interest received can be classified as either operating or investing.',
          'Both interest paid and interest received are classified as operating cash flows.',
          'Dividends paid must be classified as an operating activity.'
        ],
        correct: 2,
        explanation: 'Under US GAAP, cash flows from interest received and interest paid are categorized as operating cash flows, whereas dividends paid are financing cash flows.'
      },
      {
        id: 'p1-a-q3',
        question: 'Under ASC 606, what is the third step in the five-step model for revenue recognition?',
        options: [
          'Identify the performance obligations in the contract.',
          'Determine the transaction price.',
          'Allocate the transaction price to performance obligations.',
          'Recognize revenue when the entity satisfies a performance obligation.'
        ],
        correct: 1,
        explanation: 'The five steps are: (1) Identify the contract, (2) Identify the performance obligations, (3) Determine the transaction price, (4) Allocate the transaction price, (5) Recognize revenue.'
      }
    ]
  },
  {
    id: 'p1-b',
    title: 'Planning, Budgeting, and Forecasting',
    subtitle: 'Part 1 • Section B',
    part: 1,
    weight: '20%',
    difficulty: 'Scholar',
    description: 'Learn strategic planning methodologies, budgeting processes, and mathematical forecasting models to project future organizational performance.',
    topics: ['Strategic Planning & Analysis', 'Master Budget Formulation', 'Rolling Budgets & Zero-Based Budgeting', 'Forecasting & Regression Techniques'],
    estHours: 35,
    icon: 'TrendingUp',
    questions: [
      {
        id: 'p1-b-q1',
        question: 'Which of the following budgeting methods is most likely to encourage accountability and prevent budget slack by starting from zero each period?',
        options: [
          'Incremental Budgeting',
          'Zero-Based Budgeting (ZBB)',
          'Activity-Based Budgeting',
          'Rolling Forecasts'
        ],
        correct: 1,
        explanation: 'Zero-Based Budgeting (ZBB) requires managers to justify all expenses from scratch for each new period, helping eliminate built-in slack and historic inefficiencies.'
      },
      {
        id: 'p1-b-q2',
        question: 'If a company has a highly seasonal sales pattern, which budgeting tool would be most effective for adjusting forecasts continuously throughout the fiscal year?',
        options: [
          'Static Budget',
          'Kaizen Budget',
          'Continuous (Rolling) Budget',
          'Flexible Budget'
        ],
        correct: 2,
        explanation: 'A continuous or rolling budget is updated periodically (e.g., monthly) by adding a new segment at the end as the current segment expires, keeping projections current.'
      },
      {
        id: 'p1-b-q3',
        question: 'In regression analysis, what does the coefficient of determination (R-squared) measure?',
        options: [
          'The slope of the regression line.',
          'The proportion of variance in the dependent variable that is predictable from the independent variable.',
          'The exact cost driver multiplier.',
          'The level of internal control compliance.'
        ],
        correct: 1,
        explanation: 'R-squared (R²) measures the goodness-of-fit, or the percentage of variation in the dependent variable explained by the independent variable(s).'
      }
    ]
  },
  {
    id: 'p1-c',
    title: 'Performance Management',
    subtitle: 'Part 1 • Section C',
    part: 1,
    weight: '20%',
    difficulty: 'Expert',
    description: 'Master standard costing systems, variance analysis (materials, labor, overhead), responsibility accounting, and strategic performance scorecards.',
    topics: ['Flexible Budgets & Variance Analysis', 'Standard Costing Systems', 'Responsibility Centers & Segments', 'Balanced Scorecard Frameworks'],
    estHours: 30,
    icon: 'BarChart2',
    questions: [
      {
        id: 'p1-c-q1',
        question: 'An unfavorable materials price variance combined with a favorable materials quantity variance most likely suggests that:',
        options: [
          'Higher-quality materials were purchased, leading to less production waste.',
          'Lower-quality materials were purchased, leading to higher efficiency.',
          'Direct labor was inefficient in handling materials.',
          'The purchasing manager bought too little raw material.'
        ],
        correct: 0,
        explanation: 'A higher price paid (unfavorable price variance) often implies higher quality materials, which typically results in less scrap, breakage, or waste (favorable quantity variance).'
      },
      {
        id: 'p1-c-q2',
        question: 'Which responsibility center manager is typically accountable for both segment revenues and expenses, but NOT for capital investment decisions?',
        options: [
          'Cost Center Manager',
          'Revenue Center Manager',
          'Profit Center Manager',
          'Investment Center Manager'
        ],
        correct: 2,
        explanation: 'A Profit Center manager is responsible for both inputs (costs) and outputs (revenues), but lacks control over the capital funds invested in the segment.'
      },
      {
        id: 'p1-c-q3',
        question: 'In a Balanced Scorecard, which perspective would track metrics like employee turnover rate, training hours, and system availability?',
        options: [
          'Financial Perspective',
          'Customer Perspective',
          'Internal Business Processes',
          'Learning and Growth Perspective'
        ],
        correct: 3,
        explanation: 'The Learning and Growth perspective focuses on human capital, infrastructure, and organizational culture needed to support strategic targets.'
      }
    ]
  },
  {
    id: 'p1-d',
    title: 'Cost Management',
    subtitle: 'Part 1 • Section D',
    part: 1,
    weight: '15%',
    difficulty: 'Scholar',
    description: 'Understand cost classification, flow of costs, allocation methods, Activity-Based Costing (ABC), and operational efficiency theories (TOC, Lean).',
    topics: ['Job Order vs. Process Costing', 'Activity-Based Costing (ABC)', 'Joint and By-Product Cost Allocation', 'Theory of Constraints (TOC)'],
    estHours: 25,
    icon: 'Calculator',
    questions: [
      {
        id: 'p1-d-q1',
        question: 'Compared to traditional volume-based costing systems, Activity-Based Costing (ABC) typically leads to:',
        options: [
          'Over-costing low-volume specialty products.',
          'Under-costing low-volume specialty products in traditional systems being corrected.',
          'Equal cost distribution across all departments.',
          'Higher total manufacturing overhead for the entire firm.'
        ],
        correct: 1,
        explanation: 'Traditional costing under-costs low-volume, complex products because it relies on volume drivers (like direct labor hours). ABC allocates overhead based on actual activity consumption, rectifying this distortion.'
      },
      {
        id: 'p1-d-q2',
        question: 'In process costing, when are equivalent units of production (EUP) calculated?',
        options: [
          'Only when all materials are added at the end of the process.',
          'To measure the work done on partially completed units in ending work-in-process inventory.',
          'To reconcile actual sales with budgeted production.',
          'Only under the LIFO inventory valuation method.'
        ],
        correct: 1,
        explanation: 'Equivalent units represent the number of fully completed units that could have been produced given the amount of work actually performed on partially finished goods.'
      },
      {
        id: 'p1-d-q3',
        question: 'The primary focus of the Theory of Constraints (TOC) is to:',
        options: [
          'Maximize total direct labor hours.',
          'Maximize throughput by identifying and optimizing the organizational bottleneck.',
          'Eliminate direct materials costs entirely.',
          'Allocate corporate overhead using multiple cost pools.'
        ],
        correct: 1,
        explanation: 'TOC asserts that every business process has a bottleneck (constraint) that limits overall capacity, and management should focus on improving that specific point.'
      }
    ]
  },
  {
    id: 'p1-e',
    title: 'Internal Controls',
    subtitle: 'Part 1 • Section E',
    part: 1,
    weight: '15%',
    difficulty: 'Expert',
    description: 'Establish secure organizational controls. Understand COSO internal control framework, risk management, segregation of duties, and audit compliance.',
    topics: ['COSO Internal Control Framework', 'Segregation of Duties (SoD)', 'System Security & IT General Controls', 'Internal Audit Role & Sarbanes-Oxley'],
    estHours: 20,
    icon: 'ShieldCheck',
    questions: [
      {
        id: 'p1-e-q1',
        question: 'According to the COSO Internal Control Framework, which component serves as the foundation for all other internal control elements?',
        options: [
          'Risk Assessment',
          'Control Activities',
          'Control Environment',
          'Information and Communication'
        ],
        correct: 2,
        explanation: 'The Control Environment sets the tone of the organization, influencing control consciousness, and is the essential foundation for all other components.'
      },
      {
        id: 'p1-e-q2',
        question: 'To maintain proper Segregation of Duties, which of the following functions should ideally be separated?',
        options: [
          'Authorization, Recording, and Custody of Assets.',
          'Planning, Budgeting, and Forecasting.',
          'Marketing, Sales, and Shipping.',
          'Purchasing, Accounts Payable, and Direct Labor.'
        ],
        correct: 0,
        explanation: 'The classic Segregation of Duties rule mandates separating the Authorization of transactions, the Recording of transactions, and the Custody of related assets.'
      },
      {
        id: 'p1-e-q3',
        question: 'Section 404 of the Sarbanes-Oxley Act (SOX) requires public companies to:',
        options: [
          'File tax returns on a quarterly basis.',
          'Submit a report on management’s assessment of internal controls over financial reporting.',
          'Establish a mandatory ethics training for all operational staff.',
          'Use an activity-based costing system for all product inventory.'
        ],
        correct: 1,
        explanation: 'SOX Section 404 requires annual assessment and reporting by management (and independent auditors) on the effectiveness of internal control over financial reporting.'
      }
    ]
  },
  {
    id: 'p1-f',
    title: 'Technology and Analytics',
    subtitle: 'Part 1 • Section F',
    part: 1,
    weight: '15%',
    difficulty: 'Learner',
    description: 'Master the tech-driven future of management accounting. Cover enterprise systems, data governance, analytics, and business intelligence techniques.',
    topics: ['Enterprise Resource Planning (ERP)', 'Data Life Cycle & Governance', 'Data Visualization & BI Tools', 'Accounting Information Systems'],
    estHours: 15,
    icon: 'Database',
    questions: [
      {
        id: 'p1-f-q1',
        question: 'Which of the following describes structured data as used in accounting information systems?',
        options: [
          'Unformatted customer feedback emails.',
          'Data residing in highly defined, fixed fields in relational databases (e.g., GL transactions).',
          'Scanned paper purchase invoices.',
          'Audio transcripts of earnings calls.'
        ],
        correct: 1,
        explanation: 'Structured data is highly organized, formatted, and easily searchable in relational databases, making it standard for financial records.'
      },
      {
        id: 'p1-f-q2',
        question: 'What is the primary benefit of implementing an integrated Enterprise Resource Planning (ERP) system?',
        options: [
          'It eliminates the need for any internal control activities.',
          'It provides a single, centralized database that synchronizes data across all corporate functions.',
          'It guarantees a profit increase of at least 10%.',
          'It replaces the board of directors.'
        ],
        correct: 1,
        explanation: 'An ERP consolidates data and business processes across departments (Finance, HR, Sales, Inventory) into a unified, single source of truth.'
      },
      {
        id: 'p1-f-q3',
        question: 'In business intelligence, what is the process of extracting, transforming, and loading (ETL) data designed to do?',
        options: [
          'Reconcile bank accounts automatically.',
          'Format and clean raw data from source systems to prepare it for analysis.',
          'Enforce strict physical security controls.',
          'Authorize vendor payment disbursements.'
        ],
        correct: 1,
        explanation: 'ETL is the core data preparation flow: extracting from raw sources, transforming/cleaning, and loading into a data warehouse for visualization.'
      }
    ]
  },

  // PART 2
  {
    id: 'p2-a',
    title: 'Financial Statement Analysis',
    subtitle: 'Part 2 • Section A',
    part: 2,
    weight: '20%',
    difficulty: 'Scholar',
    description: 'Learn how to perform vertical, horizontal, and ratio analysis. Assess company liquidity, solvency, leverage, profitability, and overall market value.',
    topics: ['Liquidity & Solvency Ratios', 'Profitability & Leverage Analysis', 'Vertical & Horizontal Percentage Analysis', 'Earnings Quality & Distortions'],
    estHours: 25,
    icon: 'Percent',
    questions: [
      {
        id: 'p2-a-q1',
        question: 'Which of the following ratios evaluates a firm’s capacity to meet short-term obligations using only cash, marketable securities, and receivables?',
        options: [
          'Current Ratio',
          'Quick (Acid-Test) Ratio',
          'Debt-to-Equity Ratio',
          'Asset Turnover Ratio'
        ],
        correct: 1,
        explanation: 'The Quick Ratio excludes inventory and prepaid expenses from current assets, focusing solely on highly liquid assets to meet current liabilities.'
      },
      {
        id: 'p2-a-q2',
        question: 'A high degree of operating leverage (DOL) indicates that a firm has:',
        options: [
          'High debt compared to equity.',
          'High fixed costs relative to variable costs, making profits highly sensitive to sales changes.',
          'High inventory turnover compared to industry averages.',
          'Low gross profit margins.'
        ],
        correct: 1,
        explanation: 'Operating leverage measures the ratio of fixed to variable costs. A high DOL means small percentage changes in sales produce larger percentage changes in operating income.'
      }
    ]
  },
  {
    id: 'p2-b',
    title: 'Corporate Finance',
    subtitle: 'Part 2 • Section B',
    part: 2,
    weight: '20%',
    difficulty: 'Expert',
    description: 'Understand financial risk and return, cost of capital (WACC), capital structure, managing working capital, and raising long-term funds.',
    topics: ['Capital Asset Pricing Model (CAPM)', 'Weighted Average Cost of Capital (WACC)', 'Working Capital & Treasury Management', 'Capital Structure & Leverage Theories'],
    estHours: 30,
    icon: 'Coins',
    questions: [
      {
        id: 'p2-b-q1',
        question: 'Using the CAPM formula, if the risk-free rate is 4%, beta is 1.2, and the expected market return is 10%, what is the cost of equity?',
        options: [
          '11.2%',
          '12.0%',
          '14.8%',
          '16.0%'
        ],
        correct: 0,
        explanation: 'Cost of Equity = Rf + Beta * (Rm - Rf) = 4% + 1.2 * (10% - 4%) = 4% + 7.2% = 11.2%.'
      },
      {
        id: 'p2-b-q2',
        question: 'Why is debt financing generally cheaper than equity financing for a profitable corporation?',
        options: [
          'Debt has higher risks than equity.',
          'Interest payments are tax-deductible, creating a tax shield, and lenders have priority claims.',
          'Debt does not require repayment of principal.',
          'Dividends are legally required to be paid.'
        ],
        correct: 1,
        explanation: 'The tax-deductibility of interest expense reduces the effective cost of debt. Lenders also have senior claims over equity holders, lowering their required rate of return.'
      }
    ]
  },
  {
    id: 'p2-c',
    title: 'Decision Analysis',
    subtitle: 'Part 2 • Section C',
    part: 2,
    weight: '25%',
    difficulty: 'Expert',
    description: 'Master Cost-Volume-Profit (CVP) analysis, contribution margins, break-even calculations, and relevant cost analysis for tactical business decisions.',
    topics: ['Break-Even & CVP Analysis', 'Relevant Costing & Special Orders', 'Pricing Methodologies & Elasticity', 'Make vs. Buy Tactical Decisions'],
    estHours: 35,
    icon: 'Layers',
    questions: [
      {
        id: 'p2-c-q1',
        question: 'In a Make-or-Buy decision, which of the following is considered a relevant quantitative cost?',
        options: [
          'Sunk costs incurred last year.',
          'Avoidable fixed costs if the item is purchased externally.',
          'Unavoidable administrative allocations.',
          'Historic depreciation of existing machinery.'
        ],
        correct: 1,
        explanation: 'Relevant costs are future costs that differ between alternatives. Avoidable costs will be eliminated if the product is bought, making them highly relevant.'
      },
      {
        id: 'p2-c-q2',
        question: 'If a product’s sales price is $50, variable costs are $30, and total fixed costs are $100,000, how many units must be sold to break even?',
        options: [
          '2,000 units',
          '3,333 units',
          '5,000 units',
          '10,000 units'
        ],
        correct: 2,
        explanation: 'Break-even units = Fixed Costs / Contribution Margin per unit = $100,000 / ($50 - $30) = 5,000 units.'
      }
    ]
  },
  {
    id: 'p2-d',
    title: 'Risk Management',
    subtitle: 'Part 2 • Section D',
    part: 2,
    weight: '10%',
    difficulty: 'Scholar',
    description: 'Identify, assess, and mitigate corporate risks using modern Enterprise Risk Management (ERM) frameworks (COSO ERM).',
    topics: ['Enterprise Risk Management (ERM)', 'Risk Identification & Quantification', 'Risk Responses (Avoid, Share, Reduce)', 'Business Continuity & Disaster Planning'],
    estHours: 15,
    icon: 'ShieldCheck',
    questions: [
      {
        id: 'p2-d-q1',
        question: 'If an organization decides to purchase business interruption insurance, what risk response strategy are they employing?',
        options: [
          'Risk Avoidance',
          'Risk Reduction',
          'Risk Sharing (Transfer)',
          'Risk Acceptance'
        ],
        correct: 2,
        explanation: 'Purchasing insurance transfers or shares the financial consequences of risk with an external third-party insurer.'
      }
    ]
  },
  {
    id: 'p2-e',
    title: 'Investment Decisions',
    subtitle: 'Part 2 • Section E',
    part: 2,
    weight: '10%',
    difficulty: 'Expert',
    description: 'Evaluate capital investments using discounted cash flow models, Net Present Value (NPV), Internal Rate of Return (IRR), and Payback periods.',
    topics: ['Net Present Value (NPV) Analysis', 'Internal Rate of Return (IRR)', 'Payback & Discounted Payback', 'Inflation & Risk Adjustments'],
    estHours: 20,
    icon: 'Coins',
    questions: [
      {
        id: 'p2-e-q1',
        question: 'If an investment project has an NPV of exactly $0, it indicates that the project:',
        options: [
          'Is generating zero cash flows.',
          'Should definitely be rejected.',
          'Earns a rate of return exactly equal to the discount rate.',
          'Has a payback period of one year.'
        ],
        correct: 2,
        explanation: 'An NPV of $0 means the present value of cash inflows matches the outflows, meaning the project earns exactly the hurdle rate (discount rate).'
      }
    ]
  },
  {
    id: 'p2-f',
    title: 'Professional Ethics',
    subtitle: 'Part 2 • Section F',
    part: 2,
    weight: '15%',
    difficulty: 'Learner',
    description: 'Uphold the highest standard of professional integrity. Study the IMA Statement of Ethical Professional Practice and global compliance standards.',
    topics: ['IMA Ethical Standards (Competence, Confidentiality, Integrity, Credibility)', 'Resolving Ethical Conflicts', 'Corporate Fraud & Professional Skepticism'],
    estHours: 15,
    icon: 'FileText',
    questions: [
      {
        id: 'p2-f-q1',
        question: 'Which of the following is NOT one of the four overarching ethical principles in the IMA Statement of Ethical Professional Practice?',
        options: [
          'Honesty',
          'Fairness',
          'Competence',
          'Objectivity'
        ],
        correct: 2,
        explanation: 'The four general principles are Honesty, Fairness, Objectivity, and Responsibility. Competence, Confidentiality, Integrity, and Credibility are the four standard pillars.'
      }
    ]
  }
];

const DIFFICULTY_COLORS = {
  Starter: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Learner: 'bg-blue-100 text-blue-800 border-blue-200',
  Scholar: 'bg-amber-100 text-amber-800 border-amber-200',
  Expert: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const MasteryPath: React.FC = () => {
  const [activePart, setActivePart] = useState<1 | 2>(1);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  // Quiz practice states
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Load completed modules from Supabase & localStorage on mount
  useEffect(() => {
    const loadProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const dbProgress = await costudyService.getUserProgress(user.id);
        if (dbProgress && dbProgress.length > 0) {
          setCompletedModules(dbProgress);
          localStorage.setItem('cs_mastered_modules', JSON.stringify(dbProgress));
          return;
        }
      }
      const saved = localStorage.getItem('cs_mastered_modules');
      if (saved) {
        try {
          setCompletedModules(JSON.parse(saved));
        } catch (e) {
          setCompletedModules(['p1-a']);
        }
      } else {
        const initial = ['p1-a'];
        setCompletedModules(initial);
        localStorage.setItem('cs_mastered_modules', JSON.stringify(initial));
      }
    };
    loadProgress();
  }, []);

  const handleToggleModuleComplete = async (moduleId: string) => {
    let updated: string[];
    if (completedModules.includes(moduleId)) {
      updated = completedModules.filter(id => id !== moduleId);
    } else {
      updated = [...completedModules, moduleId];
    }
    setCompletedModules(updated);
    localStorage.setItem('cs_mastered_modules', JSON.stringify(updated));

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await costudyService.saveUserProgress(user.id, updated);
    }
    
    // Add custom credit reward if completed
    if (!completedModules.includes(moduleId)) {
      const sessionStr = localStorage.getItem('cs_auth_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session?.user?.id) {
            const profilesStr = localStorage.getItem('cs_user_profiles');
            if (profilesStr) {
              const profiles = JSON.parse(profilesStr);
              const idx = profiles.findIndex((p: any) => p.id === session.user.id);
              if (idx !== -1) {
                profiles[idx].reputation = profiles[idx].reputation || { studyScore: { total: 0 } };
                profiles[idx].reputation.studyScore.total += 100;
                localStorage.setItem('cs_user_profiles', JSON.stringify(profiles));
              }
            }
          }
        } catch (err) {}
      }
    }
  };

  const activeModules = CMA_MODULES.filter(m => m.part === activePart);
  
  // Path Coordinates for Bezier line drawing
  // Creating a nice zig-zag timeline alignment
  const getNodeCoordinates = (index: number) => {
    // We alternate X coordinate values for zig zag visual effect
    const x = index % 2 === 0 ? 30 : 70; // % distance
    const total = activeModules.length;
    // Spread evenly between 10% and 90% of container height
    const y = total > 1 ? (index / (total - 1)) * 80 + 10 : 50; 
    return { x, y };
  };

  // Build SVG Path between modules
  const generateSvgPath = () => {
    let d = '';
    activeModules.forEach((mod, idx) => {
      const { x, y } = getNodeCoordinates(idx);
      if (idx === 0) {
        d += `M ${x} ${y}`;
      } else {
        const prev = getNodeCoordinates(idx - 1);
        // Beautiful curve using control points
        const controlY = (prev.y + y) / 2;
        d += ` C ${prev.x} ${controlY}, ${x} ${controlY}, ${x} ${y}`;
      }
    });
    return d;
  };

  const getModuleStatus = (module: Module) => {
    if (completedModules.includes(module.id)) return 'completed';
    
    // Find previous module index in active part
    const partModules = CMA_MODULES.filter(m => m.part === module.part);
    const mIdx = partModules.findIndex(m => m.id === module.id);
    
    if (mIdx === 0) return 'active'; // first module is unlocked by default
    
    // Unlocked if previous is completed
    const prevMod = partModules[mIdx - 1];
    if (completedModules.includes(prevMod.id)) return 'active';
    
    return 'locked';
  };

  const startQuiz = (module: Module) => {
    setSelectedModule(module);
    setQuizActive(true);
    setCurrentQuizIdx(0);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setCorrectCount(0);
    setQuizFinished(false);
  };

  const handleSelectOption = (optIdx: number) => {
    if (answerSubmitted) return;
    setSelectedAnswer(optIdx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !selectedModule) return;
    setAnswerSubmitted(true);
    const currentQ = selectedModule.questions[currentQuizIdx];
    if (selectedAnswer === currentQ.correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (!selectedModule) return;
    if (currentQuizIdx < selectedModule.questions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
      // Automatically mark as completed if passed (all correct or majority)
      const passed = correctCount + (selectedAnswer === selectedModule.questions[currentQuizIdx].correct ? 1 : 0) >= selectedModule.questions.length - 1;
      if (passed && !completedModules.includes(selectedModule.id)) {
        handleToggleModuleComplete(selectedModule.id);
      }
    }
  };

  // Overall Statistics
  const totalCompleted = completedModules.length;
  const progressPercent = Math.round((totalCompleted / CMA_MODULES.length) * 100);
  const studyHoursCompleted = CMA_MODULES.filter(m => completedModules.includes(m.id)).reduce((acc, curr) => acc + curr.estHours, 0);
  const totalHours = CMA_MODULES.reduce((acc, curr) => acc + curr.estHours, 0);

  const renderModuleIcon = (iconStr: string, sizeClass = 'w-6 h-6') => {
    switch (iconStr) {
      case 'BookOpen': return <BookOpen className={sizeClass} />;
      case 'TrendingUp': return <TrendingUp className={sizeClass} />;
      case 'BarChart2': return <BarChart2 className={sizeClass} />;
      case 'Calculator': return <Calculator className={sizeClass} />;
      case 'ShieldCheck': return <ShieldCheck className={sizeClass} />;
      case 'Database': return <Database className={sizeClass} />;
      case 'Percent': return <Percent className={sizeClass} />;
      case 'Coins': return <Coins className={sizeClass} />;
      case 'Layers': return <Layers className={sizeClass} />;
      case 'FileText': return <FileText className={sizeClass} />;
      default: return <BookMarked className={sizeClass} />;
    }
  };

  return (
    <div id="cma-mastery-path-view" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. HEADER HERO SECTION */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Compass className="w-48 h-48 animate-spin" style={{ animationDuration: '40s' }} />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-brand text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">Mastery System</span>
              <span className="text-xs text-slate-300 font-bold">Interactive Syllabus & Study Roadmap</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">CMA Mastery Path</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mt-2 font-medium">
              Click through the comprehensive IMA syllabus sections, test out of modules via instant drills, and track your syllabus completion on your voyage to pass the CMA exams.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Progress</div>
              <div className="text-xl sm:text-2xl font-black text-brand mt-1">{progressPercent}%</div>
              <div className="text-[9px] text-slate-300 font-medium">{totalCompleted}/{CMA_MODULES.length} Sections</div>
            </div>
            <div className="text-center px-2 border-x border-white/10">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Hours Tracked</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{studyHoursCompleted}h</div>
              <div className="text-[9px] text-slate-300 font-medium">of {totalHours}h</div>
            </div>
            <div className="text-center px-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rep Score</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">+{totalCompleted * 100}</div>
              <div className="text-[9px] text-slate-300 font-medium">Bonus Earned</div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex justify-between text-xs text-slate-400 font-bold mb-2 uppercase tracking-wider">
            <span>Overall Path Completion</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-brand rounded-full" 
            />
          </div>
        </div>
      </div>

      {/* 2. TAB PART SELECTOR */}
      <div className="flex gap-4 mb-10 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-md mx-auto">
        <button 
          onClick={() => setActivePart(1)}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activePart === 1 ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Part 1: Planning & Analytics
        </button>
        <button 
          onClick={() => setActivePart(2)}
          className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activePart === 2 ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Part 2: Strategic Management
        </button>
      </div>

      {/* 3. ROADMAP / SYLLABUS PATH VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle: SVG Curved Visual Pathway */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col min-h-[800px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Interactive Pathway Map</h2>
            <span className="text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">Zig-Zag Scroll Trail</span>
          </div>

          <div className="relative flex-1 min-h-[750px] overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50/50 to-white py-12">
            
            {/* SVG Connector Lines */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="glowingCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-brand-400)" />
                  <stop offset="100%" stopColor="var(--color-brand-600)" />
                </linearGradient>
                <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Path representation */}
              <motion.path 
                d={generateSvgPath()}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="4"
                strokeDasharray="8 6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
              />
              <motion.path 
                d={generateSvgPath()}
                fill="none"
                stroke="url(#glowingCompleted)"
                strokeWidth="5"
                filter="url(#glow)"
                className="opacity-80"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: completedModules.length / CMA_MODULES.length 
                }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </svg>

            {/* Path Nodes / Modules */}
            <div className="relative h-full w-full">
              {activeModules.map((module, idx) => {
                const { x, y } = getNodeCoordinates(idx);
                const status = getModuleStatus(module);
                const isSelected = selectedModule?.id === module.id;

                return (
                  <div 
                    key={module.id} 
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    onClick={() => setSelectedModule(module)}
                  >
                    <div className="relative group flex flex-col items-center">
                      
                      {/* Active Pulse rings */}
                      {status === 'active' && (
                        <div className="absolute -inset-4 rounded-full bg-brand/20 animate-ping opacity-75 pointer-events-none" />
                      )}

                      {/* Main Node button */}
                      <button
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 shadow-lg transition-all ${
                          status === 'completed'
                            ? 'bg-gradient-to-br from-brand-500 to-brand-700 border-white text-white scale-110 shadow-brand/40'
                            : status === 'active'
                            ? 'bg-white border-brand text-brand hover:bg-slate-50'
                            : 'bg-slate-200 border-slate-300 text-slate-400'
                        } ${isSelected ? 'ring-4 ring-offset-2 ring-slate-800' : ''}`}
                      >
                        {status === 'completed' ? (
                          <Check className="w-6 h-6 stroke-[3px]" />
                        ) : status === 'locked' ? (
                          <Lock className="w-5 h-5 opacity-75" />
                        ) : (
                          renderModuleIcon(module.icon)
                        )}
                      </button>

                      {/* Quick Hover/Visual label */}
                      <div className="mt-3 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider shadow-md text-center max-w-[150px] truncate whitespace-nowrap">
                        {module.subtitle.split('•')[1].trim()}
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold text-center mt-0.5 w-[140px] truncate">
                        {module.title}
                      </div>

                      {/* Weight Badge overlay */}
                      <div className="absolute -top-1 -right-1 bg-slate-950 text-[8px] font-extrabold text-white px-1.5 py-0.5 rounded-full border border-slate-800">
                        {module.weight}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Sidebar module detail inspector & practice cards */}
        <div className="lg:col-span-1 space-y-6">
          <AnimatePresence mode="wait">
            {!selectedModule ? (
              <motion.div 
                key="empty-detail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm flex flex-col justify-center items-center py-20"
              >
                <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">
                  <Compass className="w-12 h-12 text-slate-300 animate-pulse" />
                </div>
                <h3 className="text-base font-black uppercase text-slate-700 tracking-tight mb-2">Select a Section Node</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                  Click on any milestone module bubble on the pathway to reveal study topics, weight metrics, estimated completion time, and access interactive practice quizzes.
                </p>
                
                <div className="mt-8 pt-6 border-t border-slate-100 w-full text-left space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Path Legend</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-brand border-2 border-white shadow flex items-center justify-center text-white"><Check className="w-3 h-3" /></span>
                      <span className="text-xs font-semibold text-slate-600">Completed & Mastered</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-white border-2 border-brand shadow flex items-center justify-center text-brand animate-pulse"><Play className="w-2.5 h-2.5 fill-current" /></span>
                      <span className="text-xs font-semibold text-slate-600">Active & Unlocked</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400"><Lock className="w-3 h-3" /></span>
                      <span className="text-xs font-semibold text-slate-600">Prerequisite Locked</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedModule.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md relative overflow-hidden"
              >
                {/* Module Highlight header */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{selectedModule.subtitle}</span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{selectedModule.title}</h3>
                  </div>
                  <div className="p-3 bg-brand-50 rounded-2xl text-brand border border-brand-100 shrink-0">
                    {renderModuleIcon(selectedModule.icon, 'w-6 h-6')}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-md border ${DIFFICULTY_COLORS[selectedModule.difficulty]}`}>
                    {selectedModule.difficulty}
                  </span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md uppercase">
                    Exam Weight: {selectedModule.weight}
                  </span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md uppercase">
                    Est. {selectedModule.estHours} Hours
                  </span>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed mb-5 font-medium border-b border-slate-50 pb-4">
                  {selectedModule.description}
                </p>

                {/* Sub topics checklist */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Key Exam Topics</h4>
                  <div className="space-y-2">
                    {selectedModule.topics.map((topic, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <BookMarked className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* INTERACTIVE COMPONENT: Practice Drill / Complete Toggle */}
                {!quizActive ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => startQuiz(selectedModule)}
                      className="w-full py-4.5 bg-brand text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Start Quick MCQ Practice
                    </button>

                    <button
                      onClick={() => handleToggleModuleComplete(selectedModule.id)}
                      className={`w-full py-3.5 border rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        completedModules.includes(selectedModule.id)
                          ? 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {completedModules.includes(selectedModule.id) ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Mark Section Incomplete
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Mark Section Mastered (+100)
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[9px] font-black uppercase text-brand tracking-widest">Interactive MCQ Drill</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Q: {currentQuizIdx + 1} / {selectedModule.questions.length}
                      </span>
                    </div>

                    {!quizFinished ? (
                      <div>
                        {/* Question Text */}
                        <div className="text-xs font-bold text-slate-800 leading-relaxed mb-4 bg-white p-3 rounded-xl border border-slate-100">
                          {selectedModule.questions[currentQuizIdx].question}
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {selectedModule.questions[currentQuizIdx].options.map((opt, i) => {
                            const isSelected = selectedAnswer === i;
                            const isCorrect = i === selectedModule.questions[currentQuizIdx].correct;
                            
                            let optStyle = 'border-slate-200 bg-white hover:border-slate-300 text-slate-700';
                            if (answerSubmitted) {
                              if (isCorrect) optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                              else if (isSelected) optStyle = 'border-rose-500 bg-rose-50 text-rose-800';
                              else optStyle = 'border-slate-200 bg-slate-100 opacity-60 text-slate-500';
                            } else if (isSelected) {
                              optStyle = 'border-brand bg-brand/5 text-brand font-bold';
                            }

                            return (
                              <button
                                key={i}
                                disabled={answerSubmitted}
                                onClick={() => handleSelectOption(i)}
                                className={`w-full text-left p-3 rounded-xl border text-xs leading-snug transition-all flex items-start gap-2.5 ${optStyle}`}
                              >
                                <span className={`w-5 h-5 rounded-md shrink-0 border flex items-center justify-center text-[10px] font-black ${
                                  isSelected ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-400'
                                }`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation & Action footer */}
                        {answerSubmitted && (
                          <div className="mt-4 bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                            <div className="flex gap-1.5 items-center mb-1 text-[10px] font-black uppercase text-slate-500">
                              <Info className="w-3.5 h-3.5 text-brand" />
                              Explanation & Principle
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                              {selectedModule.questions[currentQuizIdx].explanation}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between gap-3">
                          <button
                            onClick={() => {
                              setQuizActive(false);
                            }}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600"
                          >
                            Exit
                          </button>

                          {!answerSubmitted ? (
                            <button
                              disabled={selectedAnswer === null}
                              onClick={handleSubmitAnswer}
                              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                              Submit Answer
                            </button>
                          ) : (
                            <button
                              onClick={handleNextQuizQuestion}
                              className="px-6 py-2.5 bg-brand text-white hover:bg-brand-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                            >
                              Next Question
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                      </div>
                    ) : (
                      // Quiz Finished State
                      <div className="text-center py-6">
                        <Trophy className="w-14 h-14 text-amber-500 mx-auto mb-3 animate-bounce" />
                        <h4 className="text-sm font-black uppercase text-slate-800 tracking-tight mb-1">Practice Drill Complete!</h4>
                        <p className="text-[11px] text-slate-400 font-bold uppercase mb-4 tracking-widest">
                          You scored {correctCount} out of {selectedModule.questions.length} correct
                        </p>
                        
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-5 text-left text-xs leading-relaxed font-semibold text-slate-600">
                          {correctCount >= selectedModule.questions.length - 1 ? (
                            <div className="flex gap-2 items-start">
                              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">Exceptional Score!</span>
                                You have successfully mastered this section and unlocked the path forward. An additional +100 study repute has been awarded to your profile.
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px] mb-1">Practice Makes Perfect</span>
                              Retake the drill or continue reviewing the core concepts. Active recall is the key to deep retention on the CMA exam.
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startQuiz(selectedModule)}
                            className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800"
                          >
                            Retake Drill
                          </button>
                          <button
                            onClick={() => setQuizActive(false)}
                            className="flex-1 py-3 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                          >
                            Finish
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};
