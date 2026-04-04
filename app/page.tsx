'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dash' | 'findings' | 'fixq' | 'solv' | 'quiz'>('dash');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fixStatus, setFixStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [solvBalance] = useState(847);
  const [score] = useState(71);
  const [fixedSum] = useState(883);

  const handleProcessFix = async () => {
    setFixStatus('loading');
    setTimeout(() => {
      setFixStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setTimeout(() => setFixStatus('idle'), 300);
      }, 1500);
    }, 1500);
  };

  const tabs = [
    { id: 'dash', label: 'Dashboard' },
    { id: 'findings', label: 'Findings' },
    { id: 'fixq', label: 'Fix Queue', count: 3 },
    { id: 'solv', label: '$SOLV' },
    { id: 'quiz', label: 'Quiz' },
  ];

  return (
    <div className="min-h-screen">
      {/* Glass Navigation */}
      <nav className="glass-nav fixed top-0 w-full z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="font-bold text-lg tracking-tight">Shadow CFO</div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-500">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`hover:text-black transition flex items-center ${
                  activeTab === tab.id ? 'text-black' : ''
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-[#ff3b30] text-white rounded-full px-2 py-0.5 text-xs ml-1.5 font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button className="button-apple hidden md:block">Settings</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        
        {/* Dashboard View */}
        {activeTab === 'dash' && (
          <>
            {/* Hero Section */}
            <div className="mb-12">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">11 days left in trial</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Good morning, Sarah.</h1>
              <p className="text-xl text-gray-500 tracking-tight">
                Your financial health is improving. <span className="text-black font-semibold">$883/year</span> recovered so far.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Solvency Score */}
              <div className="card p-8 col-span-1 flex flex-col justify-center items-start">
                <h2 className="text-gray-500 font-medium mb-1 text-sm uppercase tracking-wide">Solvency Score</h2>
                <div className="text-7xl font-bold text-gradient mb-3 tracking-tighter">{score}</div>
                <div className="text-sm font-semibold text-[#34c759] bg-green-50 px-2.5 py-1 rounded-md flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  +13 this month
                </div>
              </div>

              {/* Optimization Value */}
              <div className="card p-8 col-span-1 md:col-span-2 flex flex-col justify-between">
                <h2 className="text-gray-500 font-medium mb-6 text-sm uppercase tracking-wide">Total Optimization Value</h2>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end w-full">
                  <div className="mb-6 md:mb-0">
                    <div className="text-5xl font-bold tracking-tight">$11,430<span className="text-2xl text-gray-400 font-normal">/yr</span></div>
                    <p className="text-sm text-gray-500 mt-1">Total potential savings found</p>
                  </div>

                  <div className="w-full md:w-auto grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div className="flex flex-col border-l-2 border-gray-100 pl-3">
                      <span className="text-gray-400 font-medium mb-1">Cash drag</span>
                      <span className="font-bold text-lg">$883</span>
                    </div>
                    <div className="flex flex-col border-l-2 border-blue-500 pl-3">
                      <span className="text-gray-400 font-medium mb-1">Fee drag</span>
                      <span className="font-bold text-lg">$1,847</span>
                    </div>
                    <div className="flex flex-col border-l-2 border-gray-100 pl-3">
                      <span className="text-gray-400 font-medium mb-1">Match gap</span>
                      <span className="font-bold text-lg">$3,200</span>
                    </div>
                    <div className="flex flex-col border-l-2 border-gray-100 pl-3">
                      <span className="text-gray-400 font-medium mb-1">OBBBA</span>
                      <span className="font-bold text-lg">$5,500</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fix Queue Preview */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Fix Queue</h2>
                <p className="text-gray-500 mt-1">3 fixes ready — takes under 2 minutes · Earns $SOLV</p>
              </div>

              <div 
                className="card p-8 cursor-pointer ring-1 ring-black/5 hover:ring-[#0071e3]/50 transition-all group"
                onClick={() => setActiveTab('fixq')}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div className="flex-1 pr-0 md:pr-8">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="bg-[#0071e3]/10 text-[#0071e3] text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">Fee Drag</span>
                      <span className="text-sm font-medium text-gray-400 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                        </svg>
                        One Tap
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 tracking-tight group-hover:text-[#0071e3] transition-colors">Your Fidelity fund charges 18× too much</h3>
                    <p className="text-gray-500 leading-relaxed text-sm md:text-base mb-2">
                      FBALX charges 0.48%/year. FXAIX tracks the same S&P 500 index at 0.015%. On your $205K balance, that's <strong className="text-black">$1,847</strong> in unnecessary fees every year.
                    </p>
                    <p className="text-xs text-gray-400 mt-3">Educational information only — not investment advice.</p>
                  </div>

                  <div className="mt-6 md:mt-0 text-left md:text-right flex flex-col items-start md:items-end">
                    <div className="text-3xl font-bold mb-4">+$1,847<span className="text-lg text-gray-400 font-normal">/yr</span></div>
                    <button className="button-apple px-6 py-2.5 shadow-sm">Review & Fix</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Findings Tab */}
        {activeTab === 'findings' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Your findings</h1>
              <p className="text-gray-500 mt-1">Total: <strong className="text-[#34c759]">$11,430/year</strong> across 5 leakage categories</p>
            </div>

            {/* Finding Cards */}
            {[
              { cat: 'Cash Drag', badge: 'Fixed ✓', color: 'green', amount: '$883', title: '$18,400 sitting idle at 0.01% — FIXED', desc: 'Moved $18,400 to Marcus HYSA earning 4.8%. You approved this on Monday.', action: 'Approved ✓', done: true },
              { cat: 'Fee Drag', badge: 'One Tap', color: 'blue', amount: '$1,847', title: 'Your Fidelity fund charges 18× too much', desc: 'FBALX charges 0.48%/year. FXAIX tracks the same index at 0.015%.', action: 'Approve Swap', done: false },
              { cat: 'Employer Match', badge: 'High Priority', color: 'amber', amount: '$3,200', title: "You're leaving $3,200 in free money on the table", desc: 'You contribute 3% to 401(k). Employer matches 100% up to 6%.', action: 'Increase to 6%', done: false },
            ].map((finding, i) => (
              <div key={i} className="card p-6 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${
                      finding.color === 'green' ? 'bg-green-100 text-green-700' :
                      finding.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>{finding.cat}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md uppercase ${
                      finding.done ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700'
                    }`}>{finding.badge}</span>
                  </div>
                  <div className={`text-2xl font-bold ${finding.done ? 'text-gray-400' : 'text-[#34c759]'}`}>
                    {finding.amount} <span className="text-sm font-normal text-gray-400">/yr</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${finding.done ? 'text-gray-400' : ''}`}>{finding.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{finding.desc}</p>
                <button className={`button-apple ${finding.done ? 'opacity-50 cursor-default' : ''}`} disabled={finding.done}>
                  {finding.action}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Fix Queue Tab */}
        {activeTab === 'fixq' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Fix Queue</h1>
              <p className="text-gray-500 mt-1">Review and approve. Every fix earns $SOLV.</p>
            </div>

            {[
              { meta: 'Fee Drag · One Tap · +10 $SOLV', title: 'Switch FBALX → FXAIX (Fidelity 500 Index)', amount: '$1,847', desc: 'Same S&P 500 exposure. 97% lower cost. We\'ll show you the link to make the switch.', solv: 10 },
              { meta: 'Employer Match · Must Do · +25 $SOLV', title: 'Increase 401(k) contribution 3% → 6%', amount: '$3,200', desc: 'Guaranteed 100% return on each new dollar contributed.', solv: 25 },
              { meta: 'OBBBA Deductions · Needs CPA · +30 $SOLV', title: 'Send deduction summary to your CPA', amount: '$5,500 est.', desc: 'We\'ve prepared a 1-page memo covering your deductions.', solv: 30 },
            ].map((item, i) => (
              <div key={i} className="card p-6 mb-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{item.meta}</div>
                <div className="flex justify-between items-start mb-3">
                  <div className="font-bold text-lg">{item.title}</div>
                  <div className="text-2xl font-bold text-[#34c759]">{item.amount}</div>
                </div>
                <p className="text-gray-500 text-sm mb-4">{item.desc}</p>
                <div className="flex gap-3">
                  <button 
                    className="button-apple"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Approve → +{item.solv} $SOLV
                  </button>
                  <button className="px-4 py-2 text-gray-500 text-sm border border-gray-200 rounded-full hover:bg-gray-50">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* $SOLV Tab */}
        {activeTab === 'solv' && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Your $SOLV</h1>
              <p className="text-gray-500 mt-1">Soul-bound — cannot be transferred or sold.</p>
            </div>

            <div className="card p-8 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Balance</div>
                  <div className="text-3xl font-bold text-[#0071e3]">{solvBalance} $SOLV</div>
                </div>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                  {solvBalance >= 1000 ? 'Architect' : 'Protector'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mb-3">
                <div 
                  className="h-full bg-[#0071e3] rounded-full transition-all" 
                  style={{ width: `${Math.min((solvBalance / 1000) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>500 — Protector</span>
                <span className="text-[#0071e3] font-medium">{Math.max(0, 1000 - solvBalance)} to Architect</span>
                <span>1,000 — Architect</span>
              </div>
            </div>

            <h3 className="font-bold mb-4">Earning history</h3>
            {[
              { action: 'Fixed cash drag on Chase', amount: 10 },
              { action: 'Emergency fund hit 3 months', amount: 25 },
              { action: 'Completed Fluency Score quiz', amount: 5 },
              { action: 'Score improved 10+ points', amount: 10 },
            ].map((item, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">{item.action}</span>
                <span className="text-[#34c759] font-bold">+{item.amount}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div className="card p-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Financial Fluency Score</h1>
            <p className="text-gray-500 mb-8">3 minutes · 10 questions · Free — no account needed</p>
            <button className="button-apple px-8 py-3">
              Start Quiz →
            </button>
          </div>
        )}
      </main>

      {/* Interactive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full md:w-[440px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-12 duration-300">
            <div className="p-8">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 md:hidden" />

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0071e3]/10 text-[#0071e3] mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">Execute Fund Swap</h3>
                <p className="text-gray-500">Instantly save $1,847/yr in hidden fees.</p>
              </div>

              <div className="bg-[#f5f5f7] p-5 rounded-2xl mb-8 border border-gray-200/60">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="text-[#ff3b30] font-semibold flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                    Sell FBALX
                  </div>
                  <span className="text-gray-500 font-medium">0.48% fee</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-[#34c759] font-bold text-lg flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Buy FXAIX
                  </div>
                  <span className="font-bold">0.015% fee</span>
                </div>
              </div>

              <button
                className={`w-full text-white rounded-2xl py-4 font-semibold text-lg shadow-md transition-all flex justify-center items-center ${
                  fixStatus === 'success' ? 'bg-[#34c759]' : 'bg-[#0071e3] hover:bg-[#0077ed] active:scale-95'
                }`}
                onClick={handleProcessFix}
                disabled={fixStatus !== 'idle'}
              >
                {fixStatus === 'idle' && 'Confirm 1-Tap Fix'}
                {fixStatus === 'loading' && (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing securely...
                  </>
                )}
                {fixStatus === 'success' && (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Fix Applied Successfully
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
