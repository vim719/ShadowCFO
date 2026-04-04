import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase';

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
