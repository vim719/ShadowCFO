import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('sb-user-id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { data: findings, error: findingsError } = await supabase
      .from('findings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (findingsError) {
      console.error('Error fetching findings:', findingsError);
      return NextResponse.json({ error: findingsError.message }, { status: 500 });
    }

    const { data: actions, error: actionsError } = await supabase
      .from('fix_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (actionsError) {
      console.error('Error fetching actions:', actionsError);
      return NextResponse.json({ error: actionsError.message }, { status: 500 });
    }

    const { data: solvHistory, error: solvError } = await supabase
      .from('solv_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (solvError) {
      console.error('Error fetching SOLV history:', solvError);
    }

    // Calculate totals
    const totalImpact = findings
      ?.filter((f) => f.status === 'active')
      .reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) || 0;

    const fixedAmount = findings
      ?.filter((f) => f.status === 'fixed')
      .reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) || 0;

    const pendingActions = actions?.filter((a) => a.status === 'pending').length || 0;

    return NextResponse.json({
      profile,
      findings: findings || [],
      actions: actions || [],
      solvHistory: solvHistory || [],
      stats: {
        totalImpact,
        fixedAmount,
        pendingActions,
        solvBalance: profile?.solv_balance || 0,
        solvencyScore: profile?.solvency_score || 50,
      },
    });
  } catch (error) {
    console.error('User data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
