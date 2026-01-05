"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

function ProblemIcon({ type }) {
  if (type === 'Students') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand-secondary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand-secondary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

export default function ProblemSection({ problemCards }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="problem">
      <div className="max-w-6xl mx-auto space-y-12">
        <SectionHeader
          eyebrow="Problem"
          title="The internship market is overcrowded and inefficient."
          description="Internship hiring is broken: students apply at scale, companies reject at scale and real potential gets lost."
          align="left"
        />
        <div className="grid md:grid-cols-2 gap-6">
          {problemCards.map((card, idx) => (
            <Reveal
              key={card.title}
              delay={idx * 0.08}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all duration-300 hover:bg-white/[0.04] hover:border-brand-secondary/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10 border border-brand-secondary/20 shadow-[0_0_15px_rgba(124,58,237,0.15)] group-hover:scale-110 transition-transform duration-300">
                    <ProblemIcon type={card.title} />
                  </div>
                  <h3 className="text-xl font-semibold text-brand-light">{card.title}</h3>
                </div>
                
                <ul className="space-y-4">
                  {card.bullets.map((bullet, i) => (
                    <motion.li 
                      key={bullet} 
                      className="flex gap-3 items-start text-brand-light/75"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary/60 shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
                      <span className="leading-relaxed">{bullet}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.16}>
          <div className="flex justify-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-5 py-2 text-sm text-brand-light/60 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400/60 animate-pulse" />
              Teams are overwhelmed by volume, while the best candidates are easy to miss.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
