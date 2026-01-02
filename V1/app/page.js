"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReducedMotion, useScroll, useTransform } from 'framer-motion';

import Navbar from '@/components/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SkillRadarCoreSection from '@/components/landing/SkillRadarCoreSection';
import ValueSection from '@/components/landing/ValueSection';
import DirectionSection from '@/components/landing/DirectionSection';
import ProgressTimelineSection from '@/components/landing/ProgressTimelineSection';
import TeamSection from '@/components/landing/TeamSection';
import ContactSection from '@/components/landing/ContactSection';
import FooterSection from '@/components/landing/FooterSection';

const problemCards = [
  {
    title: 'Students',
    icon: '🎓',
    bullets: [
      'Hard to find relevant internships.',
      'Send countless CVs with little feedback.',
      'Low transparency in selection decisions.',
    ],
  },
  {
    title: 'Companies',
    icon: '🏢',
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

const principles = [
  { title: 'Fairness first', copy: 'Skill signals over polish, so potential is visible early.' },
  { title: 'Signal over noise', copy: 'Structured inputs and explainable radars for clarity.' },
  { title: 'Speed with quality', copy: 'Automation for throughput, human insight for trust.' },
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

const valueContent = {
  students: {
    benefits: studentBenefits,
    callout: {
      title: 'Build a stronger profile',
      headline: 'Grow and unlock better fits',
      copy: 'Develop and refine your skill-based profile over time, so new and better-aligned internship opportunities unlock as you grow.',
    },
  },
  companies: {
    benefits: companyBenefits,
    callout: {
      title: 'Shortlist pipeline',
      headline: 'Faster screening',
      copy: 'Receive ranked shortlists with explainable fit, so teams spend time interviewing—not sifting.',
    },
  },
};

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const heroRef = useRef(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : 60]);

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

      <div className="relative">
        <div className="fixed inset-0 pointer-events-none opacity-60" aria-hidden>
          <div className="absolute -top-32 -left-16 w-96 h-96 bg-brand-accent/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[540px] h-[540px] bg-brand-secondary/10 blur-[140px]" />
        </div>

        <div ref={heroRef} className="space-y-16 lg:space-y-20 relative z-10">
          <HeroSection
            onTryDemo={handleOpenDemo}
            onPartner={() => document?.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            parallaxStyle={prefersReducedMotion ? undefined : { y: heroParallax }}
          />

          <ProblemSection problemCards={problemCards} />
          <SkillRadarCoreSection steps={radarSteps} />
          <ValueSection students={valueContent.students} companies={valueContent.companies} />
          <DirectionSection mission={missionLines} vision={visionLines} principles={principles} />
          <ProgressTimelineSection items={stageItems} />
          <TeamSection founders={founders} />
          <ContactSection />
        </div>
      </div>

      <FooterSection />

      {isDemoOpen && (
        <div className="modal-overlay" onClick={() => setIsDemoOpen(false)}>
          <div
            className="modal-panel max-w-lg w-full bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-brand-primary/15 backdrop-blur-2xl border border-white/15 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)] rounded-3xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Enter demo access code</h3>
              <p className="text-sm text-brand-light/70">We’ll send you straight to the guided experience.</p>
              <form className="space-y-4" onSubmit={handleVerifyDemo}>
                <input
                  type="text"
                  value={demoCode}
                  onChange={(e) => setDemoCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-brand-light focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full btn-premium neon-border px-6 py-3 rounded-xl text-sm font-semibold bg-brand-accent/30 border-brand-accent/60 text-brand-light disabled:opacity-60"
                >
                  {isVerifying ? 'Verifying…' : 'Continue'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsDemoOpen(false)}
                className="text-sm text-brand-light/70 hover:text-brand-light"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
