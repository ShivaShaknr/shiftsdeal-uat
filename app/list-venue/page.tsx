'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  Users,
  Shield,
  Rocket,
  ArrowRight,
  Check,
  Clock,
  Wallet,
  BarChart3,
  FileText,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Increase Your Revenue',
    description: 'Reach thousands of event organizers actively looking for venues like yours.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  },
  {
    icon: Shield,
    title: 'Secure Bookings',
    description: 'AI-powered KYC verification and risk assessment for every booking.',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
  },
  {
    icon: FileText,
    title: 'AI Contracts',
    description: 'Automatic contract generation with legal protection for your venue.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop',
  },
  {
    icon: Wallet,
    title: 'Guaranteed Payments',
    description: 'Secure payment processing with upfront deposits and refund protection.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&h=400&fit=crop',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track bookings, revenue, and customer insights in real-time.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
  },
  {
    icon: Clock,
    title: 'Save Time',
    description: 'Automated booking management so you can focus on what matters.',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=400&fit=crop',
  },
  {
    icon: Users,
    title: 'Verified Customers',
    description: 'Connect with pre-verified event organizers and corporate clients.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
  },
  {
    icon: Rocket,
    title: 'Fast Growth',
    description: 'Scale your venue business with our automated marketing tools.',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
  },
];

const steps = [
  {
    step: 1,
    title: 'Create Your Listing',
    description: 'Add photos, amenities, pricing, and availability in minutes.',
  },
  {
    step: 2,
    title: 'Receive Booking Requests',
    description: 'Get verified booking requests from event organizers.',
  },
  {
    step: 3,
    title: 'Confirm & Get Paid',
    description: 'Accept bookings and receive secure payments directly.',
  },
];

const stats = [
  { value: '500+', label: 'Active Venues' },
  { value: '10K+', label: 'Successful Bookings' },
  { value: '₹5Cr+', label: 'Revenue Generated' },
  { value: '98%', label: 'Owner Satisfaction' },
];

export default function ListVenuePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Aurora Background Image */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'url(/screenshot%20021809.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }} 
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Turn Your Venue Into a{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                  Revenue Machine
                </span>
              </h1>

              <p className="text-xl text-foreground-muted mb-8">
                Join India's fastest-growing venue marketplace. Get verified bookings, AI-powered
                protection, and start earning more from your spaces.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/list-venue/onboarding">
                  <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    List Your Venue Free
                  </Button>
                </Link>
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/pp.jpg"
                  alt="Venue"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

                {/* Revenue Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-4 left-4 right-4"
                >
                  <Card className="p-4 bg-background/95 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-foreground-muted">Average Monthly Earnings</p>
                        <p className="text-2xl font-bold text-primary">₹1.5L - ₹5L</p>
                      </div>
                      <div className="flex items-center gap-1 text-success">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-semibold">+35%</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Arc Card Design */}
      <section className="relative py-8 min-h-[80vh] flex flex-col items-center justify-center overflow-hidden bg-black">
        <div className="relative z-10 w-full">
          {/* Arc of Cards - Overlapping Fan */}
          <div className="relative w-full h-[380px] md:h-[420px] mb-8 flex items-center justify-center">
            {/* Card 1 - Far Left */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: -28 }}
              transition={{ delay: 0, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer origin-bottom"
              style={{ left: 'calc(50% - 480px)', top: '160px', zIndex: 1 }}
            >
              <div className="w-[140px] h-[190px] md:w-[160px] md:h-[220px] rounded-3xl shadow-2xl p-4 flex flex-col overflow-hidden relative">
                <img src={benefits[0].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase leading-tight mb-1">{benefits[0].title}</h3>
                  <p className="text-[9px] md:text-[10px] text-white/90 leading-tight">{benefits[0].description}</p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: -18 }}
              transition={{ delay: 0.08, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer origin-bottom"
              style={{ left: 'calc(50% - 340px)', top: '100px', zIndex: 2 }}
            >
              <div className="w-[140px] h-[190px] md:w-[160px] md:h-[220px] rounded-3xl shadow-2xl p-4 flex flex-col overflow-hidden relative">
                <img src={benefits[1].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase leading-tight mb-1">{benefits[1].title}</h3>
                  <p className="text-[9px] md:text-[10px] text-white/90 leading-tight">{benefits[1].description}</p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: -8 }}
              transition={{ delay: 0.16, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer origin-bottom"
              style={{ left: 'calc(50% - 200px)', top: '50px', zIndex: 3 }}
            >
              <div className="w-[140px] h-[190px] md:w-[160px] md:h-[220px] rounded-3xl shadow-2xl p-4 flex flex-col overflow-hidden relative">
                <img src={benefits[2].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase leading-tight mb-1">{benefits[2].title}</h3>
                  <p className="text-[9px] md:text-[10px] text-white/90 leading-tight">{benefits[2].description}</p>
                </div>
              </div>
            </motion.div>

            {/* Card 4 - Center (Highlighted) */}
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer"
              style={{ left: 'calc(50% - 85px)', top: '20px', zIndex: 7 }}
            >
              <div className="w-[150px] h-[200px] md:w-[170px] md:h-[240px] rounded-3xl shadow-2xl p-5 flex flex-col overflow-hidden relative" style={{ boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6)' }}>
                <img src={benefits[3].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center mb-3">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white uppercase leading-tight mb-2">{benefits[3].title}</h3>
                  <p className="text-[10px] md:text-xs text-white/90 leading-relaxed">{benefits[3].description}</p>
                  <div className="mt-auto pt-3">
                    <div className="w-full h-px bg-white/40" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 5 */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: 8 }}
              transition={{ delay: 0.32, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer origin-bottom"
              style={{ left: 'calc(50% + 50px)', top: '50px', zIndex: 3 }}
            >
              <div className="w-[140px] h-[190px] md:w-[160px] md:h-[220px] rounded-3xl shadow-2xl p-4 flex flex-col overflow-hidden relative">
                <img src={benefits[4].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase leading-tight mb-1">{benefits[4].title}</h3>
                  <p className="text-[9px] md:text-[10px] text-white/90 leading-tight">{benefits[4].description}</p>
                </div>
              </div>
            </motion.div>

            {/* Card 6 */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: 18 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer origin-bottom"
              style={{ left: 'calc(50% + 190px)', top: '100px', zIndex: 2 }}
            >
              <div className="w-[140px] h-[190px] md:w-[160px] md:h-[220px] rounded-3xl shadow-2xl p-4 flex flex-col overflow-hidden relative">
                <img src={benefits[5].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase leading-tight mb-1">{benefits[5].title}</h3>
                  <p className="text-[9px] md:text-[10px] text-white/90 leading-tight">{benefits[5].description}</p>
                </div>
              </div>
            </motion.div>

            {/* Card 7 - Far Right */}
            <motion.div
              initial={{ opacity: 0, y: 80, rotate: 0 }}
              whileInView={{ opacity: 1, y: 0, rotate: 28 }}
              transition={{ delay: 0.48, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.1, zIndex: 50, y: -20 }}
              className="absolute cursor-pointer origin-bottom"
              style={{ left: 'calc(50% + 330px)', top: '160px', zIndex: 1 }}
            >
              <div className="w-[140px] h-[190px] md:w-[160px] md:h-[220px] rounded-3xl shadow-2xl p-4 flex flex-col overflow-hidden relative">
                <img src={benefits[6].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-9 h-9 rounded-xl bg-white/30 flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-white uppercase leading-tight mb-1">{benefits[6].title}</h3>
                  <p className="text-[9px] md:text-[10px] text-white/90 leading-tight">{benefits[6].description}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Title Below Arc */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Why Venue Owners Love ShiftsDeal
            </h2>
            <p className="text-base md:text-lg text-gray-300 max-w-3xl mx-auto">
              Everything you need to manage your venue business professionally and grow your revenue effortlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get Started in 3 Easy Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-background text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-foreground-muted">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border">
                    <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-foreground-muted mb-8">
              Join 500+ venue owners already growing their business with ShiftsDeal
            </p>
            <Link href="/list-venue/onboarding">
              <Button size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                List Your Venue   It's Free
              </Button>
            </Link>
            <p className="text-sm text-foreground-muted mt-4">
              No listing fees • No hidden charges • Only pay when you earn
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: 'Is it free to list my venue?',
                a: 'Yes! Listing your venue is completely free. We only charge a small commission when you successfully complete a booking.',
              },
              {
                q: 'How does the AI verification work?',
                a: 'Our AI analyzes KYC documents, assesses booking risks, and generates customized contracts to protect both you and your guests.',
              },
              {
                q: 'When do I get paid?',
                a: 'Payments are processed within 24-48 hours after the event is completed. You can track all payments in your dashboard.',
              },
              {
                q: "What if there's damage to my venue?",
                a: 'All bookings include a security deposit based on AI risk assessment. You can claim damages from the deposit within 48 hours of the event.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">{faq.q}</h4>
                  <p className="text-sm text-foreground-muted">{faq.a}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
