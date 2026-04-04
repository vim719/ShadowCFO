import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-900 border-r border-dark-800 flex flex-col">
        <div className="p-6 border-b border-dark-800">
          <h1 className="text-2xl font-bold text-emerald-400">Shadow CFO</h1>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <span>📊</span>
              Dashboard
            </Link>
            <Link
              href="/findings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <span>🔍</span>
              Findings
            </Link>
            <Link
              href="/fix-queue"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <span>🔧</span>
              Fix Queue
            </Link>
            <Link
              href="/solv"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <span>💎</span>
              $SOLV
            </Link>
            <Link
              href="/quiz"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <span>📝</span>
              Fluency Quiz
            </Link>
            <Link
              href="/accounts"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors"
            >
              <span>🏦</span>
              Accounts
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-dark-800">
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-dark-800 hover:text-white transition-colors w-full"
            >
              <span>🚪</span>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}