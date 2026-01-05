"use client";

import React, { useEffect, useState } from 'react';
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

function TimelinePill({ text, prefersReducedMotion, isTouch }) {
  return (
    <motion.li
      variants={pillVariants}
      className="list-none relative"
    >
      <motion.button
        whileHover={isTouch ? undefined : { y: -3, boxShadow: '0 18px 50px rgba(124,58,237,0.14)' }}
        whileTap={{ scale: 0.99 }}
        type="button"
        className="group relative w-full text-left rounded-2xl border px-4 py-3.5 transition-all duration-200 backdrop-blur-md border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.28)] hover:border-brand-secondary/60 hover:bg-brand-secondary/10"
      >
        <span
          className="md:hidden absolute left-[-1.5rem] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border border-brand-secondary/60 bg-brand-secondary/20 shadow-[0_0_12px_rgba(124,58,237,0.35)]"
          aria-hidden
        />
        <span
          className="md:hidden absolute left-[-0.9rem] top-1/2 -translate-y-1/2 h-px w-4 bg-gradient-to-r from-brand-secondary/60 to-transparent"
          aria-hidden
        />
        <p className="text-sm leading-relaxed text-brand-light/90">{text}</p>
        <span className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary/70" aria-hidden />
      </motion.button>
    </motion.li>
  );
}

function TimelineCard({ title, heading, badge, items, prefersReducedMotion, isTouch }) {
  return (
    <Reveal>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="relative h-full rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-6 shadow-[0_18px_65px_rgba(0,0,0,0.32)] overflow-hidden flex flex-col md:min-h-[420px] min-h-[360px] pl-12 md:pl-6"
        whileHover={isTouch ? undefined : { boxShadow: '0 24px 75px rgba(124,58,237,0.15)' }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/10 via-transparent to-brand-primary/10" aria-hidden />
        <div className="relative flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-light/60">{title}</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-secondary/60 bg-gradient-to-r from-brand-secondary/25 via-brand-secondary/15 to-brand-primary/25 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-brand-light shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
            {badge}
          </span>
        </div>
        <h3 className="relative text-2xl font-semibold text-brand-light mb-4 leading-snug">{heading}</h3>
        <ul className="relative grid grid-rows-3 gap-4 flex-1 md:pl-0 pl-6">
          <span className="md:hidden absolute left-[-1.5rem] top-2 bottom-2 w-px bg-gradient-to-b from-brand-secondary/18 via-brand-secondary/40 to-brand-secondary/18" aria-hidden />
          {items.map((line, idx) => (
            <TimelinePill
              key={line}
              text={line}
              prefersReducedMotion={prefersReducedMotion}
              isTouch={isTouch}
            />
          ))}
        </ul>
      </motion.div>
    </Reveal>
  );
}

export default function DirectionSection({ mission, vision, principles }) {
  const prefersReducedMotion = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20 overflow-hidden" id="mission">
      <div className="max-w-6xl mx-auto space-y-10">
        <SectionHeader
          eyebrow="Direction"
          title="Where Internities is headed."
          description="A skill-first, transparent internship experience for both students and companies."
        />

        <motion.div
          className="relative flex flex-col gap-6 md:grid md:grid-cols-2 items-stretch pl-2 sm:pl-4 md:pl-0"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
        >
          <TimelineCard
            title="Mission"
            heading="Our mission."
            badge="NOW"
            items={mission}
            prefersReducedMotion={prefersReducedMotion}
            isTouch={isTouch}
          />

          <TimelineCard
            title="Vision"
            heading="Our vision."
            badge="FUTURE"
            items={vision}
            prefersReducedMotion={prefersReducedMotion}
            isTouch={isTouch}
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
