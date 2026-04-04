import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUser, seedDemoData } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    console.log('[DEMO] Creating demo user...');
    const email = `demo_${Date.now()}@shadowcfo.app`;
    const password = 'demo-' + Math.random().toString(36).substring(2, 15);

    const data = await createUser(email, password);
    console.log('[DEMO] User created:', data.user?.id);

    if (!data.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    console.log('[DEMO] Seeding demo data...');
    await seedDemoData(data.user.id, email);
    console.log('[DEMO] Demo data seeded successfully');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[DEMO] Sign in error:', signInError);
      return NextResponse.json({ error: signInError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: sessionData.user,
      session: sessionData.session,
    });
  } catch (error: any) {
    console.error('[DEMO] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
