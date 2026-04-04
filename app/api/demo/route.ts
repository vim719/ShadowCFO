import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUser, seedDemoData } from '@/lib/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const email = `demo_${Date.now()}@shadowcfo.app`;
    const password = 'demo-' + Math.random().toString(36).substring(2, 15);

    const data = await createUser(email, password);

    if (data.user) {
      await seedDemoData(data.user.id, email);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 500 });
    }

    return NextResponse.json({
      user: sessionData.user,
      session: sessionData.session,
    });
  } catch (error) {
    console.error('Demo creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
