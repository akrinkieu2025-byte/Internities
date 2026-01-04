"use client";

import React from 'react';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

export default function ContactSection() {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20 lg:py-24 min-h-[65vh] lg:min-h-[60vh] flex items-center" id="contact">
      <div className="max-w-6xl mx-auto w-full space-y-10">
        <SectionHeader
          eyebrow="Contact"
          title="Ready to partner?"
          description="Students: tell us about your projects. Companies & universities: shape early-talent hiring with us."
        />
        <Reveal>
          <div className="glass-card rounded-3xl border border-white/10 p-6 md:p-8 space-y-4">
            <h3 className="text-2xl font-semibold text-brand-light">For students, companies, and universities</h3>
            <p className="text-brand-light/75">Share your projects, roles, and what you want to build together. We’ll follow up with next steps for a skill-first, transparent internship funnel.</p>
            <a
              href="mailto:hello@internities.de?subject=Let%27s%20partner"
              className="inline-flex w-fit px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-accent/20 border border-brand-accent/50 text-brand-light hover:-translate-y-1 transition"
            >
              Get in touch
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
