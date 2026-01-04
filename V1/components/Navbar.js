"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar({ onTryDemoClick = () => {} }) {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const isLanding = pathname === '/';
  const hideHomeLink = pathname?.startsWith('/student') || pathname?.startsWith('/company');

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setUser(data?.session?.user ?? null);
      } catch (err) {
        console.error('Navbar session load error', err);
      }
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav
      className="fixed top-0 w-full z-50 backdrop-blur-md bg-gradient-to-b from-brand-dark/80 to-brand-dark/20 border-b border-brand-primary/10 transform-gpu will-change-transform backface-hidden isolate"
      style={{ contain: 'layout paint' }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-3 items-center h-20">
          {/* Logo left */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-300 will-change-transform"
            >
              <span className="gradient-text-purple">Internities.</span>
            </Link>
          </div>

          {/* Navigation center */}
          <div className="flex items-center justify-center">
            <div className="flex gap-12 items-center">
              {!hideHomeLink && (
                <Link
                  href="/"
                  className="text-brand-light/80 hover:text-brand-primary transition-colors duration-300 font-medium text-sm tracking-wide"
                >
                  Home
                </Link>
              )}
              {!isLanding && (
                !user ? (
                  <Link
                    href="/auth/login"
                    className="text-brand-light/80 hover:text-brand-primary transition-colors duration-300 font-medium text-sm tracking-wide"
                  >
                    Login
                  </Link>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="text-brand-light/80 hover:text-brand-primary transition-colors duration-300 font-medium text-sm tracking-wide"
                  >
                    Logout
                  </button>
                )
              )}
            </div>
          </div>

          {/* CTA right (landing only) or spacer */}
          <div className="flex items-center justify-end">
            {isLanding && (
              <button
                onClick={onTryDemoClick}
                className="btn-premium neon-border px-6 py-2.5 rounded-lg text-brand-light text-sm font-semibold shadow-glow-blue hover:shadow-glow-lg transition-[transform,box-shadow] duration-300 will-change-transform"
              >
                Try demo
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
