'use client';

import { motion } from 'framer-motion';
import { Mail, Clock, Linkedin } from 'lucide-react';

export default function Contact() {
  return (
    <main className="pt-20 bg-background">
      {/* Hero */}
      <section className="py-12 md:py-14 bg-background-light">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-tight">
              Let's Talk
            </h1>
            <p className="text-lg md:text-xl text-foreground-muted max-w-3xl mx-auto leading-relaxed mb-8">
              Have questions? Want to partner with us? We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-10 md:py-12 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Cards */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Get In Touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-background-light rounded-xl hover:shadow-lg hover:border-primary/50 border border-white/10 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                      <a href="mailto:team.shiftsdeal@gmail.com" className="text-foreground-muted hover:text-primary transition-colors">
                        team.shiftsdeal@gmail.com
                      </a>
                      <p className="text-sm text-foreground-muted mt-1">We'll respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-6 bg-background-light rounded-xl hover:shadow-lg hover:border-primary/50 border border-white/10 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Linkedin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Connect on LinkedIn</h3>
                      <a href="https://www.linkedin.com/company/shiftsdeal" target="_blank" rel="noopener noreferrer" className="text-foreground-muted hover:text-primary transition-colors">
                        ShiftsDeal
                      </a>
                      <p className="text-sm text-foreground-muted mt-1">Follow us for updates and news</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-8 border border-primary/20">
                <Clock className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-4">Response Time</h3>
                <p className="text-foreground-muted leading-relaxed mb-4">
                  We typically respond to all inquiries within 24 hours during business days. Reach out via email or LinkedIn for any assistance.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Email:</span>
                    <span className="font-medium text-foreground">Within 24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Forms:</span>
                    <span className="font-medium text-foreground">Within 1-2 business days</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-8 border border-primary/20">
                <h3 className="text-2xl font-bold text-foreground mb-4">For Media & Partnerships</h3>
                <p className="text-foreground-muted leading-relaxed mb-4">
                  Interested in featuring ShiftsDeal or exploring partnership opportunities? We'd love to collaborate.
                </p>
                <a 
                  href="mailto:team.shiftsdeal@gmail.com"
                  className="text-primary hover:text-primary font-medium transition-colors"
                >
                  team.shiftsdeal@gmail.com
                </a>
              </div>

              <div className="bg-background-light rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-foreground mb-4">Quick Help</h3>
                <p className="text-foreground-muted mb-6">
                  Looking for answers? Check out these common topics:
                </p>
                <ul className="space-y-3">
                  <li>
                    <a href="/how-it-works" className="text-foreground-muted hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      How does pricing work?
                    </a>
                  </li>
                  <li>
                    <a href="/how-it-works" className="text-foreground-muted hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Venue vetting process
                    </a>
                  </li>
                  <li>
                    <a href="/how-it-works" className="text-foreground-muted hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Cancellation policy
                    </a>
                  </li>
                  <li>
                    <a href="/how-it-works" className="text-foreground-muted hover:text-primary transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Insurance coverage
                    </a>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
