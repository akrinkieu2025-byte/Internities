"use client";

import React, { useMemo, useState, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const pillVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

function SignalNode({ active, animateSweep }) {
  const gradientId = useId();

  return (
    <div className="relative h-10 w-10 flex items-center justify-center">
      <svg viewBox="0 0 64 64" className="h-10 w-10" aria-hidden>
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(109,255,222,0.25)" />
            <stop offset="100%" stopColor="rgba(109,255,222,0)" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="22" fill={`url(#${gradientId})`} />
        <circle cx="32" cy="32" r="18" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" />
        <circle cx="32" cy="32" r="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
        <motion.circle
          cx="32"
          cy="32"
          r="4.2"
          fill={active ? 'rgba(109,255,222,0.95)' : 'rgba(109,255,222,0.6)'}
          animate={
            !animateSweep
              ? undefined
              : {
                  scale: [1, 1.08, 1],
                  opacity: [0.9, 0.6, 0.9],
                  transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
                }
          }
        />
        {animateSweep ? (
          <motion.path
            d="M32 10 A22 22 0 0 1 54 32"
            stroke="rgba(109,255,222,0.85)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            style={{ originX: '32px', originY: '32px' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}
      </svg>
      <span
        className={`absolute inset-0 rounded-full blur ${
          active ? 'bg-brand-accent/30' : 'bg-brand-accent/10'
        }`}
        aria-hidden
      />
    </div>
  );
}

function TimelinePill({ text, index, side, hoveredIndex, onHover, prefersReducedMotion }) {
  const isActive = hoveredIndex === index;
  const isLeft = side === 'left';

  return (
    <motion.li
      variants={pillVariants}
      whileHover={{ y: -3, boxShadow: '0 18px 50px rgba(109,255,222,0.14)' }}
      whileTap={{ scale: 0.99 }}
      className="list-none"
    >
      <button
        type="button"
        onMouseEnter={() => onHover(index)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(index)}
        onBlur={() => onHover(null)}
        className={`group relative w-full text-left rounded-2xl border px-4 py-3 transition-all duration-200 backdrop-blur-md ${
          isActive ? 'border-brand-accent/60 bg-brand-accent/10' : 'border-white/10 bg-white/[0.04]'
        } shadow-[0_12px_40px_rgba(0,0,0,0.28)]`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 hidden md:block h-px w-10 ${
            isLeft ? 'right-[-2.6rem] bg-gradient-to-l from-brand-accent/60 to-transparent' : 'left-[-2.6rem] bg-gradient-to-r from-brand-accent/60 to-transparent'
          } ${isActive ? '' : 'opacity-50'}`}
          aria-hidden
        />
        <p className="text-sm leading-relaxed text-brand-light/90">{text}</p>
        <span className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent/70" aria-hidden />
      </button>
    </motion.li>
  );
}

function TimelineCard({ title, heading, badge, items, side, hoveredIndex, onHover, prefersReducedMotion }) {
  return (
    <Reveal>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="relative h-full rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-6 shadow-[0_18px_65px_rgba(0,0,0,0.32)] overflow-hidden flex flex-col min-h-[420px]"
        whileHover={{ boxShadow: '0 24px 75px rgba(109,255,222,0.2)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 via-transparent to-brand-secondary/10" aria-hidden />
        <div className="relative flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-light/60">{title}</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/60 bg-gradient-to-r from-brand-accent/25 via-brand-accent/15 to-brand-secondary/25 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-brand-light shadow-[0_10px_30px_rgba(109,255,222,0.25)]">
            {badge}
          </span>
        </div>
        <h3 className="relative text-2xl font-semibold text-brand-light mb-4">{heading}</h3>
        <ul className="relative grid grid-rows-3 gap-4 flex-1">
          {items.map((line, idx) => (
            <TimelinePill
              key={line}
              text={line}
              index={idx}
              side={side}
              hoveredIndex={hoveredIndex}
              onHover={onHover}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </ul>
      </motion.div>
    </Reveal>
  );
}

function SignalSpineDesktop({ hoveredIndex, onHover, prefersReducedMotion }) {
  const nodes = useMemo(() => [0, 1, 2], []);
  return (
    <div className="relative hidden md:flex flex-col justify-between items-center py-6" aria-hidden>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-brand-accent/15 via-brand-accent/50 to-brand-accent/20" />
      {nodes.map((idx) => {
        const active = hoveredIndex === idx;
        return (
          <div key={idx} className="relative flex items-center justify-center">
            <span
              className={`absolute right-full h-px w-16 bg-gradient-to-l ${
                active ? 'from-brand-accent/70 to-transparent' : 'from-brand-accent/30 to-transparent'
              } transition-opacity duration-200`}
            />
            <span
              className={`absolute left-full h-px w-16 bg-gradient-to-r ${
                active ? 'from-brand-accent/70 to-transparent' : 'from-brand-accent/30 to-transparent'
              } transition-opacity duration-200`}
            />
            <div
              onMouseEnter={() => onHover(idx)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(idx)}
              onBlur={() => onHover(null)}
              className="cursor-pointer"
            >
              <SignalNode active={active} animateSweep={!prefersReducedMotion && active} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalSpineMobile({ count, hoveredIndex, onHover, prefersReducedMotion }) {
  const nodes = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <div className="md:hidden absolute left-5 top-0 bottom-0 flex flex-col justify-between pointer-events-none" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-brand-accent/15 via-brand-accent/40 to-brand-accent/15" />
      {nodes.map((idx) => {
        const active = hoveredIndex === idx % 3; // highlight matching row grouping
        return (
          <div key={idx} className="relative flex items-center" style={{ flex: 1 }}>
            <span
              className={`absolute left-0 h-px w-10 bg-gradient-to-r ${
                active ? 'from-brand-accent/60 to-transparent' : 'from-brand-accent/25 to-transparent'
              }`}
            />
            <div className="relative pointer-events-auto" onMouseEnter={() => onHover(idx % 3)} onMouseLeave={() => onHover(null)}>
              <SignalNode active={active} animateSweep={!prefersReducedMotion && active} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DirectionSection({ mission, vision, principles }) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="mission">
      <div className="max-w-6xl mx-auto space-y-10">
        <SectionHeader
          eyebrow="Direction"
          title="Where Internities is headed."
          description="A skill-first, transparent internship experience for both students and companies."
        />

        <motion.div
          className="relative grid md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <SignalSpineMobile
            count={mission.length + vision.length}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            prefersReducedMotion={prefersReducedMotion}
          />

          <TimelineCard
            title="Mission"
            heading="Our mission."
            badge="NOW"
            items={mission}
            side="left"
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            prefersReducedMotion={prefersReducedMotion}
          />

          <SignalSpineDesktop
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            prefersReducedMotion={prefersReducedMotion}
          />

          <TimelineCard
            title="Vision"
            heading="Our vision."
            badge="FUTURE"
            items={vision}
            side="right"
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            prefersReducedMotion={prefersReducedMotion}
          />
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4">
          {principles.map((item, idx) => (
            <Reveal key={item.title} delay={idx * 0.06}>
              <div className="glass-card rounded-2xl border border-white/10 p-4">
                <h4 className="text-lg font-semibold text-brand-light mb-1">{item.title}</h4>
                <p className="text-sm text-brand-light/75">{item.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
