import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PATCH(request: NextRequest) {
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

    const { actionId, status } = await request.json();

    if (!actionId || !status) {
      return NextResponse.json({ error: 'Action ID and status required' }, { status: 400 });
    }

    const userId = user.id;

    // Get current action
    const { data: action } = await supabase
      .from('fix_actions')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', userId)
      .single();

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Update action
    const updateData: Record<string, unknown> = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase
      .from('fix_actions')
      .update(updateData)
      .eq('id', actionId)
      .eq('user_id', userId);

    // Award SOLV if completed
    if (status === 'completed' && action.solv_reward > 0) {
      await supabase.rpc('increment_solv', { amount: action.solv_reward });

      await supabase.from('solv_history').insert({
        user_id: userId,
        amount: action.solv_reward,
        action: `Completed: ${action.title}`,
        source: 'fix_completed',
      });

      // Update finding to fixed
      if (action.finding_id) {
        await supabase
          .from('findings')
          .update({ status: 'fixed' })
          .eq('id', action.finding_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Action update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
