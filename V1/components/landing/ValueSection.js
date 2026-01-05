"use client";

import React, { useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

function ValueIcon({ type, animateSweep }) {
  const gradientId = useId();
  const sweepAnimation = animateSweep
    ? { rotate: 360, transition: { repeat: Infinity, ease: 'linear', duration: 8 } }
    : { rotate: 0 };

  const commonProps = {
    viewBox: "0 0 24 24",
    className: "h-10 w-10 text-brand-secondary/80",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  // Students: Fingerprint
  if (type === 'fingerprint') {
    return (
      <svg {...commonProps}>
        <path d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
      </svg>
    );
  }

  // Students: Bullseye
  if (type === 'bullseye') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.5" />
      </svg>
    );
  }

  // Students: Clock
  if (type === 'clock') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }

  // Students: Shield
  if (type === 'shield') {
    return (
      <svg {...commonProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  // Company: List
  if (type === 'list') {
    return (
      <svg {...commonProps}>
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <path d="m3 17 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
      </svg>
    );
  }

  // Company: Hourglass
  if (type === 'hourglass') {
    return (
      <svg {...commonProps}>
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </svg>
    );
  }

  // Company: Diamond
  if (type === 'diamond') {
    return (
      <svg {...commonProps}>
        <path d="M6 3h12l4 6-10 13L2 9Z" />
        <path d="M11 3 8 9l4 13 4-13-3-6" />
        <path d="M2 9h20" />
      </svg>
    );
  }

  // Company: Sprout
  if (type === 'sprout') {
    return (
      <svg {...commonProps}>
        <path d="M7 20h10" />
        <path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
        <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
      </svg>
    );
  }

  // Fallback Radar
  return (
    <svg viewBox="0 0 64 64" className="h-10 w-10 text-brand-secondary/80" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(124, 58, 237, 0.25)" />
          <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${gradientId})`} />
      {[10, 18, 26].map((radius) => (
        <circle key={radius} cx="32" cy="32" r={radius} stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" fill="none" />
      ))}
      <motion.g style={{ originX: '50%', originY: '50%' }} animate={sweepAnimation}>
        <path
          d="M32 8 A24 24 0 0 1 56 32"
          stroke="rgba(124,58,237,0.85)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      {[{ x: 45, y: 20 }, { x: 50, y: 40 }, { x: 26, y: 18 }].map((dot, idx) => (
        <circle key={idx} cx={dot.x} cy={dot.y} r="2.4" fill="rgba(167, 139, 250, 0.85)" />
      ))}
    </svg>
  );
}

function RadarTile({ text, index, animateSweep, iconType }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4 text-brand-light/85 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: '0 18px 60px rgba(0,0,0,0.35)', borderColor: 'rgba(124,58,237,0.5)' }}
      whileTap={{ scale: 0.99 }}
      tabIndex={0}
      role="listitem"
      aria-label={text}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-brand-secondary/10 via-transparent to-brand-primary/5" />
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5" />
      <div className="relative flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-brand-darker/80 border border-brand-secondary/30 p-2 shadow-[0_0_25px_rgba(124,58,237,0.25)]">
          <ValueIcon type={iconType} animateSweep={animateSweep} />
        </div>
        <p className="text-sm leading-relaxed text-brand-light/85">{text}</p>
      </div>
      <span className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-secondary/70 focus-visible:outline-offset-2" />
    </motion.div>
  );
}

export default function ValueSection({ students, companies }) {
  const [active, setActive] = useState('students');
  const prefersReducedMotion = useReducedMotion();
  const content = useMemo(() => (active === 'students' ? students : companies), [active, students, companies]);

  const getIconType = (idx) => {
    if (active === 'students') {
      if (idx === 0) return 'fingerprint';
      if (idx === 1) return 'bullseye';
      if (idx === 2) return 'clock';
      if (idx === 3) return 'shield';
    } else {
      if (idx === 0) return 'list';
      if (idx === 1) return 'hourglass';
      if (idx === 2) return 'diamond';
      if (idx === 3) return 'sprout';
    }
    return 'radar';
  };

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
                    ? 'border-brand-secondary/60 bg-brand-secondary/15 text-brand-light shadow-[0_10px_35px_rgba(124,58,237,0.18)]'
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
                  <RadarTile 
                    key={benefit} 
                    text={benefit} 
                    index={idx} 
                    animateSweep={!prefersReducedMotion} 
                    iconType={getIconType(idx)}
                  />
                ))}
              </motion.div>
            </Reveal>
          </div>
          <div className="lg:col-span-1">
            <Reveal delay={0.08}>
              <div className="relative overflow-hidden glass-card rounded-2xl border border-brand-secondary/40 bg-brand-secondary/10 p-5 text-brand-light shadow-[0_18px_55px_rgba(124,58,237,0.15)]">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/15 via-transparent to-brand-primary/5 pointer-events-none" />
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
