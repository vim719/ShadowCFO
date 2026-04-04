import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shadow CFO - Find Hidden Financial Leaks",
  description: "AI-powered financial analysis to find fee drag, missed deductions, and savings opportunities.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Header */}
      <header className="border-b border-dark-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-400">Shadow CFO</h1>
          <nav className="flex gap-6 items-center">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Find <span className="text-emerald-400">hidden financial leaks</span> in your accounts
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Upload your bank statements and let AI analyze for fee drag, missed deductions, and savings opportunities.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
            >
              Start Free Analysis
            </Link>
            <Link
              href="/login"
              className="border border-dark-700 hover:border-dark-600 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">What Shadow CFO Finds</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="text-4xl mb-4">💰</div>
              <h4 className="text-xl font-semibold mb-2">Fee Drag</h4>
              <p className="text-gray-400">Hidden investment fees and expense ratios that eat your returns over time.</p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="text-xl font-semibold mb-2">Cash Drag</h4>
              <p className="text-gray-400">Idle cash sitting in low-yield accounts that could earn more elsewhere.</p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6">
              <div className="text-4xl mb-4">🏛️</div>
              <h4 className="text-xl font-semibold mb-2">Tax Deductions</h4>
              <p className="text-gray-400">Missed deductions under OBBBA and other tax optimization opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-12">Average Findings Per User</h3>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-5xl font-bold text-emerald-400">$3,200</div>
              <div className="text-gray-400 mt-2">Annual Savings</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-emerald-400">5+</div>
              <div className="text-gray-400 mt-2">Findings per user</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-emerald-400">15min</div>
              <div className="text-gray-400 mt-2">Analysis time</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to find your financial leaks?</h3>
          <p className="text-gray-400 mb-8">Free 14-day trial. No credit card required.</p>
          <Link
            href="/signup"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors inline-block"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-dark-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-gray-500 text-sm">
          <div>© 2026 Shadow CFO. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}