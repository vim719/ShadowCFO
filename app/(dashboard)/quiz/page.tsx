'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxxezkoiyxrnwtdrchtz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eGV6a29peXhybnd0ZHJjaHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjM3MTcsImV4cCI6MjA5MDgzOTcxN30.ldVjon3CvC8Fv1UFJqxDwMx-IEOritV8pr-6CDXjigw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export default function QuizPage() {
  const router = useRouter();
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectOption = (i: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(i);
    const newAnswers = [...userAnswers, i];
    setUserAnswers(newAnswers);
    if (i === QUESTIONS[qi].correct) {
      setCorrect(correct + 1);
    }
  };

  const nextQuestion = async () => {
    if (qi + 1 >= QUESTIONS.length) {
      // Quiz complete - save result and award $SOLV
      const score = Math.round((correct / QUESTIONS.length) * 100);
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Save quiz result
          await supabase.from('quiz_results').insert({
            user_id: user.id,
            score,
            correct_count: correct,
            total_questions: QUESTIONS.length,
            category_scores: {},
          });

          // Award $SOLV for completing quiz
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('solv_balance')
            .eq('id', user.id)
            .single();

          if (profile) {
            await supabase
              .from('user_profiles')
              .update({ solv_balance: profile.solv_balance + 5 })
              .eq('id', user.id);

            await supabase.from('solv_history').insert({
              user_id: user.id,
              amount: 5,
              action: 'Completed Fluency Score quiz',
              source: 'quiz',
            });
          }
        }
      } catch (err) {
        console.error('Error saving quiz result:', err);
      }
      
      setLoading(false);
      setShowResult(true);
    } else {
      setQi(qi + 1);
      setSelectedOpt(null);
    }
  };

  const getScore = () => Math.round((correct / QUESTIONS.length) * 100);

  const getCategoryScores = () => {
    const cats = { risk: 0, tax: 0, cash: 0, fees: 0 };
    QUESTIONS.forEach((q, i) => {
      if (userAnswers[i] === q.correct) {
        if (q.cat === 'Risk comprehension') cats.risk++;
        else if (q.cat === 'Tax efficiency') cats.tax++;
        else if (q.cat === 'Cash management') cats.cash++;
        else if (q.cat === 'Investment fees') cats.fees++;
      }
    });
    return cats;
  };

  const cats = getCategoryScores();

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Quiz Complete!</h1>
        
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8 text-center mb-8">
          <div className="text-7xl font-bold mb-4" style={{ color: getScore() >= 70 ? '#34d399' : getScore() >= 50 ? '#eab308' : '#f87171' }}>
            {getScore()}
          </div>
          <div className="text-gray-400">Your Financial Fluency Score</div>
          <div className="mt-4 text-lg">
            {getScore() >= 70 ? "Strong foundation!" : getScore() >= 50 ? "You know more than most." : "Let's learn together."}
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
          {[
            { label: 'Risk comprehension', cats: cats.risk, total: 3 },
            { label: 'Tax efficiency', cats: cats.tax, total: 3 },
            { label: 'Cash management', cats: cats.cash, total: 2 },
            { label: 'Investment fees', cats: cats.fees, total: 3 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 mb-3">
              <span className="text-gray-400 w-40">{item.label}</span>
              <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: `${(item.cats / item.total) * 100}%`,
                    backgroundColor: (item.cats / item.total) * 100 >= 70 ? '#34d399' : (item.cats / item.total) * 100 >= 40 ? '#eab308' : '#f87171'
                  }} 
                />
              </div>
              <span className="text-sm text-gray-400 w-12">{item.cats}/{item.total}</span>
            </div>
          ))}
        </div>

        <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4 text-center">
          <span className="text-emerald-400 font-semibold">+5 $SOLV earned!</span>
        </div>

        <a href="/dashboard" className="block text-center mt-8 text-emerald-400 hover:text-emerald-300">
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Financial Fluency Quiz</h1>
      <p className="text-gray-400 mb-8">Test your financial knowledge. Earn $SOLV!</p>

      {/* Progress */}
      <div className="mb-6">
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${((qi + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Question {qi + 1} of {QUESTIONS.length}</span>
          <span className="text-emerald-400 font-medium">Score: {Math.round((correct / (qi + 1)) * 100) || 0}%</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">{QUESTIONS[qi].q}</h2>
        
        <div className="space-y-3">
          {QUESTIONS[qi].opts.map((opt, i) => {
            let cls = 'border-dark-700 hover:bg-dark-800';
            if (selectedOpt !== null) {
              if (i === QUESTIONS[qi].correct) cls = 'border-emerald-500 bg-emerald-900/20';
              else if (i === selectedOpt) cls = 'border-red-500 bg-red-900/20';
            }
            
            return (
              <button
                key={i}
                onClick={() => selectOption(i)}
                disabled={selectedOpt !== null}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${cls} ${selectedOpt !== null ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selectedOpt !== null && (
          <button
            onClick={nextQuestion}
            disabled={loading}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : qi + 1 >= QUESTIONS.length ? 'Finish Quiz' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}