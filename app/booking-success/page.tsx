'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Calendar, MapPin, Download, Home, ArrowRight, Hash } from 'lucide-react';
import { Button, Card, toast } from '@/components/ui';
import Confetti from 'react-confetti';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface ReceiptData {
  bookingId: string;
  venueName: string;
  venueAddress: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  attendees: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  pricing: {
    basePrice: number;
    platformFee: number;
    subtotal: number;
    gst: number;
    totalAmount: number;
    depositAmount: number;
    balanceAmount: number;
    commissionLabel?: string;
  };
  createdAt: string;
}

export default function BookingSuccessPage() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState(() => ({ width: typeof window !== 'undefined' ? window.innerWidth : 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 }));
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('lastBookingReceipt');
      return stored ? JSON.parse(stored) as ReceiptData : null;
    } catch (e) {
      return null;
    }
  });

  const [bookingRef] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem('lastBookingReceipt');
      if (stored) {
        const data = JSON.parse(stored);
        return data?.bookingId ? data.bookingId.substring(0, 12).toUpperCase() : `SD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }
    } catch (e) {
      // fallthrough
    }
    return `SD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const downloadReceipt = () => {
    if (!receiptData) {
      toast.error('Receipt data not available. Please check your bookings page.');
      return;
    }

    const { pricing } = receiptData;
    
    const commissionLabel =
      pricing.commissionLabel ||
      (pricing.basePrice > 0
        ? `${((pricing.platformFee / pricing.basePrice) * 100).toFixed(2)}%`
        : `${(Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE || 0.1) * 100).toFixed(2)}%`);

    // Generate receipt content
    const receiptContent = `
================================================================================
                              SHIFTSDEAL PRO
                         BOOKING CONFIRMATION RECEIPT
================================================================================

Booking Reference: ${receiptData.bookingId}
Date Generated: ${new Date(receiptData.createdAt).toLocaleString()}

--------------------------------------------------------------------------------
                              VENUE DETAILS
--------------------------------------------------------------------------------
Venue Name: ${receiptData.venueName}
Address: ${receiptData.venueAddress}

--------------------------------------------------------------------------------
                              EVENT DETAILS
--------------------------------------------------------------------------------
Event Name: ${receiptData.eventName}
Event Type: ${receiptData.eventType}
Date: ${receiptData.date}
Time: ${receiptData.time}
Expected Attendees: ${receiptData.attendees}

--------------------------------------------------------------------------------
                           ORGANIZATION DETAILS
--------------------------------------------------------------------------------
Organization: ${receiptData.organizationName}
Contact Person: ${receiptData.contactName}
Email: ${receiptData.contactEmail}
Phone: ${receiptData.contactPhone}

--------------------------------------------------------------------------------
                              PAYMENT BREAKDOWN
--------------------------------------------------------------------------------
Venue Charges                               ${formatCurrency(pricing.basePrice).padStart(15)}
Platform Fee (${commissionLabel}):                           ${formatCurrency(pricing.platformFee).padStart(15)}
                                            ---------------
Subtotal                                    ${formatCurrency(pricing.subtotal).padStart(15)}
GST (18%)                                   ${formatCurrency(pricing.gst).padStart(15)}
                                            ---------------
TOTAL AMOUNT                                ${formatCurrency(pricing.totalAmount).padStart(15)}

Deposit Due (30%)                           ${formatCurrency(pricing.depositAmount).padStart(15)}
Balance (Due before event)                  ${formatCurrency(pricing.balanceAmount).padStart(15)}

--------------------------------------------------------------------------------
                              PAYMENT TERMS
--------------------------------------------------------------------------------
1. Deposit must be paid within 24 hours of booking confirmation.
2. Balance amount is due 7 days before the event date.
3. All prices are inclusive of 18% GST.

--------------------------------------------------------------------------------
                           CANCELLATION POLICY
--------------------------------------------------------------------------------
• 30+ days before event: Full refund minus 10% processing fee
• 15-29 days before event: 50% refund
• Less than 15 days: No refund

================================================================================
                Thank you for choosing ShiftsDeal Pro!
                   For support: support@shiftsdeal.com
================================================================================
`;

    // Create and download the file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShiftsDeal-Receipt-${receiptData.bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          colors={['#b8f054', '#a0d94a', '#88c940', '#ffffff']}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            Booking Submitted!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-foreground-muted mb-8"
          >
            Your booking request has been sent to the venue owner. You'll receive a confirmation email once approved.
          </motion.p>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-background-light rounded-xl p-4 mb-6 text-left"
          >
            <div className="flex items-center gap-2 text-sm text-foreground-muted mb-3">
              <Hash className="w-4 h-4 text-primary" />
              <span>Booking Reference</span>
            </div>
            <p className="font-mono text-lg text-foreground font-semibold">
              {bookingRef}
            </p>
            {receiptData && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-sm text-foreground-muted">
                  <span className="font-medium text-foreground">{receiptData.venueName}</span>
                </p>
                <p className="text-sm text-foreground-muted">
                  {receiptData.date} • {receiptData.time}
                </p>
                <p className="text-sm font-semibold text-primary">
                  Total: {formatCurrency(receiptData.pricing.totalAmount)}
                </p>
              </div>
            )}
          </motion.div>

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-background-light rounded-xl p-4 mb-8 text-left"
          >
            <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  Venue owner reviews your booking request (usually within 24 hours)
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  Once approved, you'll receive payment instructions
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <p className="text-sm text-foreground-muted">
                  After payment, your booking is confirmed!
                </p>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              variant="outline"
              className="flex-1"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={downloadReceipt}
              disabled={!receiptData}
            >
              {receiptData ? 'Download Receipt' : 'Receipt Unavailable'}
            </Button>
            <Link href="/" className="flex-1">
              <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </Card>

        {/* Additional Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-4 mt-6"
        >
          <Link
            href="/venues"
            className="text-sm text-foreground-muted hover:text-primary transition-colors"
          >
            Browse more venues
          </Link>
          <span className="text-foreground-muted">•</span>
          <Link
            href="/bookings"
            className="text-sm text-foreground-muted hover:text-primary transition-colors"
          >
            View my bookings
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
