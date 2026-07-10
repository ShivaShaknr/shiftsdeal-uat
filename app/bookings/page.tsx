'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Script from "next/script";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Download,
  Eye,
  MessageSquare,
  Star,
  RefreshCw,
  Trash2,
  Loader2,
  Phone,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Copy,
} from 'lucide-react';
import { Button, Card, Badge, toast } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

const tabs = ['all', 'pending', 'upcoming', 'completed', 'cancelled'];
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Helper to download invoice - uses stored pricing from booking
const downloadInvoice = (booking: any, venueDetails: any) => {
  // Get pricing from stored values (already calculated at checkout)
  const basePrice = booking.base_price || booking.basePrice || 0;
  const platformFee = booking.platform_fee || booking.platformFee || 0;
  const subtotal = booking.subtotal || (basePrice + platformFee);
  const gstAmount = booking.gst_amount || booking.gstAmount || 0;
  const totalAmount = booking.total_amount || booking.totalAmount || 0;
  const depositAmount = booking.deposit_amount || booking.depositAmount || 0;
  const balanceAmount = booking.balance_amount || booking.balanceAmount || 0;
  
  const commissionLabel =
    basePrice > 0
      ? `${((platformFee / basePrice) * 100).toFixed(2)}%`
      : `${(Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE || 0.1) * 100).toFixed(2)}%`;

  const invoiceContent = `
================================================================================
                              SHIFTS DEAL PRO
                                 INVOICE
================================================================================

Invoice Number: INV-${booking._id?.substring(0, 8).toUpperCase() || 'N/A'}
Date Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

--------------------------------------------------------------------------------
                              VENUE DETAILS
--------------------------------------------------------------------------------
Venue Name:      ${venueDetails?.name || 'N/A'}
Address:         ${venueDetails?.address?.street || ''}, ${venueDetails?.address?.city || ''}, ${venueDetails?.address?.state || ''}

--------------------------------------------------------------------------------
                             BOOKING DETAILS
--------------------------------------------------------------------------------
Booking ID:      ${booking._id || 'N/A'}
Event Date:      ${new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Time:            ${booking.startTime || booking.start_time} - ${booking.endTime || booking.end_time}
Event Name:      ${booking.eventName || booking.event_name || 'N/A'}
Event Type:      ${booking.eventType || booking.event_type || 'N/A'}
Attendees:       ${booking.attendees || 'N/A'}

--------------------------------------------------------------------------------
                             CONTACT DETAILS
--------------------------------------------------------------------------------
Name:            ${booking.contactName || booking.contact_name || 'N/A'}
Email:           ${booking.contactEmail || booking.contact_email || 'N/A'}
Phone:           ${booking.contactPhone || booking.contact_phone || 'N/A'}

--------------------------------------------------------------------------------
                             PAYMENT SUMMARY
--------------------------------------------------------------------------------
Venue Charges:                                           ${formatCurrency(basePrice)}
Platform Fee (${commissionLabel}):                                       ${formatCurrency(platformFee)}
                                                         ----------------
Subtotal:                                                ${formatCurrency(subtotal)}
GST (18%):                                               ${formatCurrency(gstAmount)}
                                                         ================
TOTAL AMOUNT:                                            ${formatCurrency(totalAmount)}

Deposit (30%):                                           ${formatCurrency(depositAmount)}
Balance Due:                                             ${formatCurrency(balanceAmount)}

--------------------------------------------------------------------------------
                             PAYMENT DETAILS
--------------------------------------------------------------------------------
UPI ID:          shiftsdeal@upi
Account Name:    Shifts Deal Pro Pvt Ltd

UPI Payment Link (copy & paste in browser or UPI app):
upi://pay?pa=shiftsdeal@upi&pn=ShiftsDealPro&am=${depositAmount}&cu=INR&tn=Booking-${booking._id?.substring(0, 8) || 'Deposit'}

Bank Transfer (Alternative):
Bank:            HDFC Bank
Account No:      50100XXXXXXXXX
IFSC Code:       HDFC0001234
Account Name:    Shifts Deal Pro Pvt Ltd

--------------------------------------------------------------------------------
                                STATUS
--------------------------------------------------------------------------------
Booking Status:  ${booking.status?.toUpperCase() || 'N/A'}

================================================================================
                    Thank you for choosing Shifts Deal Pro!
                  For support: support@shiftsdeal.com
================================================================================
`.trim();

  const blob = new Blob([invoiceContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${booking._id?.substring(0, 8) || 'booking'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async (showRefreshing = false) => {
    if (!user?.id) return; // Don't fetch if no user
    
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    
    console.log('🔍 Fetching bookings for user:', user.id);
    try {
      const bookingsRes = await fetch(`/api/bookings?userId=${user.id}`);
      const bookingsResult = await bookingsRes.json();
      
      if (bookingsResult.success && bookingsResult.data) {
        console.log(`✅ Loaded ${bookingsResult.data.length} bookings for user`);
        setBookings(bookingsResult.data);
      }
      console.log('🔍 Bookings:', bookingsResult.data);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login?redirect=/bookings');
      return;
    }
    
    if (user?.id) {
      fetchData();
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    // Auto-refresh every 30 seconds to show status updates
    if (!user?.id) return;
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Normalize booking data from Supabase (snake_case) to expected format
  const bookingsWithVenues = bookings.map((booking) => ({
    ...booking,
    _id: booking.id || booking._id,
    venueId: booking.venue_id || booking.venueId,
    startTime: booking.start_time || booking.startTime,
    endTime: booking.end_time || booking.endTime,
    totalAmount: booking.total_amount || booking.totalAmount,
    eventName: booking.event_name || booking.eventName,
    venueDetails: booking.venue
      ? {
          _id: booking.venue.id,
          name: booking.venue.name,
          images: booking.venue.images || [],
          address: {
            street: booking.venue.address_street,
            city: booking.venue.address_city,
            state: booking.venue.address_state,
          },
        }
      : null,
    ownerDetails: booking.owner || null,
  }));

  const filteredBookings =
    activeTab === 'all'
      ? bookingsWithVenues
      : bookingsWithVenues.filter((b) => {
          if (activeTab === 'pending') return b.status === 'pending';
          if (activeTab === 'upcoming') return b.status === 'confirmed';
          if (activeTab === 'completed') return b.status === 'completed';
          if (activeTab === 'cancelled') return b.status === 'cancelled';
          return true;
        });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }
    
    setDeletingId(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBookings(bookings.filter(b => (b.id || b._id) !== bookingId));
        console.log('✅ Booking deleted successfully');
      } else {
        console.error('❌ Failed to delete booking:', result.error);
        toast.error('Failed to delete booking: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting booking:', error);
      toast.error('Error deleting booking');
    } finally {
      setDeletingId(null);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect handled in useEffect, but show nothing while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const handlePayNow = async (bookingId: string) => {
    const scriptLoaded = await loadRazorpayScript();
  
    if (!scriptLoaded) {
      toast.error("Razorpay SDK failed to load");
      return;
    }
  
    const response = await fetch(`/api/bookings/${bookingId}/pay`, {
      method: "POST",
    });
  
    const result = await response.json();
  
    if (!result.success) {
      toast.error(result.error || "Failed to create payment order");
      return;
    }
  
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: result.data.amount,
      currency: result.data.currency,
      name: "Shifts Deal",
      description: "Booking Payment",
      order_id: result.data.order_id,
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
      },
  
      handler: async function (paymentResponse: any) {
        const verifyResponse = await fetch(
          `/api/bookings/${bookingId}/verify-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentResponse),
          }
        );
  
        const verifyResult = await verifyResponse.json();
  
        if (verifyResult.success) {
          toast.success("Payment successful");
        } else {
          toast.error(verifyResult.error || "Payment verification failed");
        }
      },
      modal: {
        ondismiss: async function () {
          await fetch(`/api/bookings/${bookingId}/pay`, { method: "PATCH" });
        },
      },
  
      theme: {
        color: "#28282B",
      },
    };
  
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const getStatusTagClass = (status: any) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "expired":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };
  
  const getStatusLabel = (status: any) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "confirmed":
        return "Awaiting Payment";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };


  return (
    <div className="min-h-screen bg-background py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
            <p className="text-foreground-muted">View and manage your venue bookings</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />}
          >
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all whitespace-nowrap',
                activeTab === tab
                  ? 'bg-primary text-background'
                  : 'bg-background-card text-foreground-muted hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">No bookings found</h3>
            <p className="text-foreground-muted mb-6">
              You haven't made any bookings yet. Start exploring venues!
            </p>
            <Link href="/venues">
              <Button>Browse Venues</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:border-primary/30 transition-colors">
                  <div className="flex flex-col md:flex-row">
                    {/* Venue Image */}
                    {booking.venueDetails?.images?.[0] && (
                      <div className="md:w-48 h-32 md:h-auto">
                        <img
                          src={booking.venueDetails.images[0]}
                          alt={booking.venueDetails.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground text-[18px]">
                            {booking.venueDetails?.name || 'Venue'}
                          </h3>
                          <p className="text-sm text-foreground-muted flex items-center gap-1 capitalize text-[12px]">
                            <MapPin className="w-3 h-3" />
                            {booking.venueDetails?.address?.city || '—'}
                          </p>
                        </div>
                        <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusTagClass(
                              booking.status
                            )}`}
                          >
                            {getStatusLabel(booking.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                        <div className='flex flex-col gap-2'>
                          <p className="text-foreground-muted flex items-center gap-2 text-[14px] capitalize">
                            <Calendar className="w-3 h-3" />
                            Date
                          </p>
                          <p className="text-foreground font-medium text-[14px]">
                            {new Date(booking.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Time
                          </p>
                          <p className="text-foreground font-medium">
                            {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground-muted flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Attendees
                          </p>
                          <p className="text-foreground font-medium">{booking.attendees}</p>
                        </div>
                        <div>
                          <p className="text-foreground-muted">Amount</p>
                          <p className="font-semibold text-primary">
                            {formatCurrency(booking.totalAmount)}
                          </p>
                        </div>
                      </div>

                      {booking.status === 'pending' && (
                        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4">
                         <div className="flex items-center gap-2 text-warning">
                           <Clock className="w-4 h-4" />
                           <p className="text-sm">Awaiting venue owner approval. You'll be notified once confirmed.</p>
                         </div>
                        </div>
                      )}

                      {booking.status === 'confirmed' && booking.payment_status === 'fully_paid' && (
                         <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
                         <div className="flex items-start gap-3">
                           <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                           <div className="flex-1">
                             <h4 className="font-semibold text-success mb-1">Payment Received!</h4>
                             <p className="text-sm text-foreground-muted mb-3">
                               Your deposit of {formatCurrency(booking.deposit_amount || booking.depositAmount)} has been confirmed.
                               {booking.deposit_paid_at && (
                                 <span className="block text-xs mt-1">
                                   Paid on: {new Date(booking.deposit_paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                 </span>
                               )}
                             </p>
                             
                             <div className="bg-background/50 rounded-lg p-3 space-y-2">
                               <div className="flex justify-between text-sm">
                                 <span className="text-foreground-muted">Total Amount:</span>
                                 <span className="font-medium text-foreground">{formatCurrency(booking.totalAmount || booking.total_amount)}</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span className="text-foreground-muted">Deposit Paid:</span>
                                 <span className="font-medium text-success">✓ {formatCurrency(booking.deposit_amount || booking.depositAmount)}</span>
                               </div>
                               <div className="flex justify-between text-sm border-t border-border pt-2">
                                 <span className="text-foreground-muted">Balance Due:</span>
                                 <span className="font-semibold text-primary">{formatCurrency(booking.balance_amount || booking.balanceAmount)}</span>
                               </div>
                               <p className="text-xs text-foreground-muted pt-1">
                                 Balance payment due 7 days before event date
                               </p>
                             </div>

                             {booking.balance_paid && (
                               <div className="mt-3 p-3 bg-success/20 rounded-lg">
                                 <p className="text-sm text-success font-medium">✓ Full payment received! Your booking is fully confirmed.</p>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                      )}

                      {booking.status === 'confirmed' && booking.payment_status === 'pending' && (
                        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
                         <div className="flex items-start gap-3">
                           <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                           <div className="flex-1">
                             {process.env.NEXT_PUBLIC_PAYMENT_MODE === 'platform' ? (
                               /* ── PLATFORM PAYMENT MODE: QR + UPI flow ── */
                               <>
                                 <h4 className="font-semibold text-foreground mb-2">Booking Approved! Complete Your Payment</h4>
                                 <div className="space-y-3 text-sm">
                                   <div className="bg-background/50 rounded-lg p-3">
                                     <p className="text-foreground-muted mb-2">Pay deposit to confirm your booking:</p>
                                     <div className="flex items-center justify-between">
                                       <span className="font-semibold text-foreground">Deposit Amount (30%):</span>
                                       <span className="text-lg font-bold text-primary">{formatCurrency(booking.deposit_amount || booking.depositAmount || Math.round((booking.totalAmount || booking.total_amount) * 0.3))}</span>
                                     </div>
                                   </div>
                                   
                                   <div className="space-y-2">
                                     <p className="font-medium text-foreground flex items-center gap-2">
                                       <IndianRupee className="w-4 h-4" />
                                       Payment Options:
                                     </p>
                                     <div className="bg-background/50 rounded-lg p-3 space-y-3">
                                       <div className="flex flex-col sm:flex-row gap-4">
                                         {/* QR Code */}
                                         <div className="flex-shrink-0">
                                           <p className="text-xs text-foreground-muted mb-2 text-center">Scan to Pay</p>
                                           <img 
                                             src="/QR.jpeg" 
                                             alt="Payment QR Code" 
                                             className="w-32 h-32 rounded-lg border border-border"
                                           />
                                         </div>
                                         
                                         {/* UPI Details */}
                                         <div className="flex-1 space-y-2">
                                           <div className="flex items-center justify-between">
                                             <span className="text-foreground-muted">UPI ID:</span>
                                             <div className="flex items-center gap-2">
                                               <code className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-mono">
                                                 shiftsdeal@upi
                                               </code>
                                               <button 
                                                 onClick={() => {
                                                   navigator.clipboard.writeText('shiftsdeal@upi');
                                                   toast.success('UPI ID copied!');
                                                 }}
                                                 className="text-primary hover:text-primary/80"
                                               >
                                                 <Copy className="w-4 h-4" />
                                               </button>
                                             </div>
                                           </div>
                                           <p className="text-xs text-foreground-muted">
                                             Pay via any UPI app (GPay, PhonePe, Paytm, etc.)
                                           </p>
                                         </div>
                                       </div>
                                     </div>
                                   </div>

                                   <div className="flex items-start gap-2 text-foreground-muted">
                                     <Phone className="w-4 h-4 mt-0.5" />
                                     <div>
                                       <p>Our team will call you at <strong className="text-foreground">{booking.contact_phone || booking.contactPhone}</strong> to confirm payment details.</p>
                                     </div>
                                   </div>

                                   <div className="flex items-start gap-2 text-warning">
                                     <AlertCircle className="w-4 h-4 mt-0.5" />
                                     <p className="text-sm">Pay deposit within 24 hours to secure your booking. Balance due 7 days before event.</p>
                                   </div>
                                 </div>
                               </>
                             ) : (
                               /* ── DIRECT MODE: ShiftsDeal contacts the user ── */
                               <>
                                 <h4 className="font-semibold text-foreground mb-2">Your Request Has Been Approved! 🎉</h4>
                                 <p className="text-sm text-foreground-muted mb-3">
                                   ShiftsDeal will reach out to you in the next 24 hours from{' '}
                                   <a href="mailto:team.shiftsdeal@gmail.com" className="text-primary underline">
                                     team.shiftsdeal@gmail.com
                                   </a>{' '}
                                   with further instructions to complete your booking.
                                 </p>
                                 <div className="flex items-start gap-2 text-foreground-muted text-sm">
                                   <AlertCircle className="w-4 h-4 mt-0.5 text-warning flex-shrink-0" />
                                   <p>Please check your inbox (and spam folder) for an email from us.</p>
                                 </div>
                               </>
                             )}
                           </div>
                         </div>
                        </div>
                      )}

                      {booking.status === 'completed' && (
                        <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">
                                Booking Completed
                              </h4>
                      
                              <p className="text-sm text-foreground-muted">
                                Your booking has been successfully completed. Thank you for choosing ShiftsDeal.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {booking.status === 'cancelled' && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground mb-1">
                              Booking Cancelled
                            </h4>
                    
                            <p className="text-sm text-foreground-muted">
                              This booking has been cancelled. Please contact our team if you need more details.
                            </p>
                          </div>
                        </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <p className="text-xs text-foreground-muted">
                          Booking ID: {booking._id}
                        </p>
                        <div className="flex items-center gap-2">
                          {booking.status === 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Star className="w-4 h-4" />}
                            >
                              Rate
                            </Button>
                          )}
 
                          {booking.status === "confirmed" && booking.payment_status === "pending" && (
                            <div className="flex flex-col items-start gap-1">
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<CreditCard className="w-4 h-4" />}
                                onClick={() => {
                                  if (!booking.payment_inprogress) {
                                    handlePayNow(booking._id);
                                  }
                                }}
                                disabled={booking.payment_inprogress}
                                className={
                                  booking.payment_inprogress
                                    ? "cursor-not-allowed opacity-60"
                                    : "cursor-pointer"
                                }
                              >
                                Pay Now
                              </Button>
                              {booking.payment_inprogress && (
                                <p className="text-xs text-foreground-muted max-w-[220px]">
                                  Another renter is paying for this slot. Please try again shortly.
                                </p>
                              )}
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Download className="w-4 h-4" />}
                            onClick={() => downloadInvoice(booking, booking.venueDetails)}
                          >
                            Invoice
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            onClick={() => handleDeleteBooking(booking._id)}
                            disabled={deletingId === booking._id}
                            leftIcon={deletingId === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          >
                            {deletingId === booking._id ? 'Deleting...' : 'Delete'}
                          </Button>
                          <Link href={`/venues/${booking.venueId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              rightIcon={<ChevronRight className="w-4 h-4" />}
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
