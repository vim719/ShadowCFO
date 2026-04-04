'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dash');
  const [solvBal, setSolvBal] = useState(847);
  const [score, setScore] = useState(71);
  const [fixCnt, setFixCnt] = useState(3);
  const [fixedSum] = useState(883);
  const [dismissed, setDismissed] = useState(0);
  const [qi, setQi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

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

  const [showQuizResult, setShowQuizResult] = useState(false);

  useEffect(() => {
    if (activeTab === 'quiz' && qi === 0 && !showQuizResult) {
      setQi(0);
      setCorrect(0);
      setUserAnswers([]);
      setSelectedOpt(null);
      setShowQuizResult(false);
    }
  }, [activeTab]);

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

  const handleQuickApprove = () => {
    showToastMessage('$1,847/yr saved on fund fees · +10 $SOLV');
  };

  const handleApproveFix = (id: string, msg: string, solvAmount: number) => {
    const el = document.getElementById(id);
    if (el) {
      const btns = el.querySelector('.fqi-btns');
      if (btns) {
        btns.innerHTML = `<span class="ok-msg">✓ ${msg.split('·')[0].trim()}</span>`;
      }
    }
    setSolvBal(solvBal + solvAmount);
    setScore(Math.min(100, score + 5));
    showToastMessage(msg.replace(`+${solvAmount} $SOLV · `, '').replace(`+${solvAmount} $SOLV`, '').trim());
    
    const newFixCnt = Math.max(0, fixCnt - 1);
    setFixCnt(newFixCnt);
    if (newFixCnt === 0) {
      setTimeout(() => {
        const list = document.getElementById('fq-list');
        const done = document.getElementById('fq-done');
        if (list) list.style.display = 'none';
        if (done) done.style.display = 'block';
      }, 400);
    }
  };

  const handleDismiss = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.style.opacity = '0.3';
      el.style.pointerEvents = 'none';
      setTimeout(() => {
        el.style.display = 'none';
      }, 300);
    }
    const newFixCnt = Math.max(0, fixCnt - 1);
    setFixCnt(newFixCnt);
    setDismissed(dismissed + 1);
    if (newFixCnt === 0) {
      setTimeout(() => {
        const list = document.getElementById('fq-list');
        const done = document.getElementById('fq-done');
        if (list) list.style.display = 'none';
        if (done) done.style.display = 'block';
      }, 400);
    }
  };

  const solvPct = Math.min((solvBal / 1000) * 100, 100);
  const solvRem = Math.max(0, 1000 - solvBal);
  const cats = getCategoryScores();

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
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
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
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
        .body { padding: 20px; overflow: auto; display: flex; flex-direction: column; gap: 14px; }
        .scr { display: none; flex-direction: column; gap: 14px; }
        .scr.on { display: flex; }
        .ph { font-size: 17px; font-weight: 500; color: var(--t1); }
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
        .fh { font-size: 14px; font-weight: 500; margin-bottom: 5px; }
        .fb { font-size: 13px; color: var(--t2); line-height: 1.6; margin-bottom: 12px; }
        .fbtns { display: flex; gap: 8px; }
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
        .fqi-btns { display: flex; gap: 8px; align-items: center; }
        .fqi-disc { font-size: 11px; color: var(--t3); margin-top: 8px; }
        .ok-msg { font-size: 13px; color: var(--green); font-weight: 500; }
        .empty { text-align: center; padding: 32px 16px; color: var(--t3); font-size: 13px; }
        .solv-card { background: var(--surf); border-radius: var(--rl); border: 0.5px solid var(--bd); padding: 16px; }
        .solv-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .solv-bal { font-size: 24px; font-weight: 500; color: var(--blue); }
        .tier-pill { font-size: 11px; font-weight: 500; padding: 3px 9px; border-radius: 20px; background: var(--blue-l); color: #0C447C; }
        .solv-bar-wrap { height: 6px; background: var(--bd); border-radius: 3px; margin-bottom: 7px; }
        .solv-bar-fill { height: 100%; border-radius: 3px; background: var(--blue); transition: width 0.5s ease; }
        .solv-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--t2); }
        .unlock-row { background: var(--card); border-radius: var(--rm); padding: 12px; border: 0.5px solid var(--bd); display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .unlock-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
        .unlock-desc { font-size: 12px; color: var(--t2); }
        .unlock-pill { font-size: 11px; font-weight: 500; padding: 2px 7px; border-radius: 20px; background: var(--blue-l); color: #0C447C; white-space: nowrap; }
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
          <button className={`tab ${activeTab === 'dash' ? 'on' : ''}`} onClick={() => handleTabChange('dash')}>Dashboard</button>
          <button className={`tab ${activeTab === 'findings' ? 'on' : ''}`} onClick={() => handleTabChange('findings')}>Findings</button>
          <button className={`tab ${activeTab === 'fixq' ? 'on' : ''}`} onClick={() => handleTabChange('fixq')}>Fix Queue {fixCnt > 0 && <span className="cnt">{fixCnt}</span>}</button>
          <button className={`tab ${activeTab === 'solv' ? 'on' : ''}`} onClick={() => handleTabChange('solv')}>$SOLV</button>
          <button className={`tab ${activeTab === 'quiz' ? 'on' : ''}`} onClick={() => handleTabChange('quiz')}>Fluency Quiz</button>
        </div>

        <div className="body">
          {/* DASHBOARD */}
          <div className={`scr ${activeTab === 'dash' ? 'on' : ''}`}>
            <div className="ph">
              Good morning, Sarah <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--t2)' }}>— 11 days left in trial</span>
            </div>

            <div className="score-row">
              <div className="score-box">
                <div className="sn">{score}</div>
                <div style={{ flex: 1 }}>
                  <div className="si-label">Solvency Score</div>
                  <div className="si-delta">+13 this month</div>
                  <div className="si-txt">Cash drag fixed — $883/year recovered</div>
                  <div className="sbar"><div className="sbar-fill" style={{ width: `${score}%` }}></div></div>
                </div>
              </div>
              <div className="leakage-box">
                <div className="si-label">Total found</div>
                <div className="lb-total">$11,430/yr</div>
                <div className="lb-row"><span>Cash drag</span><span>$883</span></div>
                <div className="lb-row"><span>Fee drag</span><span>$1,847</span></div>
                <div className="lb-row"><span>Match gap</span><span>$3,200</span></div>
                <div className="lb-row"><span>OBBBA</span><span>$5,500</span></div>
                <div className="lb-row" style={{ marginTop: 4 }}><span>Fixed</span><span style={{ color: 'var(--green)' }}>${fixedSum}</span></div>
              </div>
            </div>

            <div className="banner" onClick={() => handleTabChange('fixq')}>
              <div>
                <div className="bt">3 fixes ready — one tap each</div>
                <div className="bs">Takes under 2 minutes · Earns $SOLV</div>
              </div>
              <div className="barr">→</div>
            </div>

            <div className="fc">
              <div className="fc-top">
                <div className="badges"><span className="badge b-cat">Fee Drag</span><span className="badge b-go">One Tap</span></div>
                <div className="amt">$1,847 <small>/ yr</small></div>
              </div>
              <div className="fh">Your Fidelity fund charges 18× too much</div>
              <div className="fb">FBALX charges 0.48%/year. FXAIX tracks the same S&P 500 index at 0.015%. On your $205K balance, that's $1,847 in unnecessary fees every year.</div>
              <div className="fbtns">
                <button className="btn-p" onClick={handleQuickApprove}>See Swap Option</button>
                <button className="btn-s">Learn more</button>
              </div>
              <div className="disc">Educational information only — not investment advice.</div>
            </div>
          </div>

          {/* FINDINGS */}
          <div className={`scr ${activeTab === 'findings' ? 'on' : ''}`}>
            <div className="ph">Your findings</div>
            <div className="psub">Total: <strong style={{ color: 'var(--green)' }}>$11,430/year</strong> across 5 leakage categories</div>

            <div className="fc">
              <div className="fc-top">
                <div className="badges"><span className="badge b-cat">Cash Drag</span><span className="badge b-done">Fixed</span></div>
                <div className="amt" style={{ color: 'var(--t3)' }}>$883 <small>/ yr</small></div>
              </div>
              <div className="fh" style={{ color: 'var(--t2)' }}>$18,400 sitting idle at 0.01% — FIXED</div>
              <div className="fb">Moved $18,400 to Marcus HYSA earning 4.8%. You approved this on Monday. Saving $883/year starting now.</div>
              <div className="fbtns"><button className="btn-p done" disabled>Approved</button></div>
            </div>

            <div className="fc">
              <div className="fc-top">
                <div className="badges"><span className="badge b-cat">Fee Drag</span><span className="badge b-go">One Tap</span></div>
                <div className="amt">$1,847 <small>/ yr</small></div>
              </div>
              <div className="fh">Your Fidelity fund charges 18× too much</div>
              <div className="fb">FBALX charges 0.48%/year. FXAIX tracks the exact same S&P 500 index at 0.015%. On your $205,000 balance, that's $1,847 in unnecessary fees per year.</div>
              <div className="fbtns">
                <button className="btn-p" onClick={() => showToastMessage('$1,847/yr saved · +10 $SOLV')}>Approve Swap</button>
                <button className="btn-s">Dismiss</button>
              </div>
              <div className="disc">Educational information only — not investment advice.</div>
            </div>

            <div className="fc">
              <div className="fc-top">
                <div className="badges"><span className="badge b-cat">Employer Match</span><span className="badge b-wa">High Priority</span></div>
                <div className="amt">$3,200 <small>/ yr</small></div>
              </div>
              <div className="fh">You're leaving $3,200 in free money on the table</div>
              <div className="fb">You contribute 3% to your 401(k). Your employer matches 100% up to 6%. Increasing to 6% adds $3,200/year in employer contributions — a guaranteed 100% return on each dollar.</div>
              <div className="fbtns">
                <button className="btn-p" onClick={() => showToastMessage('$3,200/yr employer match recaptured · +25 $SOLV')}>Increase to 6%</button>
                <button className="btn-s">Learn more</button>
              </div>
              <div className="disc">Educational information only — adjust through your HR portal or Fidelity NetBenefits.</div>
            </div>

            <div className="fc">
              <div className="fc-top">
                <div className="badges"><span className="badge b-cat">OBBBA Deduction</span><span className="badge b-wa">Needs CPA</span></div>
                <div className="amt">$3,080 <small>est.</small></div>
              </div>
              <div className="fh">$14,000 in overtime may be deductible under OBBBA</div>
              <div className="fb">You received $14,000 in overtime in 2025. Under the One Big Beautiful Bill Act, this income may be fully deductible. At your estimated 22% tax rate, that's ~$3,080 in savings.</div>
              <div className="fbtns">
                <button className="btn-p" onClick={() => showToastMessage('CPA memo generated · +30 $SOLV')}>Generate CPA Memo</button>
                <button className="btn-s">What is OBBBA?</button>
              </div>
              <div className="disc">Tax deductibility requires CPA review. This memo is educational — not tax advice.</div>
            </div>

            <div className="fc">
              <div className="fc-top">
                <div className="badges"><span className="badge b-cat">Auto Loan Interest</span><span className="badge b-wa">OBBBA</span></div>
                <div className="amt">$2,420 <small>est.</small></div>
              </div>
              <div className="fh">Your car loan interest may be deductible</div>
              <div className="fb">You paid an estimated $2,420 in auto loan interest in 2025. Under OBBBA, qualifying vehicle loan interest up to $10,000 is now deductible. Ask your CPA to verify.</div>
              <div className="fbtns">
                <button className="btn-p" onClick={() => showToastMessage('Auto loan deduction memo sent · +30 $SOLV')}>Add to CPA Memo</button>
                <button className="btn-s">Dismiss</button>
              </div>
              <div className="disc">Deductibility varies. This is educational — not tax advice.</div>
            </div>
          </div>

          {/* FIX QUEUE */}
          <div className={`scr ${activeTab === 'fixq' ? 'on' : ''}`}>
            <div className="ph">Fix Queue</div>
            <div className="psub">Review and approve. Every fix earns $SOLV.</div>

            <div id="fq-list">
              <div className="fqi" id="fq1">
                <div className="fqi-meta">Fee Drag · One Tap · +10 $SOLV</div>
                <div className="fqi-head">
                  <div className="fqi-title">Switch FBALX → FXAIX (Fidelity 500 Index)</div>
                  <div className="fqi-impact">$1,847 <small>/ yr</small></div>
                </div>
                <div className="fqi-desc">Same S&P 500 exposure. 97% lower cost. We'll show you the Fidelity link to make the switch in under 3 minutes. No tax event triggered by switching within an IRA.</div>
                <div className="fqi-btns">
                  <button className="btn-p" onClick={() => handleApproveFix('fq1', '$1,847/yr saved · +10 $SOLV', 10)}>Approve → +10 $SOLV</button>
                  <button className="btn-s" onClick={() => handleDismiss('fq1')}>Dismiss</button>
                </div>
                <div className="fqi-disc">Educational only. Not investment advice. Review with an advisor if unsure.</div>
              </div>

              <div className="fqi" id="fq2">
                <div className="fqi-meta">Employer Match · Must Do · +25 $SOLV</div>
                <div className="fqi-head">
                  <div className="fqi-title">Increase 401(k) contribution 3% → 6%</div>
                  <div className="fqi-impact">$3,200 <small>/ yr</small></div>
                </div>
                <div className="fqi-desc">Your employer matches 100% up to 6%. You're at 3%. This is a guaranteed 100% return on each new dollar contributed — the single highest-return action in your Fix Queue.</div>
                <div className="fqi-btns">
                  <button className="btn-p" onClick={() => handleApproveFix('fq2', '$3,200/yr recaptured · +25 $SOLV', 25)}>Approve → +25 $SOLV</button>
                  <button className="btn-s" onClick={() => handleDismiss('fq2')}>Dismiss</button>
                </div>
                <div className="fqi-disc">Educational only. Adjust through your HR portal or Fidelity NetBenefits.</div>
              </div>

              <div className="fqi" id="fq3">
                <div className="fqi-meta">OBBBA Deductions · Needs CPA · +30 $SOLV</div>
                <div className="fqi-head">
                  <div className="fqi-title">Send deduction summary to your CPA</div>
                  <div className="fqi-impact">$5,500 <small>est.</small></div>
                </div>
                <div className="fqi-desc">We've prepared a 1-page memo covering your $14,000 overtime deduction and $2,420 auto loan interest deduction. Tap to open a pre-filled email ready to send to your CPA before they file.</div>
                <div className="fqi-btns">
                  <button className="btn-p" onClick={() => handleApproveFix('fq3', 'CPA memo sent · +30 $SOLV', 30)}>Send CPA Memo → +30 $SOLV</button>
                  <button className="btn-s" onClick={() => handleDismiss('fq3')}>Dismiss</button>
                </div>
                <div className="fqi-disc">Tax deductibility requires CPA review. This memo is educational — not tax advice.</div>
              </div>
            </div>
            <div className="empty" id="fq-done" style={{ display: fixCnt === 0 ? 'block' : 'none' }}>All caught up. We're monitoring for new opportunities.</div>
          </div>

          {/* $SOLV */}
          <div className={`scr ${activeTab === 'solv' ? 'on' : ''}`}>
            <div className="ph">Your $SOLV</div>
            <div className="psub">Earned through financial health actions. Soul-bound — cannot be transferred or sold.</div>

            <div className="solv-card">
              <div className="solv-h">
                <div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 3 }}>Balance</div>
                  <div className="solv-bal">{solvBal} $SOLV</div>
                </div>
                <span className="tier-pill" style={solvRem <= 0 ? { background: 'var(--amber-l)', color: '#633806' } : {}}>
                  {solvBal >= 1000 ? 'Architect' : 'Protector'}
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
              { name: 'Trump Account setup', desc: 'Automated generational wealth for your children' }
            ].map((item, i) => (
              <div className="unlock-row" key={i}>
                <div>
                  <div className="unlock-name">{item.name}</div>
                  <div className="unlock-desc">{item.desc}</div>
                </div>
                <span className="unlock-pill" style={solvRem <= 0 ? { background: 'var(--green-l)', color: '#085041' } : {}}>
                  {solvRem > 0 ? `${solvRem} away` : 'Unlocked'}
                </span>
              </div>
            ))}

            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Earning history</div>
            <div>
              <div className="hist-row"><span style={{ color: 'var(--t2)' }}>Fixed cash drag on Chase</span><span style={{ color: 'var(--green)', fontWeight: 500 }}>+10</span></div>
              <div className="hist-row"><span style={{ color: 'var(--t2)' }}>Emergency fund hit 3 months</span><span style={{ color: 'var(--green)', fontWeight: 500 }}>+25</span></div>
              <div className="hist-row"><span style={{ color: 'var(--t2)' }}>Completed Fluency Score quiz</span><span style={{ color: 'var(--green)', fontWeight: 500 }}>+5</span></div>
              <div className="hist-row"><span style={{ color: 'var(--t2)' }}>Score improved 10+ points</span><span style={{ color: 'var(--green)', fontWeight: 500 }}>+10</span></div>
            </div>
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
                    } else if (selectedOpt === i) {
                      cls += ' sel';
                    }
                    return (
                      <button
                        key={i}
                        className={cls}
                        onClick={() => selectQuizOption(i)}
                        disabled={selectedOpt !== null}
                      >
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
                    <div className="sr-bar-row">
                      <span className="sr-bar-label">Risk comprehension</span>
                      <div className="sr-bar-track">
                        <div className="sr-bar-fill" style={{ 
                          width: `${(cats.risk / 3) * 100}%`,
                          background: (cats.risk / 3) * 100 >= 70 ? 'var(--green)' : (cats.risk / 3) * 100 >= 40 ? 'var(--amber)' : 'var(--red)'
                        }}></div>
                      </div>
                    </div>
                    <div className="sr-bar-row">
                      <span className="sr-bar-label">Tax efficiency</span>
                      <div className="sr-bar-track">
                        <div className="sr-bar-fill" style={{ 
                          width: `${(cats.tax / 3) * 100}%`,
                          background: (cats.tax / 3) * 100 >= 70 ? 'var(--green)' : (cats.tax / 3) * 100 >= 40 ? 'var(--amber)' : 'var(--red)'
                        }}></div>
                      </div>
                    </div>
                    <div className="sr-bar-row">
                      <span className="sr-bar-label">Cash management</span>
                      <div className="sr-bar-track">
                        <div className="sr-bar-fill" style={{ 
                          width: `${(cats.cash / 2) * 100}%`,
                          background: (cats.cash / 2) * 100 >= 70 ? 'var(--green)' : (cats.cash / 2) * 100 >= 40 ? 'var(--amber)' : 'var(--red)'
                        }}></div>
                      </div>
                    </div>
                    <div className="sr-bar-row">
                      <span className="sr-bar-label">Investment fees</span>
                      <div className="sr-bar-track">
                        <div className="sr-bar-fill" style={{ 
                          width: `${(cats.fees / 3) * 100}%`,
                          background: (cats.fees / 3) * 100 >= 70 ? 'var(--green)' : (cats.fees / 3) * 100 >= 40 ? 'var(--amber)' : 'var(--red)'
                        }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="find-cta">
                    Based on your score, we estimate you have <strong>{getQuizScore() >= 70 ? '$4,000–$8,000' : getQuizScore() >= 50 ? '$8,200–$14,000' : '$12,000–$20,000'}</strong> in annual financial leakage. Connect your accounts to find the exact amount.
                  </div>
                  <button className="btn-p" style={{ width: '100%' }} onClick={() => showToastMessage('Sign up at shadowcfo.com to connect your accounts and find your exact leakage')}>Find My Exact Leakage →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
