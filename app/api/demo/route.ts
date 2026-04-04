import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { seedDemoUser } from '@/lib/demo-seed';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const email = `demo_${Date.now()}@shadowcfo.app`;
    const password = 'demo-' + Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { is_demo: true },
    });

    if (error) {
      console.error('Error creating demo user:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      await seedDemoUser(data.user.id, email);

      // Auto-login the demo user
      const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

      const cookieStore = await cookies();
      cookieStore.set('sb-access-token', 'demo-session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours for demo
      });
      cookieStore.set('sb-refresh-token', 'demo-refresh', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });
      cookieStore.set('sb-user-id', data.user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });

      return NextResponse.json({
        user: { id: data.user.id, email },
        demo: true,
      });
    }

    return NextResponse.json({ error: 'Failed to create demo user' }, { status: 500 });
  } catch (error) {
    console.error('Demo creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
