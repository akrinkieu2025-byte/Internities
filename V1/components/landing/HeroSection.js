"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import MatchRadarAnimation from '../MatchRadarAnimation';

const valueChips = ['Skill-based matching', 'Faster screening'];

export default function HeroSection({ onTryDemo, onPartner, parallaxStyle = {} }) {
  return (
    <section className="min-h-[92vh] px-6 sm:px-8 lg:px-12 pt-28 pb-16 sm:pt-28 md:pt-32 md:pb-20 lg:pt-36 lg:pb-24 flex items-center overflow-hidden" id="hero">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <Reveal>
            <p className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-brand-light bg-brand-accent/20 border border-brand-accent/50 shadow-glow-sm">
              Built for ambitious teams
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-4xl sm:text-6xl font-black leading-tight text-brand-light">
              Connect potential with possibilities.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg sm:text-xl text-brand-light/75 max-w-2xl">
              An exclusive, internship marketplace using AI skill matching to connect high-potential students with ambitious companies.
            </p>
          </Reveal>
          <div className="flex flex-wrap gap-4">
            <Reveal delay={0.14}>
              <motion.button
                whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(79,209,197,0.25)' }}
                whileTap={{ y: 0 }}
                className="btn-premium neon-border px-6 py-3 rounded-xl text-sm font-semibold bg-brand-accent/20 border-brand-accent/50 text-brand-light"
                onClick={onTryDemo}
              >
                Try demo
              </motion.button>
            </Reveal>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {valueChips.map((chip, idx) => (
              <Reveal key={chip} delay={0.22 + idx * 0.05}>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-brand-light/80 shadow-glow-sm">
                  {chip}
                </span>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6">
          <Reveal delay={0.12}>
            <motion.div
              className="relative h-[440px] w-full transform-gpu will-change-transform"
              style={parallaxStyle}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-darker via-brand-dark to-brand-darker border border-white/5 shadow-glow-lg overflow-visible">
                <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(6,182,212,0.25), transparent 55%)' }} />
                <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 70% 70%, rgba(124,58,237,0.18), transparent 55%)' }} />
                <div className="relative h-full w-full flex items-center justify-center">
                  <motion.div
                    className="relative w-[360px] h-[360px]"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <MatchRadarAnimation />
                  </motion.div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-brand-light/70">
                  AI-led skill radar matching student and company profiles.
                </div>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
