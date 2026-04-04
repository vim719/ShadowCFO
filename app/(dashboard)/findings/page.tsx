import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function FindingsPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  const activeFindings = findings?.filter(f => f.status === 'active') || [];
  const totalLeakage = activeFindings.reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) / 100;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Your Findings</h1>
      <p className="text-gray-400 mb-8">
        Total: <span className="text-emerald-400 font-semibold">${totalLeakage.toLocaleString()}/year</span> across {activeFindings.length} leakage categories
      </p>

      {findings?.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No findings yet</h3>
          <p className="text-gray-400 mb-6">Connect your accounts to discover financial leaks.</p>
          <Link href="/accounts" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium inline-block transition-colors">
            Connect Accounts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {findings?.map((finding: any) => (
            <div key={finding.id} className={`bg-dark-900 border ${finding.status === 'fixed' ? 'border-emerald-800' : 'border-dark-800'} rounded-2xl p-6`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                    {finding.category.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    finding.status === 'fixed' ? 'bg-emerald-600 text-white' :
                    finding.badge_color === 'green' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {finding.status === 'fixed' ? 'Fixed' : finding.badge}
                  </span>
                </div>
                <div className={`text-3xl font-bold ${finding.status === 'fixed' ? 'text-gray-500' : 'text-emerald-400'}`}>
                  {finding.impact_amount_display} <span className="text-sm text-gray-400">/ yr</span>
                </div>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${finding.status === 'fixed' ? 'text-gray-500' : ''}`}>{finding.title}</h3>
              <p className="text-gray-400 mb-4">{finding.description}</p>
              {finding.status !== 'fixed' && (
                <div className="flex gap-4">
                  <Link href="/fix-queue" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    View in Fix Queue
                  </Link>
                  <button className="border border-dark-700 text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-dark-800 transition-colors">
                    Learn more
                  </button>
                </div>
              )}
              {finding.disclaimer && (
                <div className="mt-4 text-xs text-gray-500">{finding.disclaimer}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}