"use client";

import Navbar from '@/components/Navbar';

const heroStats = [
  { label: 'Companies onboarded', value: '1.2K+' },
  { label: 'Verified students', value: '50K+' },
  { label: 'Interview-to-offer rate', value: '3.4x' },
  { label: 'Avg. match time', value: '12 days' },
];

const personas = [
  {
    title: 'For Students',
    copy: 'Skip generic job boards. Showcase projects, unlock curated matches, and get interview prep from mentors.',
    link: '/student',
    accent: 'from-brand-primary/20 to-brand-secondary/20',
  },
  {
    title: 'For Companies',
    copy: 'Hire pre-vetted talent with AI screening, structured pipelines, and collaborative evaluations.',
    link: '/company',
    accent: 'from-brand-secondary/20 to-brand-accent/20',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Create your profile',
    copy: 'Tell us your goals, role focus, and culture preferences. We enrich profiles automatically with portfolio signals.',
  },
  {
    step: '02',
    title: 'Match intelligently',
    copy: 'Our marketplace pairs students and companies using skills, availability, and “team fit” data—not keyword spam.',
  },
  {
    step: '03',
    title: 'Collaborate & hire',
    copy: 'Workflow tools keep interviews, feedback, and offers in one place so both sides move quickly.',
  },
];

const featureHighlights = [
  {
    icon: '🎯',
    title: 'AI-Powered Matching',
    copy: 'Contextual ranking surfaces roles and candidates that align with trajectory, not just keywords.',
    cta: 'See matching',
  },
  {
    icon: '🤝',
    title: 'Mentor Network',
    copy: 'Top alumni host prep sessions, resume reviews, and mock interviews to de-risk early talent programs.',
    cta: 'Meet mentors',
  },
  {
    icon: '📈',
    title: 'Pipeline Analytics',
    copy: 'Companies monitor funnel health, DEI balance, and conversion rates in real time.',
    cta: 'View analytics',
  },
  {
    icon: '🔐',
    title: 'Trust & Compliance',
    copy: 'Background verification, NDAs, and automated onboarding packets keep legal and security teams happy.',
    cta: 'Learn more',
  },
];

const testimonials = [
  {
    quote: 'Internities replaced three different tools and helped us fill 7 critical internship roles in under a month.',
    author: 'Maya Chen · Talent Lead, Lumen Labs',
  },
  {
    quote: 'I landed interviews with companies I never thought I could reach—plus mentorship that kept me confident.',
    author: 'Carlos Rodríguez · Product Intern',
  },
];

const logos = ['Lumen Labs', 'Northwind AI', 'Archetype Capital', 'Aurora Bank', 'Nova Mobility', 'Atlas Cloud'];

export default function Home() {
  return (
    <main className="bg-brand-dark min-h-screen overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
        <div className="absolute inset-0">
          <div className="absolute -top-32 left-10 w-96 h-96 bg-gradient-to-r from-brand-primary/30 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-24 right-10 w-96 h-96 bg-gradient-to-l from-brand-secondary/30 to-transparent rounded-full blur-3xl animate-float delay-700" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-brand-accent/20 to-transparent rounded-full blur-3xl animate-float delay-1000" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-brand-light/70">
            <span className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse" />
            Built for ambitious students and innovative teams
          </div>

          <div className="space-y-8">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
              Match exceptional students with companies that move fast.
            </h1>
            <p className="text-lg sm:text-xl text-brand-light/70 max-w-3xl mx-auto">
              A curated marketplace that blends AI, mentor insights, and workflow automation so every internship search feels bespoke.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <a
              href="/get-started"
              className="btn-premium px-8 py-4 rounded-xl font-semibold text-base sm:text-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-glow-lg hover:scale-105 transition"
            >
              Explore Get Started
            </a>
            <a
              href="/auth/login"
              className="px-8 py-4 rounded-xl font-semibold text-base sm:text-lg border border-white/20 text-brand-light hover:border-brand-primary/60 hover:text-white transition"
            >
              View Live Demo
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {heroStats.map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-left">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-brand-light/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student vs Company value props */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {personas.map((persona) => (
            <div key={persona.title} className="glass-card rounded-2xl p-8 border border-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-light/50 mb-3">{persona.title}</p>
              <h3 className="text-3xl font-semibold text-white mb-4">{persona.title === 'For Students' ? 'Launch your career faster' : 'Build pipelines with confidence'}</h3>
              <p className="text-brand-light/70 mb-6">{persona.copy}</p>
              <a
                href={persona.link}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/10 text-sm font-semibold hover:bg-white/10 transition"
              >
                Learn more
                <span>→</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 sm:px-8 lg:px-12">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <p className="text-sm font-semibold text-brand-primary uppercase tracking-[0.4em]">Process</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mt-4 mb-4">From profile to offer in three steps</h2>
          <p className="text-brand-light/70">
            Every workflow is instrumented so candidates and companies see progress and can collaborate asynchronously.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {howItWorks.map((item) => (
            <div key={item.step} className="glass-card rounded-2xl p-6 flex flex-col border border-white/10">
              <span className="text-brand-primary font-semibold text-sm">Step {item.step}</span>
              <h3 className="text-2xl font-semibold text-white mt-3 mb-4">{item.title}</h3>
              <p className="text-brand-light/70 flex-1">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">Why teams pick Internities</h2>
            <p className="text-brand-light/70 max-w-2xl mx-auto mt-4">
              Purpose-built infrastructure for internship programs plus tailored talent development for students.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {featureHighlights.map((feature) => (
              <div key={feature.title} className="glass-card rounded-2xl p-6 border border-white/10 hover:border-brand-primary/40 transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-brand-light/70 mb-6">{feature.copy}</p>
                <button className="text-brand-primary font-semibold inline-flex items-center gap-2 text-sm">
                  {feature.cta}
                  <span>→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="py-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm uppercase tracking-[0.5em] text-brand-light/50">Trusted by internship programs worldwide</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mt-8 text-brand-light/60">
            {logos.map((logo) => (
              <div key={logo} className="glass-card rounded-xl py-4 px-2 text-sm font-semibold tracking-wide">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 sm:px-8 lg:px-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-brand-secondary uppercase tracking-[0.4em]">Proof</p>
            <h2 className="text-4xl font-bold text-white mt-3">People are building careers here</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <div key={item.author} className="glass-card rounded-2xl p-6 border border-white/10">
                <p className="text-brand-light/90 text-lg leading-relaxed">“{item.quote}”</p>
                <p className="text-sm text-brand-light/60 mt-4">{item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative py-32 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto text-center glass-card border border-brand-primary/30 rounded-3xl p-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to run an elite internship program?</h2>
          <p className="text-brand-light/70 mb-10">
            Launch your workspace in minutes and invite teammates or mentors. Students can complete onboarding in under ten minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/get-started" className="btn-premium px-8 py-4 rounded-xl text-lg font-semibold bg-gradient-to-r from-brand-primary to-brand-secondary text-white">
              Start Now
            </a>
            <a href="/contact" className="px-8 py-4 rounded-xl border border-white/20 text-brand-light hover:border-brand-primary/50">
              Talk to our team
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-12 px-6 sm:px-8 lg:px-12 text-sm text-brand-light/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 justify-between">
          <p>© {new Date().getFullYear()} Internities. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
