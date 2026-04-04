import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function SolvPage() {
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
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('solv_balance')
    .eq('id', user?.id)
    .single();

  const { data: solvHistory } = await supabase
    .from('solv_history')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const balance = profile?.solv_balance || 0;
  const solvPct = Math.min((balance / 1000) * 100, 100);
  const solvRem = Math.max(0, 1000 - balance);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Your $SOLV</h1>
      <p className="text-gray-400 mb-8">Earned through financial health actions.</p>

      {/* Balance Card */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-sm text-gray-400 mb-1">Balance</div>
            <div className="text-5xl font-bold text-emerald-400">{balance} $SOLV</div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${balance >= 1000 ? 'bg-emerald-600 text-white' : 'bg-dark-700 text-gray-300'}`}>
            {balance >= 1000 ? 'Architect' : 'Protector'}
          </span>
        </div>
        
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${solvPct}%` }} />
        </div>
        
        <div className="flex justify-between text-sm text-gray-400">
          <span>500 — Protector</span>
          <span className="text-emerald-400 font-medium">
            {solvRem > 0 ? `${solvRem} to Architect` : 'Architect unlocked!'}
          </span>
          <span>1,000 — Architect</span>
        </div>
      </div>

      {/* Tier Unlocks */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Architect tier unlocks (1,000 $SOLV)</h2>
        <div className="space-y-3">
          {[
            { name: 'CPA Memo generation', desc: 'Downloadable tax deduction summary' },
            { name: 'Priority scanning', desc: 'Real-time account monitoring' },
            { name: 'Advanced analytics', desc: 'Deep dive financial insights' },
          ].map((item, i) => (
            <div key={i} className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-gray-400 text-sm">{item.desc}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${solvRem <= 0 ? 'bg-emerald-600 text-white' : 'bg-dark-700 text-gray-400'}`}>
                {solvRem > 0 ? `${solvRem} away` : 'Unlocked'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Earning History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Earning history</h2>
        {solvHistory?.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No history yet. Complete actions to earn $SOLV!</div>
        ) : (
          <div className="space-y-2">
            {solvHistory?.map((item: any) => (
              <div key={item.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-400">{item.action}</span>
                <span className="text-emerald-400 font-medium">+{item.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}