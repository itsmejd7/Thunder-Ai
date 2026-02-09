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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

  {/* Hero Section */}
  <section className="text-center mb-20">
    <h1 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
      Built for Serious Work.
      <br />
      Designed for Clarity.
    </h1>

    <p className="max-w-3xl mx-auto text-blue-200 text-lg leading-relaxed">
      Thunder-AI is a professional-grade AI platform engineered for developers,
      creators, and teams who demand precision, speed, and reliability.
      Every component is optimized to support real-world workflows — not demos.
    </p>
  </section>

  {/* Mission Section */}
  <section className="bg-[#0b1426] border border-white/10 rounded-2xl p-10 mb-16 shadow-2xl">
    <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>

    <p className="text-blue-200 leading-relaxed text-lg">
      Our mission is to eliminate friction between ideas and execution.
      Thunder-AI focuses on delivering consistent intelligence,
      predictable performance, and a distraction-free environment
      where users can think, build, and ship faster.
    </p>
  </section>

  {/* Platform Highlights */}
  <section className="mb-20">
    <h2 className="text-2xl font-semibold mb-8 text-center">
      Platform Highlights
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      <div className="bg-black/30 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Enterprise Architecture</h3>
        <p className="text-blue-200 leading-relaxed">
          Scalable backend infrastructure with optimized response pipelines,
          ensuring stable performance under high workloads.
        </p>
      </div>

      <div className="bg-black/30 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Precision Interaction</h3>
        <p className="text-blue-200 leading-relaxed">
          Structured conversation handling, intelligent context management,
          and consistent output formatting.
        </p>
      </div>

      <div className="bg-black/30 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Security by Design</h3>
        <p className="text-blue-200 leading-relaxed">
          Secure authentication layers, protected session flows,
          and hardened API communication.
        </p>
      </div>

    </div>
  </section>

  {/* Philosophy Section */}
  <section className="bg-[#0b1426] border border-white/10 rounded-2xl p-10 mb-16 shadow-2xl">
    <h2 className="text-2xl font-semibold mb-4">Design Philosophy</h2>

    <p className="text-blue-200 text-lg leading-relaxed mb-6">
      Thunder-AI follows a minimal-first design philosophy.
      Every interface element exists for a reason.
      No clutter. No noise. No unnecessary friction.
    </p>

    <ul className="space-y-3 text-blue-200 text-base">
      <li>• Workflow-first interface design</li>
      <li>• Performance-focused engineering</li>
      <li>• Predictable user experience</li>
      <li>• Production-oriented tooling</li>
    </ul>
  </section>

  {/* Vision Section */}
  <section className="text-center">
    <h2 className="text-2xl font-semibold mb-6">Our Vision</h2>

    <p className="max-w-3xl mx-auto text-blue-200 text-lg leading-relaxed">
      We envision Thunder-AI as a long-term productivity platform —
      not just a chatbot.
      A system that evolves with its users and supports
      increasingly complex problem-solving at scale.
    </p>
  </section>

</main>

    </div>
  );
}
