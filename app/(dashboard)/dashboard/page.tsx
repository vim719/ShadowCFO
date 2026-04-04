import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
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

  // Get profile data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  // Get findings
  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  // Get actions
  const { data: actions } = await supabase
    .from('fix_actions')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  const activeFindings = findings?.filter(f => f.status === 'active') || [];
  const fixedFindings = findings?.filter(f => f.status === 'fixed') || [];
  const pendingActions = actions?.filter(a => a.status === 'pending') || [];

  const totalLeakage = activeFindings.reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) / 100;
  const fixedAmount = fixedFindings.reduce((sum, f) => sum + (f.impact_amount_cents || 0), 0) / 100;

  const trialDays = profile?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 14;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        Good morning, {profile?.full_name || 'User'} <span className="text-gray-400 font-normal text-lg">— {trialDays} days left in trial</span>
      </h1>

      {/* Score Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 flex items-center gap-6">
          <div className="text-6xl font-bold text-emerald-400">{profile?.solvency_score || 50}</div>
          <div>
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-1">Solvency Score</div>
            <div className="text-emerald-400 text-sm mb-2">+13 this month</div>
            <div className="text-gray-500 text-sm">Cash drag fixed — ${fixedAmount.toLocaleString()}/year recovered</div>
            <div className="mt-3 h-1 bg-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profile?.solvency_score || 50}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Total Found</div>
          <div className="text-4xl font-bold text-red-400 mb-4">${totalLeakage.toLocaleString()}/yr</div>
          <div className="space-y-2">
            {activeFindings.slice(0, 4).map((f: any) => (
              <div key={f.id} className="flex justify-between text-sm">
                <span className="text-gray-400">{f.category.replace('_', ' ')}</span>
                <span className="text-white">{f.impact_amount_display}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banner */}
      {pendingActions.length > 0 && (
        <div className="mt-8 bg-amber-900/20 border border-amber-800 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-amber-900/30 transition-colors">
          <div>
            <div className="font-semibold text-amber-400">{pendingActions.length} fixes ready — one tap each</div>
            <div className="text-gray-400 text-sm">Takes under 2 minutes · Earns $SOLV</div>
          </div>
          <div className="text-2xl text-amber-400">→</div>
        </div>
      )}

      {/* Top Finding */}
      {activeFindings[0] && (
        <div className="mt-8 bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2">
              <span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                {activeFindings[0].category.replace('_', ' ')}
              </span>
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                {activeFindings[0].badge}
              </span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {activeFindings[0].impact_amount_display} <span className="text-sm text-gray-400">/ yr</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">{activeFindings[0].title}</h3>
          <p className="text-gray-400 mb-4">{activeFindings[0].description}</p>
          <div className="flex gap-4">
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              See Swap Option
            </button>
            <button className="border border-dark-700 text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-dark-800 transition-colors">
              Learn more
            </button>
          </div>
          {activeFindings[0].disclaimer && (
            <div className="mt-4 text-xs text-gray-500">{activeFindings[0].disclaimer}</div>
          )}
        </div>
      )}

      {/* Empty state */}
      {findings?.length === 0 && (
        <div className="mt-8 bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No findings yet</h3>
          <p className="text-gray-400 mb-6">Connect your accounts to start finding financial leaks.</p>
          <a href="/accounts" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium inline-block transition-colors">
            Connect Accounts
          </a>
        </div>
      )}
    </div>
  );
}