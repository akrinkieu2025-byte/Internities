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
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-gradient-to-b from-brand-dark/80 to-brand-dark/20 border-b border-brand-primary/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo with Gradient */}
          <Link
            href="/"
            className="text-3xl font-bold tracking-tight hover:scale-105 transition-transform duration-300"
          >
            <span className="gradient-text-purple">Internities</span>
          </Link>

          {/* Navigation Links */}
          {!isLanding && (
            <div className="hidden md:flex gap-12 items-center">
              {!hideHomeLink && (
                <Link
                  href="/"
                  className="text-brand-light/80 hover:text-brand-primary transition-colors duration-300 font-medium text-sm tracking-wide"
                >
                  Home
                </Link>
              )}
              {!user ? (
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
              )}
            </div>
          )}

          {/* CTA Button */}
          <div className="flex items-center gap-4">
            {isLanding ? (
              <button
                onClick={onTryDemoClick}
                className="btn-premium neon-border px-6 py-2.5 rounded-lg text-brand-light text-sm font-semibold shadow-glow-blue hover:shadow-glow-lg transition-all duration-300"
              >
                Try demo
              </button>
            ) : (
              <Link href="/get-started">
                <button className="btn-premium neon-border px-6 py-2.5 rounded-lg text-brand-light text-sm font-semibold shadow-glow-blue hover:shadow-glow-lg transition-all duration-300">
                  Get Started
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
