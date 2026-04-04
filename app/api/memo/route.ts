import { NextRequest, NextResponse } from 'next/server';
import { generateCPAMemo } from '@/lib/cpa-memo';
import { getSession } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get OBBBA-related findings
    const { data: obbbaFindings, error: findingsError } = await supabase
      .from('findings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('category', ['obbba', 'auto_loan']);

    if (findingsError) {
      console.error('Error fetching findings:', findingsError);
      return NextResponse.json({ error: findingsError.message }, { status: 500 });
    }

    if (!obbbaFindings || obbbaFindings.length === 0) {
      return NextResponse.json(
        { error: 'No OBBBA deductions found' },
        { status: 400 }
      );
    }

    // Generate memo
    const memo = generateCPAMemo(profile, obbbaFindings);

    return NextResponse.json({
      success: true,
      memo,
      filename: `shadow-cfo-cpa-memo-${new Date().toISOString().split('T')[0]}.txt`,
    });
  } catch (error) {
    console.error('CPA memo error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
