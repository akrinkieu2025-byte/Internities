"use client";

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

export default function ValueSection({ students, companies }) {
  const [active, setActive] = useState('students');
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
                    ? 'border-brand-accent/60 bg-brand-accent/15 text-brand-light'
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
              >
                {content.benefits.map((benefit) => (
                  <div key={benefit} className="glass-card rounded-2xl border border-white/10 p-4 text-brand-light/80">
                    {benefit}
                  </div>
                ))}
              </motion.div>
            </Reveal>
          </div>
          <div className="lg:col-span-1">
            <Reveal delay={0.08}>
              <div className="glass-card rounded-2xl border border-brand-accent/40 bg-brand-accent/10 p-5 text-brand-light">
                <p className="text-sm uppercase tracking-[0.3em] text-brand-light/80 mb-2">{content.callout.title}</p>
                <h3 className="text-xl font-semibold mb-3">{content.callout.headline}</h3>
                <p className="text-brand-light/75 text-sm leading-relaxed">{content.callout.copy}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
