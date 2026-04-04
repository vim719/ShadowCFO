import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function FixQueuePage() {
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
  const { data: actions } = await supabase
    .from('fix_actions')
    .select('*')
    .eq('user_id', user?.id)
    .neq('status', 'dismissed')
    .order('created_at', { ascending: false });

  const pendingActions = actions?.filter((a: any) => a.status === 'pending') || [];
  const completedActions = actions?.filter((a: any) => a.status === 'completed') || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Fix Queue</h1>
      <p className="text-gray-400 mb-8">Review and approve. Every fix earns $SOLV.</p>

      {pendingActions.length === 0 && completedActions.length === 0 ? (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-xl font-semibold mb-2">All caught up</h3>
          <p className="text-gray-400">We're monitoring for new opportunities.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingActions.map((action: any) => (
            <div key={action.id} className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
              <div className="text-sm text-gray-400 mb-2">{action.meta} · +{action.solv_reward} $SOLV</div>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold">{action.title}</h3>
                <div className="text-2xl font-bold text-emerald-400">
                  {action.impact_amount_display} <span className="text-sm text-gray-400">/ yr</span>
                </div>
              </div>
              {action.description && <p className="text-gray-400 mb-4">{action.description}</p>}
              <div className="flex gap-4">
                <form action="/api/actions" method="POST">
                  <input type="hidden" name="actionId" value={action.id} />
                  <input type="hidden" name="status" value="completed" />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Approve → +{action.solv_reward} $SOLV
                  </button>
                </form>
                <form action="/api/actions" method="POST">
                  <input type="hidden" name="actionId" value={action.id} />
                  <input type="hidden" name="status" value="dismissed" />
                  <button type="submit" className="border border-dark-700 text-gray-300 px-6 py-2 rounded-lg font-medium hover:bg-dark-800 transition-colors">
                    Dismiss
                  </button>
                </form>
              </div>
              <div className="mt-4 text-xs text-gray-500">Educational only.</div>
            </div>
          ))}

          {completedActions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-400">Completed</h2>
              {completedActions.map((action: any) => (
                <div key={action.id} className="bg-dark-900 border border-dark-800 rounded-2xl p-6 opacity-70">
                  <div className="text-sm text-emerald-400 mb-2">✓ Action completed! +{action.solv_reward} $SOLV earned</div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold">{action.title}</h3>
                    <div className="text-xl font-bold text-gray-500">
                      {action.impact_amount_display} <span className="text-sm text-gray-400">/ yr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}