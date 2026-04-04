'use client';

import { useState } from 'react';

interface Finding {
  id: string;
  category: string;
  badge: string;
  badgeType: string;
  amount: string;
  amountColor?: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  solv: number;
  disclaimer: string;
  fixed?: boolean;
  dismissible?: boolean;
}

interface FixQueueItem {
  id: string;
  meta: string;
  title: string;
  amount: string;
  description: string;
  action: string;
  actionLabel: string;
  solv: number;
  disclaimer: string;
}

interface SolvHistory {
  action: string;
  amount: number;
}

const QUESTIONS = [
  { q: "If your savings account earns 0.01% and a high-yield savings account earns 4.8%, what is the annual difference on a $20,000 balance?", opts: ["$2 difference", "$959 difference", "$96 difference", "No difference — they're insured the same"], correct: 1, cat: "Cash management" },
  { q: "What is an expense ratio?", opts: ["The fee a bank charges for overdrafts", "The annual fee a mutual fund charges as a % of assets", "The interest rate on a mortgage", "A government tax on investments"], correct: 1, cat: "Investment fees" },
  { q: "Your employer matches 100% of your 401(k) contributions up to 6% of your salary. You contribute 3%. What are you missing?", opts: ["Nothing — 3% is the standard", "A 50% return on unclaimed match", "A guaranteed 100% return on each unclaimed dollar", "Tax penalties"], correct: 2, cat: "Risk comprehension" },
  { q: "Under the 2025 One Big Beautiful Bill Act (OBBBA), overtime pay is now:", opts: ["Taxed at a higher rate", "Potentially fully deductible from taxable income", "No longer reported to the IRS", "Subject to FICA tax only"], correct: 1, cat: "Tax efficiency" },
  { q: "What is QSBS (Qualified Small Business Stock)?", opts: ["A type of government bond", "Stock in a startup that may be 100% tax-free after 5 years", "A high-yield savings account", "A retirement account for self-employed people"], correct: 1, cat: "Tax efficiency" },
  { q: "Your fund charges 0.80% per year. An identical fund charges 0.03%. On a $100,000 portfolio over 30 years at 7% returns, the fee difference costs you approximately:", opts: ["$770", "$7,700", "$77,000", "$770,000"], correct: 2, cat: "Investment fees" },
  { q: "What is a PTET election?", opts: ["A political vote for tax reform", "A way to deduct state income taxes at entity level, bypassing the SALT cap", "A penalty for late tax filing", "A retirement contribution vehicle"], correct: 1, cat: "Tax efficiency" },
  { q: "If you have $5,000 in credit card debt at 22% interest and $10,000 in a savings account at 4.8%, what is the optimal move?", opts: ["Keep both — never touch savings", "Pay off the credit card with $5,000 from savings", "Invest the savings in stocks", "Make minimum payments on the card"], correct: 1, cat: "Cash management" },
  { q: "What is financial 'fee drag'?", opts: ["Interest charged on late payments", "The cumulative loss of returns caused by overpaying for investment products", "Bank fees for wire transfers", "Currency exchange costs"], correct: 1, cat: "Investment fees" },
  { q: "Under CFPB Section 1033, which went into effect in 2026, you have the legal right to:", opts: ["Sue your bank for overdraft fees", "Share your financial data with any authorized third-party app at no cost", "Receive a government grant for financial literacy", "Opt out of credit bureau reporting"], correct: 1, cat: "Risk comprehension" }
];

const FINDINGS: Finding[] = [
  { id: 'f1', category: 'Cash Drag', badge: 'Cash Drag', badgeType: 'done', amount: '$883', amountColor: 'text-gray-400', title: '$18,400 sitting idle at 0.01% — FIXED', description: 'Moved $18,400 to Marcus HYSA earning 4.8%. You approved this on Monday. Saving $883/year starting now.', action: 'Approved', actionLabel: 'Approved', solv: 10, disclaimer: '', fixed: true, dismissible: false },
  { id: 'f2', category: 'Fee Drag', badge: 'Fee Drag', badgeType: 'cat', amount: '$1,847', title: 'Your Fidelity fund charges 18× too much', description: 'FBALX charges 0.48%/year. FXAIX tracks the exact same S&P 500 index at 0.015%. On your $205,000 balance, that\'s $1,847 in unnecessary fees per year.', action: 'Approve Swap', actionLabel: 'Approve Swap', solv: 10, disclaimer: 'Educational information only — not investment advice.' },
  { id: 'f3', category: 'Employer Match', badge: 'Employer Match', badgeType: 'wa', amount: '$3,200', title: "You're leaving $3,200 in free money on the table", description: 'You contribute 3% to your 401(k). Your employer matches 100% up to 6%. Increasing to 6% adds $3,200/year in employer contributions — a guaranteed 100% return on each dollar.', action: 'Increase to 6%', actionLabel: 'Increase to 6%', solv: 25, disclaimer: 'Educational information only. Adjust through your HR portal or Fidelity NetBenefits.' },
  { id: 'f4', category: 'OBBBA Deduction', badge: 'OBBBA Deduction', badgeType: 'wa', amount: '$3,080 est.', title: '$14,000 in overtime may be deductible under OBBBA', description: 'You received $14,000 in overtime in 2025. Under the One Big Beautiful Bill Act, this income may be fully deductible. At your estimated 22% tax rate, that\'s ~$3,080 in savings.', action: 'Generate CPA Memo', actionLabel: 'Generate CPA Memo', solv: 30, disclaimer: 'Tax deductibility requires CPA review. This memo is educational — not tax advice.' },
  { id: 'f5', category: 'Auto Loan Interest', badge: 'Auto Loan Interest', badgeType: 'wa', amount: '$2,420 est.', title: 'Your car loan interest may be deductible', description: 'You paid an estimated $2,420 in auto loan interest in 2025. Under OBBBA, qualifying vehicle loan interest up to $10,000 is now deductible. Ask your CPA to verify.', action: 'Add to CPA Memo', actionLabel: 'Add to CPA Memo', solv: 30, disclaimer: 'Deductibility varies. This is educational — not tax advice.', dismissible: true },
];

const FIX_QUEUE: FixQueueItem[] = [
  { id: 'fq1', meta: 'Fee Drag · One Tap · +10 $SOLV', title: 'Switch FBALX → FXAIX (Fidelity 500 Index)', amount: '$1,847', description: "Same S&P 500 exposure. 97% lower cost. We'll show you the Fidelity link to make the switch in under 3 minutes. No tax event triggered by switching within an IRA.", action: 'Approve', actionLabel: 'Approve → +10 $SOLV', solv: 10, disclaimer: 'Educational only. Not investment advice. Review with an advisor if unsure.' },
  { id: 'fq2', meta: 'Employer Match · Must Do · +25 $SOLV', title: 'Increase 401(k) contribution 3% → 6%', amount: '$3,200', description: 'Your employer matches 100% up to 6%. You\'re at 3%. This is a guaranteed 100% return on each new dollar contributed — the single highest-return action in your Fix Queue.', action: 'Approve', actionLabel: 'Approve → +25 $SOLV', solv: 25, disclaimer: 'Educational only. Adjust through your HR portal or Fidelity NetBenefits.' },
  { id: 'fq3', meta: 'OBBBA Deductions · Needs CPA · +30 $SOLV', title: 'Send deduction summary to your CPA', amount: '$5,500 est.', description: "We've prepared a 1-page memo covering your $14,000 overtime deduction and $2,420 auto loan interest deduction. Tap to open a pre-filled email ready to send to your CPA before they file.", action: 'Send', actionLabel: 'Send CPA Memo → +30 $SOLV', solv: 30, disclaimer: 'Tax deductibility requires CPA review. This memo is educational — not tax advice.' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'dash' | 'findings' | 'fixq' | 'solv' | 'quiz'>('dash');
  const [solvBalance, setSolvBalance] = useState(847);
  const [score, setScore] = useState(71);
  const [fixedSum, setFixedSum] = useState(883);
  const [findings, setFindings] = useState(FINDINGS);
  const [fixQueue, setFixQueue] = useState(FIX_QUEUE);
  const [solvHistory, setSolvHistory] = useState<SolvHistory[]>([
    { action: 'Fixed cash drag on Chase', amount: 10 },
    { action: 'Emergency fund hit 3 months', amount: 25 },
    { action: 'Completed Fluency Score quiz', amount: 5 },
    { action: 'Score improved 10+ points', amount: 10 },
  ]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const badgeClass = (type: string) => {
    switch (type) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'go': return 'bg-green-100 text-green-800';
      case 'wa': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const approveFinding = (id: string, solv: number, label: string) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, fixed: true, action: 'Approved', actionLabel: 'Approved', dismissible: false } : f));
    setSolvBalance(prev => prev + solv);
    setScore(prev => Math.min(100, prev + 5));
    showToast(`${label} · +${solv} $SOLV`);
    setSolvHistory(prev => [{ action: label.split('·')[0].trim(), amount: solv }, ...prev]);
  };

  const dismissFinding = (id: string) => {
    setFindings(prev => prev.filter(f => f.id !== id));
  };

  const doFix = (id: string, solv: number, label: string) => {
    setFixQueue(prev => prev.filter(f => f.id !== id));
    setSolvBalance(prev => prev + solv);
    setScore(prev => Math.min(100, prev + 5));
    showToast(`${label.split('·')[0].trim()} · +${solv} $SOLV`);
    setSolvHistory(prev => [{ action: label.split('·')[0].trim().replace('→', '').trim(), amount: solv }, ...prev]);
  };

  const dismissFix = (id: string) => {
    setFixQueue(prev => prev.filter(f => f.id !== id));
  };

  const selectQuizOption = (optIndex: number) => {
    if (quizAnswers[quizIndex] !== undefined) return;
    const newAnswers = [...quizAnswers, optIndex];
    setQuizAnswers(newAnswers);
    if (optIndex === QUESTIONS[quizIndex].correct) {
      setQuizCorrect(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (quizIndex < QUESTIONS.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizDone(true);
    }
  };

  const solvPct = Math.min((solvBalance / 1000) * 100, 100);
  const solvToArchitect = Math.max(0, 1000 - solvBalance);
  const isArchitect = solvBalance >= 1000;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium z-50 animate-fade-in">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 flex overflow-x-auto">
          {[
            { id: 'dash', label: 'Dashboard' },
            { id: 'findings', label: 'Findings' },
            { id: 'fixq', label: 'Fix Queue', count: fixQueue.length },
            { id: 'solv', label: '$SOLV' },
            { id: 'quiz', label: 'Fluency Quiz' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {activeTab === 'dash' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-medium">Good morning, Sarah <span className="font-normal text-gray-500 text-sm">— 11 days left in trial</span></h1>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-4 flex gap-4">
                  <div className="text-5xl font-medium text-green-600 leading-none">{score}</div>
                  <div className="flex-1">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Solvency Score</div>
                    <div className="text-sm font-medium text-green-600">+13 this month</div>
                    <div className="text-xs text-gray-500 mb-2">Cash drag fixed — $883/year recovered</div>
                    <div className="h-1 bg-gray-200 rounded-full">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                </div>
                <div className="w-48 bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-2">Total found</div>
                  <div className="text-xl font-medium text-red-600 mb-3">$11,430/yr</div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-600"><span>Cash drag</span><span>$883</span></div>
                    <div className="flex justify-between text-gray-600"><span>Fee drag</span><span>$1,847</span></div>
                    <div className="flex justify-between text-gray-600"><span>Match gap</span><span>$3,200</span></div>
                    <div className="flex justify-between text-gray-600"><span>OBBBA</span><span>$5,500</span></div>
                    <div className="flex justify-between font-medium pt-1.5 border-t border-gray-200"><span>Fixed ✓</span><span className="text-green-600">${fixedSum}</span></div>
                  </div>
                </div>
              </div>

              <button onClick={() => setActiveTab('fixq')} className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 flex justify-between items-center hover:bg-amber-100 transition-colors">
                <div>
                  <div className="text-sm font-medium text-amber-800">{fixQueue.length} fixes ready — one tap each</div>
                  <div className="text-xs text-amber-700">Takes under 2 minutes · Earns $SOLV</div>
                </div>
                <div className="text-amber-800 text-xl">→</div>
              </button>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass('cat')}`}>Fee Drag</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass('go')}`}>One Tap</span>
                  </div>
                  <div className="text-2xl font-medium text-green-600">$1,847 <span className="text-xs text-gray-400 font-normal">/ yr</span></div>
                </div>
                <div className="text-sm font-medium mb-1">Your Fidelity fund charges 18× too much</div>
                <div className="text-sm text-gray-600 mb-3">FBALX charges 0.48%/year. FXAIX tracks the same S&P 500 index at 0.015%. On your $205K balance, that&apos;s $1,847 in unnecessary fees every year.</div>
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('findings')} className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:opacity-85 transition-opacity">See Swap Option</button>
                  <button className="bg-transparent text-gray-500 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Learn more</button>
                </div>
                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">Educational information only — not investment advice.</div>
              </div>
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-medium">Your findings</h1>
                <p className="text-sm text-gray-500">Total: <strong className="text-green-600">$11,430/year</strong> across 5 leakage categories</p>
              </div>

              {findings.map(finding => (
                <div key={finding.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-1.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass(finding.badgeType)}`}>{finding.badge}</span>
                      {finding.fixed && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass('done')}`}>Fixed ✓</span>}
                    </div>
                    <div className={`text-2xl font-medium ${finding.amountColor || 'text-green-600'}`}>
                      {finding.amount} <span className="text-xs text-gray-400 font-normal">/ yr</span>
                    </div>
                  </div>
                  <div className={`text-sm font-medium mb-1 ${finding.fixed ? 'text-gray-400' : ''}`}>{finding.title}</div>
                  <div className="text-sm text-gray-600 mb-3">{finding.description}</div>
                  <div className="flex gap-2">
                    {finding.fixed ? (
                      <button disabled className="bg-green-500 text-white text-xs font-medium px-3 py-2 rounded-lg cursor-default opacity-70">Approved ✓</button>
                    ) : (
                      <>
                        <button onClick={() => approveFinding(finding.id, finding.solv, finding.actionLabel)} className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:opacity-85 transition-opacity">{finding.action}</button>
                        {finding.dismissible && <button onClick={() => dismissFinding(finding.id)} className="bg-transparent text-gray-500 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Dismiss</button>}
                      </>
                    )}
                  </div>
                  {finding.disclaimer && <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">{finding.disclaimer}</div>}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'fixq' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-medium">Fix Queue</h1>
                <p className="text-sm text-gray-500">Review and approve. Every fix earns $SOLV.</p>
              </div>

              {fixQueue.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">All caught up. We&apos;re monitoring for new opportunities.</div>
              ) : (
                fixQueue.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">{item.meta}</div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xl font-medium text-green-600 whitespace-nowrap">{item.amount} <span className="text-xs text-gray-400 font-normal">/ yr</span></div>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{item.description}</div>
                    <div className="flex gap-2">
                      <button onClick={() => doFix(item.id, item.solv, item.actionLabel)} className="bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:opacity-85 transition-opacity">{item.actionLabel}</button>
                      <button onClick={() => dismissFix(item.id)} className="bg-transparent text-gray-500 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Dismiss</button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{item.disclaimer}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'solv' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-medium">Your $SOLV</h1>
                <p className="text-sm text-gray-500">Earned through financial health actions. Soul-bound — cannot be transferred or sold.</p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Balance</div>
                    <div className="text-2xl font-medium text-blue-600">{solvBalance} $SOLV</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${isArchitect ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                    {isArchitect ? 'Architect' : 'Protector'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full mb-2">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${solvPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>500 — Protector</span>
                  <span className="text-blue-600 font-medium">{solvToArchitect > 0 ? `${solvToArchitect} to Architect` : 'Architect unlocked!'}</span>
                  <span>1,000 — Architect</span>
                </div>
              </div>

              <div className="text-sm font-medium">Architect tier unlocks (1,000 $SOLV)</div>
              {[
                { name: 'Alt Alpha Pool', desc: 'Private credit and real estate access' },
                { name: 'Priority scanning', desc: 'Real-time account monitoring' },
                { name: 'Trump Account setup', desc: 'Automated generational wealth for your children' },
              ].map((unlock, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">{unlock.name}</div>
                    <div className="text-xs text-gray-500">{unlock.desc}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isArchitect ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {isArchitect ? 'Unlocked ✓' : `${solvToArchitect} away`}
                  </span>
                </div>
              ))}

              <div className="text-sm font-medium">Earning history</div>
              {solvHistory.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600">{item.action}</span>
                  <span className="text-green-600 font-medium">+{item.amount}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {!quizDone ? (
                <>
                  <div>
                    <h1 className="text-lg font-medium">Financial Fluency Score</h1>
                    <p className="text-sm text-gray-500">3 minutes · 10 questions · Free — no account needed</p>
                  </div>

                  <div className="h-1 bg-gray-200 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((quizIndex + 1) / 10) * 100}%` }} />
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mb-3">
                    <span>Question {quizIndex + 1} of 10</span>
                    <span className="font-medium text-blue-600">Score: {quizCorrect}</span>
                  </div>

                  <div className="text-base font-medium leading-relaxed">{QUESTIONS[quizIndex].q}</div>

                  <div className="space-y-2">
                    {QUESTIONS[quizIndex].opts.map((opt, i) => {
                      const answered = quizAnswers[quizIndex] !== undefined;
                      const isCorrect = i === QUESTIONS[quizIndex].correct;
                      const isSelected = quizAnswers[quizIndex] === i;
                      let className = 'p-3 border border-gray-200 rounded-lg cursor-pointer text-sm transition-colors hover:border-blue-500 hover:bg-blue-50';
                      if (answered) {
                        if (isCorrect) className = 'p-3 border border-green-500 bg-green-50 text-green-800 rounded-lg text-sm font-medium';
                        else if (isSelected) className = 'p-3 border border-red-500 bg-red-50 text-red-800 rounded-lg text-sm';
                        else className = 'p-3 border border-gray-200 rounded-lg text-sm text-gray-400';
                      }
                      return (
                        <div key={i} onClick={() => selectQuizOption(i)} className={className}>{opt}</div>
                      );
                    })}
                  </div>

                  {quizAnswers[quizIndex] !== undefined && (
                    <div className="flex justify-end">
                      <button onClick={nextQuestion} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-85 transition-opacity">
                        {quizIndex < QUESTIONS.length - 1 ? 'Next →' : 'See Results'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-5xl font-medium text-amber-600 mb-2">{Math.round((quizCorrect / 10) * 100)}</div>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-400">Your Financial Fluency Score</div>
                  <div className="text-sm text-gray-500 mt-2 mb-4">
                    {quizCorrect >= 7 ? "Strong foundation — let's find and fix your specific leaks." :
                     quizCorrect >= 5 ? "You know more than most — but there are gaps costing you money." :
                     "Significant gaps identified. The good news: they're all fixable automatically."}
                  </div>

                  <div className="space-y-2 text-left mb-4">
                    {[
                      { label: 'Risk comprehension', score: 50 },
                      { label: 'Tax efficiency', score: 30 },
                      { label: 'Cash management', score: 80 },
                      { label: 'Investment fees', score: 60 },
                    ].map((bar, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-28 text-gray-500">{bar.label}</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                          <div className={`h-full rounded-full ${bar.score >= 70 ? 'bg-green-500' : bar.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${bar.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-4">
                    Based on your score, we estimate you have <strong className="text-green-600">$8,200–$14,000</strong> in annual financial leakage. Connect your accounts to find the exact amount.
                  </div>

                  <button onClick={() => showToast('Sign up at shadowcfo.com to connect your accounts')} className="w-full bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-85 transition-opacity">
                    Find My Exact Leakage →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </main>
  );
}
