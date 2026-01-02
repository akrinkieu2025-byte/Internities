"use client";

import React from 'react';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

export default function ProblemSection({ problemCards }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="problem">
      <div className="max-w-6xl mx-auto space-y-12">
        <SectionHeader
          eyebrow="Problem"
          title="The internship market is noisy and inefficient."
          description="Internship hiring is broken: students apply at scale, companies reject at scale — and real potential gets lost."
          align="left"
        />
        <div className="grid md:grid-cols-2 gap-6">
          {problemCards.map((card, idx) => (
            <Reveal key={card.title} delay={idx * 0.08} className="glass-card rounded-3xl border border-white/10 p-8 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-brand-light">{card.title}</h3>
              </div>
              <ul className="space-y-3 text-brand-light/75">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span className="text-brand-accent">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.16}>
          <p className="text-center text-brand-light/60 text-sm">Teams are overwhelmed by volume, while the best candidates are easy to miss.</p>
        </Reveal>
      </div>
    </section>
  );
}
