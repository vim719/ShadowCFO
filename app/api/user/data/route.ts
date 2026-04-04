import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { data: findings } = await supabase
      .from('findings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    const { data: actions } = await supabase
      .from('fix_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');

    const { data: solvHistory } = await supabase
      .from('solv_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const totalLeakage = findings?.filter(f => f.status === 'active').reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) || 0;
    const fixedAmount = findings?.filter(f => f.status === 'fixed').reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) || 0;
    const pendingActions = actions?.filter(a => a.status === 'pending').length || 0;

    return NextResponse.json({
      profile,
      findings: findings || [],
      actions: actions || [],
      solvHistory: solvHistory || [],
      stats: {
        totalLeakage,
        fixedAmount,
        pendingActions,
        solvBalance: profile?.solv_balance || 0,
        solvencyScore: profile?.solvency_score || 50,
      },
    });
  } catch (error) {
    console.error('User data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
