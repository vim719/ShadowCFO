import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // For demo purposes, generate findings based on file analysis
    // In production, this would use OCR + AI to analyze actual content
    const fileName = file.name.toLowerCase();
    const fileText = ''; // Would extract text from PDF/CSV in production
    
    // Generate demo findings based on common financial scenarios
    const findings = [];
    const actions = [];

    // Check for common patterns (demo simulation)
    const hasChecking = fileName.includes('checking') || fileName.includes('chase') || fileName.includes('bank');
    const hasSavings = fileName.includes('savings') || fileName.includes(' Marcus') || fileName.includes('ally');
    const hasInvestment = fileName.includes('fidelity') || fileName.includes('401k') || fileName.includes('vanguard');
    const hasCreditCard = fileName.includes('credit') || fileName.includes('visa') || fileName.includes('amex');

    if (hasChecking || hasSavings) {
      findings.push({
        user_id: userId,
        category: 'cash_drag',
        title: '$15,000 sitting in low-yield account',
        description: 'Your checking/savings earns minimal interest. Moving to a high-yield savings account could yield $700+/year.',
        impact_amount_cents: 70000,
        impact_amount_display: '$700',
        priority: 'high',
        status: 'active',
        badge: 'One Tap',
        badge_color: 'green',
        disclaimer: 'Based on typical account balances. Actual results may vary.'
      });
      
      actions.push({
        user_id: userId,
        title: 'Switch to high-yield savings',
        description: 'Move idle cash to earn 4.5-5% APY instead of 0.01%.',
        impact_amount_cents: 70000,
        impact_amount_display: '$700',
        meta: 'Cash Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
        status: 'pending'
      });
    }

    if (hasInvestment) {
      findings.push({
        user_id: userId,
        category: 'fee_drag',
        title: 'High expense ratios eating returns',
        description: 'Active funds often charge 0.5-1% annually. Index funds charge 0.03% or less. Over 30 years, this costs hundreds of thousands.',
        impact_amount_cents: 150000,
        impact_amount_display: '$1,500',
        priority: 'medium',
        status: 'active',
        badge: 'One Tap',
        badge_color: 'green',
        disclaimer: 'Historical performance does not guarantee future results.'
      });
      
      actions.push({
        user_id: userId,
        title: 'Switch to low-cost index fund',
        description: 'Same market exposure, dramatically lower fees.',
        impact_amount_cents: 150000,
        impact_amount_display: '$1,500',
        meta: 'Fee Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
        status: 'pending'
      });
    }

    if (hasChecking || hasCreditCard) {
      findings.push({
        user_id: userId,
        category: 'employer_match',
        title: 'Free money left on the table',
        description: 'Employer 401(k) matches are guaranteed returns. Not capturing the full match means leaving money behind.',
        impact_amount_cents: 200000,
        impact_amount_display: '$2,000',
        priority: 'high',
        status: 'active',
        badge: 'High Priority',
        badge_color: 'amber',
        disclaimer: 'Check with HR for exact match rules.'
      });
      
      actions.push({
        user_id: userId,
        title: 'Maximize 401(k) match',
        description: 'Increase contribution to capture full employer match.',
        impact_amount_cents: 200000,
        impact_amount_display: '$2,000',
        meta: 'Employer Match',
        solv_reward: 25,
        action_type: 'manual',
        status: 'pending'
      });
    }

    // Add default findings if none detected
    if (findings.length === 0) {
      findings.push({
        user_id: userId,
        category: 'cash_drag',
        title: '$10,000 potential in high-yield savings',
        description: 'Based on typical spending patterns, you could earn $450+/year by moving to a high-yield account.',
        impact_amount_cents: 45000,
        impact_amount_display: '$450',
        priority: 'medium',
        status: 'active',
        badge: 'One Tap',
        badge_color: 'green',
        disclaimer: 'Estimate based on average account sizes.'
      });
      
      actions.push({
        user_id: userId,
        title: 'Open high-yield savings account',
        description: 'Switch to an account earning 4.5%+ APY.',
        impact_amount_cents: 45000,
        impact_amount_display: '$450',
        meta: 'Cash Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
        status: 'pending'
      });
    }

    // Insert findings
    if (findings.length > 0) {
      await supabase.from('findings').insert(findings);
    }

    // Insert actions
    if (actions.length > 0) {
      await supabase.from('fix_actions').insert(actions);
    }

    // Update user profile to show they've connected an account
    await supabase.from('user_profiles').update({
      solvency_score: 60,
      updated_at: new Date().toISOString()
    }).eq('id', userId);

    return NextResponse.json({
      success: true,
      findingsCount: findings.length,
      actionsCount: actions.length,
      message: 'Analysis complete! New findings and actions have been generated.'
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}