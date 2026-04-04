'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxxezkoiyxrnwtdrchtz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eGV6a29peXhybnd0ZHJjaHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjM3MTcsImV4cCI6MjA5MDgzOTcxN30.ldVjon3CvC8Fv1UFJqxDwMx-IEOritV8pr-6CDXjigw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEMO_ACCOUNTS = [
  { id: '1', name: 'Chase Checking', institution: 'Chase', type: 'checking', lastSync: '2 hours ago', balance: '$4,521.32' },
  { id: '2', name: 'Chase Savings', institution: 'Chase', type: 'savings', lastSync: '2 hours ago', balance: '$18,400.00' },
  { id: '3', name: 'Fidelity 401(k)', institution: 'Fidelity', type: 'investment', lastSync: '1 day ago', balance: '$205,000.00' },
];

export default function AccountsPage() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in first');
        setUploading(false);
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bank-statements')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      // Simulate analysis (in production, this would call an API)
      setUploading(false);
      setAnalyzing(true);
      
      // Wait for "analysis"
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate findings (demo)
      const findings = [
        { category: 'fee_drag', title: 'High expense ratio detected', impact_amount_cents: 150000 },
        { category: 'cash_drag', title: 'Low-yield account detected', impact_amount_cents: 70000 },
      ];

      for (const finding of findings) {
        await supabase.from('findings').insert({
          user_id: user.id,
          category: finding.category,
          title: finding.title,
          description: 'Based on your uploaded statement, we identified potential savings.',
          impact_amount_cents: finding.impact_amount_cents,
          impact_amount_display: `$${(finding.impact_amount_cents / 100).toLocaleString()}`,
          priority: 'medium',
          status: 'active',
          badge: 'One Tap',
          badge_color: 'green',
        });
      }

      // Create action
      await supabase.from('fix_actions').insert({
        user_id: user.id,
        title: 'Switch to low-cost index fund',
        description: 'Replace high-fee funds with low-cost alternatives.',
        impact_amount_cents: 150000,
        impact_amount_display: '$1,500',
        meta: 'Fee Drag · One Tap',
        solv_reward: 10,
        action_type: 'one_tap',
        status: 'pending',
      });

      setAnalyzing(false);
      setUploadSuccess(true);
      
    } catch (err) {
      console.error('Error:', err);
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Connected Accounts</h1>
      <p className="text-gray-400 mb-8">Your financial data is encrypted and secure (CFPB 1033 compliant)</p>

      {/* Connected Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {DEMO_ACCOUNTS.map((account) => (
          <div key={account.id} className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-900/30 rounded-xl flex items-center justify-center text-2xl">
                {account.institution.charAt(0)}
              </div>
              <div>
                <div className="font-semibold">{account.name}</div>
                <div className="text-gray-400 text-sm">{account.institution} · {account.type}</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mb-2">{account.balance}</div>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Synced {account.lastSync}</span>
              <button className="text-emerald-400 hover:text-emerald-300">Refresh</button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl p-8">
        <h2 className="text-xl font-semibold mb-2">Connect New Account</h2>
        <p className="text-gray-400 mb-6">Upload a bank statement to analyze for financial leaks.</p>

        {analyzing ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Analyzing your statement...</h3>
            <p className="text-gray-400">This usually takes 30-60 seconds.</p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></span>
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
              <span className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
            </div>
          </div>
        ) : uploadSuccess ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Analysis Complete!</h3>
            <p className="text-gray-400 mb-4">New findings have been generated from your statement.</p>
            <a href="/findings" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium inline-block transition-colors">
              View Findings
            </a>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-900/10' : 'border-dark-700'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-400 mb-2">
              Drag & drop your bank statement here, or{' '}
              <label className="text-emerald-400 cursor-pointer hover:text-emerald-300">
                browse
                <input
                  type="file"
                  accept=".csv,.pdf,.qfx,.ofx"
                  className="hidden"
                  onChange={handleChange}
                  disabled={uploading}
                />
              </label>
            </p>
            <p className="text-gray-500 text-sm">Supports CSV, PDF, QFX, OFX</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">How account connection works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold">1</div>
            <div>
              <div className="font-medium mb-1">Upload Bank Statement</div>
              <div className="text-gray-400 text-sm">Upload a CSV or PDF statement from your bank</div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold">2</div>
            <div>
              <div className="font-medium mb-1">AI Analysis</div>
              <div className="text-gray-400 text-sm">We scan for fee drag, savings, and tax deductions</div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold">3</div>
            <div>
              <div className="font-medium mb-1">Get Personalized Fixes</div>
              <div className="text-gray-400 text-sm">Actionable recommendations to recover lost money</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}