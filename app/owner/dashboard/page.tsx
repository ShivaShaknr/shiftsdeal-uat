'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  IndianRupee,
  Star,
  Check,
  X,
  ChevronRight,
  Plus,
  Eye,
  BarChart3,
  Bell,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Loader2,
  LogOut,
  Trash2,
  CheckCircle,
  XCircle,
  Pencil,
  ArrowRight,
  Share,
  Share2,
  Copy,
  MessageCircleIcon,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { Button, Card, Badge, Modal, toast, Confirm } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'bookings', label: 'Booking Requests', icon: Calendar },
  { id: 'venues', label: 'My Venues', icon: Building2 },
  { id: 'payment-settings', label: 'Add Bank Account', icon: CreditCard },
];

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, role, isLoading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [venueRequests, setVenueRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [savingVenue, setSavingVenue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qrRef = useRef<HTMLDivElement | null>(null);

  const [venueForm, setVenueForm] = useState<any>({
    availability: 'available',
    inventoryVisibility: 'public',
    pricingHourly: '',
    minBookingHours: '',
    availableTimings: '',
    capacityMin: '',
    capacityMax: '',
    bookingSlots: '',
    blockedDates: [] as string[],
    description: '',
    amenities: [] as string[],
    images: [] as string[],
  });

  // Redirect if not authenticated or not an owner
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/owner/dashboard');
        return;
      }
      // Only redirect if role is explicitly set to non-owner
      // Don't redirect if role is still null (still loading)
      if (role !== null && role !== 'owner') {
        console.log('User role is not owner, redirecting. Role:', role);
        router.push('/');
        return;
      }
    }

  }, [user, role, authLoading, router]);

  useEffect(() => {
    if (user && role === 'owner') {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    if (!user) return;
    console.log('Fetching data for user:', user.id);
    setIsLoading(true);
    try {
      const [venuesRes, bookingsRes, requestsRes , paymentSettingsRes] = await Promise.all([
        fetch(`/api/owner/venues?ownerId=${user.id}`),
        fetch(`/api/owner/bookings?ownerId=${user.id}`),
        fetch(`/api/venue-requests?ownerId=${user.id}`),
        fetch(`/api/owner/payment-settings?userId=${user.id}`),
      ]);

      const venuesData = await venuesRes.json();
      const bookingsData = await bookingsRes.json();
      const requestsData = await requestsRes.json();
      const paymentSettingsData = await paymentSettingsRes.json();
      console.log('Payment settings API response:', paymentSettingsData);
      setPaymentSettings(paymentSettingsData.data);
      console.log('Venues API response:', { venuesData, userId: user.id });

      if (venuesData.success) {
        setVenues(venuesData.data || []);
      } else {
        console.error('Venues API error:', venuesData.error);
      }

      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }

      if (requestsData.success) {
        setVenueRequests(requestsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const openInventoryModal = (venue: any) => {
    console.log('Opening inventory modal for venue:', venue);
    setSelectedVenue(venue);
    setVenueForm({
      availability: venue.availability || 'available',
      inventoryVisibility: venue.inventory_visibility || 'public',
      pricingHourly: String(venue.pricing?.hourly ?? ''),
      minBookingHours: String(venue.minBookingHours ?? ''),
      availableTimings: String(venue.availableTimings ?? ''),
      capacityMin: String(venue.capacity?.min ?? ''),
      capacityMax: String(venue.capacity?.max ?? ''),
      bookingSlots: String(venue.booking_slots ?? ''),
      blockedDates: Array.isArray(venue.blocked_dates) ? venue.blocked_dates : [],
      description: String(venue.description ?? ''),
      amenities: Array.isArray(venue.amenities) ? venue.amenities : [],
      images: Array.isArray(venue.images) ? venue.images : [],
    });
    setShowInventoryModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedVenue(null);
    setShareLink('');
    setLinkCopied(false);
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getWhatsAppMessage = () => {
    const venueName = selectedVenue?.name || 'Venue';
    return `${shareLink}`;
  };

  const handleWhatsAppShare = () => {
    if (!shareLink) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage())}`, '_blank');
  };

  const saveInventoryUpdates = async () => {
    if (!user || !selectedVenue) return;

    const capacityMin = Number(venueForm.capacityMin);
    const capacityMax = Number(venueForm.capacityMax);

    if (!Number.isFinite(capacityMin) || !Number.isFinite(capacityMax) || capacityMin <= 0 || capacityMax <= 0) {
      toast.error('Please enter a valid capacity range.');
      return;
    }

    if (capacityMin > capacityMax) {
      toast.error('Capacity min cannot be greater than capacity max.');
      return;
    }

    setSavingVenue(true);
    try {
      const response = await fetch(`/api/owner/venues/${selectedVenue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.id,
          availability: venueForm.availability,
            inventory_visibility: venueForm.inventoryVisibility,
          pricing_hourly: Number(venueForm.pricingHourly || 0),
          min_booking_hours: Number(venueForm.minBookingHours || 1),
          available_timings: venueForm.availableTimings,
          capacity_min: capacityMin,
          capacity_max: capacityMax,
            booking_slots: venueForm.bookingSlots,
            blocked_dates: Array.isArray(venueForm.blockedDates) ? venueForm.blockedDates : String(venueForm.blockedDates || '').split(',').map((v:string)=>v.trim()).filter(Boolean),
            description: venueForm.description,
            amenities: Array.isArray(venueForm.amenities) ? venueForm.amenities : String(venueForm.amenities || '').split(',').map((v:string)=>v.trim()).filter(Boolean),
            images: Array.isArray(venueForm.images) ? venueForm.images : String(venueForm.images || '').split(',').map((v:string)=>v.trim()).filter(Boolean),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save inventory updates.');
      }

      await fetchData();
      setShowInventoryModal(false);
      setSelectedVenue(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update venue inventory.';
      toast.error(message);
    } finally {
      setSavingVenue(false);
    }
  };

  // Image upload helper: uploads files to /api/storage/upload and appends returned publicUrl
  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'venue-images', fileName: `owner-${selectedVenue?.id || 'guest'}-${Date.now()}-${i}.${file.name.split('.').pop()}`, file: base64 }),
        });

        const json = await res.json();
        if (res.ok && json?.data?.publicUrl) {
          setVenueForm((prev: any) => ({ ...prev, images: [...(prev.images || []), json.data.publicUrl] }));
        } else {
          console.warn('Upload failed', json);
          toast.error('Image upload failed');
        }
      } catch (err) {
        console.error('Image upload error', err);
        toast.error('Image upload failed');
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setVenueForm((prev: any) => ({ ...prev, images: prev.images.filter((_:any, i:number) => i !== index) }));
  };

  const handleAddAmenity = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setVenueForm((prev: any) => ({ ...prev, amenities: Array.from(new Set([...(prev.amenities || []), v])) }));
  };

  const handleRemoveAmenity = (index: number) => {
    setVenueForm((prev: any) => ({ ...prev, amenities: prev.amenities.filter((_:any, i:number) => i !== index) }));
  };

  const handleAddBlockedDate = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setVenueForm((prev: any) => ({ ...prev, blockedDates: Array.from(new Set([...(prev.blockedDates || []), v])) }));
  };

  const handleRemoveBlockedDate = (index: number) => {
    setVenueForm((prev: any) => ({ ...prev, blockedDates: prev.blockedDates.filter((_:any, i:number) => i !== index) }));
  };

  const handleApproveBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed',approved_at: Date.now().toString() }),
      });

      if (response.ok) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: 'confirmed' } : b
        ));
        setShowBookingModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error approving booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBookings((prev) =>
            prev.map((b) =>
              b.id === bookingId ? { ...b, ...result.data } : b
            )
          );
        }
        setShowBookingModal(false);
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteBookingId) return;

    setDeletingId(deleteBookingId);
    try {
      const response = await fetch(`/api/bookings/${deleteBookingId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBookings(bookings.filter(b => b.id !== deleteBookingId));
        setShowBookingModal(false);
        setSelectedBooking(null);
        setDeleteBookingId(null);
        toast.success('Booking deleted successfully');
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

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const totalRevenue = completedBookings.reduce((sum, b) => sum + (parseFloat(b.base_price) || 0), 0);
  const pendingVenueRequests = venueRequests.filter(r => r.status === 'pending');

  const getVenueRequestStatusStyle = (status: string) => {
    const styles: Record<string, { label: string; className: string }> = {
      pending: {
        label: 'Under Review',
        className: 'inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2.5 py-1 text-xs font-medium text-yellow-500 capitalize',
      },
      approved: {
        label: 'Approved',
        className: 'inline-flex items-center rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-500 capitalize',
      },
      rejected: {
        label: 'Rejected',
        className: 'inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-500 capitalize',
      },
      expired: {
        label: 'Expired',
        className: 'inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-500 capitalize',
      },
    };

    return (
      styles[status] || {
        label: status,
        className: 'inline-flex items-center rounded-full border border-border bg-background-light px-2.5 py-1 text-xs font-medium text-foreground-muted capitalize',
      }
    );
  };

  const getBookingStatusBadge = (status: string) => {
    const styles: Record<string, { label: string; className: string }> = {
      pending: {
        label: 'Pending',
        className: 'inline-flex items-center rounded-full border border-yellow-500/30 bg-yellow-500/15 px-2.5 py-1 text-xs font-medium text-yellow-500',
      },
      confirmed: {
        label: 'Confirmed',
        className: 'inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-500',
      },
      completed: {
        label: 'Completed',
        className: 'inline-flex items-center rounded-full border border-green-500/30 bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-500',
      },
      cancelled: {
        label: 'Cancelled',
        className: 'inline-flex items-center rounded-full border border-gray-500/30 bg-gray-500/15 px-2.5 py-1 text-xs font-medium text-gray-400',
      },
      expired: {
        label: 'Expired',
        className: 'inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-1 text-xs font-medium text-orange-500',
      },
    };

    return (
      styles[status] || {
        label: status,
        className: 'inline-flex items-center rounded-full border border-border bg-background-light px-2.5 py-1 text-xs font-medium capitalize text-foreground-muted',
      }
    );
  };

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: IndianRupee },
    { label: 'Total Bookings', value: bookings.length.toString(), icon: Calendar },
    { label: 'Pending Bookings', value: pendingBookings.length.toString(), icon: Clock },
    { label: 'Active Venues', value: venues.length.toString(), icon: Building2 },
  ];

  const getBookingStatusStyle = (status?: string) => {
    const styles: Record<string, { label: string; className: string }> = {
      completed: {
        label: "Completed",
        className: "bg-green-100 text-green-700 border border-green-200 text-[12px] font-medium px-2 py-1 rounded-full",
      },
      confirmed: {
        label: "Awaiting Payment",
        className: "bg-blue-100 text-blue-700 border border-blue-200 text-[12px] font-medium px-2 py-1 rounded-full",
      },
      pending: {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-700 border border-yellow-200 text-[12px] font-medium px-2 py-1 rounded-full",
      },
      expired: {
        label: "Expired",
        className: "bg-red-100 text-red-700 border border-red-200 text-[12px] font-medium px-2 py-1 rounded-full",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-gray-100 text-gray-700 border border-gray-200 text-[12px] font-medium px-2 py-1 rounded-full",
      },
    };
  
    return (
      styles[status || ""] || {
        label: "Unknown",
        className: "bg-gray-100 text-gray-500 border border-gray-200",
      }
    );
  };
  

  // Show loading while checking auth
  if (authLoading || (!user && isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || (role && role !== 'owner')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="bg-background-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Owner Dashboard</h1>
              <p className="text-foreground-muted">
                Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              {pendingBookings.length > 0 && (
                <div className="flex items-center gap-2 bg-warning/10 text-warning px-3 py-2 rounded-lg">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">{pendingBookings.length} pending</span>
                </div>
              )}
              <Link href="/list-venue/onboarding">
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>Add Venue</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut} leftIcon={<LogOut className="w-4 h-4" />}>
                Sign Out
              </Button>
            </div>
          </div>
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() =>{
                    setActiveTab(tab.id);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-primary text-background'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-light'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'bookings' && pendingBookings.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                    {pendingBookings.length}
                  </span>
                )}
                
              </button>
            ))}
            {paymentSettings?.payment_method === null && (
              <div className="flex items-center justify-between mb-4 bg-warning/10 p-4 rounded-lg">
                <Link href="/owner-settings" className="text-primary hover:underline text-[12px]">
                  <span className="flex items-center gap-1">Add Bank Details <ArrowRight className="w-3 h-3 text-primary" /></span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <div className="skeleton h-10 w-10 rounded-lg mb-3" />
                <div className="skeleton h-8 w-24 mb-2" />
                <div className="skeleton h-4 w-20" />
              </Card>
            ))}
          </div>
        ) : (
          <>
          {paymentSettings?.payment_method === null && (
              <div className="flex items-center justify-between mb-4 bg-warning/10 p-4 rounded-lg">
                <p className="text-sm text-foreground-muted">
                  Make sure that you have added your <span className="font-bold">bank details</span> in the Account Settings. If not please add them to list your venues and start receiving payments.
                </p>
                <Link href="/owner-settings" className="text-primary hover:underline text-[12px]">
                  <span className="flex items-center gap-1">Add Bank Details <ArrowRight className="w-3 h-3 text-primary" /></span>
                </Link>
              </div>
            )}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                      <Card className="p-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <stat.icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-sm text-foreground-muted">{stat.label}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {pendingBookings.length > 0 && (
                  <Card className="p-6 border-warning/50 bg-warning/5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {pendingBookings.length} pending booking request(s)
                        </h3>
                        <p className="text-foreground-muted text-sm mb-3">Review and approve or reject these requests.</p>
                        <Button size="sm" onClick={() => setActiveTab('bookings')}>Review Requests</Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Venue Requests Status */}
                {venueRequests.length > 0 && (
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Your Venue Submissions
                      </h3>
                      <Link href="/list-venue/onboarding" className="cursor-pointer">
                        <Button size="sm" variant="outline" leftIcon={<Plus className="w-4 h-4" />} className="cursor-pointer">
                          Add Another
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {venueRequests.map((request) => {
                        const requestStatus = getVenueRequestStatusStyle(request.status);

                        return (
                        <div 
                          key={request.id} 
                          className={`p-4 rounded-xl border text-[14px] ${
                            request.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' :
                            request.status === 'approved' ? 'border-green-500/30 bg-green-500/5' :
                            request.status === 'expired' ? 'border-orange-500/30 bg-orange-500/5' :
                            'border-red-500/30 bg-red-500/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[14px] font-semibold text-foreground capitalize">{request.name}</h4>
                                <span className={requestStatus.className}>
                                  {requestStatus.label}
                                </span>
                              </div>
                              <p className="text-sm text-foreground-muted mb-2 capitalize">
                                {request.type} • {request.address?.city || 'Unknown location'}
                              </p>
                              {request.status === 'pending' && (
                                <p className="text-[12px] text-warning flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Your venue is being reviewed by our team
                                </p>
                              )}
                              {request.status === 'approved' && (
                                <p className="text-[12px] text-success flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" />
                                  Your venue is now live and make sure your bank account is added in the <strong>Account Settings</strong> to start receiving payments!
                                </p>
                              )}
                              {request.status === 'rejected' && (
                                <div>
                                  <p className="text-[12px] text-error flex items-center gap-1">
                                    <XCircle className="w-4 h-4" />
                                    Unfortunately, your venue was not approved
                                  </p>
                                  {request.rejection_reason && (
                                    <p className="text-[12px] text-foreground-muted bg-background-light p-2 rounded mt-2">
                                      <strong>Reason:</strong> {request.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            {request.images?.[0] && (
                              <img 
                                src={request.images[0]} 
                                alt={request.name}
                                className="w-16 h-16 rounded-lg object-cover shrink-0"
                              />
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-foreground">Recent Bookings</h3>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                      <p className="text-foreground-muted">No bookings yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-background-light rounded-xl hover:bg-background-light/80 cursor-pointer" onClick={() => { setSelectedBooking(booking); setShowBookingModal(true); }}>
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{booking.event_name}</p>
                              <p className="text-sm text-foreground-muted">{booking.venue?.name || 'Unknown'} • {booking.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={getBookingStatusBadge(booking.status).className}>
                              {getBookingStatusBadge(booking.status).label}
                            </span>
                            <ChevronRight className="w-5 h-5 text-foreground-muted" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {pendingBookings.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-warning" />
                      Pending Requests ({pendingBookings.length})
                    </h3>
                    <div className="grid gap-4">
                      {pendingBookings.map((booking) => (
                        <Card key={booking.id} className="p-6 border-warning/30">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-foreground">{booking.event_name}</h4>
                                <Badge variant="warning">Pending</Badge>
                              </div>
                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-foreground-muted">
                                  <Building2 className="w-4 h-4" />
                                  {booking.venue?.name || 'Unknown'}
                                </div>
                                <div className="flex items-center gap-2 text-foreground-muted">
                                  <Calendar className="w-4 h-4" />
                                  {booking.date}
                                </div>
                                <div className="flex items-center gap-2 text-foreground-muted">
                                  <User className="w-4 h-4" />
                                  {booking.contact_name}
                                </div>
                                <div className="flex items-center gap-2 text-foreground-muted">
                                  <IndianRupee className="w-4 h-4" />
                                  {formatCurrency(booking.total_amount)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedBooking(booking); setShowBookingModal(true); }}>
                                <Eye className="w-4 h-4 mr-1" />Details
                              </Button>
                              <Button variant="outline" size="sm" className="text-error hover:bg-error/10" onClick={() => handleRejectBooking(booking.id)} disabled={actionLoading}>
                                <X className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="text-error hover:bg-error/10" onClick={() => setDeleteBookingId(booking.id)} disabled={deletingId === booking.id}>
                                {deletingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                              <Button size="sm" onClick={() => handleApproveBooking(booking.id)} disabled={actionLoading}>
                                <Check className="w-4 h-4 mr-1" />Approve
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-foreground mb-4">All Bookings</h3>
                  {bookings.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Calendar className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                      <p className="text-foreground-muted">No bookings yet</p>
                    </Card>
                  ) : (
                    <Card className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-background-light">
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Event</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Venue</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Date</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Contact</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Amount</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Status</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-foreground-muted">Payment</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-foreground-muted">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr key={booking.id} className="border-b border-border/50 hover:bg-background-light">
                                <td className="py-1 px-4">
                                  <p className="font-medium text-foreground text-[14px]">{booking.event_name}</p>
                                  <p className="text-[12px] text-foreground-muted">{booking.event_type}</p>
                                </td>
                                <td className="py-2 px-4 text-foreground-muted text-[14px]">{booking.venue?.name || '-'}</td>
                                <td className="py-2 px-4 text-foreground-muted text-[14px]">{booking.date}</td>
                                <td className="py-2 px-4 text-foreground-muted text-[14px]">{booking.contact_name}</td>
                                <td className="py-2 px-4 text-foreground text-[14px]">{formatCurrency(booking.total_amount)}</td>
                                <td className="py-2 px-4">
                                    <span
                                      className={getBookingStatusStyle(booking.status).className}
                                    >
                                      {getBookingStatusStyle(booking.status).label}
                                    </span>
                                </td>
                                <td className="py-2 px-4">
                                    <span
                                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                        booking.payment_status === "fully_paid"
                                          ? "bg-green-100 text-green-700"
                                          : booking.payment_status === "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {booking.payment_status === "fully_paid"
                                        ? "Full Payment Received"
                                        : booking.payment_status === "pending"
                                        ? "Pending"
                                        : "Expired"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedBooking(booking); setShowBookingModal(true); }}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-error hover:bg-error/10"
                                      onClick={() => setDeleteBookingId(booking.id)} 
                                      disabled={deletingId === booking.id}
                                    >
                                      {deletingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'venues' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venues.map((venue) => (
                    <Card key={venue._id} className="overflow-hidden">
                      <img src={venue.images?.[0] || '/placeholder.jpg'} alt={venue.name} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <h4 className="font-semibold text-foreground mb-1 capitalize">{venue.name}</h4>
                        <p className="text-sm text-foreground-muted mb-3 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {venue.address?.city}, {venue.address?.state}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-medium">{venue.rating}</span>
                          </div>
                          <p className="text-primary font-semibold">{formatCurrency(venue.pricing?.hourly)}/hr</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 capitalize">
                          <Badge variant={venue.availability === 'available' ? 'success' : venue.availability === 'maintenance' ? 'warning' : 'default'}>
                            {venue.availability || 'Available'}
                          </Badge>
                          <div className="flex items-center gap-2">
                          {venue.availability === 'available' && (
                            <>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="whitespace-nowrap cursor-pointer"
                              onClick={() => {
                                const venueId = venue._id || venue.id;
                                setSelectedVenue(venue);
                                setShareLink(
                                  `${window.location.origin}/venues/${venueId}?ownerId=${user?.id}`
                                );
                                setShowShareModal(true);
                              }}
                            >
                              <Share2 className="w-4 h-4 mr-1" />
                              Share Link
                            </Button>
                            </>
                            )}
                            <Button size="sm" onClick={() => openInventoryModal(venue)} className="whitespace-nowrap">
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Link href="/list-venue/onboarding">
                    <Card className="h-full min-h-70 flex items-center justify-center border-dashed hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                      <div className="text-center p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <p className="font-medium text-foreground">Add New Venue</p>
                        <p className="text-sm text-foreground-muted">List your space</p>
                      </div>
                    </Card>
                  </Link>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="lg"
      >
        {selectedBooking && (
          <div className="p-6 space-y-5">
            {/* Header Card */}
            <div className="rounded-2xl border border-border bg-background-light p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedBooking.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : selectedBooking.status === "confirmed"
                          ? "bg-blue-100 text-blue-700"
                          : selectedBooking.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedBooking.status === "completed"
                        ? "Completed"
                        : selectedBooking.status === "confirmed"
                        ? "Confirmed"
                        : selectedBooking.status === "pending"
                        ? "Pending"
                        : "Cancelled"}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        selectedBooking.payment_status === "fully_paid"
                          ? "bg-green-100 text-green-700"
                          : selectedBooking.payment_status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedBooking.payment_status === "fully_paid"
                        ? "Full Payment Received"
                        : selectedBooking.payment_status === "pending"
                        ? "Waiting for Payment"
                        : "Payment Expired"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedBooking.event_name}
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      {selectedBooking.event_type}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-foreground-muted">Total Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(selectedBooking.total_amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Info */}
            <div className="rounded-2xl border border-border p-5">
              <h4 className="mb-4 text-sm font-semibold text-foreground">
                Booking Information
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground-muted">Venue</p>
                  <p className="font-medium text-foreground text-[12px]">
                    {selectedBooking.venue?.name || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-foreground-muted">Date</p>
                  <p className="font-medium text-foreground text-[12px]">{selectedBooking.date}</p>
                </div>

                <div>
                  <p className="text-xs text-foreground-muted">Time</p>
                  <p className="font-medium text-foreground text-[12px]">
                    {selectedBooking.start_time} - {selectedBooking.end_time}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-foreground-muted">Attendees</p>
                  <p className="font-medium text-foreground text-[12px]">
                    {selectedBooking.attendees} people
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="rounded-2xl border border-border p-5">
              <h4 className="mb-4 text-sm font-semibold text-foreground">
                Contact Information
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm text-foreground">
                    {selectedBooking.contact_name || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm text-foreground">
                    {selectedBooking.organization_name || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm text-foreground">
                    {selectedBooking.contact_email || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm text-foreground">
                    {selectedBooking.contact_phone || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification */}
            {/* <div className="rounded-2xl border border-border p-5">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4" />
                Verification Documents
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-foreground-muted">Document Type</p>
                  <p className="font-medium capitalize text-foreground">
                    {selectedBooking.kyc_document_type || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-foreground-muted">Contract Signed</p>
                  <p className="font-medium text-foreground">
                    {selectedBooking.signature ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              {(selectedBooking.kyc_document_url === "deleted" ||
                selectedBooking.kyc_face_photo_url === "deleted") && (
                <div className="mt-4 rounded-xl border border-border bg-background-light px-4 py-3">
                  <p className="text-sm text-foreground-muted">
                    KYC documents have been deleted as this booking has been processed.
                  </p>
                </div>
              )}
            </div> */}

            {/* Actions */}
            {selectedBooking.status === "pending" && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="text-error hover:bg-error/10"
                  onClick={() => handleRejectBooking(selectedBooking.id)}
                  disabled={actionLoading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>

                <Button
                  onClick={() => handleApproveBooking(selectedBooking.id)}
                  disabled={actionLoading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-error/40 text-error hover:bg-error/10"
              onClick={() => setDeleteBookingId(selectedBooking.id)}
              disabled={deletingId === selectedBooking.id}
            >
              {deletingId === selectedBooking.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Booking
                </>
              )}
            </Button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false);
          setSelectedVenue(null);
        }}
        title="Edit Venue Inventory"
        size="md"
      >
        {selectedVenue && (
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm text-foreground-muted block mb-2">Availability</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                value={venueForm.availability}
                onChange={(e) => setVenueForm((prev: any) => ({ ...prev, availability: e.target.value }))}
              >
                <option value="available">available</option>
                <option value="hidden">hidden</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-foreground-muted block mb-2">Inventory Visibility</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                value={venueForm.inventoryVisibility}
                onChange={(e) => setVenueForm((prev: any) => ({ ...prev, inventoryVisibility: e.target.value }))}
              >
                <option value="public">public</option>
                <option value="private">private</option>
                <option value="draft">draft</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Capacity Min</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                  value={venueForm.capacityMin}
                  onChange={(e) => setVenueForm((prev: any) => ({ ...prev, capacityMin: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Capacity Max</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                  value={venueForm.capacityMax}
                  onChange={(e) => setVenueForm((prev: any) => ({ ...prev, capacityMax: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-foreground-muted block mb-2">Booking Slots</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                value={venueForm.bookingSlots}
                onChange={(e) => setVenueForm((prev: any) => ({ ...prev, bookingSlots: e.target.value }))}
                placeholder="Morning, Afternoon, Evening"
              />
            </div>

            <div>
              <label className="text-sm text-foreground-muted block mb-2">Blocked Dates</label>
              {(venueForm.blockedDates || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {(venueForm.blockedDates || []).map((d: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background-light rounded-full text-sm text-foreground">
                      {d}
                      <button type="button" onClick={() => handleRemoveBlockedDate(i)} className="text-red-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="date"
                className="w-full h-10 px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                onChange={(e) => {
                  if (e.target.value) handleAddBlockedDate(e.target.value);
                  e.currentTarget.value = '';
                }}
              />
              <p className="text-xs text-foreground-muted mt-1.5">Use the date picker to add blocked dates.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Pricing Per Hour</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                  value={venueForm.pricingHourly}
                  onChange={(e) => setVenueForm((prev: any) => ({ ...prev, pricingHourly: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Minimum Booking Hours</label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                  value={venueForm.minBookingHours}
                  onChange={(e) => setVenueForm((prev: any) => ({ ...prev, minBookingHours: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-foreground-muted block mb-2">Available Timings</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                value={venueForm.availableTimings}
                onChange={(e) => setVenueForm((prev: any) => ({ ...prev, availableTimings: e.target.value }))}
                placeholder="09:00 AM - 10:00 PM"
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Venue Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-light text-foreground min-h-24"
                  value={venueForm.description}
                  onChange={(e) => setVenueForm((prev: any) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(venueForm.amenities || []).map((a: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-background-light rounded-full text-sm text-foreground">
                      {a}
                      <button type="button" onClick={() => handleRemoveAmenity(i)} className="text-red-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add amenity (e.g. WiFi)"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background-light text-foreground"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const v = (e.currentTarget as HTMLInputElement).value;
                        handleAddAmenity(v);
                        (e.currentTarget as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = (document.activeElement as HTMLElement) as HTMLInputElement;
                      if (el && el.tagName === 'INPUT') {
                        const v = (el as HTMLInputElement).value;
                        handleAddAmenity(v);
                        (el as HTMLInputElement).value = '';
                      }
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-foreground-muted block mb-2">Images</label>

                {(venueForm.images || []).length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3 sm:grid-cols-4">
                    {(venueForm.images || []).map((img: string, idx: number) => (
                      <div key={idx} className="relative group">
                        <img src={img} alt={`img-${idx}`} className="w-full aspect-video object-cover rounded-lg border border-border" />
                        <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 py-2 bg-background-light border border-border rounded-lg text-sm text-foreground hover:bg-background-card transition-colors"
                >
                  Upload Images
                </button>
                <p className="text-xs text-foreground-muted mt-1.5">Upload images directly — no URL copying required.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowInventoryModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveInventoryUpdates} disabled={savingVenue}>
                {savingVenue ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showShareModal}
        onClose={closeShareModal}
        title="Share Link"
        size="lg"
        className="overflow-hidden"
      >
        <div className="overflow-x-hidden px-5 pb-5 sm:px-6 pt-4">
          {selectedVenue?.name && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-background-light px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">Venue</p>
                <p className="truncate text-sm font-semibold text-foreground">{selectedVenue.name}</p>
              </div>
            </div>
          )}

          <p className="mb-4 text-sm text-foreground-muted">
            Share this link with renters so they can view and book your venue directly.
          </p>

          {shareLink && (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-5">
              <div className="flex flex-col items-center rounded-xl border border-border bg-white px-3 py-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                  Scan to open
                </p>
                <div ref={qrRef} className="rounded-lg border border-border bg-white p-2">
                  <QRCode value={shareLink} size={130} level="M" />
                </div>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-foreground-muted">
                  Scan with your phone camera to open the booking page
                </p>
              </div>

              <div className="flex min-w-0 flex-col justify-center gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex w-full cursor-pointer max-w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#20bd5a]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                   <MessageCircleIcon className="h-4 w-4" />
                  </span>
                  <span className="truncate">Share on WhatsApp</span>
                </button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background-card px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                      Or copy link
                    </span>
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-border bg-background-light p-3">
                  <p className="break-all text-xs font-mono leading-relaxed text-foreground/80">{shareLink}</p>
                  <Button
                    variant={linkCopied ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleCopyShareLink}
                    className="mt-3 w-full cursor-pointer"
                    leftIcon={linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  >
                    {linkCopied ? 'Copied' : 'Copy Link'}
                  </Button>
                </div>

                <p className="text-[11px] text-foreground-muted">
                  Includes owner and venue details in the link for direct booking.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end border-t border-border pt-4 cursor-pointer">
            <Button variant="outline" onClick={closeShareModal} className="min-w-[100px]">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Confirm
        isOpen={!!deleteBookingId}
        title="Delete Booking"
        message="Are you sure you want to delete this booking? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={!!deletingId}
        onConfirm={handleDeleteBooking}
        onCancel={() => setDeleteBookingId(null)}
      />
    </div>
  );
}
