import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('sb-user-id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { actionId, status } = await request.json();

    if (!actionId || !status) {
      return NextResponse.json(
        { error: 'Action ID and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'started', 'completed', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current action
    const { data: action, error: getError } = await supabase
      .from('fix_actions')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', userId)
      .single();

    if (getError || !action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Update action
    const updateData: Record<string, unknown> = { status: status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('fix_actions')
      .update(updateData)
      .eq('id', actionId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating action:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Award $SOLV if completed
    if (status === 'completed' && action.solv_reward > 0) {
      // Update user SOLV balance
      const { error: profileError } = await supabase.rpc('increment_solv_balance', {
        user_id: userId,
        amount: action.solv_reward,
      });

      if (profileError) {
        // Fallback: direct update
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('solv_balance')
          .eq('id', userId)
          .single();

        await supabase
          .from('user_profiles')
          .update({ solv_balance: (profile?.solv_balance || 0) + action.solv_reward })
          .eq('id', userId);
      }

      // Log SOLV earning
      await supabase.from('solv_history').insert({
        user_id: userId,
        amount: action.solv_reward,
        action: `Completed: ${action.title}`,
        source: 'fix_completed',
      });
    }

    // Update related finding if action completed
    if (status === 'completed' && action.finding_id) {
      await supabase
        .from('findings')
        .update({ status: 'fixed' })
        .eq('id', action.finding_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Action update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
