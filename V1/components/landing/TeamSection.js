"use client";

import React from 'react';
import Image from 'next/image';
import Reveal from '../motion/Reveal';
import SectionHeader from './SectionHeader';

export default function TeamSection({ founders }) {
  return (
    <section className="px-6 sm:px-8 lg:px-12 py-20" id="team">
      <div className="max-w-6xl mx-auto space-y-8">
        <SectionHeader
          eyebrow="Team"
          title="The founders."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:[&>div:last-child]:col-span-2 sm:[&>div:last-child]:justify-self-center">
          {founders.map((founder, index) => (
            <Reveal key={founder.name} delay={index * 0.06}>
              <div className="glass-card rounded-3xl border border-white/10 p-6 text-center transition duration-200 hover:-translate-y-1 hover:border-brand-accent/50 hover:shadow-glow-md">
                <div className="relative w-32 h-32 mx-auto mb-5 rounded-2xl overflow-hidden border border-white/20">
                  <Image src={founder.headshot} alt={`${founder.name} portrait`} fill sizes="128px" className="object-cover" />
                </div>
                <h3 className="text-xl font-semibold text-brand-light">{founder.name}</h3>
                <p className="text-brand-accent text-sm uppercase tracking-[0.3em] my-2">{founder.role}</p>
                <p className="text-brand-light/70 text-sm">{founder.line}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
