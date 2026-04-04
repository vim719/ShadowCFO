import { QuizClient } from '@/components/quiz-client';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function QuizPage() {
  const { latestQuiz } = await getDashboardData();

  return (
    <div className="screen-stack">
      <div>
        <div className="page-title">Financial Fluency Score</div>
        <p className="page-subtitle">3 minutes · 10 questions · educational only</p>
      </div>

      <QuizClient initialScore={latestQuiz?.score ?? null} />
    </div>
  );
}
