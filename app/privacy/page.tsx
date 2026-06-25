'use client';

import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none space-y-6 text-foreground-muted">
            <p className="text-lg">
              Last updated: January 2026
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, 
                make a booking, or contact us for support. This may include your name, email address, 
                phone number, and payment information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
              <p>
                We use the information we collect to provide, maintain, and improve our services, 
                process transactions, send you related information, and communicate with you about 
                products, services, and events.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">3. Information Sharing</h2>
              <p>
                We may share your information with venue owners when you make a booking, 
                and with third-party service providers who perform services on our behalf. 
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">5. Your Rights</h2>
              <p>
                You have the right to access, correct, or delete your personal information. 
                You may also opt out of receiving promotional communications from us.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto: team.shiftsdeal@gmail.com" className="text-primary hover:underline">
                   team.shiftsdeal@gmail.com
                </a>
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
