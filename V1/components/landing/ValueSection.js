"use client";

import React, { useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

function RadarIcon({ animateSweep }) {
  const gradientId = useId();
  const sweepAnimation = animateSweep
    ? { rotate: 360, transition: { repeat: Infinity, ease: 'linear', duration: 8 } }
    : { rotate: 0 };

  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-brand-accent/80" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(109, 255, 222, 0.25)" />
          <stop offset="100%" stopColor="rgba(109, 255, 222, 0)" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${gradientId})`} />
      {[10, 18, 26].map((radius) => (
        <circle key={radius} cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" fill="none" />
      ))}
      <motion.g style={{ originX: '50%', originY: '50%' }} animate={sweepAnimation}>
        <path
          d="M32 8 A24 24 0 0 1 56 32"
          stroke="rgba(109,255,222,0.85)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      {[{ x: 45, y: 20 }, { x: 50, y: 40 }, { x: 26, y: 18 }].map((dot, idx) => (
        <circle key={idx} cx={dot.x} cy={dot.y} r="2.4" fill="rgba(164, 232, 255, 0.85)" />
      ))}
    </svg>
  );
}

function RadarTile({ text, index, animateSweep }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 text-brand-light/85 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 18px 60px rgba(0,0,0,0.35)', borderColor: 'rgba(109,255,222,0.5)' }}
      whileTap={{ scale: 0.99 }}
      tabIndex={0}
      role="listitem"
      aria-label={text}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand-accent/10 via-transparent to-brand-accent/5" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5" />
      <div className="relative flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-brand-darker/80 border border-brand-accent/30 p-2 shadow-[0_0_25px_rgba(109,255,222,0.25)]">
          <RadarIcon animateSweep={animateSweep} />
        </div>
        <p className="text-sm leading-relaxed text-brand-light/85">{text}</p>
      </div>
      <span className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-accent/70 focus-visible:outline-offset-2" />
    </motion.div>
  );
}

export default function ValueSection({ students, companies }) {
  const [active, setActive] = useState('students');
  const prefersReducedMotion = useReducedMotion();
  const content = useMemo(() => (active === 'students' ? students : companies), [active, students, companies]);

  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="value">
      <div className="max-w-6xl mx-auto space-y-10">
        <SectionHeader
          eyebrow="Value"
          title="Designed for both students and companies."
          description="Clarity for candidates, efficiency for teams."
        />

        <div className="flex gap-3 justify-center">
          {[
            { key: 'students', label: 'Students' },
            { key: 'companies', label: 'Companies' },
          ].map((tab) => (
            <Reveal key={tab.key} delay={tab.key === 'companies' ? 0.05 : 0}>
              <button
                type="button"
                onClick={() => setActive(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  active === tab.key
                    ? 'border-brand-accent/60 bg-brand-accent/15 text-brand-light shadow-[0_10px_35px_rgba(109,255,222,0.18)]'
                    : 'border-white/10 text-brand-light/70 hover:border-white/25'
                }`}
                aria-pressed={active === tab.key}
              >
                {tab.label}
              </button>
            </Reveal>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Reveal>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="grid sm:grid-cols-2 gap-4"
                role="list"
              >
                {content.benefits.map((benefit, idx) => (
                  <RadarTile key={benefit} text={benefit} index={idx} animateSweep={!prefersReducedMotion} />
                ))}
              </motion.div>
            </Reveal>
          </div>
          <div className="lg:col-span-1">
            <Reveal delay={0.08}>
              <div className="relative overflow-hidden glass-card rounded-2xl border border-brand-accent/40 bg-brand-accent/10 p-5 text-brand-light shadow-[0_18px_55px_rgba(109,255,222,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/15 via-transparent to-brand-accent/5 pointer-events-none" />
                <p className="relative text-sm uppercase tracking-[0.3em] text-brand-light/80 mb-2">{content.callout.title}</p>
                <h3 className="relative text-xl font-semibold mb-3">{content.callout.headline}</h3>
                <p className="relative text-brand-light/75 text-sm leading-relaxed">{content.callout.copy}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
