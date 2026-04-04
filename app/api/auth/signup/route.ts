import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { setAuthCookies } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName ?? null,
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message ?? 'Signup failed.' }, { status: 400 });
    }

    const userId = data.user.id;

    await admin.from('user_profiles').upsert({
      id: userId,
      email,
      full_name: fullName ?? email.split('@')[0],
      is_demo: false,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      solv_balance: 50,
      solvency_score: 55,
      updated_at: new Date().toISOString(),
    });

    const { data: findings } = await admin
      .from('findings')
      .insert([
        {
          user_id: userId,
          category: 'cash_drag',
          title: '$18,400 sitting idle at 0.01%',
          description:
            'A starter scan suggests idle cash in a low-yield account. Moving it to a high-yield savings option is the fastest low-risk win.',
          impact_amount_cents: 88300,
          impact_amount_display: '$883',
          priority: 'high',
          status: 'active',
          badge: 'One Tap',
          badge_color: 'green',
          disclaimer: 'Educational only.',
        },
        {
          user_id: userId,
          category: 'fee_drag',
          title: 'Your fund charges materially more than a plain index fund',
          description:
            'We seeded one realistic fee-drag scenario so the app is immediately usable before you upload your own statements.',
          impact_amount_cents: 184700,
          impact_amount_display: '$1,847',
          priority: 'medium',
          status: 'active',
          badge: 'One Tap',
          badge_color: 'green',
          disclaimer: 'Educational only.',
        },
        {
          user_id: userId,
          category: 'employer_match',
          title: 'You may be under-capturing your employer match',
          description:
            'We seeded one retirement opportunity so your Fix Queue starts with a high-signal action.',
          impact_amount_cents: 320000,
          impact_amount_display: '$3,200',
          priority: 'high',
          status: 'active',
          badge: 'High Priority',
          badge_color: 'amber',
          disclaimer: 'Adjust through your HR portal.',
        },
      ])
      .select('id, category');

    await admin.from('fix_actions').insert([
      {
        user_id: userId,
        finding_id: findings?.find((finding) => finding.category === 'cash_drag')?.id ?? null,
        title: 'Move idle cash into a high-yield savings account',
        description: 'Review the destination account, then move the idle balance after confirming APY and liquidity.',
        impact_amount_cents: 88300,
        impact_amount_display: '$883',
        meta: 'Cash Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
        status: 'pending',
      },
      {
        user_id: userId,
        finding_id: findings?.find((finding) => finding.category === 'fee_drag')?.id ?? null,
        title: 'Compare your current fund against a lower-cost alternative',
        description: 'Same exposure, lower fee drag. Review the specific share class and confirm tax treatment before making changes.',
        impact_amount_cents: 184700,
        impact_amount_display: '$1,847',
        meta: 'Fee Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
        status: 'pending',
      },
      {
        user_id: userId,
        finding_id: findings?.find((finding) => finding.category === 'employer_match')?.id ?? null,
        title: 'Increase retirement contribution to capture full match',
        description: 'Set the contribution rate in your employer portal high enough to capture the full match on the next paycheck.',
        impact_amount_cents: 320000,
        impact_amount_display: '$3,200',
        meta: 'Employer Match · Must Do',
        solv_reward: 25,
        action_type: 'manual',
        status: 'pending',
      },
    ]);

    await admin.from('solv_history').insert({
      user_id: userId,
      amount: 50,
      action: 'Welcome bonus',
      source: 'signup',
    });

    const auth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData, error: sessionError } = await auth.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { error: sessionError?.message ?? 'Signup succeeded but sign-in failed.' },
        { status: 400 }
      );
    }

    await setAuthCookies(sessionData.session, sessionData.user);

    return NextResponse.json({ user: sessionData.user });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
