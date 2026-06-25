'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button, GlowingEffect, StaggerTestimonials } from '@/components/ui';
import Link from 'next/link';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const steps = {
  renters: [
    {
      number: '01',
      title: 'Discover',
      description:
        'Search by location, capacity, budget, and venue type. Browse venues on an interactive map or list view. Compare options side-by-side to find what fits.',
      highlights: [
        'Filter by your exact requirements',
        'View venues on map',
        'AI helps narrow down options faster',
      ],
    },
    {
      number: '02',
      title: 'Understand Fit',
      description:
        'See why each venue matches your needs. AI highlights suitability insights, capacity matching, and potential concerns upfront so you know exactly what to expect.',
      highlights: [
        'Suitability score for your event',
        'Requirement matching analysis',
        'Transparent venue details',
      ],
    },
    {
      number: '03',
      title: 'Book with Confidence',
      description:
        'Submit event details, complete identity verification, review AI-generated booking terms, and confirm. Everything is transparent with no hidden surprises.',
      highlights: [
        'Simple 5-step booking flow',
        'Clear pricing and terms',
        'Secure identity verification',
      ],
    },
    {
      number: '04',
      title: 'Host Your Event',
      description:
        'Your venue is reserved with a clear agreement. Both sides know what to expect. Support and documentation are available if you need them.',
      highlights: [
        'Confirmed reservation',
        'Clear agreements',
        'Support when needed',
      ],
    },
  ],
  owners: [
    {
      number: '01',
      title: 'List Your Venue',
      description:
        'List your hall, auditorium, or conference space in minutes. Simple onboarding, no upfront cost. Upload photos, set pricing, and define availability.',
      features: ['Quick setup', 'No listing fees', 'Full control'],
    },
    {
      number: '02',
      title: 'Manage Bookings',
      description:
        'Review booking requests, approve or decline based on your criteria. Set your own availability windows and manage your calendar easily.',
      features: ['Approve/decline requests', 'Control availability', 'Flexible scheduling'],
    },
    {
      number: '03',
      title: 'Earn & Track',
      description:
        'Track bookings and revenue in your dashboard. See analytics on performance and get AI-based pricing suggestions to optimize earnings.',
      features: ['Revenue tracking', 'Performance analytics', 'Smart pricing tips'],
    },
  ],
};

const trustPoints = [
  {
    title: 'Transparent Process',
    description:
      'ShiftsDeal facilitates connections between renters and venues. Bookings are governed by clear renter-venue contracts, not hidden terms.',
  },
  {
    title: 'Risk Management',
    description:
      'Security deposits, identity verification, and optional insurance help manage risk. Both sides have protection and clarity.',
  },
  {
    title: 'Dispute Resolution',
    description:
      'If issues arise, a structured resolution process with evidence collection and mediation support helps reach fair outcomes.',
  },
  {
    title: 'Secure Platform',
    description:
      'Your data is protected. Payment information is secure. Identity verification ensures genuine users on both sides.',
  },
];

const aiFeatures = [
  {
    title: 'Smarter Search',
    description: 'Natural language search understands what you need',
  },
  {
    title: 'Better Matching',
    description: 'AI analyzes venue suitability for your specific event',
  },
  {
    title: 'Faster Verification',
    description: 'Automated KYC and document checks save time',
  },
  {
    title: 'Streamlined Process',
    description: 'Contract generation and risk assessment happen instantly',
  },
];

export default function HowItWorksPage() {
  const renterCards = React.useMemo(
    () =>
      steps.renters.map((step, index) => ({
        tempId: index,
        heading: step.title,
        description: step.description,
        points: step.highlights,
        testimonial: `${step.title}. ${step.description}`,
        by: `Step ${step.number}`,
      })),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-background-light border-b border-border">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(184,240,84,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(184,240,84,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-5">
              Finding the right venue
              <br />
              <span className="gradient-text">shouldn't be complicated</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto mb-7">
              ShiftsDeal helps organizers discover, compare, and book professional venues easily.
              No confusion, no endless coordination just clarity.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/venues">
                <Button size="lg">
                  Browse Venues
                </Button>
              </Link>
              <Link href="/list-venue">
                <Button size="lg" variant="secondary">
                  List Your Venue
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
              For Event Organizers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">How Renting Works</h2>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">Four simple steps from search to event day</p>
          </motion.div>

          <StaggerTestimonials items={renterCards} />
        </div>
      </section>

      <section className="py-12 sm:py-14 bg-background-light border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <div className="inline-flex px-4 py-2 rounded-full bg-foreground/5 text-foreground-muted text-sm font-medium mb-3">
              For Venue Owners
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">List Your Space</h2>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">Simple setup, flexible management, clear earnings</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {steps.owners.map((step) => (
              <motion.div
                key={step.number}
                variants={fadeInUp}
                className="bg-background rounded-2xl border border-border p-7 hover:border-primary/30 transition-colors"
              >
                <div className="text-sm font-medium text-primary mb-2">Step {step.number}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-foreground-muted mb-5">{step.description}</p>
                <div className="space-y-2">
                  {step.features.map((feature, i) => (
                    <div key={i} className="text-sm text-foreground-muted">
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Trust, Safety & Disputes</h2>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">Clear processes, transparent policies, and structured support</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {trustPoints.map((point, idx) => {
              return (
                <motion.div
                  key={point.title}
                  variants={fadeInUp}
                  className="relative cursor-pointer bg-background-card rounded-2xl border border-border p-7"
                >
                  <GlowingEffect
                    glow
                    spread={46}
                    proximity={140}
                    inactiveZone={0.02}
                    borderWidth={3}
                    disabled={false}
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{point.title}</h3>
                    <p className="text-foreground-muted">{point.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-14 bg-background-light border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
              AI Assistant
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Where AI Helps</h2>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
              An invisible assistant that makes everything smoother not the product itself
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {aiFeatures.map((feature, idx) => {
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="relative cursor-pointer bg-background rounded-xl border border-border p-6 text-center"
                >
                  <GlowingEffect
                    glow
                    spread={46}
                    proximity={140}
                    inactiveZone={0.02}
                    borderWidth={3}
                    disabled={false}
                  />
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-foreground-muted">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-5">Ready to get started?</h2>
            <p className="text-lg text-foreground-muted mb-7 max-w-2xl mx-auto">
              Whether you are looking for a venue or listing your space, ShiftsDeal makes it simple.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/venues">
                <Button size="lg">
                  Find a Venue
                </Button>
              </Link>
              <Link href="/list-venue">
                <Button size="lg" variant="secondary">
                  List Your Space
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
