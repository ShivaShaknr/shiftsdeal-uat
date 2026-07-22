'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Linkedin, Instagram } from 'lucide-react';

export default function Footer() {
  const footerLinks = {
    discover: [
      { label: 'Find Venues', href: '/venues' },
      { label: 'Training Halls', href: '/venues?type=training-hall' },
      { label: 'Auditoriums', href: '/venues?type=auditorium' },
      { label: 'Coworking Spaces', href: '/venues?type=coworking' },
    ],
    forOwners: [
      { label: 'List Your Venue', href: '/list-venue' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Work', href: '/how-it-works' },
      { label: 'Contact', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  };

  return (
    <footer className="bg-background-light border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img
                src="/logo-dark.png"
                alt="ShiftsDeal"
                className="h-12 md:h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-foreground-muted mb-6 max-w-xs">
              India's leading venue discovery and booking platform. Find the perfect space for your next event.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <MapPin className="w-4 h-4 text-foreground" />
                Delhi, India
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <Mail className="w-4 h-4 text-foreground" />
                team.shiftsdeal@gmail.com
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <Phone className="w-4 h-4 text-foreground" />
                +91 8076407511
              </div>
            </div>
          </div>

          {/* Discover */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Discover</h4>
            <ul className="space-y-3">
              {footerLinks.discover.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">For Owners</h4>
            <ul className="space-y-3">
              {footerLinks.forOwners.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-muted hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground-muted">
            © {new Date().getFullYear()} ShiftsDeal. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="https://www.linkedin.com/company/shiftsdeal"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-background-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <Linkedin className="w-5 h-5" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.1 }}
              href="https://www.instagram.com/shiftsdeal/?g=5"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-background-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
}
