"use client";

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

import Navbar from '@/components/Navbar';

const problemPoints = [
  {
    title: 'Students',
    bullets: [
      'Hard to find relevant internships.',
      'Send countless CVs with little feedback.',
      'Low transparency in selection decisions.',
    ],
  },
  {
    title: 'Companies',
    bullets: [
      'Overloaded with mismatched CVs.',
      'Manual screening drains time.',
      'Hard to spot potential early.',
    ],
  },
];

const radarSteps = [
  'Students complete a guided questionnaire and upload documents like CVs, LinkedIn, or personal sites.',
  'Companies create new roles through a questionnaire and can attach specs, scorecards, or decks.',
  'An AI-driven skill engine builds the radar view for every student and every role.',
  '“Skills required” diagrams from companies are matched to “skills available” diagrams from students to surface the best fit.',
];

const studentBenefits = [
  'Build your skill-based profile via a questionnaire and document uploads.',
  'Receive curated internships that match your profile.',
  'Showcase projects, competitions, and extracurriculars.',
  'Gain transparency into why you fit a role.',
];

const companyBenefits = [
  'Get shortlists of pre-matched candidates.',
  'Spend less time screening CVs manually.',
  'Spot high-potential talent from top universities.',
  'Build a resilient early-talent pipeline.',
];

const missionLines = [
  'Connect high-potential students with meaningful internships.',
  'Replace CV-based screening with skill-focused matching.',
  'Make early-career hiring fairer and more efficient.',
];

const visionLines = [
  'A world where potential is measured by capability, not paperwork.',
  'Internship recruiting that feels curated for every participant.',
];

const stageItems = [
  {
    title: 'Concept & research',
    status: 'Completed',
    copy: 'Interviews with students and companies defined the Skill Radar concept.',
  },
  {
    title: 'Prototype',
    status: 'In development',
    copy: 'We are building the first version of the radar-driven platform.',
  },
  {
    title: 'Pilot partners',
    status: 'Actively seeking',
    copy: 'We are inviting companies and universities to shape the pilot phase.',
  },
  {
    title: 'Next steps',
    status: 'Up next',
    copy: 'Collect data, refine matching, and expand the network with intent.',
  },
];

const founders = [
  {
    name: 'Gwendolin Lueders',
    role: 'CXO',
    headshot: '/team/gwendolin.jpeg',
    line: 'Designs the end-to-end experience for students and companies.',
  },
  {
    name: 'Alexander Krink',
    role: 'COO',
    headshot: '/team/alexander.jpeg',
    line: 'Keeps operations, partnerships, and strategic planning on track.',
  },
  {
    name: 'Boris Albert',
    role: 'CFO',
    headshot: '/team/boris.png',
    line: 'Owns finance, data diligence, and investment relationships.',
  },
];

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const heroRef = useRef(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, 80]);

  useEffect(() => {
    if (isDemoOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDemoOpen]);

  const heroAnimation = prefersReducedMotion
    ? {}
    : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8 } };

  const handleOpenDemo = () => {
    setDemoCode('');
    setError('');
    setIsDemoOpen(true);
  };

  const handleVerifyDemo = async (event) => {
    event.preventDefault();
    if (!demoCode.trim()) {
      setError('Please enter an access code.');
      return;
    }
    setIsVerifying(true);
    setError('');
    try {
      const response = await fetch('/api/verify-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: demoCode.trim() }),
      });
      const data = await response.json();
      if (data.valid) {
        setIsDemoOpen(false);
        router.push('/get-started');
      } else {
        setError('This code isn’t valid. Please try again or contact us for access.');
      }
    } catch (err) {
      console.error('Demo verification failed', err);
      setError('We had trouble verifying that code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="bg-brand-dark text-brand-light min-h-screen overflow-hidden">
      <Navbar onTryDemoClick={handleOpenDemo} />

      <div className="pt-24 space-y-24">
        {/* Hero */}
        <section ref={heroRef} className="min-h-[85vh] px-6 sm:px-8 lg:px-12 flex items-center">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <motion.p
                className="uppercase tracking-[0.4em] text-xs text-brand-light/60"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.1 } })}
              >
                Built for ambitious teams
              </motion.p>
              <motion.h1
                className="text-4xl sm:text-6xl font-black leading-tight"
                {...heroAnimation}
              >
                Match exceptional students with companies that move fast.
              </motion.h1>
              <motion.p
                className="text-lg sm:text-xl text-brand-light/70"
                {...(prefersReducedMotion ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 } })}
              >
                A curated marketplace that blends AI, mentor insights, and workflow automation so every internship search feels bespoke.
              </motion.p>
            </div>

            <motion.div
              className="relative h-[420px] w-full"
              style={prefersReducedMotion ? undefined : { y: heroParallax }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-brand-darker to-brand-dark border border-white/5 shadow-glow-lg overflow-hidden">
                <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(6,182,212,0.25), transparent 55%)' }} />
                <div className="relative h-full w-full flex items-center justify-center">
                  <div className="relative w-72 h-72">
                    {[0, 1, 2].map((ring) => (
                      <motion.div
                        key={ring}
                        className="absolute inset-0 rounded-full border border-brand-accent/30"
                        {...(prefersReducedMotion
                          ? {}
                          : {
                              initial: { scale: 0.6 + ring * 0.1, opacity: 0 },
                              whileInView: { scale: 1 + ring * 0.08, opacity: 1 },
                              transition: { delay: 0.2 * ring, duration: 0.8 },
                            })}
                      />
                    ))}
                    <motion.div
                      className="absolute inset-8 rounded-full bg-gradient-to-r from-brand-primary/40 to-brand-secondary/40 blur-2xl"
                      animate={prefersReducedMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 6 }}
                    />
                    <motion.div
                      className="absolute inset-16 rounded-full border border-white/30 flex items-center justify-center"
                      animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
                    >
                      <span className="text-sm uppercase tracking-[0.4em] text-brand-light/70">Skill Radar</span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="px-6 sm:px-8 lg:px-12" id="problem">
          <div className="max-w-6xl mx-auto space-y-10">
            <motion.div
              className="space-y-4"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.4 },
                    transition: { duration: 0.8 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">Problem</p>
              <h2 className="text-3xl sm:text-4xl font-bold">The internship and job entry market is in an ongoing crisis for students and companies.</h2>
              <p className="text-brand-light/70 max-w-3xl">Everyone feels the friction: talented students can’t get signal, and teams drown in mismatched applications.</p>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-2">
              {problemPoints.map((side, idx) => (
                <motion.div
                  key={side.title}
                  className="glass-card rounded-3xl p-8 border border-white/10"
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, x: idx === 0 ? -40 : 40 },
                        whileInView: { opacity: 1, x: 0 },
                        viewport: { once: true, amount: 0.3 },
                        transition: { duration: 0.8, delay: idx * 0.1 },
                      })}
                >
                  <h3 className="text-xl font-semibold mb-4">{side.title}</h3>
                  <ul className="space-y-3 text-brand-light/70">
                    {side.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="text-brand-accent">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Skill Radar */}
        <section className="px-6 sm:px-8 lg:px-12" id="skill-radar">
          <div className="max-w-6xl mx-auto glass-card rounded-3xl border border-white/10 p-10">
            <motion.div
              className="text-center space-y-4 max-w-3xl mx-auto"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">Skill Radar</p>
              <h2 className="text-3xl sm:text-4xl font-bold">The Skill Radar at the core of Internities.</h2>
              <p className="text-brand-light/70">Internities uses AI-built skill profiles for students and companies so both sides understand potential before the first call.</p>
            </motion.div>
            <div className="mt-10 grid md:grid-cols-2 gap-10 items-center">
              <motion.ul
                className="space-y-6"
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, y: 30 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.8 },
                    })}
              >
                {radarSteps.map((step, index) => (
                  <li key={step} className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-brand-accent font-semibold">{index + 1}</span>
                    <p className="text-brand-light/80">{step}</p>
                  </li>
                ))}
              </motion.ul>
              <motion.div
                className="relative h-64 rounded-3xl bg-gradient-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 border border-white/10 flex items-center justify-center"
                {...(prefersReducedMotion
                  ? {}
                  : {
                      initial: { opacity: 0, scale: 0.95 },
                      whileInView: { opacity: 1, scale: 1 },
                      viewport: { once: true },
                      transition: { duration: 0.8 },
                    })}
              >
                <div className="absolute inset-6 rounded-3xl border border-white/20" />
                <div className="absolute inset-12 rounded-3xl border border-white/10" />
                <p className="text-sm uppercase tracking-[0.4em] text-brand-light/70">AI-led matching</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* For Students */}
        <section className="px-6 sm:px-8 lg:px-12" id="students">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-4"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.7 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">For students</p>
              <h2 className="text-3xl font-bold">For students.</h2>
              <p className="text-brand-light/70">Internities becomes your launchpad by translating projects into proof of skill.</p>
            </motion.div>
            <motion.ul
              className="space-y-4"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8, delay: 0.1 },
                  })}
            >
              {studentBenefits.map((benefit) => (
                <li key={benefit} className="glass-card rounded-2xl border border-white/10 p-4 text-brand-light/80">
                  {benefit}
                </li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* For Companies */}
        <section className="px-6 sm:px-8 lg:px-12" id="companies">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.ul
              className="order-2 lg:order-1 space-y-4"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 },
                  })}
            >
              {companyBenefits.map((benefit) => (
                <li key={benefit} className="glass-card rounded-2xl border border-white/10 p-4 text-brand-light/80">
                  {benefit}
                </li>
              ))}
            </motion.ul>
            <motion.div
              className="order-1 lg:order-2 space-y-4"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.7, delay: 0.1 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">For companies</p>
              <h2 className="text-3xl font-bold">For companies.</h2>
              <p className="text-brand-light/70">Smarter early-talent hiring powered by real signals, not noisy resumes.</p>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="px-6 sm:px-8 lg:px-12" id="mission">
          <div className="max-w-6xl mx-auto space-y-10">
            <motion.div
              className="text-center space-y-3"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">Direction</p>
              <h2 className="text-3xl font-bold">Where Internities is headed.</h2>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-2">
              {[
                { label: 'Mission', title: 'Our mission.', lines: missionLines },
                { label: 'Vision', title: 'Our vision.', lines: visionLines },
              ].map((block, idx) => (
                <motion.div
                  key={block.label}
                  className="glass-card rounded-3xl border border-white/10 p-8"
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 24 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true },
                        transition: { duration: 0.8, delay: idx * 0.1 },
                      })}
                >
                  <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">{block.label}</p>
                  <h3 className="text-2xl font-semibold mb-3">{block.title}</h3>
                  <ul className="space-y-3 text-brand-light/80">
                    {block.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Current Stage */}
        <section className="px-6 sm:px-8 lg:px-12" id="stage">
          <div className="max-w-6xl mx-auto space-y-8">
            <motion.div
              className="space-y-3"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">Progress</p>
              <h2 className="text-3xl font-bold">Where we are today.</h2>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-2">
              {stageItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  className="glass-card rounded-3xl border border-white/10 p-6"
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 30 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true },
                        transition: { duration: 0.8, delay: index * 0.05 },
                      })}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <span className="text-xs uppercase tracking-[0.2em] text-brand-light/60">{item.status}</span>
                  </div>
                  <p className="text-brand-light/70">{item.copy}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="px-6 sm:px-8 lg:px-12" id="team">
          <div className="max-w-6xl mx-auto space-y-8">
            <motion.div
              className="space-y-3 text-center"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">Team</p>
              <h2 className="text-3xl font-bold">The founders.</h2>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {founders.map((founder, index) => (
                <motion.div
                  key={founder.name}
                  className="glass-card rounded-3xl border border-white/10 p-6 text-center"
                  {...(prefersReducedMotion
                    ? {}
                    : {
                        initial: { opacity: 0, y: 30 },
                        whileInView: { opacity: 1, y: 0 },
                        viewport: { once: true },
                        transition: { duration: 0.8, delay: index * 0.1 },
                      })}
                >
                  <div className="relative w-32 h-32 mx-auto mb-5 rounded-full overflow-hidden border border-white/20">
                    <Image src={founder.headshot} alt={`${founder.name} portrait`} fill sizes="128px" className="object-cover" />
                  </div>
                  <h3 className="text-xl font-semibold">{founder.name}</h3>
                  <p className="text-brand-accent text-sm uppercase tracking-[0.3em] my-2">{founder.role}</p>
                  <p className="text-brand-light/70 text-sm">{founder.line}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="px-6 sm:px-8 lg:px-12" id="contact">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              className="space-y-4"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8 },
                  })}
            >
              <p className="text-sm uppercase tracking-[0.4em] text-brand-light/50">Contact</p>
              <h2 className="text-3xl font-bold">Contact us.</h2>
              <div className="space-y-3 text-brand-light/80">
                <p>Students: tell us about your projects and we’ll invite you into the beta.</p>
                <p>Companies & universities: partner with us to shape early talent hiring.</p>
              </div>
            </motion.div>
            <motion.div
              className="glass-card rounded-3xl border border-white/10 p-6"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 24 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.8, delay: 0.1 },
                  })}
            >
              <p className="text-sm text-brand-light/70 mb-3">Email us and we’ll respond within 24 hours.</p>
              <a
                href="mailto:hello@internities.de"
                className="btn-premium neon-border w-full inline-flex justify-center px-6 py-3 rounded-2xl text-sm font-semibold"
              >
                hello@internities.de
              </a>
            </motion.div>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 py-12 px-6 sm:px-8 lg:px-12 text-sm text-brand-light/60 mt-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 justify-between">
          <p>© {new Date().getFullYear()} Internities. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#mission">About</a>
            <a href="#contact">Contact</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>

      {isDemoOpen && (
        <div className="modal-overlay" onClick={() => setIsDemoOpen(false)}>
          <motion.div
            className="modal-panel glass-card border border-white/10"
            onClick={(event) => event.stopPropagation()}
            {...(prefersReducedMotion
              ? {}
              : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } })}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-semibold">Try demo</h3>
                <p className="text-brand-light/70 text-sm">Enter your access code to try the demo.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDemoOpen(false)}
                aria-label="Close demo modal"
                className="text-brand-light/60 hover:text-white"
              >
                ×
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleVerifyDemo}>
              <div>
                <label htmlFor="demo-code" className="block text-sm font-medium mb-2">Access code</label>
                <input
                  id="demo-code"
                  type="text"
                  value={demoCode}
                  onChange={(event) => setDemoCode(event.target.value)}
                  className="w-full rounded-2xl bg-brand-darker border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="XXXX-XXXX"
                />
              </div>
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={isVerifying}
                className="btn-premium neon-border w-full px-6 py-3 rounded-2xl text-sm font-semibold disabled:opacity-60"
              >
                {isVerifying ? 'Unlocking…' : 'Unlock demo'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}
