"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

function FeatureIcon({ type }) {
  if (type === 'workflow') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand-secondary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-brand-secondary" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export default function SkillRadarCoreSection({ steps }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="skill-radar">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-8">
          <SectionHeader
            eyebrow="The Skill Radar"
            title="The core of Internities is a skill-first radar."
            description="Clear, comparable skill profiles for students and roles, built from questionnaires, documents, and mentor insight."
            align="left"
          />
          <div className="relative space-y-8 pl-2">
            {/* Connecting Line */}
            <div className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-gradient-to-b from-brand-secondary/50 via-brand-secondary/20 to-transparent" />
            
            {steps.map((step, idx) => (
              <div key={step} className="relative flex items-start gap-6 group">
                <Reveal delay={idx * 0.1}>
                  <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-full bg-brand-dark border border-brand-secondary/30 text-brand-light font-bold shadow-[0_0_15px_rgba(124,58,237,0.15)] group-hover:border-brand-secondary/60 group-hover:scale-110 transition-all duration-300">
                    <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">{idx + 1}</span>
                  </div>
                </Reveal>
                <Reveal delay={0.05 + idx * 0.1}>
                  <p className="text-brand-light/80 leading-relaxed pt-2 group-hover:text-brand-light transition-colors duration-300">{step}</p>
                </Reveal>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <Reveal variant="scaleIn">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-1">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/10 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative rounded-[1.4rem] bg-brand-darker/50 backdrop-blur-sm p-6 sm:p-8 overflow-hidden">
                <div className="grid md:grid-cols-2 gap-6 relative z-10">
                  <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-brand-secondary/20 transition-all duration-300">
                    <div className="mb-4 inline-flex rounded-xl bg-brand-secondary/10 p-3 text-brand-secondary group-hover:scale-110 transition-transform duration-300">
                      <FeatureIcon type="workflow" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-light mb-2">Workflow clarity</h3>
                    <p className="text-sm text-brand-light/60 leading-relaxed">Guided inputs build comparable radars for roles and candidates, establishing the perfect fit.</p>
                  </div>

                  <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-brand-secondary/20 transition-all duration-300">
                    <div className="mb-4 inline-flex rounded-xl bg-brand-secondary/10 p-3 text-brand-secondary group-hover:scale-110 transition-transform duration-300">
                      <FeatureIcon type="matching" />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-light mb-2">Explainable matching</h3>
                    <p className="text-sm text-brand-light/60 leading-relaxed">Side-by-side radar overlays reveal strengths, gaps, and a transparent match score.</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
