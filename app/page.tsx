'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxxezkoiyxrnwtdrchtz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4b3h5b3J2em55bXdwZXdhcGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzQ5NTUsImV4cCI6MjA5MDg1MDk1NX0.dvcgcomlV8Oc8QVXN6zc0DwYyoNl0LaNq-MDITcB2_Y';

let supabase: SupabaseClient | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

interface Finding {
  id: string;
  category: string;
  title: string;
  description: string;
  impact_amount_display: string;
  status: 'active' | 'fixed' | 'dismissed';
  badge: string | null;
  badge_color: string | null;
  disclaimer: string | null;
}

interface FixAction {
  id: string;
  title: string;
  description: string;
  impact_amount_display: string;
  meta: string;
  solv_reward: number;
  status: 'pending' | 'completed' | 'dismissed';
}

interface UserData {
  profile: {
    name: string;
    email: string;
    is_demo: boolean;
    trial_days_left: number;
    solv_balance: number;
    solvency_score: number;
  };
  findings: Finding[];
  actions: FixAction[];
  solvHistory: Array<{ id: string; action: string; amount: number }>;
  stats: {
    totalLeakage: number;
    fixedAmount: number;
    pendingActions: number;
  };
}

const QUESTIONS = [
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

export default function Dashboard() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'demo'>('demo');
  const [activeTab, setActiveTab] = useState('dash');
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [connectedAccounts, setConnectedAccounts] = useState<Array<{id: string, name: string, institution: string, type: string, lastSync: string, balance: string}>>([
    { id: '1', name: 'Chase Checking', institution: 'Chase', type: 'checking', lastSync: '2 hours ago', balance: '$4,521.32' },
    { id: '2', name: 'Chase Savings', institution: 'Chase', type: 'savings', lastSync: '2 hours ago', balance: '$18,400.00' },
    { id: '3', name: 'Fidelity 401(k)', institution: 'Fidelity', type: 'investment', lastSync: '1 day ago', balance: '$205,000.00' },
  ]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectStep, setConnectStep] = useState<'method' | 'uploading' | 'success'>('method');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    
    if (session) {
      await fetchUserData(session.access_token);
    }
    setLoading(false);
  };

  const fetchUserData = async (token?: string) => {
    const sb = getSupabase();
    const accessToken = token || (await sb.auth.getSession()).data.session?.access_token;
    
    if (!accessToken) return;

    try {
      const res = await fetch('/api/user/data', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        const trialDays = data.profile?.trial_ends_at 
          ? Math.max(0, Math.ceil((new Date(data.profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 14;

        setUser({
          profile: {
            name: data.profile?.full_name || data.profile?.email?.split('@')[0] || 'User',
            email: data.profile?.email || '',
            is_demo: data.profile?.is_demo || false,
            trial_days_left: trialDays,
            solv_balance: data.profile?.solv_balance || 0,
            solvency_score: data.profile?.solvency_score || 50,
          },
          findings: data.findings || [],
          actions: data.actions || [],
          solvHistory: data.solvHistory || [],
          stats: {
            totalLeakage: data.stats?.totalLeakage || 0,
            fixedAmount: data.stats?.fixedAmount || 0,
            pendingActions: data.stats?.pendingActions || 0,
          },
        });
      }
    } catch (error) {
      console.error('Fetch user data error:', error);
    }
  };

  const showToastMessage = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDemo = async () => {
    // Use client-side demo data for instant demo
    setUser({
      profile: {
        name: 'Sarah',
        email: 'sarah.demo@shadowcfo.app',
        is_demo: true,
        trial_days_left: 11,
        solv_balance: 847,
        solvency_score: 71,
      },
      findings: [
        { id: '1', category: 'cash_drag', title: '$18,400 sitting idle at 0.01% — FIXED', description: 'Moved $18,400 to Marcus HYSA earning 4.8%. Saving $883/year starting now.', impact_amount_display: '$883', status: 'fixed', badge: 'Fixed', badge_color: 'green', disclaimer: null },
        { id: '2', category: 'fee_drag', title: 'Your Fidelity fund charges 18× too much', description: 'FBALX charges 0.48%/year. FXAIX tracks the same index at 0.015%. On your $205,000 balance, that\'s $1,847 in unnecessary fees per year.', impact_amount_display: '$1,847', status: 'active', badge: 'One Tap', badge_color: 'green', disclaimer: 'Educational only.' },
        { id: '3', category: 'employer_match', title: "You're leaving $3,200 in free money on the table", description: 'You contribute 3% to your 401(k). Your employer matches 100% up to 6%. Increasing to 6% adds $3,200/year.', impact_amount_display: '$3,200', status: 'active', badge: 'High Priority', badge_color: 'amber', disclaimer: 'Adjust through HR portal.' },
        { id: '4', category: 'obbba', title: '$14,000 in overtime may be deductible under OBBBA', description: 'You received $14,000 in overtime in 2025. Under OBBBA, this may be fully deductible.', impact_amount_display: '$3,080', status: 'active', badge: 'Needs CPA', badge_color: 'amber', disclaimer: 'CPA review required.' },
        { id: '5', category: 'auto_loan', title: 'Your car loan interest may be deductible', description: 'You paid an estimated $2,420 in auto loan interest in 2025. Under OBBBA, qualifying interest may be deductible.', impact_amount_display: '$2,420', status: 'active', badge: 'OBBBA', badge_color: 'amber', disclaimer: 'Deductibility varies.' },
      ],
      actions: [
        { id: '1', title: 'Switch FBALX → FXAIX', description: 'Same S&P 500 exposure. 97% lower cost.', impact_amount_display: '$1,847', meta: 'Fee Drag · One Tap', solv_reward: 10, status: 'pending' },
        { id: '2', title: 'Increase 401(k) 3% → 6%', description: 'Guaranteed 100% return on each dollar.', impact_amount_display: '$3,200', meta: 'Employer Match', solv_reward: 25, status: 'pending' },
        { id: '3', title: 'Send deduction summary to CPA', description: 'We\'ve prepared a 1-page memo.', impact_amount_display: '$5,500', meta: 'OBBBA Deductions', solv_reward: 30, status: 'pending' },
      ],
      solvHistory: [
        { id: '1', action: 'Fixed cash drag on Chase', amount: 10 },
        { id: '2', action: 'Emergency fund hit 3 months', amount: 25 },
        { id: '3', action: 'Completed Fluency Score quiz', amount: 5 },
        { id: '4', action: 'Score improved 10+ points', amount: 10 },
      ],
      stats: {
        totalLeakage: 1034700,
        fixedAmount: 88300,
        pendingActions: 3,
      },
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    await fetchUserData(data.session?.access_token);
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
        setLoading(false);
        return;
      }

      // Auto login
      const sb = getSupabase();
      const { data: loginData, error: loginError } = await sb.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) throw loginError;
      await fetchUserData(loginData.session?.access_token);
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const sb = getSupabase();
    await sb.auth.signOut();
    setUser(null);
    setAuthMode('demo');
    setFormData({ email: '', password: '' });
  };

  const handleActionUpdate = async (actionId: string, status: string) => {
    if (!user) return;

    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;

    try {
      const res = await fetch('/api/actions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ actionId, status }),
      });

      if (res.ok) {
        // Update local state
        const action = user.actions.find(a => a.id === actionId);
        if (status === 'completed' && action) {
          showToastMessage(`+${action.solv_reward} $SOLV earned!`);
        }

        // Refresh data
        await fetchUserData(session.access_token);
      }
    } catch (error) {
      console.error('Action update error:', error);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'quiz') {
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
    const newAnswers = [...userAnswers, i];
    setUserAnswers(newAnswers);
    if (i === QUESTIONS[qi].correct) {
      setCorrect(correct + 1);
    }
  };

  const nextQuestion = () => {
    const nextQi = qi + 1;
    if (nextQi >= QUESTIONS.length) {
      setShowQuizResult(true);
    } else {
      setQi(nextQi);
      setSelectedOpt(null);
    }
  };

  const generateMemo = () => {
    if (!user) return;
    
    const obbbaFindings = user.findings.filter(f => f.category === 'obbba' || f.category === 'auto_loan');
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let memo = `
================================================================================
                    SHADOW CFO - TAX DEDUCTION SUMMARY
                              ${date}
================================================================================

CLIENT: ${user.profile.name}
EMAIL: ${user.profile.email}
PREPARED BY: Shadow CFO (Automated Analysis)

--------------------------------------------------------------------------------
                              EXECUTIVE SUMMARY
--------------------------------------------------------------------------------

This memo summarizes potential tax deductions identified through Shadow CFO.

--------------------------------------------------------------------------------
                            OBBBA-RELATED DEDUCTIONS
--------------------------------------------------------------------------------

`;

    obbbaFindings.forEach((f, i) => {
      memo += `${i + 1}. ${f.title}\n   Category: ${f.category.toUpperCase()}\n   Potential Savings: ${f.impact_amount_display}\n\n   ${f.description}\n\n`;
    });

    memo += `
--------------------------------------------------------------------------------
                              DISCLAIMER
--------------------------------------------------------------------------------

This memo is for educational purposes only. Consult a qualified CPA.

================================================================================
                         Generated by Shadow CFO
================================================================================
`;

    const blob = new Blob([memo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow-cfo-cpa-memo-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToastMessage('CPA Memo downloaded!');
  };

  if (showConnectModal) {
    return (
      <>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f7; }
          .modal-overlay { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.5); }
          .modal-card { background: white; border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; }
          .modal-title { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
          .modal-sub { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
          .connect-methods { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
          .method-btn { display: flex; align-items: center; gap: 14px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; cursor: pointer; background: white; text-align: left; transition: all 0.2s; }
          .method-btn:hover { border-color: #185FA5; background: #f0f7ff; }
          .method-icon { width: 44px; height: 44px; background: #f3f4f6; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
          .method-title { font-weight: 500; font-size: 15px; }
          .method-desc { font-size: 13px; color: #6b7280; }
          .upload-zone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; margin-bottom: 16px; transition: all 0.2s; }
          .upload-zone:hover { border-color: #185FA5; background: #f0f7ff; }
          .upload-zone.dragover { border-color: #185FA5; background: #e6f1fb; }
          .upload-icon { font-size: 32px; margin-bottom: 8px; }
          .upload-text { font-size: 14px; color: #6b7280; }
          .upload-text strong { color: #185FA5; }
          .file-name { font-size: 13px; color: #1a1a1a; margin-top: 8px; font-weight: 500; }
          .btn-primary { width: 100%; padding: 14px; background: #185FA5; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 500; cursor: pointer; }
          .btn-primary:hover { opacity: 0.9; }
          .btn-secondary { width: 100%; padding: 14px; background: transparent; color: #185FA5; border: 1px solid #185FA5; border-radius: 12px; font-size: 15px; font-weight: 500; cursor: pointer; margin-top: 12px; }
          .close-btn { position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 20px; cursor: pointer; color: #9ca3af; }
          .success-icon { width: 64px; height: 64px; background: #e1f5ee; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; }
          .spinner { width: 40px; height: 40px; border: 3px solid #e6f1fb; border-top-color: #185FA5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="modal-overlay">
          <div className="modal-card" style={{ position: 'relative' }}>
            <button className="close-btn" onClick={() => { setShowConnectModal(false); setConnectStep('method'); setUploadedFile(null); }}>×</button>
            
            {connectStep === 'method' && (
              <>
                <div className="modal-title">Connect an Account</div>
                <div className="modal-sub">Choose how you'd like to share your financial data</div>
                
                <div className="connect-methods">
                  <button className="method-btn" onClick={() => setConnectStep('uploading')}>
                    <div className="method-icon">📄</div>
                    <div>
                      <div className="method-title">Upload Bank Statement</div>
                      <div className="method-desc">CSV or PDF from your bank portal</div>
                    </div>
                  </button>
                  <button className="method-btn">
                    <div className="method-icon">🏦</div>
                    <div>
                      <div className="method-title">Secure Bank Connect</div>
                      <div className="method-desc">Read-only access via Plaid (coming soon)</div>
                    </div>
                  </button>
                  <button className="method-btn">
                    <div className="method-icon">📊</div>
                    <div>
                      <div className="method-title">Manual Entry</div>
                      <div className="method-desc">Enter accounts and balances manually</div>
                    </div>
                  </button>
                </div>
                
                <button className="btn-secondary" onClick={() => { setShowConnectModal(false); setConnectStep('method'); }}>Cancel</button>
              </>
            )}

            {connectStep === 'uploading' && (
              <>
                <div className="modal-title">Upload Statement</div>
                <div className="modal-sub">We'll analyze your transactions for fee leaks and savings opportunities</div>
                
                <div 
                  className="upload-zone"
                  onClick={() => document.getElementById('file-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('dragover');
                    if (e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0]);
                  }}
                >
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    Drag & drop your file here<br/>
                    or <strong>browse</strong>
                  </div>
                  <div className="upload-text" style={{ marginTop: 8, fontSize: 12 }}>Supports CSV, PDF, QFX, OFX</div>
                  {uploadedFile && <div className="file-name">✓ {uploadedFile.name}</div>}
                </div>
                <input 
                  id="file-input" 
                  type="file" 
                  accept=".csv,.pdf,.qfx,.ofx" 
                  style={{ display: 'none' }}
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                />
                
                <button className="btn-primary" onClick={() => {
                  if (uploadedFile) {
                    setConnectStep('success');
                  } else {
                    setConnectStep('success');
                  }
                }}>
                  Analyze Statement
                </button>
              </>
            )}

            {connectStep === 'success' && (
              <>
                <div className="success-icon">✓</div>
                <div className="modal-title" style={{ textAlign: 'center' }}>Account Connected!</div>
                <div className="modal-sub" style={{ textAlign: 'center' }}>
                  We're analyzing your transactions now. This usually takes 30-60 seconds.
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Analyzing for:</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: '#e6f1fb', color: '#185FA5', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Fee Drag</span>
                    <span style={{ background: '#e1f5ee', color: '#085041', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Savings</span>
                    <span style={{ background: '#faeeda', color: '#633806', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Tax Deductions</span>
                  </div>
                </div>
                <button className="btn-primary" onClick={() => {
                  setShowConnectModal(false);
                  setConnectStep('method');
                  setUploadedFile(null);
                }}>
                  Back to Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <style>{authStyles}</style>
        <div className="auth-container">
          <div className="auth-card">
            <div className="loading-spinner" />
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <style>{authStyles}</style>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-logo">Shadow CFO</div>
            <p className="auth-subtitle">Guided Financial Intelligence</p>

            {authMode === 'demo' ? (
              <>
                <p className="auth-desc">Try instantly with demo data. No signup required.</p>
                <button className="btn-primary" onClick={handleDemo} disabled={loading}>
                  Start Demo
                </button>
                <p className="auth-switch">
                  Have an account? <button onClick={() => setAuthMode('login')}>Sign in</button>
                </p>
              </>
            ) : authMode === 'login' ? (
              <>
                <form onSubmit={handleLogin}>
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
                    Sign In
                  </button>
                </form>
                <div className="auth-divider"><span>or</span></div>
                <button className="btn-secondary" onClick={() => setAuthMode('demo')}>
                  Try Demo Mode
                </button>
                <p className="auth-switch">
                  New here? <button onClick={() => setAuthMode('signup')}>Create account</button>
                </p>
              </>
            ) : (
              <>
                <form onSubmit={handleSignup}>
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
                    Create Account
                  </button>
                </form>
                <p className="auth-switch">
                  Have an account? <button onClick={() => setAuthMode('login')}>Sign in</button>
                </p>
              </>
            )}
          </div>
        </div>
        {showToast && <div className="toast show">{toastMsg}</div>}
      </>
    );
  }

  const totalLeakage = user.stats.totalLeakage / 100;
  const fixedAmount = user.stats.fixedAmount / 100;
  const solvPct = Math.min((user.profile.solv_balance / 1000) * 100, 100);
  const solvRem = Math.max(0, 1000 - user.profile.solv_balance);
  const getQuizScore = () => Math.round((correct / QUESTIONS.length) * 100);
  const getCategoryScores = () => {
    const cats = { risk: 0, tax: 0, cash: 0, fees: 0 };
    QUESTIONS.forEach((q, i) => {
      if (userAnswers[i] === q.correct) {
        if (q.cat === 'Risk comprehension') cats.risk++;
        else if (q.cat === 'Tax efficiency') cats.tax++;
        else if (q.cat === 'Cash management') cats.cash++;
        else if (q.cat === 'Investment fees') cats.fees++;
      }
    });
    return cats;
  };
  const cats = getCategoryScores();

  return (
    <>
      <style>{dashboardStyles}</style>
      
      <div className="toast" style={{ opacity: showToast ? 1 : 0, transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(40px)' }}>
        {toastMsg}
      </div>

      <div className="wrap">
        <div className="topbar">
          <div className="topbar-left">
            <button className={`tab ${activeTab === 'dash' ? 'on' : ''}`} onClick={() => handleTabChange('dash')}>Dashboard</button>
            <button className={`tab ${activeTab === 'findings' ? 'on' : ''}`} onClick={() => handleTabChange('findings')}>Findings</button>
            <button className={`tab ${activeTab === 'fixq' ? 'on' : ''}`} onClick={() => handleTabChange('fixq')}>
              Fix Queue {user.stats.pendingActions > 0 && <span className="cnt">{user.stats.pendingActions}</span>}
            </button>
            <button className={`tab ${activeTab === 'solv' ? 'on' : ''}`} onClick={() => handleTabChange('solv')}>$SOLV</button>
            <button className={`tab ${activeTab === 'quiz' ? 'on' : ''}`} onClick={() => handleTabChange('quiz')}>Fluency Quiz</button>
            <button className={`tab ${activeTab === 'accounts' ? 'on' : ''}`} onClick={() => handleTabChange('accounts')}>Accounts</button>
          </div>
          <div className="topbar-right">
            <div className="user-menu">
              {user.profile.name}
              {user.profile.is_demo && <span className="demo-badge">DEMO</span>}
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="body">
          {/* DASHBOARD */}
          {activeTab === 'dash' && (
            <div className="scr on">
              <div className="ph">
                Good morning, {user.profile.name} <span className="ph-sub">— {user.profile.trial_days_left} days left in trial</span>
              </div>

              <div className="score-row">
                <div className="score-box">
                  <div className="sn">{user.profile.solvency_score}</div>
                  <div style={{ flex: 1 }}>
                    <div className="si-label">Solvency Score</div>
                    <div className="si-delta">+13 this month</div>
                    <div className="si-txt">Cash drag fixed — ${fixedAmount.toLocaleString()}/year recovered</div>
                    <div className="sbar"><div className="sbar-fill" style={{ width: `${user.profile.solvency_score}%` }}></div></div>
                  </div>
                </div>
                <div className="leakage-box">
                  <div className="si-label">Total found</div>
                  <div className="lb-total">${totalLeakage.toLocaleString()}/yr</div>
                  {user.findings.filter(f => f.status === 'active').map((f, i) => (
                    <div key={i} className="lb-row">
                      <span>{f.category.replace('_', ' ')}</span>
                      <span>{f.impact_amount_display}</span>
                    </div>
                  ))}
                  {fixedAmount > 0 && (
                    <div className="lb-row" style={{ marginTop: 4 }}>
                      <span>Fixed</span>
                      <span style={{ color: 'var(--green)' }}>${fixedAmount.toLocaleString()}</span>
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
                      <span className={`badge ${finding.badge_color === 'green' ? 'b-go' : 'b-wa'}`}>{finding.badge}</span>
                    </div>
                    <div className="amt">{finding.impact_amount_display} <small>/ yr</small></div>
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
          )}

          {/* FINDINGS */}
          {activeTab === 'findings' && (
            <div className="scr">
              <div className="ph">Your findings</div>
              <div className="psub">Total: <strong style={{ color: 'var(--green)' }}>${totalLeakage.toLocaleString()}/year</strong> across {user.findings.filter(f => f.status === 'active').length} leakage categories</div>

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
                      {finding.impact_amount_display} <small>/ yr</small>
                    </div>
                  </div>
                  <div className={`fh ${finding.status === 'fixed' ? 'faded' : ''}`}>{finding.title}</div>
                  <div className="fb">{finding.description}</div>
                  {finding.status !== 'fixed' && (
                    <div className="fbtns">
                      <button className="btn-p" onClick={() => handleTabChange('fixq')}>View in Fix Queue</button>
                      <button className="btn-s">Learn more</button>
                    </div>
                  )}
                  {finding.disclaimer && <div className="disc">{finding.disclaimer}</div>}
                </div>
              ))}
            </div>
          )}

          {/* FIX QUEUE */}
          {activeTab === 'fixq' && (
            <div className="scr">
              <div className="ph">Fix Queue</div>
              <div className="psub">Review and approve. Every fix earns $SOLV.</div>

              {user.actions.filter(a => a.status !== 'dismissed').length > 0 ? (
                user.actions.filter(a => a.status !== 'dismissed').map((action) => (
                  <div key={action.id} className="fqi">
                    <div className="fqi-meta">{action.meta} · +{action.solv_reward} $SOLV</div>
                    <div className="fqi-head">
                      <div className="fqi-title">{action.title}</div>
                      <div className="fqi-impact">{action.impact_amount_display} <small>/ yr</small></div>
                    </div>
                    {action.description && <div className="fqi-desc">{action.description}</div>}
                    
                    {action.status === 'pending' && (
                      <div className="fqi-btns">
                        <button className="btn-p" onClick={() => handleActionUpdate(action.id, 'completed')}>
                          Approve → +{action.solv_reward} $SOLV
                        </button>
                        <button className="btn-s" onClick={() => handleActionUpdate(action.id, 'dismissed')}>Dismiss</button>
                      </div>
                    )}
                    {action.status === 'completed' && (
                      <div className="ok-msg">✓ Action completed! +{action.solv_reward} $SOLV earned</div>
                    )}
                    <div className="fqi-disc">Educational only.</div>
                  </div>
                ))
              ) : (
                <div className="empty">All caught up. We're monitoring for new opportunities.</div>
              )}
            </div>
          )}

          {/* $SOLV */}
          {activeTab === 'solv' && (
            <div className="scr">
              <div className="ph">Your $SOLV</div>
              <div className="psub">Earned through financial health actions.</div>

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
                { name: 'CPA Memo generation', desc: 'Downloadable tax deduction summary' },
                { name: 'Priority scanning', desc: 'Real-time account monitoring' },
                { name: 'Advanced analytics', desc: 'Deep dive financial insights' },
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
              {user.solvHistory.map((item) => (
                <div key={item.id} className="hist-row">
                  <span style={{ color: 'var(--t2)' }}>{item.action}</span>
                  <span style={{ color: 'var(--green)', fontWeight: 500 }}>+{item.amount}</span>
                </div>
              ))}

              <button className="btn-p" style={{ marginTop: 16 }} onClick={generateMemo}>
                Download CPA Memo
              </button>
            </div>
          )}

          {/* ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="scr on">
              <div className="ph">Connected Accounts</div>
              <div className="psub">Your financial data is encrypted and secure (CFPB 1033 compliant)</div>

              <div className="accounts-grid">
                {connectedAccounts.map((account) => (
                  <div key={account.id} className="account-card">
                    <div className="acc-header">
                      <div className="acc-icon">{account.institution.charAt(0)}</div>
                      <div className="acc-info">
                        <div className="acc-name">{account.name}</div>
                        <div className="acc-inst">{account.institution} · {account.type}</div>
                      </div>
                    </div>
                    <div className="acc-balance">{account.balance}</div>
                    <div className="acc-footer">
                      <span className="acc-sync">Synced {account.lastSync}</span>
                      <button className="acc-refresh">Refresh</button>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setShowConnectModal(true)}>
                + Connect New Account
              </button>

              <div className="connect-info">
                <div className="ci-title">How account connection works</div>
                <div className="ci-row">
                  <div className="ci-icon">1</div>
                  <div>
                    <div className="ci-label">Upload Bank Statement</div>
                    <div className="ci-desc">Upload a CSV or PDF statement from your bank</div>
                  </div>
                </div>
                <div className="ci-row">
                  <div className="ci-icon">2</div>
                  <div>
                    <div className="ci-label">AI Analysis</div>
                    <div className="ci-desc">We scan for fee drag, savings opportunities, and tax deductions</div>
                  </div>
                </div>
                <div className="ci-row">
                  <div className="ci-icon">3</div>
                  <div>
                    <div className="ci-label">Get Personalized Fixes</div>
                    <div className="ci-desc">Actionable recommendations to recover lost money</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FLUENCY QUIZ */}
          {activeTab === 'quiz' && (
            <div className="scr">
              {!showQuizResult ? (
                <div className="quiz-wrap">
                  <div>
                    <div className="q-progress-bar"><div className="q-progress-fill" style={{ width: `${((qi + 1) / QUESTIONS.length) * 100}%` }}></div></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t3)', marginTop: 5, marginBottom: 12 }}>
                      <span className="q-num">Question {qi + 1} of {QUESTIONS.length}</span>
                      <span style={{ fontWeight: 500, color: 'var(--blue)' }}>Score: {Math.round((correct / (qi + 1)) * 100) || 0}</span>
                    </div>
                  </div>
                  <div className="q-text">{QUESTIONS[qi]?.q}</div>
                  <div className="q-opts">
                    {QUESTIONS[qi]?.opts.map((opt, i) => {
                      let cls = 'q-opt';
                      if (selectedOpt !== null) {
                        if (i === QUESTIONS[qi].correct) cls += ' right';
                        else if (i === selectedOpt && i !== QUESTIONS[qi].correct) cls += ' wrong';
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
                <div className="score-result">
                  <div className="sr-num" style={{ color: getQuizScore() >= 70 ? 'var(--green)' : getQuizScore() >= 50 ? 'var(--amber)' : 'var(--red)' }}>
                    {getQuizScore()}
                  </div>
                  <div className="si-label">Your Financial Fluency Score</div>
                  <div className="sr-label">
                    {getQuizScore() >= 70 ? "Strong foundation!" : getQuizScore() >= 50 ? "You know more than most." : "Let's learn together."}
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
                    Based on your score, we estimate you have <strong>{getQuizScore() >= 70 ? '$4,000–$8,000' : getQuizScore() >= 50 ? '$8,200–$14,000' : '$12,000–$20,000'}</strong> in annual financial leakage.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const authStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f7; }
  .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-card { background: white; border-radius: 20px; padding: 48px 40px; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .auth-logo { font-size: 32px; font-weight: 600; color: #185FA5; margin-bottom: 8px; }
  .auth-subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
  .auth-desc { color: #6b7280; font-size: 14px; margin-bottom: 24px; line-height: 1.5; }
  .auth-card input { width: 100%; padding: 14px 16px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 15px; margin-bottom: 12px; outline: none; }
  .auth-card input:focus { border-color: #185FA5; }
  .btn-primary { width: 100%; padding: 14px; background: #185FA5; color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 500; cursor: pointer; margin-bottom: 16px; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:disabled { opacity: 0.6; }
  .btn-secondary { width: 100%; padding: 14px; background: transparent; color: #185FA5; border: 1px solid #185FA5; border-radius: 12px; font-size: 15px; font-weight: 500; cursor: pointer; }
  .auth-divider { margin: 24px 0; position: relative; }
  .auth-divider::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(0,0,0,0.1); }
  .auth-divider span { background: white; padding: 0 12px; position: relative; color: #9ca3af; font-size: 13px; }
  .auth-switch { font-size: 14px; color: #6b7280; }
  .auth-switch button { background: none; border: none; color: #185FA5; cursor: pointer; font-weight: 500; }
  .loading-spinner { width: 40px; height: 40px; border: 3px solid #E6F1FB; border-top-color: #185FA5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #1a1a18; color: white; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; z-index: 999; }
  .toast.show { animation: toastIn 0.3s ease; }
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
`;

const dashboardStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --blue: #185FA5; --blue-l: #E6F1FB; --green: #1D9E75; --green-l: #E1F5EE; --amber: #854F0B; --amber-l: #FAEEDA; --red: #A32D2D; --red-l: #FCEBEB; --t1: #1a1a1a; --t2: #6b7280; --t3: #9ca3af; --bd: rgba(0,0,0,0.08); --surf: #f9fafb; --card: #ffffff; --rm: 14px; --rl: 20px; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; color: var(--t1); background: #f5f5f7; }
  .wrap { border: 0.5px solid var(--bd); border-radius: var(--rl); overflow: hidden; background: var(--card); display: grid; grid-template-rows: auto 1fr; min-height: 560px; max-width: 1000px; margin: 40px auto; }
  @media (max-width: 520px) { .wrap { margin: 0; border-radius: 0; min-height: 100vh; } }
  .topbar { background: var(--surf); border-bottom: 0.5px solid var(--bd); display: flex; justify-content: space-between; }
  .topbar-left { display: flex; overflow-x: auto; }
  .topbar-right { display: flex; align-items: center; padding: 0 12px; gap: 8px; }
  .tab { padding: 12px 18px; font-size: 13px; color: var(--t2); cursor: pointer; border: none; background: none; border-bottom: 2px solid transparent; white-space: nowrap; }
  .tab:hover { color: var(--t1); }
  .tab.on { color: var(--blue); border-bottom-color: var(--blue); font-weight: 500; }
  .tab .cnt { display: inline-block; background: var(--blue); color: white; font-size: 10px; font-weight: 500; padding: 1px 6px; border-radius: 10px; margin-left: 5px; }
  .user-menu { font-size: 13px; color: var(--t2); display: flex; align-items: center; gap: 8px; }
  .demo-badge { font-size: 10px; background: var(--amber-l); color: #633806; padding: 2px 6px; border-radius: 4px; }
  .logout-btn { padding: 6px 12px; font-size: 12px; color: var(--t2); background: transparent; border: 1px solid var(--bd); border-radius: var(--rm); cursor: pointer; }
  .body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .scr { display: none; flex-direction: column; gap: 14px; }
  .scr.on { display: flex; }
  .ph { font-size: 17px; font-weight: 500; }
  .ph-sub { font-size: 14px; color: var(--t2); font-weight: 400; }
  .psub { font-size: 13px; color: var(--t2); margin-top: -8px; }
  .score-row { display: flex; gap: 16px; }
  @media (max-width: 520px) { .score-row { flex-direction: column; } }
  .score-box { background: var(--surf); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 18px; flex: 1; display: flex; gap: 14px; align-items: center; }
  .sn { font-size: 48px; font-weight: 500; color: var(--green); }
  .si-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; color: var(--t3); margin-bottom: 3px; }
  .si-delta { font-size: 13px; color: var(--green); font-weight: 500; margin-bottom: 2px; }
  .si-txt { font-size: 12px; color: var(--t2); }
  .sbar { height: 4px; background: var(--bd); border-radius: 2px; margin-top: 8px; }
  .sbar-fill { height: 100%; border-radius: 2px; background: var(--green); }
  .leakage-box { background: var(--surf); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 18px; width: 200px; }
  @media (max-width: 520px) { .leakage-box { width: 100%; } }
  .lb-total { font-size: 22px; font-weight: 500; color: var(--red); margin-bottom: 8px; }
  .lb-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--t2); padding: 3px 0; border-bottom: 0.5px solid var(--bd); }
  .lb-row:last-child { border-bottom: none; font-weight: 500; color: var(--t1); }
  .banner { background: var(--amber-l); border: 0.5px solid #FAC775; border-radius: var(--rm); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
  .banner:hover { background: #F5DDB0; }
  .bt { font-size: 13px; font-weight: 500; color: var(--amber); }
  .bs { font-size: 12px; color: #633806; margin-top: 1px; }
  .barr { font-size: 16px; color: var(--amber); }
  .fc, .fqi { background: var(--card); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 16px; }
  .fc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; gap: 8px; }
  .badges { display: flex; gap: 5px; flex-wrap: wrap; flex: 1; }
  .badge { font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 20px; }
  .b-cat { background: var(--blue-l); color: #0C447C; }
  .b-go { background: var(--green-l); color: #085041; }
  .b-wa { background: var(--amber-l); color: #633806; }
  .b-done { background: var(--green-l); color: #085041; opacity: 0.7; }
  .amt { font-size: 24px; font-weight: 500; color: var(--green); white-space: nowrap; }
  .amt.faded { color: var(--t3); }
  .amt small { font-size: 12px; color: var(--t3); font-weight: 400; }
  .fh { font-size: 14px; font-weight: 500; margin-bottom: 5px; }
  .fh.faded { color: var(--t2); }
  .fb { font-size: 13px; color: var(--t2); line-height: 1.6; margin-bottom: 12px; }
  .fbtns { display: flex; gap: 8px; flex-wrap: wrap; }
  .btn-p { background: var(--blue); color: white; font-size: 12px; font-weight: 500; padding: 8px 14px; border-radius: var(--rm); border: none; cursor: pointer; }
  .btn-p:hover { opacity: 0.85; }
  .btn-s { background: transparent; color: var(--t2); font-size: 12px; padding: 8px 12px; border-radius: var(--rm); border: 0.5px solid var(--bd); cursor: pointer; }
  .btn-s:hover { background: var(--surf); }
  .disc { font-size: 11px; color: var(--t3); margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--bd); }
  .fqi-meta { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; color: var(--t3); margin-bottom: 4px; }
  .fqi-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; }
  .fqi-title { font-size: 14px; font-weight: 500; }
  .fqi-impact { font-size: 22px; font-weight: 500; color: var(--green); white-space: nowrap; }
  .fqi-impact small { font-size: 12px; color: var(--t3); font-weight: 400; }
  .fqi-desc { font-size: 13px; color: var(--t2); margin-bottom: 12px; line-height: 1.6; }
  .fqi-btns { display: flex; gap: 8px; align-items: center; }
  .fqi-disc { font-size: 11px; color: var(--t3); margin-top: 8px; }
  .ok-msg { font-size: 13px; color: var(--green); font-weight: 500; }
  .empty { text-align: center; padding: 32px 16px; color: var(--t3); font-size: 13px; }
  .solv-card { background: var(--surf); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 16px; }
  .solv-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .solv-bal { font-size: 24px; font-weight: 500; color: var(--blue); }
  .tier-pill { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--blue-l); color: #0C447C; }
  .tier-pill.architect { background: var(--amber-l); color: #633806; }
  .solv-bar-wrap { height: 6px; background: var(--bd); border-radius: 3px; margin-bottom: 7px; }
  .solv-bar-fill { height: 100%; border-radius: 3px; background: var(--blue); }
  .solv-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--t2); }
  .unlock-row { background: var(--card); border-radius: var(--rm); padding: 12px; border: 0.5px solid var(--bd); display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .unlock-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
  .unlock-desc { font-size: 12px; color: var(--t2); }
  .unlock-pill { font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 20px; background: var(--blue-l); color: #0C447C; }
  .unlock-pill.unlocked { background: var(--green-l); color: #085041; }
  .hist-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 0.5px solid var(--bd); }
  .hist-row:last-child { border-bottom: none; }
  .quiz-wrap { display: flex; flex-direction: column; gap: 12px; }
  .q-progress-bar { height: 3px; background: var(--bd); border-radius: 2px; }
  .q-progress-fill { height: 100%; border-radius: 2px; background: var(--blue); }
  .q-num { font-size: 11px; color: var(--t3); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
  .q-text { font-size: 16px; font-weight: 500; line-height: 1.4; }
  .q-opts { display: flex; flex-direction: column; gap: 8px; }
  .q-opt { padding: 12px 14px; border: 0.5px solid var(--bd); border-radius: var(--rm); cursor: pointer; font-size: 13px; background: var(--card); text-align: left; width: 100%; font-family: inherit; }
  .q-opt:hover { border-color: var(--blue); background: var(--blue-l); }
  .q-opt.right { border-color: var(--green); background: var(--green-l); color: #085041; }
  .q-opt.wrong { border-color: var(--red); background: var(--red-l); color: var(--red); }
  .q-nav { display: flex; justify-content: flex-end; }
  .score-result { background: var(--surf); border-radius: var(--rl); padding: 24px; text-align: center; border: 0.5px solid var(--bd); }
  .sr-num { font-size: 56px; font-weight: 500; margin-bottom: 8px; }
  .sr-label { font-size: 13px; color: var(--t2); margin-bottom: 16px; }
  .sr-bars { display: flex; flex-direction: column; gap: 8px; text-align: left; margin-bottom: 16px; }
  .sr-bar-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
  .sr-bar-label { min-width: 120px; color: var(--t2); }
  .sr-bar-track { flex: 1; height: 6px; background: var(--bd); border-radius: 3px; }
  .sr-bar-fill { height: 100%; border-radius: 3px; }
  .find-cta { font-size: 13px; color: var(--t2); line-height: 1.6; padding: 12px; background: var(--card); border-radius: var(--rm); border: 0.5px solid var(--bd); margin-bottom: 12px; }
  .find-cta strong { color: var(--green); }
  .toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%) translateY(40px); background: #1a1a18; color: white; padding: 9px 16px; border-radius: var(--rm); font-size: 13px; font-weight: 500; opacity: 0; transition: all 0.3s; pointer-events: none; z-index: 999; white-space: nowrap; }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  
  /* Accounts Tab */
  .accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .account-card { background: var(--surf); border: 0.5px solid var(--bd); border-radius: var(--rl); padding: 16px; }
  .acc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .acc-icon { width: 40px; height: 40px; background: var(--blue-l); color: var(--blue); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; }
  .acc-name { font-weight: 500; font-size: 14px; }
  .acc-inst { font-size: 12px; color: var(--t2); text-transform: capitalize; }
  .acc-balance { font-size: 22px; font-weight: 500; color: var(--t1); margin-bottom: 12px; }
  .acc-footer { display: flex; justify-content: space-between; align-items: center; }
  .acc-sync { font-size: 11px; color: var(--t3); }
  .acc-refresh { background: none; border: none; color: var(--blue); font-size: 12px; cursor: pointer; font-weight: 500; }
  .acc-refresh:hover { text-decoration: underline; }
  .connect-info { background: var(--surf); border-radius: var(--rl); padding: 20px; margin-top: 8px; border: 0.5px solid var(--bd); }
  .ci-title { font-weight: 500; font-size: 14px; margin-bottom: 16px; }
  .ci-row { display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start; }
  .ci-row:last-child { margin-bottom: 0; }
  .ci-icon { width: 24px; height: 24px; background: var(--blue-l); color: var(--blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
  .ci-label { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
  .ci-desc { font-size: 12px; color: var(--t2); }
`;
