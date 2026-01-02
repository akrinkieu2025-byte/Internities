"use client";

import React from 'react';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

export default function DirectionSection({ mission, vision, principles }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="mission">
      <div className="max-w-6xl mx-auto space-y-10">
        <SectionHeader
          eyebrow="Direction"
          title="Where Internities is headed."
          description="A skill-first, transparent internship experience for both students and companies."
        />
        <div className="grid md:grid-cols-2 gap-6">
          <Reveal>
            <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-brand-light/60">Mission</p>
              <h3 className="text-2xl font-semibold text-brand-light">Our mission.</h3>
              <ul className="space-y-2 text-brand-light/80">
                {mission.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass-card rounded-3xl border border-white/10 p-6 space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-brand-light/60">Vision</p>
              <h3 className="text-2xl font-semibold text-brand-light">Our vision.</h3>
              <ul className="space-y-2 text-brand-light/80">
                {vision.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

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
