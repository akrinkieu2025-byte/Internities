"use client";

import React from 'react';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

export default function SkillRadarCoreSection({ steps }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="skill-radar">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <SectionHeader
            eyebrow="The Skill Radar"
            title="The core of Internities is a skill-first radar."
            description="Clear, comparable skill profiles for students and roles—built from questionnaires, documents, and mentor insight."
            align="left"
          />
          <div className="space-y-5">
            {steps.map((step, idx) => (
              <div key={step} className="flex items-start gap-4">
                <Reveal delay={idx * 0.08}>
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-brand-accent/15 border border-brand-accent/40 text-brand-light font-semibold">
                    {idx + 1}
                  </div>
                </Reveal>
                <Reveal delay={0.04 + idx * 0.08}>
                  <p className="text-brand-light/80">{step}</p>
                </Reveal>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <Reveal variant="scaleIn">
            <div className="glass-card rounded-3xl border border-white/10 p-8 relative overflow-hidden">
              <div className="grid md:grid-cols-2 gap-6 relative">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-brand-light">Workflow clarity</h3>
                  <p className="text-brand-light/70">Guided inputs build comparable radars for roles and candidates, making fit obvious.</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-brand-light">Explainable matching</h3>
                  <p className="text-brand-light/70">Side-by-side radar overlays reveal strengths, gaps, and a transparent match score.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
