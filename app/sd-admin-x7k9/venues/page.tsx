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
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Building: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Image: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
};

const VENUE_TYPES = [
  'banquet-hall', 'wedding-venue', 'conference-hall', 'party-hall',
  'rooftop', 'farmhouse', 'resort', 'hotel', 'restaurant', 'outdoor'
];

const AMENITIES_LIST = [
  'WiFi', 'Parking', 'Air Conditioning', 'Sound System', 'Projector',
  'Catering', 'Decoration', 'Stage', 'Green Room', 'Valet Parking',
  'Dance Floor', 'DJ Equipment', 'Outdoor Area', 'Kitchen Access'
];

interface VenueRequest {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  description: string;
  capacity_min: number;
  capacity_max: number;
  address_street: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  images: string[];
  pricing_hourly: number;
  pricing_half_day: number | null;
  pricing_full_day: number | null;
  security_deposit: number | null;
  amenities: string[];
  rules: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  owner: { id: string; name: string; email: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminVenueRequestsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [requests, setRequests] = useState<VenueRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VenueRequest | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<VenueRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<VenueRequest>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newRule, setNewRule] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/sd-admin/auth');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        fetchRequests();
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
        fetchRequests();
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

  const fetchRequests = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/sd-admin/venue-requests?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchRequests();
  }, [filter, isAuthenticated]);

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this venue and make it live?')) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/sd-admin/venue-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', admin_notes: adminNotes }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue approved and published!');
        setSelectedRequest(null);
        fetchRequests();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/sd-admin/venue-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          rejection_reason: rejectionReason,
          admin_notes: adminNotes 
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue request rejected');
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        fetchRequests();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to reject');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateRequest = async (updatedData: any) => {
    if (!editingRequest) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/sd-admin/venue-requests/${editingRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', ...updatedData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Venue request updated successfully!');
        setShowEditModal(false);
        setEditingRequest(null);
        fetchRequests(); // Refresh the list
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Failed to update venue request');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const RequestStatusBadge = ({ status }: { status: VenueRequest['status'] }) => {
    const config = {
      pending: {
        label: 'Pending',
        className: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
        dot: 'bg-amber-400',
      },
      approved: {
        label: 'Approved',
        className: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
        dot: 'bg-emerald-400',
      },
      rejected: {
        label: 'Rejected',
        className: 'border-red-500/30 bg-red-500/15 text-red-400',
        dot: 'bg-red-400',
      },
    } as const;

    const item = config[status] ?? config.pending;

    return (
      <span
        className={cn(
          'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide',
          item.className
        )}
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', item.dot)} />
        {item.label}
      </span>
    );
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

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
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Icons.Building />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Venue Requests</h1>
            <p className="text-foreground-muted">ShiftsDeal Admin</p>
          </div>

          <form onSubmit={handleLogin} className="bg-background-card border border-border rounded-2xl p-6">
            {loginError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {loginError}
              </div>
            )}
            <div className="space-y-4">
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
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? <Icons.Loader /> : <Icons.Lock />}
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader onLogout={handleLogout} />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Venue Requests</h2>
            <p className="text-sm text-foreground-muted">Review and approve new venue listings</p>
          </div>
          <button
            onClick={() => fetchRequests()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-background-light border border-border rounded-lg hover:border-border-hover text-sm cursor-pointer"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}><Icons.Refresh /></span>
            Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-foreground' },
              { label: 'Pending', value: stats.pending, color: 'text-yellow-500' },
              { label: 'Approved', value: stats.approved, color: 'text-primary' },
              { label: 'Rejected', value: stats.rejected, color: 'text-red-500' },
              { label: 'Expired', value: 0, color: 'text-gray-500' },
            ].map(stat => (
              <div key={stat.label} className="bg-background-card border border-border rounded-xl p-4">
                <p className="text-sm text-foreground-muted">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'expired', label: 'Expired' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-4 py-[6px] rounded-lg text-[12px] font-medium transition-colors cursor-pointer',
                filter === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background-light text-foreground-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-background-card border border-border rounded-xl p-12 text-center text-foreground-muted text-[14px] font-medium">
              No venue requests found
            </div>
          ) : (
            filteredRequests.map(request => (
              <div
                key={request.id}
                className="bg-background-card border border-border rounded-xl overflow-hidden hover:border-border-hover transition-colors"
              >
                <div className="flex h-fit">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {request.images.length > 0 ? (
                      <img
                        src={request.images[0]}
                        alt={request.name}
                        className="w-48 h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-background-light flex items-center justify-center">
                        <Icons.Image />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[16px] font-semibold text-foreground">{request.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-foreground-muted mt-1">
                          <Icons.MapPin />
                          <span className='text-[14px] font-medium capitalize text-foreground-muted'>{request.address_city}, {request.address_state}</span>
                        </div>
                        <p className="text-[14px] font-medium capitalize text-foreground-muted mt-1">
                          {request.type} • {request.capacity_min}-{request.capacity_max} guests
                        </p>
                      </div>
                      <RequestStatusBadge status={request.status} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="text-foreground-muted">Owner:</span>
                        <span className="text-foreground ml-2">{request.owner?.name || 'Unknown'}</span>
                        <span className="text-foreground-muted ml-2">({request.owner?.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-semibold">
                          {formatCurrency(request.pricing_hourly)}/hr
                        </span>
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || '');
                          }}
                          className="px-4 py-2 bg-background-light border border-border rounded-lg hover:border-primary text-sm cursor-pointer"
                        >
                          View Details
                        </button>
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingRequest(request);
                                setShowEditModal(true);
                              }}
                              className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={processingId === request.id}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover text-sm disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Venue Edit Modal */}
      {showEditModal && editingRequest && (
        <VenueEditModal
          venue={editingRequest}
          mode="venue_request"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingRequest(null);
          }}
          onSave={handleUpdateRequest}
          isLoading={isUpdating}
        />
      )}

      {/* Detail Modal */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-foreground">Venue Details</h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-background-light rounded-lg cursor-pointer"
              >
                <Icons.X />
              </button>
            </div>

            <div className="p-6">
              {/* Image Gallery */}
              {selectedRequest.images.length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-4 gap-2">
                    {selectedRequest.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Venue Name</h3>
                    <p className="text-lg font-semibold text-foreground">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Type</h3>
                    <p className="capitalize text-foreground">{selectedRequest.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Capacity</h3>
                    <p className="text-foreground">{selectedRequest.capacity_min} - {selectedRequest.capacity_max} guests</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Description</h3>
                    <p className="text-sm text-foreground-muted">{selectedRequest.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Location</h3>
                    <p className="text-foreground">{selectedRequest.address_street}</p>
                    <p className="text-foreground-muted">
                      {selectedRequest.address_city}, {selectedRequest.address_state} - {selectedRequest.address_pincode}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Pricing</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-foreground">Hourly: <span className="text-primary">{formatCurrency(selectedRequest.pricing_hourly)}</span></p>
                      {selectedRequest.pricing_half_day && (
                        <p className="text-foreground">Half Day: <span className="text-primary">{formatCurrency(selectedRequest.pricing_half_day)}</span></p>
                      )}
                      {selectedRequest.pricing_full_day && (
                        <p className="text-foreground">Full Day: <span className="text-primary">{formatCurrency(selectedRequest.pricing_full_day)}</span></p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground-muted mb-1">Owner</h3>
                    <p className="text-foreground">{selectedRequest.owner?.name}</p>
                    <p className="text-sm text-foreground-muted">{selectedRequest.owner?.email}</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {selectedRequest.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground-muted mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.amenities.map((amenity, idx) => (
                      <span key={idx} className="px-3 py-1 bg-background-light rounded-full text-sm text-foreground">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {selectedRequest.rules.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground-muted mb-2">Venue Rules</h3>
                  <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1">
                    {selectedRequest.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Admin Notes */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  className="w-full bg-background-light border border-border rounded-lg p-3 text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary min-h-[80px]"
                />
              </div>

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setEditingRequest(selectedRequest);
                      setShowEditModal(true);
                      setSelectedRequest(null);
                    }}
                    className="flex-1 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg font-semibold hover:bg-blue-500/20"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50"
                  >
                    Approve & Publish
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              )}

              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <h3 className="text-sm font-medium text-red-400 mb-1">Rejection Reason</h3>
                  <p className="text-sm text-gray-400">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card border border-border rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Reject Venue Request</h2>
              <p className="text-sm text-foreground-muted">Provide a reason for rejection</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-foreground-muted mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Photos are low quality, incomplete information..."
                  className="w-full bg-background-light border border-border rounded-lg p-3 text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary min-h-[100px]"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 py-3 bg-background-light border border-border rounded-lg text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={processingId === selectedRequest.id || !rejectionReason.trim()}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {processingId === selectedRequest.id ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
