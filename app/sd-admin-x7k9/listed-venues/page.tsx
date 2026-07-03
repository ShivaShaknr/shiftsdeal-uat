'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, cn } from '@/lib/utils';
import AdminHeader from '@/components/layout/AdminHeader';
import VenueEditModal from '@/components/admin/VenueEditModal';

// Icons as simple SVG components
const Icons = {
  Lock: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Loader: () => <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>,
  LogOut: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Building: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  ExternalLink: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  Filter: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
};

interface Venue {
  id: string;
  name: string;
  type: string;
  description: string;
  images: string[];
  address_street: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  capacity_min: number;
  capacity_max: number;
  pricing_hourly: number;
  pricing_half_day: number | null;
  pricing_full_day: number | null;
  security_deposit: number | null;
  amenities: string[];
  availability: string;
  rating: number;
  review_count: number;
  created_at: string;
  owner: { id: string; name: string; email: string } | null;
}

interface Stats {
  total: number;
  available: number;
  hidden: number;
  maintenance: number;
}

export default function AdminVenuesListPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/sd-admin/auth');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchVenues();
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
        fetchVenues();
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Connection error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/sd-admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  const fetchVenues = async () => {
    setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (cityFilter !== 'all') params.set('city', cityFilter);

      const res = await fetch(`/api/sd-admin/venues?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVenues(data.data);
        setCities(data.cities || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchVenues();
  }, [statusFilter, cityFilter, isAuthenticated]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isAuthenticated) fetchVenues();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleHideVenue = async (id: string) => {
    if (!confirm('Hide this venue? It will not appear in search results.')) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/sd-admin/venues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hide' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue hidden successfully');
        fetchVenues();
        setSelectedVenue(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to hide venue');
    } finally {
      setProcessingId(null);
    }
  };

  const handleShowVenue = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/sd-admin/venues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'show' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue is now visible');
        fetchVenues();
        setSelectedVenue(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to show venue');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteVenue = async (id: string) => {
    if (!confirm('DELETE this venue? This action cannot be undone. Only venues with no bookings can be deleted.')) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/sd-admin/venues/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue deleted successfully');
        fetchVenues();
        setSelectedVenue(null);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to delete venue');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateVenue = async (updatedData: any) => {
    if (!editingVenue) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sd-admin/venues/${editingVenue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', ...updatedData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue updated successfully!');
        setShowEditModal(false);
        setEditingVenue(null);
        fetchVenues(); // Refresh the list
        setSelectedVenue(null); // Close detail modal if open
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to update venue');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-primary/20 text-primary',
      hidden: 'bg-yellow-500/20 text-yellow-400',
      maintenance: 'bg-orange-500/20 text-orange-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icons.Loader />
      </div>
    );
  }

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
        {/* Page Title */}
        <div className="flex items-center justify-between mb-2">
          <div className='flex flex-col'>
            <h2 className="text-lg font-semibold text-foreground">Venue Management</h2>
            <p className="text-sm text-foreground-muted">View, search, hide or delete venues</p>
          </div>
          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 mb-6">
            <button
              onClick={() => router.push('/sd-admin-x7k9/add-venue')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-hover"
            >
              <Icons.Building />
              Add Venue
            </button>
            <button
              onClick={fetchVenues}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 bg-background-light border border-border rounded-lg hover:border-border-hover text-sm"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}><Icons.Refresh /></span>
              Refresh
            </button>
          </div>
        </div>
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Venues', value: stats.total, color: 'text-foreground' },
              { label: 'Available', value: stats.available, color: 'text-primary' },
              { label: 'Hidden', value: stats.hidden, color: 'text-yellow-500' },
              { label: 'Maintenance', value: stats.maintenance, color: 'text-orange-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-background-card border border-border rounded-xl p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-foreground-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              {/* <span className="text-foreground-muted"><Icons.Filter /></span> */}
              {/* <p className="text-sm font-semibold text-foreground">Search & Filters</p> */}
            </div>
            {/* {(searchQuery || statusFilter !== 'all' || cityFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setCityFilter('all');
                }}
                className="text-xs font-medium text-foreground-muted transition-colors hover:text-primary"
              >
                Clear all
              </button>
            )} */}
          </div>

          <div className="grid grid-cols-1 gap-4 pb-6 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                Search venues
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, city, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted/60 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <Icons.Search />
                </div>
              </div>
            </div>

            <div className="min-w-[170px]">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-background/50 py-2.5 pl-3 pr-9 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="hidden">Hidden</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <Icons.ChevronDown />
                </div>
              </div>
            </div>

            <div className="min-w-[170px]">
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                City
              </label>
              <div className="relative">
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-background/50 py-2.5 pl-3 pr-9 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                  <Icons.ChevronDown />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map(venue => (
            <div
              key={venue.id}
              className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background-card transition-colors hover:border-border-hover"
            >
              {/* Venue Image */}
              <div className="relative h-40 shrink-0">
                <img
                  src={venue.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'}
                  alt={venue.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusBadge(venue.availability))}>
                    {venue.availability}
                  </span>
                </div>
              </div>

              {/* Venue Info */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 truncate font-semibold text-foreground">{venue.name}</h3>
                <div className="mb-2 flex items-center gap-1 text-sm text-foreground-muted">
                  <Icons.MapPin />
                  <span className="truncate">{venue.address_city}, {venue.address_state}</span>
                </div>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Capacity: {venue.capacity_min}-{venue.capacity_max}</span>
                  <span className="font-medium text-primary">{formatCurrency(venue.pricing_hourly)}/hr</span>
                </div>
                <p className="mb-3 min-h-4 truncate text-xs text-foreground-muted">
                  {venue.owner
                    ? `Owner: ${venue.owner.name} (${venue.owner.email})`
                    : '\u00A0'}
                </p>

                {/* Actions */}
                <div className="mt-auto flex gap-2 border-t border-border/60 pt-3">
                  <button
                    onClick={() => setSelectedVenue(venue)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-sm cursor-pointer"
                  >
                    <Icons.Eye />
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEditingVenue(venue);
                      setShowEditModal(true);
                    }}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm cursor-pointer"
                  >
                    <Icons.Edit />
                  </button>
                  {venue.availability === 'available' ? (
                    <button
                      onClick={() => handleHideVenue(venue.id)}
                      disabled={processingId === venue.id}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Icons.EyeOff />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleShowVenue(venue.id)}
                      disabled={processingId === venue.id}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-sm disabled:opacity-50 cursor-pointer  "
                    >
                      <Icons.Eye />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteVenue(venue.id)}
                    disabled={processingId === venue.id}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {venues.length === 0 && !isRefreshing && (
          <div className="text-center py-12 text-[14px] font-medium text-foreground-muted">
            {/* <Icons.Building /> */}
            <p className="text-foreground-muted mt-2">No venues found</p>
          </div>
        )}
      </div>

      {/* Venue Detail Modal */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedVenue(null)}>
          <div
            className="bg-background-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-background-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{selectedVenue.name}</h2>
              <button onClick={() => setSelectedVenue(null)} className="text-foreground-muted hover:text-foreground">
                <Icons.X />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Image */}
              <div className="relative h-48 rounded-xl overflow-hidden">
                <img
                  src={selectedVenue.images?.[0] || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'}
                  alt={selectedVenue.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusBadge(selectedVenue.availability))}>
                  {selectedVenue.availability.toUpperCase()}
                </span>
                <a
                  href={`/venues/${selectedVenue.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  View on Site <Icons.ExternalLink />
                </a>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-foreground-muted">Type</p>
                  <p className="text-foreground font-medium">{selectedVenue.type}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Capacity</p>
                  <p className="text-foreground font-medium">{selectedVenue.capacity_min} - {selectedVenue.capacity_max} people</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Hourly Rate</p>
                  <p className="text-foreground font-medium">{formatCurrency(selectedVenue.pricing_hourly)}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Full Day Rate</p>
                  <p className="text-foreground font-medium">{selectedVenue.pricing_full_day ? formatCurrency(selectedVenue.pricing_full_day) : '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-foreground-muted">Location</p>
                  <p className="text-foreground font-medium">
                    {selectedVenue.address_street}, {selectedVenue.address_city}, {selectedVenue.address_state} {selectedVenue.address_pincode}
                  </p>
                </div>
                {selectedVenue.owner && (
                  <div className="col-span-2">
                    <p className="text-foreground-muted">Owner</p>
                    <p className="text-foreground font-medium">{selectedVenue.owner.name} - {selectedVenue.owner.email}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-foreground-muted text-sm mb-1">Description</p>
                <p className="text-foreground text-sm">{selectedVenue.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-foreground-muted text-sm mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVenue.amenities?.map(amenity => (
                    <span key={amenity} className="px-2 py-1 bg-background-light rounded-lg text-xs text-foreground">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setEditingVenue(selectedVenue);
                    setShowEditModal(true);
                    setSelectedVenue(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20"
                >
                  Edit Venue
                </button>
                {selectedVenue.availability === 'available' ? (
                  <button
                    onClick={() => handleHideVenue(selectedVenue.id)}
                    disabled={processingId === selectedVenue.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 disabled:opacity-50"
                  >
                    <Icons.EyeOff />
                    Hide Venue
                  </button>
                ) : (
                  <button
                    onClick={() => handleShowVenue(selectedVenue.id)}
                    disabled={processingId === selectedVenue.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 disabled:opacity-50"
                  >
                    <Icons.Eye />
                    Show Venue
                  </button>
                )}
                <button
                  onClick={() => handleDeleteVenue(selectedVenue.id)}
                  disabled={processingId === selectedVenue.id}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Icons.Trash />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venue Edit Modal */}
      {showEditModal && editingVenue && (
        <VenueEditModal
          venue={editingVenue}
          mode="venue"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingVenue(null);
          }}
          onSave={handleUpdateVenue}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
