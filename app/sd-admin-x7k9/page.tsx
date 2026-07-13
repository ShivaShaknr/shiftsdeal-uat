'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, cn, formatDate, formatTimeRange } from '@/lib/utils';
import AdminHeader from '@/components/layout/AdminHeader';
import { Confirm } from '@/components/ui';

// Icons as simple SVG components
const Icons = {
  Lock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Loader: () => <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>,
  LogOut: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  IndianRupee: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-6 4h6m-6 4h.01M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2m0 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8" /></svg>,
};

interface Booking {
  id: string;
  razorpay_payment_id: string;
  platform_fee: number;
  base_price: number;
  event_name: string;
  event_type: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  balance_amount: number;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  balance_paid: boolean;
  balance_paid_at: string | null;
  follow_up_sent: boolean;
  follow_up_sent_at: string | null;
  admin_notes: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  deposit_expired?: boolean;
  venues: {
    id: string;
    name: string;
    address_city: string;
    address_state: string;
  };
  owner: { id: string; email: string; name: string } | null;
  renter: { id: string; email: string; name: string } | null;
}

interface Stats {
  total_venue_booked: number;
  total_revenue: number;
  commision_earned: number;
  total_settlement: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  successful_payments: number;
  expired_bookings: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Check auth on mount and autofill credentials
  useEffect(() => {
    checkAuth();
    // Autofill admin credentials
    setUsername('shiftsdeal_admin');
    setPassword('SD@dm1n2025!Secure');
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/sd-admin/auth');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchBookings();
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/sd-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        fetchBookings();
      } else {
        setLoginError('Invalid credentials');
      }
    } catch (error) {
      setLoginError('Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/sd-admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setBookings([]);
    setStats(null);
  };

  const fetchBookings = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sd-admin/bookings');
      const data = await res.json();
      console.log("fetchBookings data", data);
      console.log("fetchBookings summary", data.summary);
      if (data.success) {
        setBookings(data.data);
        setStats(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateBooking = async (bookingId: string, updates: any) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/sd-admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...data.data } : b));
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, ...data.data });
        }
        fetchBookings(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'pending') return b.status === 'pending';
    if (filter === 'confirmed') return b.status === 'confirmed';
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'awaiting_payment') return b.status === 'confirmed' && b.payment_status === 'pending';
    if (filter === 'expired') return b.status === 'expired' || b.deposit_expired;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending:
        'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
      confirmed:
        'bg-blue-500/10 text-blue-600 border border-blue-500/20',
      cancelled:
        'bg-red-500/10 text-red-600 border border-red-500/20',
      completed:
        'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
      expired:
        'bg-red-500/10 text-red-600 border border-red-500/20',
    };
    return colors[status] || 'bg-muted text-muted-foreground border border-border';
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icons.Loader />
      </div>
    );
  }

  //for transaction details
  const PaymentStatusBadge = ({ status }: { status?: string | null }) => {
    const config = {
      fully_paid: {
        label: 'Fully Paid',
        className: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
        dot: 'bg-emerald-500',
      },
      pending: {
        label: 'Pending',
        className: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
        dot: 'bg-amber-400',
      },
      expired: {
        label: 'Expired',
        className: 'bg-red-500/10 text-red-600 border border-red-500/20',
        dot: 'bg-red-400',
      },
    } as const;

    const item =
      config[status as keyof typeof config] ?? config.pending;

    return (
      <span
        className={cn(
          'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
          item.className
        )}
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', item.dot)} />
        {item.label}
      </span>
    );
  };

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null | ReactNode;
  }) => {
    const isPrimitive = typeof value === 'string' || typeof value === 'number';

    return (
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-medium text-muted-foreground capitalize">
          {label}
        </span>

        {isPrimitive ? (
          <span className="max-w-[220px] text-right text-[12px] font-normal text-foreground-muted break-words capitalize">
            {value ?? '-'}
          </span>
        ) : (
          <div className="text-right capitalize">{value ?? '-'}</div>
        )}
      </div>
    );
  };

  const InfoBox = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => {
    return (
      <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
        <div className="text-xs font-medium text-muted-foreground">
          {label}
        </div>
  
        <div className="mt-1 break-all text-[10px] font-semibold text-foreground">
          {value || '-'}
        </div>
      </div>
    );
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-background-card border border-border rounded-2xl p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6">
              <Icons.Lock />
            </div>
            <h1 className="text-xl font-bold text-foreground text-center mb-2">Admin Access</h1>
            <p className="text-foreground-muted text-center text-sm mb-6">Authorized personnel only</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-foreground-muted mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-foreground-muted mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>
              {loginError && (
                <p className="text-red-400 text-sm text-center">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader onLogout={handleLogout} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Bookings Management</h2>
          <button
            onClick={fetchBookings}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-background-light border border-border rounded-lg hover:border-border-hover text-sm cursor-pointer"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}><Icons.Refresh /></span>
            Refresh
          </button>
        </div>
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {[
              { label: 'Total venues booked', value: stats.total_venue_booked, color: 'text-foreground', currency: false },
              { label: 'Total revenue', value: stats.total_revenue, color: 'text-foreground', currency: true },
              { label: 'Commissions Earned', value: stats.commision_earned, color: 'text-foreground', currency: true },
              { label: 'Total Settlements', value: stats.total_settlement, color: 'text-foreground', currency: true },
              { label: 'Pending Bookings', value: stats.pending_bookings, color: 'text-foreground', currency: false },
              { label: 'Confirmed Bookings', value: stats.confirmed_bookings, color: 'text-foreground', currency: false },
              { label: 'Completed Bookings', value: stats.completed_bookings, color: 'text-foreground', currency: false },
              { label: 'Expired Bookings', value: stats.expired_bookings, color: 'text-foreground', currency: false },
            ].map(stat => (
              <div key={stat.label} className="bg-background-card border border-border rounded-xl p-4 flex flex-col gap-2">
                <p className="text-[10px] text-foreground-muted">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.currency ? formatCurrency(stat.value) : stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'completed', label: 'Completed' },
            { id: 'awaiting_payment', label: 'Awaiting Payment' },
            { id: 'expired', label: 'Expired' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-[6px] rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors cursor-pointer',
                filter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background-light text-foreground-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-background-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background-light">
                  <th className="text-left py-3 px-4 text-[10px] font-medium text-foreground-muted uppercase">Booking</th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium text-foreground-muted uppercase">Venue</th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium text-foreground-muted uppercase">Owner</th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium text-foreground-muted uppercase">Renter</th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium text-foreground-muted uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-[10px] font-medium text-foreground-muted uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-foreground-muted uppercase">Payment</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-foreground-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => (
                  <tr key={booking.id}
                   onClick={() => setSelectedBooking(booking)}
                   className={cn(
                    "border-b border-border/50 hover:bg-background-light cursor-pointer",
                    booking.deposit_expired && "bg-red-500/5"
                  )}>
                    <td className="py-2 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground leading-none text-[14px]">
                            {booking.event_name}
                          </p>

                          {booking.platform_fee === 0 && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[8px] font-medium leading-none text-green-700">
                              Owner Referred
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-foreground-muted leading-none">
                          {formatDate(booking.date)} | {formatTimeRange(booking.start_time, booking.end_time)}
                        </p>

                        {booking.deposit_expired && (
                          <span className="mt-1 w-fit inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                            ⚠️ EXPIRED - 24h+
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <p className="text-sm text-foreground text-[14px] font-semibold">{booking.venues?.name}</p>
                      <p className="text-xs text-[10px] capitalize text-foreground-muted font-semibold">{booking.venues?.address_city}</p>
                    </td>
                    <td className="py-2 px-4">
                      <p className="text-sm text-foreground text-[14px] font-semibold">{booking.owner?.name || '-'}</p>
                      <p className="text-xs text-[10px] text-foreground-muted font-semibold">{booking.owner?.email || '-'}</p>
                    </td>
                    <td className="py-2 px-4">
                      <p className="text-sm text-foreground text-[14px] font-semibold">{booking.renter?.name || booking.contact_name}</p>
                      <p className="text-[10px] text-foreground-muted font-semibold">{booking.renter?.email || booking.contact_email}</p>
                      <p className="text-[10px] text-foreground-muted font-medium">{booking.contact_phone}</p>
                    </td>
                    <td className="py-2 px-4">
                      <p className="text-sm font-medium text-primary">{formatCurrency(booking.total_amount)}</p>
                      {/* <p className="text-xs text-foreground-muted">Dep: {formatCurrency(booking.deposit_amount)}</p> */}
                    </td>
                    <td className="py-2 px-4">
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <PaymentStatusBadge status={booking.payment_status} />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 bg-background-light border border-border rounded-lg hover:border-primary text-foreground-muted hover:text-primary cursor-pointer"
                          title="View Details"
                        >
                          <Icons.Eye />
                        </button>
                        {/* {booking.status === 'confirmed' && !booking.deposit_paid && (
                          <button
                            onClick={() => updateBooking(booking.id, { deposit_paid: true })}
                            disabled={updatingId === booking.id}
                            className="p-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 text-primary"
                            title="Mark Deposit Paid"
                          >
                            <Icons.IndianRupee />
                          </button>
                        )}
                        {booking.status === 'confirmed' && !booking.deposit_paid && !booking.follow_up_sent && (
                          <button
                            onClick={() => updateBooking(booking.id, { follow_up_sent: true })}
                            disabled={updatingId === booking.id}
                            className="p-2 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 text-primary"
                            title="Mark Follow-up Sent"
                          >
                            <Icons.Mail />
                          </button>
                        )} */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="py-12 text-center text-foreground-muted text-[12px]">
              No bookings found
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground text-center">Booking Details</h2>
              {selectedBooking.platform_fee === 0 && (
                    <div className='text-[10px] font-medium text-center bg-green-500/10 text-green-600 w-fit px-2 py-1 rounded-lg'>Owner Referred</div>
              )}
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 hover:bg-background-light rounded-lg text-foreground cursor-pointer"
              >
                <Icons.X />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Event Info */}
              <div>
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Event</h3>
                <p className="text-[16px] font-semibold text-foreground">{selectedBooking.event_name}</p>
                <p className="text-[12px] font-semibold text-foreground-muted">{selectedBooking.event_type} • {formatDate(selectedBooking.date)}</p>
                <p className="text-[10px] font-semibold text-foreground-muted">{formatTimeRange(selectedBooking.start_time, selectedBooking.end_time)}</p>
              </div>

              {/* Venue Info */}
              <div>
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Venue</h3>
                <p className="text-[14px] font-semibold text-foreground">{selectedBooking.venues?.name}</p>
                <p className="text-[12px] font-normal text-foreground-muted capitalize">{selectedBooking.venues?.address_city}, {selectedBooking.venues?.address_state}</p>
              </div>

              {/* Owner & Renter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground-muted mb-2">Owner</h3>
                  <p className="text-[14px] font-semibold text-foreground">{selectedBooking.owner?.name || 'N/A'}</p>
                  <p className="text-[12px] font-normal text-foreground-muted">{selectedBooking.owner?.email || '-'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground-muted mb-2">Renter</h3>
                  <p className="text-[14px] font-semibold text-foreground">{selectedBooking.contact_name}</p>
                  <p className="text-[12px] font-normal text-foreground-muted">{selectedBooking.contact_email}</p>
                  <p className="text-[10px] font-semibold text-foreground">{selectedBooking.contact_phone}</p>
                </div>
              </div>

              {/* Payment Info */}
              {/* <div>
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Payment</h3>
                <div className="bg-background-light rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Total Amount</span>
                    <span className="font-semibold text-primary">{formatCurrency(selectedBooking.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Deposit (30%)</span>
                    <span className="text-foreground">{formatCurrency(selectedBooking.deposit_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Balance</span>
                    <span className="text-foreground">{formatCurrency(selectedBooking.balance_amount)}</span>
                  </div>
                </div>
              </div> */}

              {/* Status Controls */}
              {/* <div>
                <h3 className="text-sm font-medium text-foreground-muted mb-3">Status Management</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-background-light rounded-lg p-3">
                    <div>
                      <p className="font-medium text-foreground">Deposit Paid</p>
                      {selectedBooking.deposit_paid_at && (
                        <p className="text-xs text-foreground-muted">
                          Paid on: {new Date(selectedBooking.deposit_paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => updateBooking(selectedBooking.id, { deposit_paid: !selectedBooking.deposit_paid })}
                      disabled={updatingId === selectedBooking.id}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                        selectedBooking.deposit_paid
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-border text-foreground-muted hover:bg-border-hover'
                      )}
                    >
                      {selectedBooking.deposit_paid ? '✓ Paid' : 'Mark Paid'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-background-light rounded-lg p-3">
                    <div>
                      <p className="font-medium text-foreground">Balance Paid</p>
                      {selectedBooking.balance_paid_at && (
                        <p className="text-xs text-foreground-muted">
                          Paid on: {new Date(selectedBooking.balance_paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => updateBooking(selectedBooking.id, { balance_paid: !selectedBooking.balance_paid })}
                      disabled={updatingId === selectedBooking.id}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                        selectedBooking.balance_paid
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-border text-foreground-muted hover:bg-border-hover'
                      )}
                    >
                      {selectedBooking.balance_paid ? '✓ Paid' : 'Mark Paid'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-background-light rounded-lg p-3">
                    <div>
                      <p className="font-medium text-foreground">Follow-up Sent</p>
                      {selectedBooking.follow_up_sent_at && (
                        <p className="text-xs text-foreground-muted">
                          Sent on: {new Date(selectedBooking.follow_up_sent_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => updateBooking(selectedBooking.id, { follow_up_sent: !selectedBooking.follow_up_sent })}
                      disabled={updatingId === selectedBooking.id}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                        selectedBooking.follow_up_sent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-border text-foreground-muted hover:bg-border-hover'
                      )}
                    >
                      {selectedBooking.follow_up_sent ? '✓ Sent' : 'Mark Sent'}
                    </button>
                  </div>
                </div>
              </div> */}

              {/* Admin Notes */}
              {/* <div>
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Admin Notes</h3>
                <textarea
                  defaultValue={selectedBooking.admin_notes || ''}
                  placeholder="Add internal notes..."
                  className="w-full bg-background-light border border-border rounded-lg p-3 text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary min-h-[100px]"
                  onBlur={(e) => {
                    if (e.target.value !== (selectedBooking.admin_notes || '')) {
                      updateBooking(selectedBooking.id, { admin_notes: e.target.value });
                    }
                  }}
                />
              </div> */}

          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">
                Transaction Details
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Payment and settlement information
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoBox
                  label="Transaction ID"
                  value={selectedBooking.razorpay_payment_id || '-'}
                />
                <InfoBox
                  label="Booking ID"
                  value={selectedBooking.id || '-'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="space-y-4 border-b border-border p-5 md:border-b-0 md:border-r">
                <InfoRow
                  label="Customer Name"
                  value={selectedBooking.contact_name || '-'}
                />
                <InfoRow
                  label="Venue Name"
                  value={selectedBooking.venues?.name || '-'}
                />
                <InfoRow
                  label="Payment Gateway"
                  value={selectedBooking.razorpay_payment_id || '-'}
                />
                <InfoRow
                  label="Payment Status"
                  value={<PaymentStatusBadge status={selectedBooking.payment_status} />}
                />
              </div>

              <div className="space-y-4 p-5">
                <InfoRow
                  label="Total Amount"
                  value={`₹${selectedBooking.total_amount || 0}`}
                />
                <InfoRow
                  label="Commission Amount"
                  value={`₹${selectedBooking.platform_fee || 0}`}
                />
                <InfoRow
                  label="Settlement Amount"
                  value={`₹${selectedBooking.base_price || 0}`}
                />
                <InfoRow
                  label="Settlement Status"
                  value={selectedBooking.status || '-'}
                />
              </div>
            </div>
          </div>
              {selectedBooking.deposit_expired && selectedBooking.status !== 'cancelled' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-500">⚠️ Booking Expired</p>
                      <p className="text-sm text-foreground-muted">24+ hours passed without deposit payment</p>
                    </div>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={updatingId === selectedBooking.id}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Confirm
        isOpen={showCancelConfirm}
        title="Cancel Booking"
        message="Cancel this expired booking? This action cannot be undone."
        confirmText="Cancel Booking"
        cancelText="Keep"
        loading={!!updatingId}
        onConfirm={() => {
          if (!selectedBooking) return;
          updateBooking(selectedBooking.id, { status: 'cancelled' });
          setShowCancelConfirm(false);
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </div>
  );
}
