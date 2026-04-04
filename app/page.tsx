'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserData {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    is_demo: boolean;
    trial_ends_at: string | null;
    solv_balance: number;
    solvency_score: number;
  };
  findings: Array<{
    id: string;
    category: string;
    title: string;
    description: string;
    impact_amount_display: string | null;
    priority: string;
    status: string;
    badge: string | null;
    badge_color: string | null;
    disclaimer: string | null;
  }>;
  actions: Array<{
    id: string;
    finding_id: string | null;
    title: string;
    description: string | null;
    impact_amount_display: string | null;
    meta: string | null;
    solv_reward: number;
    action_type: string;
    status: string;
  }>;
  solvHistory: Array<{
    id: string;
    amount: number;
    action: string;
    created_at: string;
  }>;
  stats: {
    totalImpact: number;
    fixedAmount: number;
    pendingActions: number;
    solvBalance: number;
    solvencyScore: number;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'demo'>('login');
  const [activeTab, setActiveTab] = useState('dash');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [memoGenerating, setMemoGenerating] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const questions = [
    { q: "If your savings account earns 0.01% and a high-yield savings account earns 4.8%, what is the annual difference on a $20,000 balance?", opts: ["$2 difference", "$959 difference", "$96 difference", "No difference — they're insured the same"], correct: 1, cat: "Cash management" },
    { q: "What is an expense ratio?", opts: ["The fee a bank charges for overdrafts", "The annual fee a mutual fund charges as a % of assets", "The interest rate on a mortgage", "A government tax on investments"], correct: 1, cat: "Investment fees" },
    { q: "Your employer matches 100% of your 401(k) contributions up to 6% of your salary. You contribute 3%. What are you missing?", opts: ["Nothing — 3% is the standard", "A 50% return on unclaimed match", "A guaranteed 100% return on each unclaimed dollar", "Tax penalties"], correct: 2, cat: "Risk comprehension" },
    { q: "Under the 2025 One Big Beautiful Bill Act (OBBBA), overtime pay is now:", opts: ["Taxed at a higher rate", "Potentially fully deductible from taxable income", "No longer reported to the IRS", "Subject to FICA tax only"], correct: 1, cat: "Tax efficiency" },
    { q: "What is QSBS (Qualified Small Business Stock)?", opts: ["A type of government bond", "Stock in a startup that may be 100% tax-free after 5 years", "A high-yield savings account", "A retirement account for self-employed people"], correct: 1, cat: "Tax efficiency" },
    { q: "Your fund charges 0.80% per year. An identical fund charges 0.03%. On a $100,000 portfolio over 30 years at 7% returns, the fee difference costs you approximately:", opts: ["$770", "$7,700", "$77,000", "$770,000"], correct: 2, cat: "Investment fees" },
    { q: "What is a PTET election?", opts: ["A political vote for tax reform", "A way to deduct state income taxes at entity level, bypassing the SALT cap", "A penalty for late tax filing", "A retirement contribution vehicle"], correct: 1, cat: "Tax efficiency" },
    { q: "If you have $5,000 in credit card debt at 22% interest and $10,000 in a savings account at 4.8%, what is the optimal move?", opts: ["Keep both — never touch savings", "Pay off the credit card with $5,000 from savings", "Invest the savings in stocks", "Make minimum payments on the card"], correct: 1, cat: "Cash management" },
    { q: "What is financial 'fee drag'?", opts: ["Interest charged on late payments", "The cumulative loss of returns caused by overpaying for investment products", "Bank fees for wire transfers", "Currency exchange costs"], correct: 1, cat: "Investment fees" },
    { q: "Under CFPB Section 1033, which went into effect in 2026, you have the legal right to:", opts: ["Sue your bank for overdraft fees", "Share your financial data with any authorized third-party app at no cost", "Receive a government grant for financial literacy", "Opt out of credit bureau reporting"], correct: 1, cat: "Risk comprehension" }
  ];

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/user/data');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Login failed');
        return;
      }

      await checkSession();
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Signup failed');
        return;
      }

      // Auto-login after signup
      await handleLogin(e);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Demo creation failed');
        return;
      }

      await checkSession();
    } catch (error) {
      console.error('Demo error:', error);
      alert('Demo creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAuthMode('login');
    setFormData({ email: '', password: '' });
  };

  const showToastMessage = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'quiz' && qi === 0 && !showQuizResult) {
      setQi(0);
      setCorrect(0);
      setUserAnswers([]);
      setSelectedOpt(null);
      setShowQuizResult(false);
    }
  };

  const selectQuizOption = (i: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(i);
    const q = questions[qi];
    const newAnswers = [...userAnswers, i];
    setUserAnswers(newAnswers);
    if (i === q.correct) {
      setCorrect(correct + 1);
    }
  };

  const nextQuestion = () => {
    const nextQi = qi + 1;
    if (nextQi >= questions.length) {
      setShowQuizResult(true);
    } else {
      setQi(nextQi);
      setSelectedOpt(null);
    }
  };

  const handleActionUpdate = async (actionId: string, status: string) => {
    try {
      const res = await fetch('/api/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, status }),
      });

      if (res.ok) {
        // Update local state
        if (user) {
          const updatedActions = user.actions.map((a) =>
            a.id === actionId ? { ...a, status: status as typeof a.status } : a
          );
          const updatedFindings = status === 'completed'
            ? user.findings.map((f) =>
                user.actions.find((a) => a.id === actionId)?.finding_id === f.id
                  ? { ...f, status: 'fixed' as const }
                  : f
              )
            : user.findings;

          const pendingActions = updatedActions.filter((a) => a.status === 'pending').length;
          const action = user.actions.find((a) => a.id === actionId);

          let newSolvBalance = user.profile.solv_balance;
          if (status === 'completed' && action) {
            newSolvBalance += action.solv_reward;
            showToastMessage(`+${action.solv_reward} $SOLV earned!`);
          } else {
            showToastMessage(
              status === 'completed' ? 'Action completed!' : 'Action dismissed'
            );
          }

          setUser({
            ...user,
            actions: updatedActions,
            findings: updatedFindings,
            profile: {
              ...user.profile,
              solv_balance: newSolvBalance,
            },
            stats: {
              ...user.stats,
              pendingActions,
              solvBalance: newSolvBalance,
            },
          });
        }
      }
    } catch (error) {
      console.error('Action update error:', error);
      showToastMessage('Failed to update action');
    }
  };

  const handleGenerateMemo = async () => {
    setMemoGenerating(true);
    try {
      const res = await fetch('/api/memo', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToastMessage(data.error || 'Failed to generate memo');
        return;
      }

      // Download memo as file
      const blob = new Blob([data.memo], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToastMessage('CPA Memo downloaded!');
    } catch (error) {
      console.error('Memo error:', error);
      showToastMessage('Failed to generate memo');
    } finally {
      setMemoGenerating(false);
    }
  };

  const getQuizScore = () => Math.round((correct / questions.length) * 100);

  const getCategoryScores = () => {
    const cats = { risk: 0, tax: 0, cash: 0, fees: 0 };
    questions.forEach((q, i) => {
      if (userAnswers[i] === q.correct) {
        if (q.cat === 'Risk comprehension') cats.risk++;
        else if (q.cat === 'Tax efficiency') cats.tax++;
        else if (q.cat === 'Cash management') cats.cash++;
        else if (q.cat === 'Investment fees') cats.fees++;
      }
    });
    return cats;
  };

  const cats = user ? getCategoryScores() : { risk: 0, tax: 0, cash: 0, fees: 0 };
  const solvPct = user ? Math.min((user.profile.solv_balance / 1000) * 100, 100) : 0;
  const solvRem = user ? Math.max(0, 1000 - user.profile.solv_balance) : 1000;

  const formatCurrency = (cents: number) => {
    return '$' + (cents / 100).toLocaleString() + '/yr';
  };

  const getDaysLeft = () => {
    if (!user?.profile.trial_ends_at) return 14;
    const diff = new Date(user.profile.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Loading state
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading-spinner" />
          <p>Loading...</p>
        </div>
        <style>{authStyles}</style>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">Shadow CFO</div>
          <p className="auth-subtitle">Guided Financial Intelligence</p>

          {authMode === 'demo' ? (
            <div className="demo-section">
              <p>Try Shadow CFO instantly with demo data. No signup required.</p>
              <button className="btn-primary" onClick={handleDemo} disabled={loading}>
                {loading ? 'Creating demo...' : 'Start Demo'}
              </button>
              <button className="btn-link" onClick={() => setAuthMode('login')}>
                Back to login
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={authMode === 'signup' ? handleSignup : handleLogin}>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <button className="btn-secondary" onClick={() => setAuthMode('demo')}>
                Try Demo Mode
              </button>

              <p className="auth-switch">
                {authMode === 'login' ? (
                  <>New here? <button onClick={() => setAuthMode('signup')}>Create account</button></>
                ) : (
                  <>Already have an account? <button onClick={() => setAuthMode('login')}>Sign in</button></>
                )}
              </p>
            </>
          )}
        </div>
        <style>{authStyles}</style>
      </div>
    );
  }

  const userName = user.profile.full_name || user.profile.email.split('@')[0];
  const isDemo = user.profile.is_demo;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f7;
          padding: 20px;
        }
        .auth-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .auth-logo {
          font-size: 28px;
          font-weight: 600;
          color: #185FA5;
          margin-bottom: 8px;
        }
        .auth-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 32px;
        }
        .auth-card input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 12px;
          font-size: 15px;
          margin-bottom: 12px;
          outline: none;
          transition: border-color 0.15s;
        }
        .auth-card input:focus {
          border-color: #185FA5;
        }
        .btn-primary {
          width: 100%;
          padding: 14px;
          background: #185FA5;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
          margin-bottom: 16px;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary {
          width: 100%;
          padding: 14px;
          background: transparent;
          color: #185FA5;
          border: 1px solid #185FA5;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-secondary:hover { background: #E6F1FB; }
        .btn-link {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          margin-top: 16px;
        }
        .btn-link:hover { color: #185FA5; }
        .auth-divider {
          margin: 24px 0;
          position: relative;
        }
        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(0,0,0,0.1);
        }
        .auth-divider span {
          background: white;
          padding: 0 12px;
          position: relative;
          color: #9ca3af;
          font-size: 13px;
        }
        .auth-switch {
          margin-top: 24px;
          font-size: 14px;
          color: #6b7280;
        }
        .auth-switch button {
          background: none;
          border: none;
          color: #185FA5;
          cursor: pointer;
          font-weight: 500;
        }
        .demo-section p {
          color: #6b7280;
          margin-bottom: 24px;
          font-size: 14px;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #E6F1FB;
          border-top-color: #185FA5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .wrap {
          border: 0.5px solid var(--bd);
          border-radius: var(--rl);
          overflow: hidden;
          background: var(--card);
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 560px;
          max-width: 1000px;
          margin: 40px auto;
        }
        @media (max-width: 520px) {
          .wrap { margin: 0; border-radius: 0; border-left: none; border-right: none; min-height: 100vh; }
        }
        .topbar {
          background: var(--surf);
          border-bottom: 0.5px solid var(--bd);
          padding: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          overflow-x: auto;
        }
        .topbar-left {
          display: flex;
          overflow-x: auto;
          flex: 1;
        }
        .topbar-right {
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .topbar::-webkit-scrollbar { display: none; }
        .tab {
          padding: 12px 18px;
          font-size: 13px;
          font-weight: 400;
          color: var(--t2);
          cursor: pointer;
          white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color 0.15s, border-color 0.15s;
          user-select: none;
          flex-shrink: 0;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          font-family: inherit;
        }
        .tab:hover { color: var(--t1); }
        .tab.on { color: var(--blue); border-bottom-color: var(--blue); font-weight: 500; }
        .tab .cnt {
          display: inline-block;
          background: var(--blue);
          color: #fff;
          font-size: 10px;
          font-weight: 500;
          padding: 1px 5px;
          border-radius: 10px;
          margin-left: 5px;
          vertical-align: middle;
        }
        .user-menu {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 13px;
          color: var(--t2);
        }
        .logout-btn {
          padding: 6px 12px;
          font-size: 12px;
          color: var(--t2);
          background: transparent;
          border: 1px solid var(--bd);
          border-radius: var(--rm);
          cursor: pointer;
          transition: background 0.15s;
        }
        .logout-btn:hover { background: var(--surf); }
        .body { padding: 20px; overflow: auto; display: flex; flex-direction: column; gap: 14px; }
        .scr { display: none; flex-direction: column; gap: 14px; }
        .scr.on { display: flex; }
        .ph { font-size: 17px; font-weight: 500; color: var(--t1); }
        .ph-sub { font-size: 14px; color: var(--t2); font-weight: 400; }
        .psub { font-size: 13px; color: var(--t2); margin-top: -8px; }
        .score-row { display: flex; gap: 16px; align-items: stretch; }
        .score-box {
          background: var(--surf);
          border-radius: var(--rl);
          border: 0.5px solid var(--bd);
          padding: 18px;
          flex: 1;
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .sn { font-size: 48px; font-weight: 500; line-height: 1; color: var(--green); }
        .si-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; color: var(--t3); margin-bottom: 3px; }
        .si-delta { font-size: 13px; color: var(--green); font-weight: 500; margin-bottom: 2px; }
        .si-txt { font-size: 12px; color: var(--t2); }
        .sbar { height: 4px; background: var(--bd); border-radius: 2px; margin-top: 8px; width: 100%; }
        .sbar-fill { height: 100%; border-radius: 2px; background: var(--green); transition: width 0.5s ease; }
        .leakage-box { background: var(--surf); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 18px; width: 200px; }
        .lb-total { font-size: 22px; font-weight: 500; color: var(--red); margin-bottom: 8px; }
        .lb-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--t2); padding: 3px 0; border-bottom: 0.5px solid var(--bd); }
        .lb-row:last-child { border-bottom: none; font-weight: 500; color: var(--t1); }
        .banner {
          background: var(--amber-l);
          border: 0.5px solid #FAC775;
          border-radius: var(--rm);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.15s;
        }
        .banner:hover { background: #F5DDB0; }
        .bt { font-size: 13px; font-weight: 500; color: var(--amber); }
        .bs { font-size: 12px; color: #633806; margin-top: 1px; }
        .barr { font-size: 16px; color: var(--amber); font-weight: 300; }
        .fc { background: var(--card); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 16px; transition: border-color 0.15s; }
        .fc:hover { border-color: rgba(0,0,0,0.15); }
        .fc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; }
        .badges { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; }
        .badge { font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 20px; }
        .b-cat { background: var(--blue-l); color: #0C447C; }
        .b-go { background: var(--green-l); color: #085041; }
        .b-wa { background: var(--amber-l); color: #633806; }
        .b-done { background: var(--green-l); color: #085041; opacity: 0.7; }
        .amt { font-size: 24px; font-weight: 500; color: var(--green); white-space: nowrap; line-height: 1; }
        .amt small { font-size: 12px; color: var(--t3); font-weight: 400; }
        .amt.faded { color: var(--t3); }
        .fh { font-size: 14px; font-weight: 500; margin-bottom: 5px; }
        .fh.faded { color: var(--t2); }
        .fb { font-size: 13px; color: var(--t2); line-height: 1.6; margin-bottom: 12px; }
        .fbtns { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-p {
          background: var(--blue);
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: var(--rm);
          border: none;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .btn-p:hover { opacity: 0.85; }
        .btn-p:active { transform: scale(0.97); }
        .btn-p:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
        .btn-p.done { background: var(--green); cursor: default; }
        .btn-s {
          background: transparent;
          color: var(--t2);
          font-size: 12px;
          padding: 8px 12px;
          border-radius: var(--rm);
          border: 0.5px solid var(--bd);
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-s:hover { background: var(--surf); }
        .disc { font-size: 11px; color: var(--t3); margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--bd); }
        .fqi { background: var(--card); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 16px; transition: opacity 0.3s; }
        .fqi-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
        .fqi-meta { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t3); margin-bottom: 4px; }
        .fqi-title { font-size: 14px; font-weight: 500; }
        .fqi-impact { font-size: 22px; font-weight: 500; color: var(--green); white-space: nowrap; line-height: 1; }
        .fqi-impact small { font-size: 12px; color: var(--t3); font-weight: 400; }
        .fqi-desc { font-size: 13px; color: var(--t2); margin-bottom: 12px; line-height: 1.6; }
        .fqi-btns { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .fqi-disc { font-size: 11px; color: var(--t3); margin-top: 8px; }
        .ok-msg { font-size: 13px; color: var(--green); font-weight: 500; }
        .empty { text-align: center; padding: 32px 16px; color: var(--t3); font-size: 13px; }
        .solv-card { background: var(--surf); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 16px; }
        .solv-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .solv-bal { font-size: 24px; font-weight: 500; color: var(--blue); }
        .tier-pill { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--blue-l); color: #0C447C; }
        .tier-pill.architect { background: var(--amber-l); color: #633806; }
        .solv-bar-wrap { height: 6px; background: var(--bd); border-radius: 3px; margin-bottom: 7px; }
        .solv-bar-fill { height: 100%; border-radius: 3px; background: var(--blue); transition: width 0.5s ease; }
        .solv-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--t2); }
        .unlock-row { background: var(--card); border-radius: var(--rm); padding: 12px; border: 0.5px solid var(--bd); display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .unlock-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
        .unlock-desc { font-size: 12px; color: var(--t2); }
        .unlock-pill { font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 20px; background: var(--blue-l); color: #0C447C; white-space: nowrap; }
        .unlock-pill.unlocked { background: var(--green-l); color: #085041; }
        .hist-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 0.5px solid var(--bd); }
        .hist-row:last-child { border-bottom: none; }
        .quiz-wrap { display: flex; flex-direction: column; gap: 12px; }
        .q-progress-bar { height: 3px; background: var(--bd); border-radius: 2px; }
        .q-progress-fill { height: 100%; border-radius: 2px; background: var(--blue); transition: width 0.4s ease; }
        .q-num { font-size: 11px; color: var(--t3); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
        .q-text { font-size: 16px; font-weight: 500; line-height: 1.4; }
        .q-opts { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .q-opt { padding: 12px 14px; border: 0.5px solid var(--bd); border-radius: var(--rm); cursor: pointer; font-size: 13px; transition: border-color 0.15s, background 0.15s; user-select: none; background: var(--card); text-align: left; width: 100%; font-family: inherit; }
        .q-opt:hover { border-color: var(--blue); background: var(--blue-l); }
        .q-opt.sel { border-color: var(--blue); background: var(--blue-l); color: #0C447C; font-weight: 500; }
        .q-opt.wrong { border-color: var(--red); background: var(--red-l); color: var(--red); }
        .q-opt.right { border-color: var(--green); background: var(--green-l); color: #085041; }
        .q-nav { display: flex; justify-content: flex-end; margin-top: 4px; }
        .score-result { background: var(--surf); border-radius: var(--rl); padding: 24px; text-align: center; border: 0.5px solid var(--bd); }
        .sr-num { font-size: 56px; font-weight: 500; line-height: 1; margin-bottom: 8px; }
        .sr-label { font-size: 13px; color: var(--t2); margin-bottom: 16px; }
        .sr-bars { display: flex; flex-direction: column; gap: 8px; text-align: left; margin-bottom: 16px; }
        .sr-bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
        .sr-bar-label { min-width: 120px; color: var(--t2); }
        .sr-bar-track { flex: 1; height: 6px; background: var(--bd); border-radius: 3px; }
        .sr-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
        .find-cta { font-size: 13px; color: var(--t2); line-height: 1.6; padding: 12px; background: var(--card); border-radius: var(--rm); border: 0.5px solid var(--bd); margin-bottom: 12px; }
        .find-cta strong { color: var(--green); }
        .toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%) translateY(40px); background: #1a1a18; color: #fff; padding: 9px 16px; border-radius: var(--rm); font-size: 13px; font-weight: 500; opacity: 0; transition: all 0.3s; pointer-events: none; z-index: 999; white-space: nowrap; }
        .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .demo-badge { font-size: 10px; background: var(--amber-l); color: #633806; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
        @media (max-width: 520px) {
          .score-row { flex-direction: column; }
          .leakage-box { width: 100%; }
          .topbar .tab { padding: 10px 12px; font-size: 12px; }
        }
      `}</style>

      <div className="toast" style={{ opacity: showToast ? 1 : 0, transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(40px)' }}>
        {toastMsg}
      </div>

      <div className="wrap">
        <div className="topbar">
          <div className="topbar-left">
            <button className={`tab ${activeTab === 'dash' ? 'on' : ''}`} onClick={() => handleTabChange('dash')}>Dashboard</button>
            <button className={`tab ${activeTab === 'findings' ? 'on' : ''}`} onClick={() => handleTabChange('findings')}>Findings</button>
            <button className={`tab ${activeTab === 'fixq' ? 'on' : ''}`} onClick={() => handleTabChange('fixq')}>Fix Queue {user.stats.pendingActions > 0 && <span className="cnt">{user.stats.pendingActions}</span>}</button>
            <button className={`tab ${activeTab === 'solv' ? 'on' : ''}`} onClick={() => handleTabChange('solv')}>$SOLV</button>
            <button className={`tab ${activeTab === 'quiz' ? 'on' : ''}`} onClick={() => handleTabChange('quiz')}>Fluency Quiz</button>
          </div>
          <div className="topbar-right">
            <div className="user-menu">
              {userName}
              {isDemo && <span className="demo-badge">DEMO</span>}
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="body">
          {/* DASHBOARD */}
          <div className={`scr ${activeTab === 'dash' ? 'on' : ''}`}>
            <div className="ph">
              Good morning, {userName.split(' ')[0]} <span className="ph-sub">— {getDaysLeft()} days left in trial</span>
            </div>

            <div className="score-row">
              <div className="score-box">
                <div className="sn">{user.stats.solvencyScore}</div>
                <div style={{ flex: 1 }}>
                  <div className="si-label">Solvency Score</div>
                  <div className="si-delta">+13 this month</div>
                  <div className="si-txt">Cash drag fixed — {formatCurrency(user.stats.fixedAmount)} recovered</div>
                  <div className="sbar"><div className="sbar-fill" style={{ width: `${user.stats.solvencyScore}%` }}></div></div>
                </div>
              </div>
              <div className="leakage-box">
                <div className="si-label">Total found</div>
                <div className="lb-total">{formatCurrency(user.stats.totalImpact)}</div>
                {user.findings.filter(f => f.status === 'active').map((f, i) => (
                  <div key={i} className="lb-row">
                    <span>{f.category.replace('_', ' ')}</span>
                    <span>{f.impact_amount_display || 'TBD'}</span>
                  </div>
                ))}
                {user.stats.fixedAmount > 0 && (
                  <div className="lb-row" style={{ marginTop: 4 }}>
                    <span>Fixed</span>
                    <span style={{ color: 'var(--green)' }}>{formatCurrency(user.stats.fixedAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {user.stats.pendingActions > 0 && (
              <div className="banner" onClick={() => handleTabChange('fixq')}>
                <div>
                  <div className="bt">{user.stats.pendingActions} fixes ready — one tap each</div>
                  <div className="bs">Takes under 2 minutes · Earns $SOLV</div>
                </div>
                <div className="barr">→</div>
              </div>
            )}

            {user.findings.filter(f => f.status === 'active').slice(0, 1).map((finding) => (
              <div key={finding.id} className="fc">
                <div className="fc-top">
                  <div className="badges">
                    <span className="badge b-cat">{finding.category.replace('_', ' ')}</span>
                    {finding.badge && <span className={`badge ${finding.badge_color === 'green' ? 'b-go' : 'b-wa'}`}>{finding.badge}</span>}
                  </div>
                  <div className="amt">{finding.impact_amount_display || 'TBD'} <small>/ yr</small></div>
                </div>
                <div className="fh">{finding.title}</div>
                <div className="fb">{finding.description}</div>
                <div className="fbtns">
                  <button className="btn-p" onClick={() => handleTabChange('fixq')}>See Swap Option</button>
                  <button className="btn-s">Learn more</button>
                </div>
                {finding.disclaimer && <div className="disc">{finding.disclaimer}</div>}
              </div>
            ))}
          </div>

          {/* FINDINGS */}
          <div className={`scr ${activeTab === 'findings' ? 'on' : ''}`}>
            <div className="ph">Your findings</div>
            <div className="psub">Total: <strong style={{ color: 'var(--green)' }}>{formatCurrency(user.stats.totalImpact)}</strong> across {user.findings.filter(f => f.status === 'active').length} leakage categories</div>

            {user.findings.map((finding) => (
              <div key={finding.id} className="fc">
                <div className="fc-top">
                  <div className="badges">
                    <span className="badge b-cat">{finding.category.replace('_', ' ')}</span>
                    <span className={`badge ${finding.status === 'fixed' ? 'b-done' : finding.badge_color === 'green' ? 'b-go' : 'b-wa'}`}>
                      {finding.status === 'fixed' ? 'Fixed' : finding.badge}
                    </span>
                  </div>
                  <div className={`amt ${finding.status === 'fixed' ? 'faded' : ''}`}>
                    {finding.impact_amount_display || 'TBD'} <small>/ yr</small>
                  </div>
                </div>
                <div className={`fh ${finding.status === 'fixed' ? 'faded' : ''}`}>{finding.title}</div>
                <div className="fb">{finding.description}</div>
                {finding.status === 'fixed' ? (
                  <button className="btn-p done" disabled>Approved</button>
                ) : (
                  <div className="fbtns">
                    <button className="btn-p" onClick={() => handleTabChange('fixq')}>View in Fix Queue</button>
                    <button className="btn-s">Learn more</button>
                  </div>
                )}
                {finding.disclaimer && <div className="disc">{finding.disclaimer}</div>}
              </div>
            ))}
          </div>

          {/* FIX QUEUE */}
          <div className={`scr ${activeTab === 'fixq' ? 'on' : ''}`}>
            <div className="ph">Fix Queue</div>
            <div className="psub">Review and approve. Every fix earns $SOLV.</div>

            {user.actions.filter(a => a.status !== 'dismissed').length > 0 ? (
              user.actions.filter(a => a.status !== 'dismissed').map((action) => (
                <div key={action.id} className="fqi" id={`action-${action.id}`}>
                  <div className="fqi-meta">{action.meta}</div>
                  <div className="fqi-head">
                    <div className="fqi-title">{action.title}</div>
                    <div className="fqi-impact">{action.impact_amount_display || 'TBD'} <small>/ yr</small></div>
                  </div>
                  {action.description && <div className="fqi-desc">{action.description}</div>}
                  
                  {action.status === 'pending' || action.status === 'started' ? (
                    <div className="fqi-btns">
                      <button className="btn-p" onClick={() => handleActionUpdate(action.id, 'completed')}>
                        Approve → +{action.solv_reward} $SOLV
                      </button>
                      <button className="btn-s" onClick={() => handleActionUpdate(action.id, 'dismissed')}>Dismiss</button>
                    </div>
                  ) : action.status === 'completed' ? (
                    <div className="ok-msg">✓ Action completed! +{action.solv_reward} $SOLV earned</div>
                  ) : null}
                  
                  <div className="fqi-disc">Educational only. Review with an advisor if unsure.</div>
                </div>
              ))
            ) : (
              <div className="empty">All caught up. We're monitoring for new opportunities.</div>
            )}
          </div>

          {/* $SOLV */}
          <div className={`scr ${activeTab === 'solv' ? 'on' : ''}`}>
            <div className="ph">Your $SOLV</div>
            <div className="psub">Earned through financial health actions. Soul-bound — cannot be transferred or sold.</div>

            <div className="solv-card">
              <div className="solv-h">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 3 }}>Balance</div>
                  <div className="solv-bal">{user.profile.solv_balance} $SOLV</div>
                </div>
                <span className={`tier-pill ${solvRem <= 0 ? 'architect' : ''}`}>
                  {user.profile.solv_balance >= 1000 ? 'Architect' : 'Protector'}
                </span>
              </div>
              <div className="solv-bar-wrap"><div className="solv-bar-fill" style={{ width: `${solvPct}%` }}></div></div>
              <div className="solv-meta">
                <span>500 — Protector</span>
                <span style={{ color: 'var(--blue)', fontWeight: 500 }}>
                  {solvRem > 0 ? `${solvRem} to Architect` : 'Architect unlocked!'}
                </span>
                <span>1,000 — Architect</span>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Architect tier unlocks (1,000 $SOLV)</div>
            {[
              { name: 'Alt Alpha Pool', desc: 'Private credit and real estate access' },
              { name: 'Priority scanning', desc: 'Real-time account monitoring' },
              { name: 'CPA Memo generation', desc: 'Downloadable tax deduction summary' },
            ].map((item, i) => (
              <div className="unlock-row" key={i}>
                <div>
                  <div className="unlock-name">{item.name}</div>
                  <div className="unlock-desc">{item.desc}</div>
                </div>
                <span className={`unlock-pill ${solvRem <= 0 ? 'unlocked' : ''}`}>
                  {solvRem > 0 ? `${solvRem} away` : 'Unlocked'}
                </span>
              </div>
            ))}

            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Earning history</div>
            {user.solvHistory.length > 0 ? (
              user.solvHistory.map((item) => (
                <div key={item.id} className="hist-row">
                  <span style={{ color: 'var(--t2)' }}>{item.action}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 500 }}>+{item.amount}</span>
                </div>
              ))
            ) : (
              <div className="hist-row" style={{ color: 'var(--t3)' }}>Complete fixes to earn $SOLV</div>
            )}
          </div>

          {/* FLUENCY QUIZ */}
          <div className={`scr ${activeTab === 'quiz' ? 'on' : ''}`}>
            {!showQuizResult ? (
              <div className="quiz-wrap">
                <div>
                  <div className="q-progress-bar"><div className="q-progress-fill" style={{ width: `${((qi + 1) / questions.length) * 100}%` }}></div></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t3)', marginTop: 5, marginBottom: 12 }}>
                    <span className="q-num">Question {qi + 1} of {questions.length}</span>
                    <span style={{ fontWeight: 500, color: 'var(--blue)' }}>Score: {Math.round((correct / (qi + 1)) * 100) || 0}</span>
                  </div>
                </div>
                <div className="q-text">{questions[qi]?.q}</div>
                <div className="q-opts">
                  {questions[qi]?.opts.map((opt, i) => {
                    let cls = 'q-opt';
                    if (selectedOpt !== null) {
                      if (i === questions[qi].correct) cls += ' right';
                      else if (i === selectedOpt && i !== questions[qi].correct) cls += ' wrong';
                    }
                    return (
                      <button key={i} className={cls} onClick={() => selectQuizOption(i)} disabled={selectedOpt !== null}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <div className="q-nav">
                  <button className="btn-p" onClick={nextQuestion} style={{ display: selectedOpt !== null ? 'block' : 'none' }}>Next</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="score-result">
                  <div className="sr-num" style={{ color: getQuizScore() >= 70 ? 'var(--green)' : getQuizScore() >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                    {getQuizScore()}
                  </div>
                  <div className="si-label">Your Financial Fluency Score</div>
                  <div className="sr-label">
                    {getQuizScore() >= 70 ? "Strong foundation — let's find and fix your specific leaks." : getQuizScore() >= 50 ? "You know more than most — but there are gaps costing you money." : "Significant gaps identified. The good news: they're all fixable automatically."}
                  </div>
                  <div className="sr-bars">
                    {[
                      { label: 'Risk comprehension', cats: cats.risk, total: 3 },
                      { label: 'Tax efficiency', cats: cats.tax, total: 3 },
                      { label: 'Cash management', cats: cats.cash, total: 2 },
                      { label: 'Investment fees', cats: cats.fees, total: 3 },
                    ].map((item, i) => (
                      <div key={i} className="sr-bar-row">
                        <span className="sr-bar-label">{item.label}</span>
                        <div className="sr-bar-track">
                          <div className="sr-bar-fill" style={{
                            width: `${(item.cats / item.total) * 100}%`,
                            background: (item.cats / item.total) * 100 >= 70 ? 'var(--green)' : (item.cats / item.total) * 100 >= 40 ? 'var(--amber)' : 'var(--red)'
                          }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="find-cta">
                    Based on your score, we estimate you have <strong>{getQuizScore() >= 70 ? '$4,000–$8,000' : getQuizScore() >= 50 ? '$8,200–$14,000' : '$12,000–$20,000'}</strong> in annual financial leakage. Connect your accounts to find the exact amount.
                  </div>
                  <button className="btn-p" style={{ width: '100%' }} onClick={() => showToastMessage('Sign up at shadowcfo.com to connect your accounts')}>Find My Exact Leakage →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const authStyles = `
  :root {
    --blue: #185FA5;
    --blue-l: #E6F1FB;
    --green: #1D9E75;
    --green-l: #E1F5EE;
    --amber: #854F0B;
    --amber-l: #FAEEDA;
    --red: #A32D2D;
    --red-l: #FCEBEB;
    --t1: #1a1a1a;
    --t2: #6b7280;
    --t3: #9ca3af;
    --bd: rgba(0, 0, 0, 0.08);
    --surf: #f9fafb;
    --card: #ffffff;
    --rm: 14px;
    --rl: 20px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #f5f5f7;
    color: var(--t1);
    font-size: 14px;
    line-height: 1.5;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
