import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function seedDemoUser(userId: string, email: string) {
  // Create user profile
  const { error: profileError } = await supabase.from('user_profiles').upsert({
    id: userId,
    email,
    full_name: 'Sarah',
    is_demo: true,
    trial_ends_at: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    solv_balance: 847,
    solvency_score: 71,
  });

  if (profileError) {
    console.error('Error seeding user profile:', profileError);
    throw profileError;
  }

  // Create findings
  const findings = [
    {
      user_id: userId,
      category: 'cash_drag',
      title: '$18,400 sitting idle at 0.01% — FIXED',
      description: 'Moved $18,400 to Marcus HYSA earning 4.8%. You approved this on Monday. Saving $883/year starting now.',
      impact_amount_cents: 88300,
      impact_amount_display: '$883',
      priority: 'high',
      status: 'fixed',
      badge: 'Fixed',
      badge_color: 'green',
      disclaimer: null,
    },
    {
      user_id: userId,
      category: 'fee_drag',
      title: 'Your Fidelity fund charges 18× too much',
      description: 'FBALX charges 0.48%/year. FXAIX tracks the exact same S&P 500 index at 0.015%. On your $205,000 balance, that\'s $1,847 in unnecessary fees per year.',
      impact_amount_cents: 184700,
      impact_amount_display: '$1,847',
      priority: 'medium',
      status: 'active',
      badge: 'One Tap',
      badge_color: 'green',
      disclaimer: 'Educational information only — not investment advice.',
    },
    {
      user_id: userId,
      category: 'employer_match',
      title: "You're leaving $3,200 in free money on the table",
      description: 'You contribute 3% to your 401(k). Your employer matches 100% up to 6%. Increasing to 6% adds $3,200/year in employer contributions — a guaranteed 100% return on each dollar.',
      impact_amount_cents: 320000,
      impact_amount_display: '$3,200',
      priority: 'high',
      status: 'active',
      badge: 'High Priority',
      badge_color: 'amber',
      disclaimer: 'Educational information only — adjust through your HR portal or Fidelity NetBenefits.',
    },
    {
      user_id: userId,
      category: 'obbba',
      title: '$14,000 in overtime may be deductible under OBBBA',
      description: 'You received $14,000 in overtime in 2025. Under the One Big Beautiful Bill Act, this income may be fully deductible. At your estimated 22% tax rate, that\'s ~$3,080 in savings.',
      impact_amount_cents: 308000,
      impact_amount_display: '$3,080 est.',
      priority: 'medium',
      status: 'active',
      badge: 'Needs CPA',
      badge_color: 'amber',
      disclaimer: 'Tax deductibility requires CPA review. This memo is educational — not tax advice.',
    },
    {
      user_id: userId,
      category: 'auto_loan',
      title: 'Your car loan interest may be deductible',
      description: 'You paid an estimated $2,420 in auto loan interest in 2025. Under OBBBA, qualifying vehicle loan interest up to $10,000 is now deductible. Ask your CPA to verify.',
      impact_amount_cents: 242000,
      impact_amount_display: '$2,420 est.',
      priority: 'low',
      status: 'active',
      badge: 'OBBBA',
      badge_color: 'amber',
      disclaimer: 'Deductibility varies. This is educational — not tax advice.',
    },
  ];

  const { data: insertedFindings, error: findingsError } = await supabase
    .from('findings')
    .insert(findings)
    .select('id, category');

  if (findingsError) {
    console.error('Error seeding findings:', findingsError);
    throw findingsError;
  }

  // Create fix actions for active findings
  const fixActions = [
    {
      user_id: userId,
      finding_id: insertedFindings.find((f) => f.category === 'fee_drag')?.id,
      title: 'Switch FBALX → FXAIX (Fidelity 500 Index)',
      description: "Same S&P 500 exposure. 97% lower cost. We'll show you the Fidelity link to make the switch in under 3 minutes. No tax event triggered by switching within an IRA.",
      impact_amount_cents: 184700,
      impact_amount_display: '$1,847',
      meta: 'Fee Drag · One Tap',
      solv_reward: 10,
      action_type: 'one_tap',
      status: 'pending',
    },
    {
      user_id: userId,
      finding_id: insertedFindings.find((f) => f.category === 'employer_match')?.id,
      title: 'Increase 401(k) contribution 3% → 6%',
      description: 'Your employer matches 100% up to 6%. You\'re at 3%. This is a guaranteed 100% return on each new dollar contributed — the single highest-return action in your Fix Queue.',
      impact_amount_cents: 320000,
      impact_amount_display: '$3,200',
      meta: 'Employer Match · Must Do',
      solv_reward: 25,
      action_type: 'manual',
      status: 'pending',
    },
    {
      user_id: userId,
      finding_id: insertedFindings.find((f) => f.category === 'obbba')?.id,
      title: 'Send deduction summary to your CPA',
      description: "We've prepared a 1-page memo covering your $14,000 overtime deduction and $2,420 auto loan interest deduction. Tap to open a pre-filled email ready to send to your CPA before they file.",
      impact_amount_cents: 550000,
      impact_amount_display: '$5,500 est.',
      meta: 'OBBBA Deductions · Needs CPA',
      solv_reward: 30,
      action_type: 'needs_cpa',
      status: 'pending',
    },
  ];

  const { error: actionsError } = await supabase.from('fix_actions').insert(fixActions);

  if (actionsError) {
    console.error('Error seeding fix actions:', actionsError);
    throw actionsError;
  }

  // Create $SOLV history
  const solvHistory = [
    { user_id: userId, amount: 10, action: 'Fixed cash drag on Chase', source: 'fix_completed' },
    { user_id: userId, amount: 25, action: 'Emergency fund hit 3 months', source: 'milestone' },
    { user_id: userId, amount: 5, action: 'Completed Fluency Score quiz', source: 'quiz' },
    { user_id: userId, amount: 10, action: 'Score improved 10+ points', source: 'milestone' },
  ];

  const { error: solvError } = await supabase.from('solv_history').insert(solvHistory);

  if (solvError) {
    console.error('Error seeding SOLV history:', solvError);
    throw solvError;
  }

  console.log('Demo user seeded successfully:', userId);
  return true;
}

export async function createDemoUser() {
  const email = `demo_${Date.now()}@shadowcfo.app`;
  const password = 'demo-password-' + Math.random().toString(36).substring(7);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { is_demo: true },
  });

  if (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }

  if (data.user) {
    await seedDemoUser(data.user.id, email);
  }

  return { user: data.user, email, password };
}
