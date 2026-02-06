import { Link } from "react-router-dom";
import logo from "../assets/Thunder-Ai.png";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050b18] via-[#0b1b3a] to-[#0a0f1f] text-white">
      <header className="bg-black/40 border-b border-white/10 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Thunder-AI logo" className="w-9 h-9 rounded shadow" />
            <div>
              <p className="text-white font-semibold leading-tight">Thunder-AI</p>
              <p className="text-xs text-blue-300">AI Assistant for real work</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg border border-white/15 text-blue-200 hover:bg-white/10 transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <section className="bg-[#0b1426] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">About Thunder-AI</h1>
          <p className="text-blue-200 text-base sm:text-lg leading-relaxed mb-6">
            Thunder-AI is built to help you move faster with clear answers, clean drafts, and
            reliable coding help. It is optimized for real projects: structured prompts, consistent
            outputs, and a simple workspace that stays out of your way.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/30 border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Focused UI</h3>
              <p className="text-blue-200 text-sm">Clean layout, zero overlap, mobile friendly.</p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Secure Sessions</h3>
              <p className="text-blue-200 text-sm">Token-aware flows and safe logout handling.</p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-1">Production Ready</h3>
              <p className="text-blue-200 text-sm">Validated inputs and predictable errors.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
