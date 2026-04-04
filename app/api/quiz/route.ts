import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { score, correctCount, totalQuestions, categoryScores } = await request.json();

    if (
      typeof score !== 'number' ||
      typeof correctCount !== 'number' ||
      typeof totalQuestions !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid quiz payload.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    await supabase.from('quiz_results').insert({
      user_id: user.id,
      score,
      correct_count: correctCount,
      total_questions: totalQuestions,
      category_scores: categoryScores ?? {},
    });

    const { data: rewardHistory } = await supabase
      .from('solv_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', 'quiz')
      .limit(1);

    let awarded = 0;

    if ((rewardHistory?.length ?? 0) === 0) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('solv_balance')
        .eq('id', user.id)
        .single();

      awarded = 5;

      await supabase
        .from('user_profiles')
        .update({
          solv_balance: (profile?.solv_balance ?? 0) + awarded,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      await supabase.from('solv_history').insert({
        user_id: user.id,
        amount: awarded,
        action: 'Completed Fluency Score quiz',
        source: 'quiz',
      });
    }

    revalidatePath('/quiz');
    revalidatePath('/solv');

    return NextResponse.json({
      success: true,
      awarded,
    });
  } catch (error) {
    console.error('Quiz save error:', error);
    return NextResponse.json({ error: 'Could not save quiz result.' }, { status: 500 });
  }
}
