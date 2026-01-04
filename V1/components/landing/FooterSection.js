"use client";

import React from 'react';
import Link from 'next/link';
export default function FooterSection() {
  return (
    <footer className="border-t border-white/12 py-12 px-6 sm:px-8 lg:px-12 text-sm mt-16 bg-brand-dark/80" id="footer">
      <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 justify-between items-start sm:items-center">
        <p className="text-left text-brand-light/90 leading-relaxed">© {new Date().getFullYear()} Internities. All rights reserved.</p>
        <div className="flex gap-6 text-brand-light/85">
          <Link href="/terms-of-use" className="hover:text-brand-light">Terms of Use</Link>
          <Link href="/data-privacy" className="hover:text-brand-light">Data Privacy</Link>
          <Link href="/imprint" className="hover:text-brand-light">Imprint</Link>
        </div>
      </div>
    </footer>
  );
}
