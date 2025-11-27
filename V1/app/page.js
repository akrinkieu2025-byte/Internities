'use client';

import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <main className="bg-brand-dark min-h-screen overflow-hidden">
      <Navbar />

      {/* Hero Section with Animated Gradient Orbs */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background Orbs */}
        <div className="absolute top-40 left-10 w-96 h-96 bg-gradient-to-r from-brand-primary/30 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-40 right-10 w-96 h-96 bg-gradient-to-l from-brand-secondary/30 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-r from-brand-accent/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          {/* Headline */}
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight">
              <span className="block text-brand-light">Connect with</span>
              <span className="gradient-text-purple text-7xl sm:text-8xl lg:text-8xl">Elite Internships</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-brand-light/60 max-w-3xl mx-auto leading-relaxed font-light">
              Where top-tier talent meets innovative companies. Discover exclusive internship opportunities and launch your career with the world's leading organizations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <a
                href="/auth/signup?role=student"
                className="btn-premium group relative px-8 sm:px-10 py-4 rounded-lg text-lg font-semibold border-2 border-brand-primary/50 text-brand-light hover:border-brand-primary transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>✨</span> Join as Student
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 group-hover:from-brand-primary/40 group-hover:to-brand-secondary/40 transition-all duration-300"></div>
              </a>

              <a
                href="/auth/signup?role=company"
                className="btn-premium group relative px-8 sm:px-10 py-4 rounded-lg text-lg font-semibold border-2 border-brand-secondary/50 text-brand-light hover:border-brand-secondary transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>🚀</span> Hire Top Talent
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 group-hover:from-brand-secondary/40 group-hover:to-brand-accent/40 transition-all duration-300"></div>
              </a>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="glass-card p-4 rounded-lg">
              <div className="text-3xl font-bold gradient-text">1.2K+</div>
              <div className="text-sm text-brand-light/60 mt-1">Companies</div>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <div className="text-3xl font-bold gradient-text">50K+</div>
              <div className="text-sm text-brand-light/60 mt-1">Students</div>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <div className="text-3xl font-bold gradient-text">98%</div>
              <div className="text-sm text-brand-light/60 mt-1">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              <span className="gradient-text-purple">Why Internities?</span>
            </h2>
            <p className="text-xl text-brand-light/60 max-w-2xl mx-auto">
              The most exclusive internship platform built for the next generation of leaders.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Smart Matching */}
            <div className="glass-card group p-8 rounded-xl hover:shadow-glow-blue transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-brand-primary/10 hover:border-brand-primary/40">
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold mb-3 text-brand-light">AI-Powered Matching</h3>
              <p className="text-brand-light/70 leading-relaxed">
                Our advanced algorithms match your unique skills and aspirations with the perfect internship opportunities tailored just for you.
              </p>
              <div className="mt-6 flex items-center gap-2 text-brand-primary font-semibold group-hover:gap-4 transition-all duration-300">
                <span>Learn More</span>
                <span>→</span>
              </div>
            </div>

            {/* Card 2: Career Growth */}
            <div className="glass-card group p-8 rounded-xl hover:shadow-glow-purple transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-brand-secondary/10 hover:border-brand-secondary/40">
              <div className="text-5xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold mb-3 text-brand-light">Accelerate Your Career</h3>
              <p className="text-brand-light/70 leading-relaxed">
                Gain hands-on experience at world-class companies, build a powerful professional network, and develop skills that matter in your industry.
              </p>
              <div className="mt-6 flex items-center gap-2 text-brand-secondary font-semibold group-hover:gap-4 transition-all duration-300">
                <span>Discover</span>
                <span>→</span>
              </div>
            </div>

            {/* Card 3: Exclusive Access */}
            <div className="glass-card group p-8 rounded-xl hover:shadow-glow-cyan transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-brand-accent/10 hover:border-brand-accent/40">
              <div className="text-5xl mb-6">💎</div>
              <h3 className="text-2xl font-bold mb-3 text-brand-light">Premium Opportunities</h3>
              <p className="text-brand-light/70 leading-relaxed">
                Access internships exclusively listed on Internities. Connect with innovative startups and Fortune 500 companies seeking exceptional talent.
              </p>
              <div className="mt-6 flex items-center gap-2 text-brand-accent font-semibold group-hover:gap-4 transition-all duration-300">
                <span>Explore</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="relative py-20 px-6 sm:px-8 lg:px-12 border-t border-brand-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-brand-primary/80 tracking-widest uppercase">Trusted by Leading Organizations</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 hover:opacity-100 transition-opacity duration-300">
            <div className="h-12 glass-card rounded-lg flex items-center justify-center">
              <span className="text-lg font-semibold text-brand-light/70">Tech Startup</span>
            </div>
            <div className="h-12 glass-card rounded-lg flex items-center justify-center">
              <span className="text-lg font-semibold text-brand-light/70">Fortune 500</span>
            </div>
            <div className="h-12 glass-card rounded-lg flex items-center justify-center">
              <span className="text-lg font-semibold text-brand-light/70">Unicorn VC</span>
            </div>
            <div className="h-12 glass-card rounded-lg flex items-center justify-center">
              <span className="text-lg font-semibold text-brand-light/70">Global Brand</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Gradient Background Boxes */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/2 w-96 h-96 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-full blur-3xl"></div>
          </div>

          <div className="glass-card border border-brand-primary/30 rounded-2xl p-12 sm:p-16 text-center neon-border">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Transform Your Future?
            </h2>
            <p className="text-xl text-brand-light/70 mb-10 leading-relaxed">
              Join thousands of ambitious students and innovative companies already building success on Internities. Your next opportunity is waiting.
            </p>
            <a
              href="/auth/signup"
              className="btn-premium inline-flex px-10 py-4 rounded-lg text-lg font-semibold bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-glow-lg hover:shadow-glow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-primary/10 py-12 px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            <div>
              <p className="text-brand-light/60 text-sm">© 2025 Internities. All rights reserved.</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-brand-light/60 hover:text-brand-primary transition-colors text-sm">Privacy</a>
              <a href="#" className="text-brand-light/60 hover:text-brand-primary transition-colors text-sm">Terms</a>
              <a href="#" className="text-brand-light/60 hover:text-brand-primary transition-colors text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
