import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function createUser(email: string, password: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;
  return data;
}

export async function seedDemoData(userId: string, email: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create profile
  await supabase.from('user_profiles').insert({
    id: userId,
    email,
    full_name: 'Sarah',
    is_demo: true,
    trial_ends_at: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
    solv_balance: 847,
    solvency_score: 71,
  });

  // Create findings
  const findingsData = [
    { user_id: userId, category: 'cash_drag', title: '$18,400 sitting idle at 0.01% — FIXED', description: 'Moved $18,400 to Marcus HYSA earning 4.8%. Saving $883/year starting now.', impact_amount_cents: 88300, impact_amount_display: '$883', priority: 'high', status: 'fixed', badge: 'Fixed', badge_color: 'green', disclaimer: null },
    { user_id: userId, category: 'fee_drag', title: 'Your Fidelity fund charges 18× too much', description: 'FBALX charges 0.48%/year. FXAIX tracks the same index at 0.015%. On your $205,000 balance, that\'s $1,847 in unnecessary fees per year.', impact_amount_cents: 184700, impact_amount_display: '$1,847', priority: 'medium', status: 'active', badge: 'One Tap', badge_color: 'green', disclaimer: 'Educational information only — not investment advice.' },
    { user_id: userId, category: 'employer_match', title: "You're leaving $3,200 in free money on the table", description: 'You contribute 3% to your 401(k). Your employer matches 100% up to 6%. Increasing to 6% adds $3,200/year in employer contributions.', impact_amount_cents: 320000, impact_amount_display: '$3,200', priority: 'high', status: 'active', badge: 'High Priority', badge_color: 'amber', disclaimer: 'Educational information only — adjust through your HR portal.' },
    { user_id: userId, category: 'obbba', title: '$14,000 in overtime may be deductible under OBBBA', description: 'You received $14,000 in overtime in 2025. Under OBBBA, this income may be fully deductible. At your 22% tax rate, that\'s ~$3,080 in savings.', impact_amount_cents: 308000, impact_amount_display: '$3,080', priority: 'medium', status: 'active', badge: 'Needs CPA', badge_color: 'amber', disclaimer: 'Tax deductibility requires CPA review.' },
    { user_id: userId, category: 'auto_loan', title: 'Your car loan interest may be deductible', description: 'You paid an estimated $2,420 in auto loan interest in 2025. Under OBBBA, qualifying vehicle loan interest up to $10,000 is now deductible.', impact_amount_cents: 242000, impact_amount_display: '$2,420', priority: 'low', status: 'active', badge: 'OBBBA', badge_color: 'amber', disclaimer: 'Deductibility varies.' },
  ];

  const { data: insertedFindings } = await supabase.from('findings').insert(findingsData).select('id, category');

  // Create fix actions
  const actionsData = [
    { user_id: userId, finding_id: insertedFindings?.find(f => f.category === 'fee_drag')?.id, title: 'Switch FBALX → FXAIX (Fidelity 500 Index)', description: 'Same S&P 500 exposure. 97% lower cost. We\'ll show you the Fidelity link.', impact_amount_cents: 184700, impact_amount_display: '$1,847', meta: 'Fee Drag · One Tap', solv_reward: 10, action_type: 'one_tap', status: 'pending' },
    { user_id: userId, finding_id: insertedFindings?.find(f => f.category === 'employer_match')?.id, title: 'Increase 401(k) contribution 3% → 6%', description: 'Guaranteed 100% return on each new dollar contributed.', impact_amount_cents: 320000, impact_amount_display: '$3,200', meta: 'Employer Match · Must Do', solv_reward: 25, action_type: 'manual', status: 'pending' },
    { user_id: userId, finding_id: insertedFindings?.find(f => f.category === 'obbba')?.id, title: 'Send deduction summary to your CPA', description: 'We\'ve prepared a 1-page memo covering your deductions.', impact_amount_cents: 550000, impact_amount_display: '$5,500', meta: 'OBBBA Deductions · Needs CPA', solv_reward: 30, action_type: 'needs_cpa', status: 'pending' },
  ];

  await supabase.from('fix_actions').insert(actionsData);

  // Create SOLV history
  await supabase.from('solv_history').insert([
    { user_id: userId, amount: 10, action: 'Fixed cash drag on Chase', source: 'fix_completed' },
    { user_id: userId, amount: 25, action: 'Emergency fund hit 3 months', source: 'milestone' },
    { user_id: userId, amount: 5, action: 'Completed Fluency Score quiz', source: 'quiz' },
    { user_id: userId, amount: 10, action: 'Score improved 10+ points', source: 'milestone' },
  ]);
}
