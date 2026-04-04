import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create profile with demo data
    if (data.user) {
      const userId = data.user.id;
      
      // Insert profile
      await supabase.from('user_profiles').insert({
        id: userId,
        email,
        full_name: email.split('@')[0],
        is_demo: false,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        solv_balance: 50,
        solvency_score: 55,
      });

      // Insert demo findings so features aren't empty
      await supabase.from('findings').insert([
        { user_id: userId, category: 'cash_drag', title: '$18,400 sitting idle at 0.01%', description: 'Your savings account earns minimal interest. Consider a high-yield savings account.', impact_amount_cents: 88300, impact_amount_display: '$883', priority: 'high', status: 'active', badge: 'One Tap', badge_color: 'green', disclaimer: 'Educational only.' },
        { user_id: userId, category: 'fee_drag', title: 'Your fund charges 18× too much', description: 'High expense ratios eat into returns over time. Consider lower-cost index funds.', impact_amount_cents: 184700, impact_amount_display: '$1,847', priority: 'medium', status: 'active', badge: 'One Tap', badge_color: 'green', disclaimer: 'Educational only.' },
        { user_id: userId, category: 'employer_match', title: "You're leaving free money on the table", description: 'Your employer matches contributions. Increasing your contribution can yield guaranteed returns.', impact_amount_cents: 320000, impact_amount_display: '$3,200', priority: 'high', status: 'active', badge: 'High Priority', badge_color: 'amber', disclaimer: 'Adjust through HR portal.' },
        { user_id: userId, category: 'obbba', title: 'Overtime may be deductible under OBBBA', description: 'Under the One Big Beautiful Bill Act, certain overtime may be fully deductible.', impact_amount_cents: 308000, impact_amount_display: '$3,080', priority: 'medium', status: 'active', badge: 'Needs CPA', badge_color: 'amber', disclaimer: 'CPA review required.' },
      ]);

      // Insert demo actions
      await supabase.from('fix_actions').insert([
        { user_id: userId, title: 'Switch to high-yield savings', description: 'Move idle cash to earn 4.5-5% APY.', impact_amount_cents: 88300, impact_amount_display: '$883', meta: 'Cash Drag · One Tap', solv_reward: 10, action_type: 'one_tap', status: 'pending' },
        { user_id: userId, title: 'Switch to low-cost index fund', description: 'Same exposure, dramatically lower fees.', impact_amount_cents: 184700, impact_amount_display: '$1,847', meta: 'Fee Drag · One Tap', solv_reward: 10, action_type: 'one_tap', status: 'pending' },
        { user_id: userId, title: 'Increase 401(k) contribution', description: 'Capture full employer match.', impact_amount_cents: 320000, impact_amount_display: '$3,200', meta: 'Employer Match', solv_reward: 25, action_type: 'manual', status: 'pending' },
      ]);

      // Insert demo SOLV history
      await supabase.from('solv_history').insert([
        { user_id: userId, amount: 50, action: 'Welcome bonus', source: 'signup' },
      ]);
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
