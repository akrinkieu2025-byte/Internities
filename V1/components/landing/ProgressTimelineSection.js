"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

const statusColors = {
  Completed: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  'In development': 'bg-amber-500/15 text-amber-100 border-amber-400/40',
  'Actively seeking': 'bg-cyan-500/15 text-cyan-100 border-cyan-400/40',
  'Up next': 'bg-slate-500/15 text-slate-100 border-slate-400/40',
};

export default function ProgressTimelineSection({ items }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="stage">
      <div className="max-w-6xl mx-auto space-y-10">
        <SectionHeader
          eyebrow="Progress"
          title="Where we are today."
          description="A transparent view of the roadmap—no vanity metrics, just clear milestones."
        />
        <div className="relative">
          <motion.div
            className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-brand-accent/70 via-white/10 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="space-y-6">
            {items.map((item, idx) => (
              <Reveal key={item.title} delay={idx * 0.08} className="relative pl-12">
                <div className="absolute left-1 top-2 w-6 h-6 rounded-full border border-brand-accent/60 bg-brand-darker flex items-center justify-center text-xs text-brand-light">
                  {idx + 1}
                </div>
                <div className="glass-card rounded-2xl border border-white/10 p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-brand-light">{item.title}</h3>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColors[item.status] || 'border-white/20 text-brand-light/80'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-brand-light/75 text-sm">{item.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
