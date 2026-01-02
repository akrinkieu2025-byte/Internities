"use client";

import React from 'react';
import Reveal from '../motion/Reveal';

export default function SectionHeader({ eyebrow, title, description, align = 'center', className = '' }) {
  const alignment = align === 'left' ? 'items-start text-left' : 'items-center text-center';
  return (
    <div className={`flex flex-col gap-3 ${alignment} ${className}`}>
      {eyebrow && (
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-light/60">{eyebrow}</p>
        </Reveal>
      )}
      {title && (
        <Reveal delay={0.05}>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-light leading-tight">{title}</h2>
        </Reveal>
      )}
      {description && (
        <Reveal delay={0.1}>
          <p className="text-brand-light/70 max-w-2xl">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
