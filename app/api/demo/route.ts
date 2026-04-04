import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createDemoUser } from '@/lib/demo-seed';
import { setAuthCookies } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST() {
  try {
    const { email, password } = await createDemoUser();

    const auth = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await auth.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? 'Demo sign-in failed.' },
        { status: 500 }
      );
    }

    await setAuthCookies(data.session, data.user);

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error('Demo creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Demo creation failed.' },
      { status: 500 }
    );
  }
}
