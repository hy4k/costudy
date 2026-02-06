import React, { useState } from 'react';
import { Icons } from '../Icons';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [pricingMode, setPricingMode] = useState<'individual' | 'group'>('individual');
  const [groupSize, setGroupSize] = useState(5);

  // Group pricing calculation (20% discount base + 5% per additional member)
  const basePrice = billingCycle === 'yearly' ? 3999 : 499;
  const groupDiscount = Math.min(0.20 + (groupSize - 2) * 0.05, 0.50); // Max 50% discount
  const perPersonPrice = Math.round(basePrice * (1 - groupDiscount));
  const totalGroupPrice = perPersonPrice * groupSize;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Icons.BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">CoStudy</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#wall" className="text-slate-400 hover:text-white transition">The Wall</a>
              <a href="#alignment" className="text-slate-400 hover:text-white transition">Alignment Network</a>
              <a href="#clusters" className="text-slate-400 hover:text-white transition">Study Rooms</a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition">Pricing</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={onLogin} className="text-slate-400 hover:text-white transition">Sign In</button>
              <button onClick={onGetStarted} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium transition">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative">
          {/* Global Pulse Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm text-slate-300">
                <span className="text-emerald-400 font-semibold">1,420</span> Active Alignments Worldwide
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-center mb-6 leading-tight">
            Study Like a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
              Global Firm
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 text-center max-w-3xl mx-auto mb-8">
            The CMA exam demands professional-grade discipline. CoStudy transforms isolated studying into a 
            <span className="text-white font-medium"> synchronized global operation</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
            >
              Start Your Mission <Icons.ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-lg transition border border-slate-700">
              Watch Demo
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { value: '39,914', label: 'Study Chunks Indexed' },
              { value: '24/7', label: 'Global Coverage' },
              { value: '96', label: 'PDFs Analyzed' },
              { value: '0', label: 'Excuses Left' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Wall Section */}
      <section id="wall" className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 rounded-full text-violet-400 text-sm font-medium mb-4">
              <Icons.MessageSquare className="w-4 h-4" /> THE WALL
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Not a Feed.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                A Knowledge Exchange.
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Traditional social networks optimize for likes. The CoStudy Wall is an Academic Intelligence Hub 
              designed for validation and strategic knowledge exchange.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Left: Post Types */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">+</div>
                Academic Protocols
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Standard Question', desc: 'Classic doubt-clearing. Tagged by CMA Part & Section.', color: 'bg-blue-500' },
                  { title: 'MCQ Share', desc: 'Share tricky questions with formatted A/B/C/D options.', color: 'bg-emerald-500' },
                  { title: 'Resource Drop', desc: 'Summaries, formula cheat sheets, high-value videos.', color: 'bg-amber-500' },
                  { title: 'Peer Audit Request', desc: 'Post essay arguments for IMA-standards review.', color: 'bg-purple-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${item.color}`} />
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-sm text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Specialized Desks */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                  <Icons.Target className="w-5 h-5" />
                </div>
                Specialized Desks
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Audit Desk', desc: 'Peer essay reviews. Verdicts: Compliant or Non-Compliant.' },
                  { title: 'Bounty Board', desc: 'Gig economy for study tasks. Earn Credits & Badges.' },
                  { title: 'Strategic Notes', desc: 'Curated high-density study guides from top performers.' },
                  { title: 'Expert Q&A', desc: 'Verified mentors only. Professional Skepticism score 50+.' },
                  { title: 'Discussions', desc: 'Long-form academic debates. IFRS vs GAAP deep-dives.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-2 h-2 rounded-full mt-2 bg-violet-500" />
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-sm text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Mechanics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/20 p-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Icons.Shield className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Vouch, Don't Like</h4>
              <p className="text-slate-400">
                A Vouch is a professional endorsement. It means the content is accurate and academically sound. 
                High Vouch counts unlock Peer Tutor recommendations.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl border border-blue-500/20 p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Icons.MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Audit Trail Threads</h4>
              <p className="text-slate-400">
                Comments form a Threaded Logic Tree. Follow the audit trail of any argument. 
                Sub-replies keep context without losing the main question.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl border border-purple-500/20 p-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Icons.Zap className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-2">Instant Summaries</h4>
              <p className="text-slate-400">
                Every post has a Summary button. AI generates 3 Strategic Bullet Points instantly. 
                Scan 10 posts in the time it takes to read 2.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CAN (Alignment Network) Section */}
      <section id="alignment" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-violet-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 rounded-full text-violet-400 text-sm font-medium mb-4">
              <Icons.Globe className="w-4 h-4" /> CMA ALIGNMENT NETWORK
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your Global Study Partner,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                Synchronized.
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              From "friends" to "contractors." Form Borderless Academic Units with peers whose strengths 
              offset your weaknesses. A student in Mumbai and a student in New York, operating as one.
            </p>
          </div>

          {/* The Protocol Steps */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {[
              { step: '01', title: 'Signal Intercept', desc: "The Academic Radar scans globally. See who's hitting 80%+ in topics you struggle with.", icon: <Icons.Target className="w-6 h-6" /> },
              { step: '02', title: 'Treaty Request', desc: 'Send a Contract Proposal: Purpose, Duration, Mission Goal. Not a friend request.', icon: <Icons.Users className="w-6 h-6" /> },
              { step: '03', title: 'Synchronized Metrics', desc: 'Shared Radar shows live telemetry. Streak-Lock: if one breaks, both are threatened.', icon: <Icons.Zap className="w-6 h-6" /> },
              { step: '04', title: 'Context-Only DMs', desc: "Messages anchored to Missions. When your phone pings, it's high-value insight.", icon: <Icons.MessageSquare className="w-6 h-6" /> },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 h-full">
                  <div className="text-violet-500 font-mono text-sm mb-4">{item.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                    {item.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-violet-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>

          {/* USPs Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-slate-800 p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-bold text-slate-800">24/7</div>
              <div className="relative">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Icons.Clock className="w-6 h-6" />
                  Cross-Timezone Intelligence
                </h3>
                <p className="text-slate-400 mb-6">
                  While you sleep in India, your partner in the USA is auditing your essays. 
                  When you wake up, a professional feedback report is waiting.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="px-3 py-1 bg-slate-800 rounded-full">🇮🇳 Mumbai</div>
                  <div className="flex-1 h-px bg-gradient-to-r from-violet-500 to-blue-500" />
                  <div className="px-3 py-1 bg-slate-800 rounded-full">🇺🇸 New York</div>
                </div>
                <p className="text-center text-violet-400 text-sm mt-4">The 24/7 Academic Factory</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-2xl border border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Icons.Shield className="w-6 h-6" />
                Enforced Professionalism
              </h3>
              <p className="text-slate-400 mb-6">
                No more ghosting. If a student fails to meet contract goals, their Consistency Score drops. 
                Low-Signal students can't align with elite peers.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-300">Reputation Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-emerald-500 rounded-full" />
                    </div>
                    <span className="text-emerald-400 font-mono text-sm">82</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-300">Consistency Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="w-11/12 h-full bg-violet-500 rounded-full" />
                    </div>
                    <span className="text-violet-400 font-mono text-sm">94%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                  <span className="text-slate-300">Successful Alignments</span>
                  <span className="text-amber-400 font-mono">12 ✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Control & SOS */}
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
              <h3 className="text-2xl font-bold mb-4">Mission Control Dashboard</h3>
              <p className="text-slate-400 mb-6">
                Instead of a profile page, see a Combined Tactical View. Two progress bars racing toward Mastery.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">You</span>
                    <span className="text-violet-400">78%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[78%] h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Partner (NYC)</span>
                    <span className="text-blue-400">82%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[82%] h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl border border-red-500/20 p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                🚨 SOS Protocol
              </h3>
              <p className="text-slate-400 mb-6">
                Stuck on a calculation? Trigger an SOS. Jump into a 15-minute Rapid Response audio session 
                with your aligned peer — anywhere in the world.
              </p>
              <button className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 font-semibold transition">
                Request Rapid Response
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Study Rooms / Cluster Hub Section */}
      <section id="clusters" className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full text-amber-400 text-sm font-medium mb-4">
              <Icons.Users className="w-4 h-4" /> CLUSTER HUB
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Study Rooms:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Tactical Command Centers
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              While the Wall is for broad intelligence, Study Rooms are for Deep-Dive Operations. 
              Persistent, private workspaces designed for high-intensity Learning Units.
            </p>
          </div>

          {/* Room Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Icons.Target className="w-6 h-6" />,
                title: 'MCQ War Room',
                desc: "Live-solve 50 questions together. Real-time room accuracy vs global average.",
                color: 'violet'
              },
              {
                icon: <Icons.FolderLock className="w-6 h-6" />,
                title: 'Shared Ledger',
                desc: 'Encrypted vault for summaries, formula banks, and essay audit logs.',
                color: 'emerald'
              },
              {
                icon: <Icons.Moon className="w-6 h-6" />,
                title: 'Radio Silence Mode',
                desc: 'Room-wide focus timer. Notifications suppressed, dark focus theme.',
                color: 'blue'
              },
              {
                icon: <Icons.Pencil className="w-6 h-6" />,
                title: 'Strategic Whiteboard',
                desc: 'Low-latency canvas for variance analysis and allocation trees on audio.',
                color: 'amber'
              },
              {
                icon: <Icons.BarChart className="w-6 h-6" />,
                title: 'Mission Ticker',
                desc: '"85% Accuracy in Section B by Sunday" — live goal tracking.',
                color: 'purple'
              },
              {
                icon: <Icons.Trophy className="w-6 h-6" />,
                title: 'Mastery Certification',
                desc: 'Complete missions, get Certified. Earn Mastery Badges per topic.',
                color: 'rose'
              },
            ].map((item, i) => (
              <div key={i} className={`bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-${item.color}-500/50 transition`}>
                <div className={`w-12 h-12 rounded-xl bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-400 mb-4`}>
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Stickiness Features */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-orange-500/10 rounded-2xl border border-amber-500/20 p-8 mb-16">
            <h3 className="text-2xl font-bold text-center mb-8">Why Teams Come Back Every Day</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-3">🔥</div>
                <h4 className="text-lg font-bold mb-2">Cluster Streak Lock</h4>
                <p className="text-slate-400 text-sm">10-day streak = Exclusive Mock Exams & Mentor Credits. Breaking it feels like letting down your unit.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">🏆</div>
                <h4 className="text-lg font-bold mb-2">Room vs Room Leaderboards</h4>
                <p className="text-slate-400 text-sm">Mumbai Cluster vs London Cluster. Who finishes more essay audits this week?</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📍</div>
                <h4 className="text-lg font-bold mb-2">Scheduled Ops</h4>
                <p className="text-slate-400 text-sm">"Your NYC partner enters the War Room in 15 min for MCQ Sprint." Auto-generated rendezvous.</p>
              </div>
            </div>
          </div>

          {/* Faculty Hive - Mentor Integration */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900 rounded-2xl border border-emerald-500/30 p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-emerald-400 text-sm font-medium mb-4">
                  <Icons.Award className="w-4 h-4" /> THE FACULTY HIVE
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  Micro-Crowdfunded{' '}
                  <span className="text-emerald-400">Mentorship</span>
                </h3>
                <p className="text-slate-400 mb-6">
                  Cluster struggling with Foreign Currency Translation? Click "Enlist Specialist." 
                  Split the fee. Get expert help. This is mentorship democratized.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">1</div>
                    <div>
                      <div className="font-semibold">SOS Signal</div>
                      <div className="text-sm text-slate-400">Any room member clicks "Enlist Specialist"</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">2</div>
                    <div>
                      <div className="font-semibold">Marketplace Pull</div>
                      <div className="text-sm text-slate-400">See verified mentors online for Flash Sessions</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">3</div>
                    <div>
                      <div className="font-semibold">Split-Fee Logic</div>
                      <div className="text-sm text-slate-400">₹2500 session ÷ 5 members = ₹500 each</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">4</div>
                    <div>
                      <div className="font-semibold">Escrow + Vouch Release</div>
                      <div className="text-sm text-slate-400">Room vouches for quality → funds released to mentor</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <div className="text-center mb-6">
                  <div className="text-sm text-slate-500 mb-2">Example: 1-Hour Deep Dive</div>
                  <div className="text-4xl font-bold text-emerald-400">₹2,500</div>
                  <div className="text-slate-400">Session Fee</div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-500/20" />
                      <span className="text-slate-300">You</span>
                    </div>
                    <span className="text-emerald-400 font-mono">₹500</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20" />
                      <span className="text-slate-300">Partner 1 (NYC)</span>
                    </div>
                    <span className="text-emerald-400 font-mono">₹500</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20" />
                      <span className="text-slate-300">Partner 2 (London)</span>
                    </div>
                    <span className="text-emerald-400 font-mono">₹500</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20" />
                      <span className="text-slate-300">Partner 3 (Dubai)</span>
                    </div>
                    <span className="text-emerald-400 font-mono">₹500</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20" />
                      <span className="text-slate-300">Partner 4 (Singapore)</span>
                    </div>
                    <span className="text-emerald-400 font-mono">₹500</span>
                  </div>
                </div>

                <div className="text-center text-sm text-slate-500">
                  CoStudy Platform Fee: 10-15%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Mentors Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full text-emerald-400 text-sm font-medium mb-4">
              <Icons.Award className="w-4 h-4" /> FOR MENTORS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Teach Globally.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                Earn Professionally.
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Verified mentors join the Faculty Hive. Get pulled into Flash Sessions, 
              set your rates, and earn from global clusters.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Icons.CheckBadge className="w-6 h-6" />,
                title: 'Verified Badge',
                desc: 'Manual verification by CoStudy. Unique code login. Trust built-in.',
              },
              {
                icon: <Icons.Users className="w-6 h-6" />,
                title: 'Student Dashboard',
                desc: 'Track enrolled students. Send broadcasts. Monitor progress at scale.',
              },
              {
                icon: <Icons.Wallet className="w-6 h-6" />,
                title: 'Revenue Share',
                desc: 'Referral bonuses + session fees. CoStudy Escrow protects payments.',
              },
              {
                icon: <Icons.Zap className="w-6 h-6" />,
                title: 'Flash Sessions',
                desc: "Clusters pull you in for 1-hour deep dives. You see their data before joining.",
              },
              {
                icon: <Icons.BarChart className="w-6 h-6" />,
                title: 'Analytics & Insights',
                desc: 'Track your impact. See which topics need you most.',
              },
              {
                icon: <Icons.Award className="w-6 h-6" />,
                title: 'Post Bounties',
                desc: 'Create study tasks for students. Build your coaching empire.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-emerald-500/50 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-lg transition">
              Apply to Become a Mentor
            </button>
          </div>
        </div>
      </section>

      {/* Supporting Features */}
      <section className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything Else You Need</h2>
            <p className="text-xl text-slate-400">Powered by AI. Built for CMA.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Icons.Brain className="w-6 h-6" />, title: 'RAG-Powered AI', desc: '39,914 chunks from official CMA materials. Answers grounded in your actual syllabus.' },
              { icon: <Icons.Target className="w-6 h-6" />, title: 'Smart MCQ Practice', desc: 'Topic-tagged questions with instant explanations. Track weak areas automatically.' },
              { icon: <Icons.Award className="w-6 h-6" />, title: 'Essay Evaluation', desc: 'AI grades your essays using RAG context. Get IMA-standards feedback in seconds.' },
              { icon: <Icons.Clock className="w-6 h-6" />, title: 'Mock Test Simulation', desc: 'Real test-center experience. Timed sections, proctored environment, stress training.' },
              { icon: <Icons.Trophy className="w-6 h-6" />, title: 'Gamified Progress', desc: 'Streaks, badges, leaderboards. Turn grinding into a game. Compete globally.' },
              { icon: <Icons.Sparkles className="w-6 h-6" />, title: 'Glassmorphism UI', desc: 'Flight cockpit aesthetic. Signal lights for active solving. Premium feel.' },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 hover:border-violet-500/50 transition">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-400 mb-8">Start free. Upgrade solo or with your squad.</p>
            
            {/* Billing Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="inline-flex items-center gap-4 p-1 bg-slate-800 rounded-full">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    billingCycle === 'monthly' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    billingCycle === 'yearly' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Yearly <span className="text-emerald-400 text-sm">Save 33%</span>
                </button>
              </div>

              <div className="inline-flex items-center gap-4 p-1 bg-slate-800 rounded-full">
                <button
                  onClick={() => setPricingMode('individual')}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    pricingMode === 'individual' ? 'bg-amber-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setPricingMode('group')}
                  className={`px-6 py-2 rounded-full font-medium transition ${
                    pricingMode === 'group' ? 'bg-amber-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Group <span className="text-emerald-400 text-sm">Extra Savings</span>
                </button>
              </div>
            </div>
          </div>

          {pricingMode === 'individual' ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <p className="text-slate-400 mb-6">Get started, test the waters</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹0</span>
                  <span className="text-slate-400">/forever</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {['20 AI questions/day', '10 MCQ practice/day', 'Community Wall access', 'Basic Alignment (1 peer)', '3 Vouches/day'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400"><Icons.CheckCircle className="w-5 h-5" /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition">
                  Get Started
                </button>
              </div>

              {/* Pro */}
              <div className="bg-gradient-to-b from-violet-600/20 to-slate-900 rounded-2xl border-2 border-violet-500 p-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-violet-600 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <p className="text-slate-400 mb-6">For serious candidates</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ₹{billingCycle === 'yearly' ? '333' : '499'}
                  </span>
                  <span className="text-slate-400">/month</span>
                  {billingCycle === 'yearly' && (
                    <div className="text-sm text-slate-500">Billed ₹3,999/year</div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {['Unlimited AI questions', 'Unlimited MCQ practice', 'Full Wall + all Desks', 'Unlimited Alignments', 'Unlimited Vouches', 'Essay AI evaluation', 'Mock test simulations', 'Priority support'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400"><Icons.CheckCircle className="w-5 h-5" /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition">
                  Upgrade to Pro
                </button>
              </div>

              {/* Mentor */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
                <h3 className="text-2xl font-bold mb-2">Mentor</h3>
                <p className="text-slate-400 mb-6">Teach and earn</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">₹1,999</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {['Everything in Pro', 'Student dashboard', 'Broadcast to followers', 'Revenue share on sessions', 'Verified Mentor badge', 'Post Bounties', 'Analytics & insights'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400"><Icons.CheckCircle className="w-5 h-5" /></span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition">
                  Become a Mentor
                </button>
              </div>
            </div>
          ) : (
            /* Group Pricing */
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-b from-amber-600/20 to-slate-900 rounded-2xl border-2 border-amber-500 p-8">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold mb-2">Group Pro</h3>
                  <p className="text-slate-400">Buy together. Study together. Save together.</p>
                </div>

                {/* Group Size Slider */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-400">Group Size</span>
                    <span className="text-2xl font-bold text-amber-400">{groupSize} Students</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>2</span>
                    <span>10</span>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-800/50 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-2">Per Person</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">₹{perPersonPrice}</span>
                      <span className="text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                    <div className="text-emerald-400 text-sm mt-2">
                      Save {Math.round(groupDiscount * 100)}% vs Individual
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-2">Total for Group</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-amber-400">₹{totalGroupPrice.toLocaleString()}</span>
                      <span className="text-slate-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                    <div className="text-slate-500 text-sm mt-2">
                      One payment, {groupSize} Premium accounts
                    </div>
                  </div>
                </div>

                {/* How It Works */}
                <div className="bg-slate-800/30 rounded-xl p-6 mb-8">
                  <h4 className="font-bold mb-4">How Group Purchase Works</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">1</div>
                      <div>
                        <div className="font-medium">You Pay Once</div>
                        <div className="text-slate-400">One payment for entire group</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">2</div>
                      <div>
                        <div className="font-medium">Invites Sent</div>
                        <div className="text-slate-400">Each member gets email to register</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">3</div>
                      <div>
                        <div className="font-medium">Auto Study Room</div>
                        <div className="text-slate-400">Your Cluster Hub is pre-created</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {[
                    'All Pro features for each member',
                    'Pre-configured Study Room',
                    'Shared Ledger (Resource Vault)',
                    'Group Streak tracking',
                    'Priority cluster support',
                    'Bulk mentor session discounts',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-400"><Icons.CheckCircle className="w-5 h-5" /></span>
                      {item}
                    </div>
                  ))}
                </div>

                <button onClick={onGetStarted} className="w-full py-4 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold text-lg transition">
                  Purchase Group Plan
                </button>
              </div>
            </div>
          )}

          {/* Competitor Comparison */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Why Not Just Use Gleim or Becker?</h3>
              <p className="text-slate-400">Legacy tools for a legacy era.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-4 px-4 font-medium text-slate-400">Feature</th>
                    <th className="py-4 px-4 font-medium text-slate-400">Gleim/Becker</th>
                    <th className="py-4 px-4 font-medium text-violet-400">CoStudy</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Global Peer Accountability', false, true],
                    ['Cross-Timezone Study Partners', false, true],
                    ['AI-Powered Essay Grading', false, true],
                    ['Mission-Based Contracts', false, true],
                    ['Cluster Study Rooms', false, true],
                    ['Crowdfunded Mentorship', false, true],
                    ['Community Knowledge Exchange', false, true],
                    ['Price', '$1,500+', '₹499/mo'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      <td className="py-4 px-4 text-slate-300">{row[0]}</td>
                      <td className="py-4 px-4 text-center">
                        {typeof row[1] === 'boolean' ? (
                          row[1] ? (
                            <span className="text-emerald-400"><Icons.CheckCircle className="w-5 h-5 inline" /></span>
                          ) : (
                            <span className="text-slate-600"><Icons.XCircle className="w-5 h-5 inline" /></span>
                          )
                        ) : (
                          <span className="text-slate-400">{row[1]}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof row[2] === 'boolean' ? (
                          row[2] ? (
                            <span className="text-emerald-400"><Icons.CheckCircle className="w-5 h-5 inline" /></span>
                          ) : (
                            <span className="text-slate-600"><Icons.XCircle className="w-5 h-5 inline" /></span>
                          )
                        ) : (
                          <span className="text-violet-400 font-semibold">{row[2]}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Join the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
              Global Force?
            </span>
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            1,420 students are already aligned across 12 time zones. The CMA exam doesn't wait. Neither should you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
            >
              Start Your Mission <Icons.ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-lg transition border border-slate-700">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Icons.BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">CoStudy</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <div className="text-slate-500 text-sm">
              © 2026 CoStudy. Study like a global firm.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
