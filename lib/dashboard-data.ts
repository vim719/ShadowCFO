import { requireAuth } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';

export type AppProfile = {
  id: string;
  email: string;
  full_name: string | null;
  is_demo: boolean | null;
  trial_ends_at: string | null;
  solv_balance: number | null;
  solvency_score: number | null;
};

export type AppFinding = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  impact_amount_cents: number | null;
  impact_amount_display: string | null;
  priority: string | null;
  status: string;
  badge: string | null;
  badge_color: string | null;
  disclaimer: string | null;
  created_at: string;
};

export type AppFixAction = {
  id: string;
  user_id: string;
  finding_id: string | null;
  title: string;
  description: string | null;
  impact_amount_cents: number | null;
  impact_amount_display: string | null;
  meta: string | null;
  solv_reward: number | null;
  action_type: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
};

export type AppSolvHistory = {
  id: string;
  user_id: string;
  amount: number;
  action: string;
  source: string | null;
  created_at: string;
};

export type AppQuizResult = {
  id: string;
  user_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  category_scores: Record<string, number> | null;
  created_at: string;
};

export function formatCurrencyFromCents(amountCents: number | null | undefined): string {
  const amount = (amountCents ?? 0) / 100;
  return `$${amount.toLocaleString()}`;
}

export function formatCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getTier(balance: number): 'Starter' | 'Protector' | 'Architect' {
  if (balance >= 1000) return 'Architect';
  if (balance >= 500) return 'Protector';
  return 'Starter';
}

export function calculateTrialDays(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 14;

  const days = Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(days, 0);
}

export async function getDashboardData() {
  const user = await requireAuth();
  const supabase = createSupabaseAdminClient();

  const [{ data: profile }, { data: findings }, { data: actions }, { data: solvHistory }, { data: quizResults }] =
    await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single<AppProfile>(),
      supabase.from('findings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).returns<AppFinding[]>(),
      supabase.from('fix_actions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).returns<AppFixAction[]>(),
      supabase.from('solv_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20).returns<AppSolvHistory[]>(),
      supabase.from('quiz_results').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).returns<AppQuizResult[]>(),
    ]);

  const safeProfile: AppProfile = profile ?? {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name ?? null,
    is_demo: false,
    trial_ends_at: null,
    solv_balance: 0,
    solvency_score: 50,
  };

  const safeFindings = findings ?? [];
  const safeActions = actions ?? [];
  const safeSolvHistory = solvHistory ?? [];
  const latestQuiz = quizResults?.[0] ?? null;

  const activeFindings = safeFindings.filter((finding) => finding.status === 'active');
  const fixedFindings = safeFindings.filter((finding) => finding.status === 'fixed');
  const pendingActions = safeActions.filter((action) => action.status === 'pending');
  const completedActions = safeActions.filter((action) => action.status === 'completed');

  const totalLeakageCents = activeFindings.reduce(
    (sum, finding) => sum + (finding.impact_amount_cents ?? 0),
    0
  );
  const fixedAmountCents = fixedFindings.reduce(
    (sum, finding) => sum + (finding.impact_amount_cents ?? 0),
    0
  );

  return {
    user,
    profile: safeProfile,
    findings: safeFindings,
    actions: safeActions,
    solvHistory: safeSolvHistory,
    latestQuiz,
    activeFindings,
    fixedFindings,
    pendingActions,
    completedActions,
    stats: {
      totalLeakageCents,
      fixedAmountCents,
      totalLeakageDisplay: formatCurrencyFromCents(totalLeakageCents),
      fixedAmountDisplay: formatCurrencyFromCents(fixedAmountCents),
      trialDays: calculateTrialDays(safeProfile.trial_ends_at),
      tier: getTier(safeProfile.solv_balance ?? 0),
    },
  };
}
