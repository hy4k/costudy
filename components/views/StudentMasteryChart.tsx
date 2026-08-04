import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Icons } from '../Icons';

export interface StudentMasteryChartProps {
  students?: Array<{ id: string; name: string; handle: string }>;
  selectedStudentId?: string | null;
  onSelectStudent?: (studentId: string) => void;
}

// Sample time series trends for Cohort vs Individual students
const COHORT_TIME_DATA = [
  { time: 'Week 1', FinancialReporting: 52, CostManagement: 48, CorporateFinance: 42, InternalControls: 60, PerformanceMgmt: 55, Benchmark: 72 },
  { time: 'Week 2', FinancialReporting: 58, CostManagement: 53, CorporateFinance: 49, InternalControls: 64, PerformanceMgmt: 60, Benchmark: 72 },
  { time: 'Week 3', FinancialReporting: 64, CostManagement: 59, CorporateFinance: 55, InternalControls: 68, PerformanceMgmt: 63, Benchmark: 72 },
  { time: 'Week 4', FinancialReporting: 71, CostManagement: 66, CorporateFinance: 62, InternalControls: 73, PerformanceMgmt: 69, Benchmark: 72 },
  { time: 'Week 5', FinancialReporting: 76, CostManagement: 72, CorporateFinance: 68, InternalControls: 78, PerformanceMgmt: 74, Benchmark: 72 },
  { time: 'Week 6', FinancialReporting: 82, CostManagement: 78, CorporateFinance: 74, InternalControls: 83, PerformanceMgmt: 80, Benchmark: 72 },
  { time: 'Week 7', FinancialReporting: 86, CostManagement: 82, CorporateFinance: 79, InternalControls: 87, PerformanceMgmt: 85, Benchmark: 72 },
  { time: 'Week 8', FinancialReporting: 89, CostManagement: 85, CorporateFinance: 83, InternalControls: 91, PerformanceMgmt: 88, Benchmark: 72 },
];

const STUDENT_TRENDS: Record<string, typeof COHORT_TIME_DATA> = {
  'stu-1': [
    { time: 'Week 1', FinancialReporting: 40, CostManagement: 35, CorporateFinance: 30, InternalControls: 50, PerformanceMgmt: 45, Benchmark: 72 },
    { time: 'Week 2', FinancialReporting: 48, CostManagement: 42, CorporateFinance: 38, InternalControls: 55, PerformanceMgmt: 50, Benchmark: 72 },
    { time: 'Week 3', FinancialReporting: 55, CostManagement: 50, CorporateFinance: 45, InternalControls: 62, PerformanceMgmt: 58, Benchmark: 72 },
    { time: 'Week 4', FinancialReporting: 62, CostManagement: 58, CorporateFinance: 52, InternalControls: 70, PerformanceMgmt: 65, Benchmark: 72 },
    { time: 'Week 5', FinancialReporting: 70, CostManagement: 65, CorporateFinance: 60, InternalControls: 76, PerformanceMgmt: 72, Benchmark: 72 },
    { time: 'Week 6', FinancialReporting: 78, CostManagement: 73, CorporateFinance: 68, InternalControls: 82, PerformanceMgmt: 78, Benchmark: 72 },
    { time: 'Week 7', FinancialReporting: 84, CostManagement: 80, CorporateFinance: 75, InternalControls: 88, PerformanceMgmt: 83, Benchmark: 72 },
    { time: 'Week 8', FinancialReporting: 88, CostManagement: 84, CorporateFinance: 81, InternalControls: 92, PerformanceMgmt: 87, Benchmark: 72 },
  ],
  'stu-2': [
    { time: 'Week 1', FinancialReporting: 60, CostManagement: 55, CorporateFinance: 50, InternalControls: 65, PerformanceMgmt: 58, Benchmark: 72 },
    { time: 'Week 2', FinancialReporting: 66, CostManagement: 61, CorporateFinance: 57, InternalControls: 70, PerformanceMgmt: 64, Benchmark: 72 },
    { time: 'Week 3', FinancialReporting: 72, CostManagement: 68, CorporateFinance: 63, InternalControls: 75, PerformanceMgmt: 70, Benchmark: 72 },
    { time: 'Week 4', FinancialReporting: 78, CostManagement: 74, CorporateFinance: 70, InternalControls: 80, PerformanceMgmt: 76, Benchmark: 72 },
    { time: 'Week 5', FinancialReporting: 83, CostManagement: 79, CorporateFinance: 76, InternalControls: 85, PerformanceMgmt: 81, Benchmark: 72 },
    { time: 'Week 6', FinancialReporting: 88, CostManagement: 84, CorporateFinance: 82, InternalControls: 89, PerformanceMgmt: 86, Benchmark: 72 },
    { time: 'Week 7', FinancialReporting: 92, CostManagement: 89, CorporateFinance: 87, InternalControls: 94, PerformanceMgmt: 90, Benchmark: 72 },
    { time: 'Week 8', FinancialReporting: 95, CostManagement: 92, CorporateFinance: 90, InternalControls: 96, PerformanceMgmt: 93, Benchmark: 72 },
  ]
};

const CATEGORY_COLORS = {
  FinancialReporting: { name: 'Financial Reporting', stroke: '#3b82f6', fill: '#93c5fd' },
  CostManagement: { name: 'Cost Management & Decisions', stroke: '#10b981', fill: '#6ee7b7' },
  CorporateFinance: { name: 'Corporate Finance & Risk', stroke: '#f59e0b', fill: '#fcd34d' },
  InternalControls: { name: 'Internal Controls & Ethics', stroke: '#8b5cf6', fill: '#c4b5fd' },
  PerformanceMgmt: { name: 'Performance Management', stroke: '#ec4899', fill: '#fbcfe8' }
};

export const StudentMasteryChart: React.FC<StudentMasteryChartProps> = ({
  students = [
    { id: 'all', name: 'Cohort Average', handle: 'all_cohort' },
    { id: 'stu-1', name: 'Alex Johnson', handle: 'alex_cma' },
    { id: 'stu-2', name: 'Sarah Miller', handle: 'sarah_fin' }
  ],
  selectedStudentId = 'all',
  onSelectStudent
}) => {
  const [activeStudentId, setActiveStudentId] = useState<string>(selectedStudentId || 'all');
  const [chartType, setChartType] = useState<'TREND' | 'COMPARISON' | 'AREA'>('TREND');
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({
    FinancialReporting: true,
    CostManagement: true,
    CorporateFinance: true,
    InternalControls: true,
    PerformanceMgmt: true
  });

  const handleStudentChange = (id: string) => {
    setActiveStudentId(id);
    if (onSelectStudent) onSelectStudent(id);
  };

  const toggleCategory = (catKey: string) => {
    setSelectedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const chartData = activeStudentId !== 'all' && STUDENT_TRENDS[activeStudentId]
    ? STUDENT_TRENDS[activeStudentId]
    : COHORT_TIME_DATA;

  // Latest week scores for bar chart view
  const latestData = chartData[chartData.length - 1];
  const barData = Object.keys(CATEGORY_COLORS).map(key => ({
    category: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS].name,
    score: latestData[key as keyof typeof latestData] as number,
    benchmark: 72,
    color: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS].stroke
  }));

  // Find top and lowest performing categories
  const sortedCategories = [...barData].sort((a, b) => b.score - a.score);
  const topCategory = sortedCategories[0];
  const lowestCategory = sortedCategories[sortedCategories.length - 1];

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl text-white text-xs font-sans min-w-[200px]">
          <div className="font-mono text-amber-400 font-bold uppercase tracking-widest text-[10px] mb-2 pb-1 border-b border-slate-800">
            {label}
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              if (entry.dataKey === 'Benchmark') return null;
              return (
                <div key={`item-${index}`} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                    {entry.name}:
                  </span>
                  <span className="font-mono font-bold text-white ml-2">{entry.value}%</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[10px] font-mono text-slate-400">
            <span>ICMA Benchmark:</span>
            <span className="text-emerald-400 font-bold">72%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-100 p-8 md:p-10 shadow-xl flex flex-col gap-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-brand/10 text-brand font-black rounded-lg text-[9px] uppercase tracking-widest border border-brand/20">
              Recharts Engine
            </span>
            <span className="text-slate-400 text-xs font-mono">Category Mastery Analytics</span>
          </div>
          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Category Mastery Trajectory
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">
            Category-wise performance progression over study weeks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Student Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Icons.Users className="w-4 h-4 text-slate-400" />
            <select
              value={activeStudentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              className="bg-transparent font-bold text-xs text-slate-900 outline-none cursor-pointer"
            >
              <option value="all">Cohort Average (All Students)</option>
              {students.filter(s => s.id !== 'all').map(s => (
                <option key={s.id} value={s.id}>{s.name} (@{s.handle})</option>
              ))}
            </select>
          </div>

          {/* Chart View Mode Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setChartType('TREND')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                chartType === 'TREND' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Lines
            </button>
            <button
              onClick={() => setChartType('AREA')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                chartType === 'AREA' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('COMPARISON')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                chartType === 'COMPARISON' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bar Comparison
            </button>
          </div>
        </div>
      </div>

      {/* Category Toggles (Legend Controls) */}
      {chartType !== 'COMPARISON' && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filter Topics:</span>
          {Object.entries(CATEGORY_COLORS).map(([key, config]) => {
            const active = selectedCategories[key];
            return (
              <button
                key={key}
                onClick={() => toggleCategory(key)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.stroke }}></span>
                {config.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Chart Canvas */}
      <div className="w-full h-[360px] bg-slate-50/50 rounded-3xl border border-slate-100 p-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'TREND' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={72} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'ICMA Pass 72%', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
              
              {selectedCategories.FinancialReporting && (
                <Line type="monotone" dataKey="FinancialReporting" name={CATEGORY_COLORS.FinancialReporting.name} stroke={CATEGORY_COLORS.FinancialReporting.stroke} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              )}
              {selectedCategories.CostManagement && (
                <Line type="monotone" dataKey="CostManagement" name={CATEGORY_COLORS.CostManagement.name} stroke={CATEGORY_COLORS.CostManagement.stroke} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              )}
              {selectedCategories.CorporateFinance && (
                <Line type="monotone" dataKey="CorporateFinance" name={CATEGORY_COLORS.CorporateFinance.name} stroke={CATEGORY_COLORS.CorporateFinance.stroke} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              )}
              {selectedCategories.InternalControls && (
                <Line type="monotone" dataKey="InternalControls" name={CATEGORY_COLORS.InternalControls.name} stroke={CATEGORY_COLORS.InternalControls.stroke} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              )}
              {selectedCategories.PerformanceMgmt && (
                <Line type="monotone" dataKey="PerformanceMgmt" name={CATEGORY_COLORS.PerformanceMgmt.name} stroke={CATEGORY_COLORS.PerformanceMgmt.stroke} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
              )}
            </LineChart>
          ) : chartType === 'AREA' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={72} stroke="#10b981" strokeDasharray="5 5" />
              
              {selectedCategories.FinancialReporting && (
                <Area type="monotone" dataKey="FinancialReporting" name={CATEGORY_COLORS.FinancialReporting.name} stroke={CATEGORY_COLORS.FinancialReporting.stroke} fill={CATEGORY_COLORS.FinancialReporting.fill} fillOpacity={0.3} strokeWidth={2} />
              )}
              {selectedCategories.CostManagement && (
                <Area type="monotone" dataKey="CostManagement" name={CATEGORY_COLORS.CostManagement.name} stroke={CATEGORY_COLORS.CostManagement.stroke} fill={CATEGORY_COLORS.CostManagement.fill} fillOpacity={0.3} strokeWidth={2} />
              )}
              {selectedCategories.CorporateFinance && (
                <Area type="monotone" dataKey="CorporateFinance" name={CATEGORY_COLORS.CorporateFinance.name} stroke={CATEGORY_COLORS.CorporateFinance.stroke} fill={CATEGORY_COLORS.CorporateFinance.fill} fillOpacity={0.3} strokeWidth={2} />
              )}
              {selectedCategories.InternalControls && (
                <Area type="monotone" dataKey="InternalControls" name={CATEGORY_COLORS.InternalControls.name} stroke={CATEGORY_COLORS.InternalControls.stroke} fill={CATEGORY_COLORS.InternalControls.fill} fillOpacity={0.3} strokeWidth={2} />
              )}
              {selectedCategories.PerformanceMgmt && (
                <Area type="monotone" dataKey="PerformanceMgmt" name={CATEGORY_COLORS.PerformanceMgmt.name} stroke={CATEGORY_COLORS.PerformanceMgmt.stroke} fill={CATEGORY_COLORS.PerformanceMgmt.fill} fillOpacity={0.3} strokeWidth={2} />
              )}
            </AreaChart>
          ) : (
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 'bold' }} interval={0} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} unit="%" />
              <Tooltip formatter={(value: any) => [`${value}%`, 'Current Mastery']} />
              <ReferenceLine y={72} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target 72%', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#3b82f6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* KPI Cards / Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <Icons.CheckBadge className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Highest Mastery</div>
            <div className="text-base font-black text-slate-900">{topCategory?.category}</div>
            <div className="text-xs font-mono text-emerald-600 font-bold">{topCategory?.score}% Mastery</div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
            <Icons.Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommended Focus</div>
            <div className="text-base font-black text-slate-900">{lowestCategory?.category}</div>
            <div className="text-xs font-mono text-amber-600 font-bold">{lowestCategory?.score}% Mastery (Below Benchmark)</div>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="w-12 h-12 bg-white/10 text-brand rounded-2xl flex items-center justify-center font-bold">
            <Icons.Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[9px] font-black text-brand uppercase tracking-widest">Trajectory Velocity</div>
            <div className="text-base font-black text-white">+37% Growth over 8 Wks</div>
            <div className="text-xs font-mono text-slate-400">On-track for ICMA Pass</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentMasteryChart;
