"use client";

import React from 'react';
import Reveal from '../motion/Reveal';

export default function FooterSection() {
  return (
    <footer className="border-t border-white/10 py-12 px-6 sm:px-8 lg:px-12 text-sm text-brand-light/60 mt-16" id="footer">
      <Reveal>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-start">
          <p>© {new Date().getFullYear()} Internities. All rights reserved.</p>
          <div className="flex gap-6 text-brand-light/70">
            <a href="#mission" className="hover:text-brand-light">About</a>
            <a href="#contact" className="hover:text-brand-light">Contact</a>
            <a href="#problem" className="hover:text-brand-light">Problem</a>
            <a href="#value" className="hover:text-brand-light">Value</a>
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
