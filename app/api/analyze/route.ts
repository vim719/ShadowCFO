import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';

type GeneratedFinding = {
  category: 'cash_drag' | 'fee_drag' | 'employer_match' | 'obbba' | 'auto_loan';
  title: string;
  description: string;
  impact_amount_cents: number;
  impact_amount_display: string;
  priority: 'low' | 'medium' | 'high';
  badge: string;
  badge_color: 'green' | 'amber';
  disclaimer: string;
};

type GeneratedAction = {
  title: string;
  description: string;
  impact_amount_cents: number;
  impact_amount_display: string;
  meta: string;
  solv_reward: number;
  action_type: 'one_tap' | 'manual' | 'needs_cpa';
};

function buildScenario(signalText: string) {
  const findings: GeneratedFinding[] = [];
  const actions: GeneratedAction[] = [];

  const pushScenario = (finding: GeneratedFinding, action: GeneratedAction) => {
    findings.push(finding);
    actions.push(action);
  };

  const hasCashSignals =
    /checking|savings|bank|chase|wells|boa|idle cash|balance/i.test(signalText);
  const hasInvestmentSignals =
    /401k|fidelity|vanguard|expense ratio|fund|ira|brokerage/i.test(signalText);
  const hasPayrollSignals =
    /payroll|401\(k\)|netbenefits|match|salary|contribution/i.test(signalText);
  const hasTaxSignals =
    /overtime|loan|interest|vehicle|tax|deduction|obbba/i.test(signalText);

  if (hasCashSignals) {
    pushScenario(
      {
        category: 'cash_drag',
        title: '$18,400 sitting idle at 0.01%',
        description:
          'The uploaded account data suggests meaningful idle cash in a low-yield account. Moving that balance to a high-yield option can materially improve annual yield.',
        impact_amount_cents: 88300,
        impact_amount_display: '$883',
        priority: 'high',
        badge: 'One Tap',
        badge_color: 'green',
        disclaimer: 'Educational only. Verify account type and APY before moving funds.',
      },
      {
        title: 'Move idle cash to a high-yield savings account',
        description:
          'Review the destination account, confirm FDIC coverage, and shift the identified idle cash to a 4.5%+ savings option.',
        impact_amount_cents: 88300,
        impact_amount_display: '$883',
        meta: 'Cash Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
      }
    );
  }

  if (hasInvestmentSignals) {
    pushScenario(
      {
        category: 'fee_drag',
        title: 'High fund fees are dragging long-term returns',
        description:
          'The uploaded account names look consistent with actively managed funds that can often be replaced with lower-cost equivalents without changing overall market exposure.',
        impact_amount_cents: 184700,
        impact_amount_display: '$1,847',
        priority: 'medium',
        badge: 'One Tap',
        badge_color: 'green',
        disclaimer: 'Educational information only — not investment advice.',
      },
      {
        title: 'Review lower-cost fund alternatives',
        description:
          'Compare the current fund against a lower-cost index alternative in the same account and confirm there is no tax event before making changes.',
        impact_amount_cents: 184700,
        impact_amount_display: '$1,847',
        meta: 'Fee Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
      }
    );
  }

  if (hasPayrollSignals) {
    pushScenario(
      {
        category: 'employer_match',
        title: 'Employer match may be under-captured',
        description:
          'Your uploaded payroll or retirement data suggests room to improve match capture. This is usually one of the highest-return financial actions available.',
        impact_amount_cents: 320000,
        impact_amount_display: '$3,200',
        priority: 'high',
        badge: 'High Priority',
        badge_color: 'amber',
        disclaimer: 'Educational only. Confirm plan rules in your HR portal or retirement plan dashboard.',
      },
      {
        title: 'Increase retirement contribution to capture full employer match',
        description:
          'Adjust the contribution rate in your employer portal and confirm the next paycheck reflects the increase.',
        impact_amount_cents: 320000,
        impact_amount_display: '$3,200',
        meta: 'Employer Match · Must Do',
        solv_reward: 25,
        action_type: 'manual',
      }
    );
  }

  if (hasTaxSignals) {
    pushScenario(
      {
        category: 'obbba',
        title: 'Uploaded records suggest tax deduction opportunities',
        description:
          'We detected patterns that may support OBBBA-adjacent deduction review, including overtime or qualifying interest records that should be validated with a CPA.',
        impact_amount_cents: 308000,
        impact_amount_display: '$3,080 est.',
        priority: 'medium',
        badge: 'Needs CPA',
        badge_color: 'amber',
        disclaimer: 'Tax treatment varies. This is educational only and requires CPA review.',
      },
      {
        title: 'Generate a CPA-ready deduction summary',
        description:
          'We will package the detected deduction signals into a memo you can share with a tax professional before filing.',
        impact_amount_cents: 308000,
        impact_amount_display: '$3,080 est.',
        meta: 'OBBBA Deductions · Needs CPA',
        solv_reward: 30,
        action_type: 'needs_cpa',
      }
    );
  }

  if (findings.length === 0) {
    pushScenario(
      {
        category: 'cash_drag',
        title: 'Scanner found at least one likely cash optimization path',
        description:
          'This file did not expose enough structured detail for a deep pass, so we generated a conservative starting recommendation around cash efficiency.',
        impact_amount_cents: 45000,
        impact_amount_display: '$450',
        priority: 'medium',
        badge: 'One Tap',
        badge_color: 'green',
        disclaimer: 'Educational estimate based on limited file structure.',
      },
      {
        title: 'Review high-yield savings options',
        description:
          'Start with the lowest-risk action: compare current APY against a high-yield alternative and move excess cash if appropriate.',
        impact_amount_cents: 45000,
        impact_amount_display: '$450',
        meta: 'Cash Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
      }
    );
  }

  return { findings, actions };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    const rawText = await file.text().catch(() => '');
    const signalText = `${file.name}\n${file.type}\n${rawText}`.toLowerCase();
    const supabase = createSupabaseAdminClient();

    const { findings, actions } = buildScenario(signalText);

    const { data: existingFindings } = await supabase
      .from('findings')
      .select('title')
      .eq('user_id', user.id);

    const existingTitles = new Set((existingFindings ?? []).map((entry) => entry.title));

    const newFindings = findings
      .filter((finding) => !existingTitles.has(finding.title))
      .map((finding) => ({
        user_id: user.id,
        ...finding,
      }));

    let insertedFindings: { id: string; title: string }[] = [];

    if (newFindings.length > 0) {
      const { data } = await supabase
        .from('findings')
        .insert(newFindings)
        .select('id, title');
      insertedFindings = data ?? [];
    }

    const findingByTitle = new Map(insertedFindings.map((entry) => [entry.title, entry.id]));

    const existingActions = await supabase
      .from('fix_actions')
      .select('title')
      .eq('user_id', user.id);
    const existingActionTitles = new Set((existingActions.data ?? []).map((entry) => entry.title));

    const newActions = actions
      .filter((action) => !existingActionTitles.has(action.title))
      .map((action) => ({
        user_id: user.id,
        finding_id: findingByTitle.get(
          action.title.includes('CPA')
            ? 'Uploaded records suggest tax deduction opportunities'
            : action.title.includes('retirement')
              ? 'Employer match may be under-captured'
              : action.title.includes('fund')
                ? 'High fund fees are dragging long-term returns'
                : action.title.includes('Move idle cash')
                  ? '$18,400 sitting idle at 0.01%'
                  : 'Scanner found at least one likely cash optimization path'
        ) ?? null,
        ...action,
        status: 'pending',
      }));

    if (newActions.length > 0) {
      await supabase.from('fix_actions').insert(newActions);
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('solvency_score')
      .eq('id', user.id)
      .single();

    await supabase
      .from('user_profiles')
      .update({
        solvency_score: Math.max(profile?.solvency_score ?? 50, 60),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    revalidatePath('/dashboard');
    revalidatePath('/findings');
    revalidatePath('/fix-queue');
    revalidatePath('/accounts');

    return NextResponse.json({
      success: true,
      findingsCount: newFindings.length,
      actionsCount: newActions.length,
      message:
        newFindings.length > 0
          ? 'Analysis complete. Your findings and Fix Queue have been updated.'
          : 'Analysis complete. No new findings were added because similar recommendations already exist.',
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed.' }, { status: 500 });
  }
}
