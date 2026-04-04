import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase';

type SessionLike = {
  access_token: string;
  refresh_token: string;
};

type UserLike = {
  id: string;
};

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) return null;

  const supabase = createSupabaseAdminClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) return null;
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', '', { maxAge: 0, path: '/' });
  cookieStore.set('sb-refresh-token', '', { maxAge: 0, path: '/' });
  cookieStore.set('sb-user-id', '', { maxAge: 0, path: '/' });
}

export async function setAuthCookies(session: SessionLike, user: UserLike) {
  const cookieStore = await cookies();
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };

  cookieStore.set('sb-access-token', session.access_token, baseOptions);
  cookieStore.set('sb-refresh-token', session.refresh_token, baseOptions);
  cookieStore.set('sb-user-id', user.id, baseOptions);
}
