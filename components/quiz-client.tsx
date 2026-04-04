'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  q: string;
  opts: string[];
  correct: number;
  cat: 'Risk comprehension' | 'Tax efficiency' | 'Cash management' | 'Investment fees';
};

const QUESTIONS: Question[] = [
  {
    q: 'If your savings account earns 0.01% and a high-yield savings account earns 4.8%, what is the annual difference on a $20,000 balance?',
    opts: ['$2 difference', '$959 difference', '$96 difference', "No difference — they're insured the same"],
    correct: 1,
    cat: 'Cash management',
  },
  {
    q: 'What is an expense ratio?',
    opts: [
      'The fee a bank charges for overdrafts',
      'The annual fee a mutual fund charges as a % of assets',
      'The interest rate on a mortgage',
      'A government tax on investments',
    ],
    correct: 1,
    cat: 'Investment fees',
  },
  {
    q: 'Your employer matches 100% of your 401(k) contributions up to 6% of your salary. You contribute 3%. What are you missing?',
    opts: [
      'Nothing — 3% is the standard',
      'A 50% return on unclaimed match',
      'A guaranteed 100% return on each unclaimed dollar',
      'Tax penalties',
    ],
    correct: 2,
    cat: 'Risk comprehension',
  },
  {
    q: 'Under the 2025 One Big Beautiful Bill Act (OBBBA), overtime pay is now:',
    opts: [
      'Taxed at a higher rate',
      'Potentially fully deductible from taxable income',
      'No longer reported to the IRS',
      'Subject to FICA tax only',
    ],
    correct: 1,
    cat: 'Tax efficiency',
  },
  {
    q: 'What is QSBS (Qualified Small Business Stock)?',
    opts: [
      'A type of government bond',
      'Stock in a startup that may be 100% tax-free after 5 years',
      'A high-yield savings account',
      'A retirement account for self-employed people',
    ],
    correct: 1,
    cat: 'Tax efficiency',
  },
  {
    q: 'Your fund charges 0.80% per year. An identical fund charges 0.03%. On a $100,000 portfolio over 30 years at 7% returns, the fee difference costs you approximately:',
    opts: ['$770', '$7,700', '$77,000', '$770,000'],
    correct: 2,
    cat: 'Investment fees',
  },
  {
    q: 'What is a PTET election?',
    opts: [
      'A political vote for tax reform',
      'A way to deduct state income taxes at entity level, bypassing the SALT cap',
      'A penalty for late tax filing',
      'A retirement contribution vehicle',
    ],
    correct: 1,
    cat: 'Tax efficiency',
  },
  {
    q: 'If you have $5,000 in credit card debt at 22% interest and $10,000 in a savings account at 4.8%, what is the optimal move?',
    opts: [
      'Keep both — never touch savings',
      'Pay off the credit card with $5,000 from savings',
      'Invest the savings in stocks',
      'Make minimum payments on the card',
    ],
    correct: 1,
    cat: 'Cash management',
  },
  {
    q: "What is financial 'fee drag'?",
    opts: [
      'Interest charged on late payments',
      'The cumulative loss of returns caused by overpaying for investment products',
      'Bank fees for wire transfers',
      'Currency exchange costs',
    ],
    correct: 1,
    cat: 'Investment fees',
  },
  {
    q: 'Under CFPB Section 1033, which went into effect in 2026, you have the legal right to:',
    opts: [
      'Sue your bank for overdraft fees',
      'Share your financial data with any authorized third-party app at no cost',
      'Receive a government grant for financial literacy',
      'Opt out of credit bureau reporting',
    ],
    correct: 1,
    cat: 'Risk comprehension',
  },
];

function categoryScore(correctIndexes: number[], category: Question['cat']) {
  return QUESTIONS.filter((question) => question.cat === category).reduce((sum, question, index) => {
    const globalIndex = QUESTIONS.indexOf(question);
    return sum + (correctIndexes.includes(globalIndex) ? 1 : 0);
  }, 0);
}

export function QuizClient({
  initialScore,
}: {
  initialScore: number | null;
}) {
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    awarded: number;
    categoryScores: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const correctCount = useMemo(
    () =>
      answers.reduce(
        (sum, answer, index) => sum + (answer === QUESTIONS[index].correct ? 1 : 0),
        0
      ),
    [answers]
  );

  const liveScore =
    answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  async function moveNext() {
    if (selectedAnswer === null) return;

    const nextAnswers = [...answers, selectedAnswer];
    setAnswers(nextAnswers);
    setSelectedAnswer(null);

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex((value) => value + 1);
      return;
    }

    const finalCorrect = nextAnswers.reduce(
      (sum, answer, index) => sum + (answer === QUESTIONS[index].correct ? 1 : 0),
      0
    );
    const score = Math.round((finalCorrect / QUESTIONS.length) * 100);

    const categoryScores = {
      risk: categoryScore(
        nextAnswers
          .map((answer, index) => (answer === QUESTIONS[index].correct ? index : -1))
          .filter((index) => index >= 0),
        'Risk comprehension'
      ),
      tax: categoryScore(
        nextAnswers
          .map((answer, index) => (answer === QUESTIONS[index].correct ? index : -1))
          .filter((index) => index >= 0),
        'Tax efficiency'
      ),
      cash: categoryScore(
        nextAnswers
          .map((answer, index) => (answer === QUESTIONS[index].correct ? index : -1))
          .filter((index) => index >= 0),
        'Cash management'
      ),
      fees: categoryScore(
        nextAnswers
          .map((answer, index) => (answer === QUESTIONS[index].correct ? index : -1))
          .filter((index) => index >= 0),
        'Investment fees'
      ),
    };

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          correctCount: finalCorrect,
          totalQuestions: QUESTIONS.length,
          categoryScores,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'Could not save quiz result.');
      }

      setResult({
        score,
        awarded: payload.awarded ?? 0,
        categoryScores,
      });
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Could not save quiz result.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    const label =
      result.score >= 70
        ? "Strong foundation — now let's find your exact leaks."
        : result.score >= 50
          ? 'You know more than most, but there are still expensive blind spots.'
          : 'The good news: these gaps are fixable quickly once we turn them into actions.';
    const estimatedLeakage =
      result.score >= 70 ? '$4,000–$8,000' : result.score >= 50 ? '$8,200–$14,000' : '$12,000–$20,000';

    return (
      <div className="quiz-result-stack">
        <div className="score-result-card">
          <div
            className="score-result-number"
            style={{
              color:
                result.score >= 70 ? 'var(--green)' : result.score >= 50 ? 'var(--amber)' : 'var(--red)',
            }}
          >
            {result.score}
          </div>
          <div className="eyebrow">Your Financial Fluency Score</div>
          <p className="score-result-label">{label}</p>

          <div className="score-bars">
            {[
              ['Risk comprehension', result.categoryScores.risk, 2],
              ['Tax efficiency', result.categoryScores.tax, 3],
              ['Cash management', result.categoryScores.cash, 2],
              ['Investment fees', result.categoryScores.fees, 3],
            ].map(([labelText, scoreValue, total]) => {
              const percentage = Math.round((Number(scoreValue) / Number(total)) * 100);
              const color =
                percentage >= 70 ? 'var(--green)' : percentage >= 40 ? 'var(--amber)' : 'var(--red)';

              return (
                <div key={String(labelText)} className="score-bar-row">
                  <span className="score-bar-label">{labelText}</span>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{ width: `${percentage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="score-callout">
            Based on this score, we estimate <strong>{estimatedLeakage}</strong> in annual leakage.
            Connect statements to turn that estimate into a working Fix Queue.
          </div>

          <div className="inline-actions">
            <a href="/accounts" className="primary-link-button">
              Find my exact leakage
            </a>
            <a href="/dashboard" className="secondary-link-button">
              Back to dashboard
            </a>
          </div>
        </div>

        <div className="mini-note">
          {result.awarded > 0
            ? `+${result.awarded} $SOLV awarded.`
            : initialScore !== null
              ? 'Result saved. Quiz reward was already claimed on a previous attempt.'
              : 'Result saved.'}
        </div>
      </div>
    );
  }

  const question = QUESTIONS[questionIndex];
  const progress = ((questionIndex + 1) / QUESTIONS.length) * 100;

  return (
    <div className="quiz-stack">
      <div className="quiz-progress-card">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz-progress-meta">
          <span className="eyebrow">Question {questionIndex + 1} of {QUESTIONS.length}</span>
          <span className="quiz-live-score">Score: {liveScore}</span>
        </div>
      </div>

      <div className="quiz-question-card">
        <h2 className="quiz-question">{question.q}</h2>
        <div className="quiz-options">
          {question.opts.map((option, index) => {
            const isCorrect = selectedAnswer !== null && index === question.correct;
            const isWrong = selectedAnswer === index && index !== question.correct;

            const className = [
              'quiz-option',
              selectedAnswer === index ? 'selected' : '',
              isCorrect ? 'correct' : '',
              isWrong ? 'wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={option}
                type="button"
                className={className}
                onClick={() => setSelectedAnswer(index)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            );
          })}
        </div>

        {error ? <p className="inline-error">{error}</p> : null}

        {selectedAnswer !== null ? (
          <div className="quiz-actions">
            <button
              type="button"
              className="primary-button compact-button"
              onClick={() => void moveNext()}
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : questionIndex === QUESTIONS.length - 1
                  ? 'Finish quiz'
                  : 'Next'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
