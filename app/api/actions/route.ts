import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';

async function updateActionStatus(actionId: string, status: string) {
  const user = await getSession();
  if (!user) {
    throw new Error('Unauthorized');
  }
  const supabase = createSupabaseAdminClient();

  const { data: action, error: actionError } = await supabase
    .from('fix_actions')
    .select('*')
    .eq('id', actionId)
    .eq('user_id', user.id)
    .single();

  if (actionError || !action) {
    throw new Error('Action not found.');
  }

  if (!['pending', 'started', 'completed', 'dismissed'].includes(status)) {
    throw new Error('Invalid action status.');
  }

  if (action.status === status) {
    return { action, awarded: 0 };
  }

  const updatePayload: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updatePayload.completed_at = new Date().toISOString();
  }

  await supabase
    .from('fix_actions')
    .update(updatePayload)
    .eq('id', action.id)
    .eq('user_id', user.id);

  if (action.finding_id) {
    await supabase
      .from('findings')
      .update({ status: status === 'dismissed' ? 'dismissed' : 'fixed', updated_at: new Date().toISOString() })
      .eq('id', action.finding_id)
      .eq('user_id', user.id);
  }

  let awarded = 0;

  if (status === 'completed' && action.status !== 'completed' && (action.solv_reward ?? 0) > 0) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('solv_balance')
      .eq('id', user.id)
      .single();

    const currentBalance = profile?.solv_balance ?? 0;
    awarded = action.solv_reward ?? 0;

    await supabase
      .from('user_profiles')
      .update({
        solv_balance: currentBalance + awarded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    await supabase.from('solv_history').insert({
      user_id: user.id,
      amount: awarded,
      action: `Completed: ${action.title}`,
      source: 'fix_completed',
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/findings');
  revalidatePath('/fix-queue');
  revalidatePath('/solv');

  return { action, awarded };
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const actionId = String(formData.get('actionId') ?? '');
  const status = String(formData.get('status') ?? '');

  if (!actionId || !status) {
    redirect('/fix-queue');
  }

  try {
    await updateActionStatus(actionId, status);
  } catch (error) {
    console.error('Action form update error:', error);
  }

  redirect('/fix-queue');
}

export async function PATCH(request: NextRequest) {
  try {
    const { actionId, status } = await request.json();

    if (!actionId || !status) {
      return NextResponse.json(
        { error: 'Action ID and status are required.' },
        { status: 400 }
      );
    }

    const result = await updateActionStatus(actionId, status);

    return NextResponse.json({
      success: true,
      awarded: result.awarded,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to update action.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
