'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/layout/AdminHeader';
import { amenities as amenityOptions, venueTypes as venueTypeOptions } from '@/lib/utils';

const organizationTypes = [
  'institution',
  'private owner',
  'company',
  'trust',
  'university',
  'school',
  'club',
  'commercial property',
  'creator-owned venue',
];

export default function AdminAddVenuePage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageDragRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dragActiveImage, setDragActiveImage] = useState(false);

  const [formData, setFormData] = useState({
    venueName: '',
    venueType: '',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    googleMapsLink: '',
    capacityMin: '',
    capacityMax: '',
    minimumBookingHours: '',
    availableTimings: '',
    pricingPerHour: '',
    pricingPerSlot: '',
    securityDeposit: '',
    venueDescription: '',
    amenities: [] as string[],
    rulesAndRestrictions: '',
    cancellationPolicy: '',
    venueImages: [] as string[],
    venueVideos: [] as string[],
    gstNumber: '',

    ownerFullName: '',
    ownerEmail: '',
    ownerPhoneNumber: '',
    alternatePhoneNumber: '',
    businessName: '',
    organizationType: '',
    panOrGst: '',
    internalNotes: '',
  });

  const [localAmenities, setLocalAmenities] = useState(amenityOptions);
  const [newAmenityLabel, setNewAmenityLabel] = useState('');

  const slugify = (label: string) =>
    label
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const addCustomAmenity = (label: string) => {
    const normalized = String(label).trim();
    if (!normalized) return setError('Amenity label cannot be empty');
    const value = slugify(normalized);
    if (localAmenities.find((a) => a.value === value || a.label.toLowerCase() === normalized.toLowerCase())) {
      setError('That amenity already exists');
      return;
    }
    const newAmenity = { value, label: normalized };
    setLocalAmenities((prev) => [...prev, newAmenity]);
    toggleAmenity(value);
    setNewAmenityLabel('');
    setError('');
  };

  const amenitySet = useMemo(() => new Set(formData.amenities), [formData.amenities]);

  useEffect(() => {
    let mounted = true;

    const verifyAdminAuth = async () => {
      try {
        const response = await fetch('/api/sd-admin/auth', { method: 'GET' });
        if (!response.ok) {
          router.push('/sd-admin-x7k9');
          return;
        }
      } catch {
        router.push('/sd-admin-x7k9');
        return;
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };

    verifyAdminAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  const onLogout = async () => {
    await fetch('/api/sd-admin/auth', { method: 'DELETE' });
    router.push('/sd-admin-x7k9');
  };

  const handleImageDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActiveImage(true);
    } else if (e.type === 'dragleave') {
      setDragActiveImage(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveImage(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFiles(files, 'image');
    }
  };

  const updateField = (key: keyof typeof formData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError('');
    setSuccessMessage('');
  };

  const toggleAmenity = (value: string) => {
    if (amenitySet.has(value)) {
      updateField('amenities', formData.amenities.filter((item) => item !== value));
      return;
    }
    updateField('amenities', [...formData.amenities, value]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (readerError) => reject(readerError);
    });
  };

  const uploadFiles = async (files: FileList | null, kind: 'image' | 'video') => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');

    // Image max size: 40MB, Video max size: 15MB
    const maxFileSize = kind === 'image' ? 40 * 1024 * 1024 : 15 * 1024 * 1024;

    try {
      const uploadedUrls: string[] = [];
      const bucket = kind === 'image' ? 'venue-images' : 'venue-videos';

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        if (!file.type.startsWith(`${kind}/`)) continue;

        if (file.size > maxFileSize) {
          setError(`${file.name} exceeded ${kind === 'image' ? '40MB' : '15MB'} limit.`);
          continue;
        }

        const base64 = await fileToBase64(file);
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket, fileName, file: base64 }),
        });

        const result = await response.json();
        if (result.success && result.data?.publicUrl) {
          uploadedUrls.push(result.data.publicUrl);
        } else {
          setError(result.error || `Failed to upload ${file.name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        if (kind === 'image') {
          updateField('venueImages', [...formData.venueImages, ...uploadedUrls]);
        } else {
          updateField('venueVideos', [...formData.venueVideos, ...uploadedUrls]);
        }
      }
    } catch (uploadError: unknown) {
      const message = uploadError instanceof Error ? uploadError.message : `Failed to upload ${kind}s`;
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const required = [
      ['venueName', formData.venueName],
      ['venueType', formData.venueType],
      ['fullAddress', formData.fullAddress],
      ['city', formData.city],
      ['state', formData.state],
      ['capacityMin', formData.capacityMin],
      ['capacityMax', formData.capacityMax],
      ['minimumBookingHours', formData.minimumBookingHours],
      ['availableTimings', formData.availableTimings],
      ['pricingPerHour', formData.pricingPerHour],
      ['venueDescription', formData.venueDescription],
      ['ownerFullName', formData.ownerFullName],
      ['ownerEmail', formData.ownerEmail],
      ['ownerPhoneNumber', formData.ownerPhoneNumber],
    ] as const;

    for (const [fieldName, value] of required) {
      if (!String(value).trim()) {
        setError(`${fieldName} is required.`);
        return false;
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
      setError('Please provide a valid owner email.');
      return false;
    }

    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      setError('Pincode must be 6 digits if provided.');
      return false;
    }

    if (formData.venueImages.length === 0) {
      setError('At least one venue image is required.');
      return false;
    }

    const capacityMin = Number(formData.capacityMin);
    const capacityMax = Number(formData.capacityMax);
    if (!Number.isFinite(capacityMin) || !Number.isFinite(capacityMax) || capacityMin <= 0 || capacityMax <= 0) {
      setError('Capacity range must be valid positive numbers.');
      return false;
    }

    if (capacityMin > capacityMax) {
      setError('Capacity min cannot be greater than capacity max.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/sd-admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        setError('Admin session expired. Please sign in again.');
        setTimeout(() => router.push('/sd-admin-x7k9'), 1200);
        return;
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create venue');
      }

      setSuccessMessage('Venue created and owner assigned successfully.');
      setTimeout(() => {
        router.push('/sd-admin-x7k9/listed-venues');
      }, 1200);
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to create venue';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader onLogout={onLogout} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {checkingAuth ? (
          <div className="text-sm text-foreground-muted">Checking admin session...</div>
        ) : (
        <>
        <div className="mb-6">
          <button
            onClick={() => router.push('/sd-admin-x7k9/listed-venues')}
            className="text-sm text-foreground-muted hover:text-foreground"
          >
            Back to Listed Venues
          </button>
          <h2 className="text-2xl font-semibold mt-2">Add Venue</h2>
          <p className="text-foreground-muted text-sm">Create a venue directly and assign ownership by email.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-background-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Venue Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Venue Name *">
                <input className="input" value={formData.venueName} onChange={(e) => updateField('venueName', e.target.value)} />
              </Field>

              <Field label="Venue Type *">
                <select className="input" value={formData.venueType} onChange={(e) => updateField('venueType', e.target.value)}>
                  <option value="">Select type</option>
                  {venueTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Full Address *" className="md:col-span-2">
                <input className="input" value={formData.fullAddress} onChange={(e) => updateField('fullAddress', e.target.value)} />
              </Field>

              <Field label="City *">
                <input className="input" value={formData.city} onChange={(e) => updateField('city', e.target.value)} />
              </Field>

              <Field label="State *">
                <input className="input" value={formData.state} onChange={(e) => updateField('state', e.target.value)} />
              </Field>

              <Field label="Pincode">
                <input className="input" value={formData.pincode} onChange={(e) => updateField('pincode', e.target.value)} maxLength={6} />
              </Field>

              <Field label="Google Maps Link">
                <input className="input" value={formData.googleMapsLink} onChange={(e) => updateField('googleMapsLink', e.target.value)} />
              </Field>

              <Field label="Capacity Min *">
                <input className="input" type="number" min={1} value={formData.capacityMin} onChange={(e) => updateField('capacityMin', e.target.value)} />
              </Field>

              <Field label="Capacity Max *">
                <input className="input" type="number" min={1} value={formData.capacityMax} onChange={(e) => updateField('capacityMax', e.target.value)} />
              </Field>

              <Field label="Minimum Booking Hours *">
                <input className="input" type="number" value={formData.minimumBookingHours} onChange={(e) => updateField('minimumBookingHours', e.target.value)} />
              </Field>

              <Field label="Available Timings *">
                <input className="input" placeholder="09:00 AM - 10:00 PM" value={formData.availableTimings} onChange={(e) => updateField('availableTimings', e.target.value)} />
              </Field>

              <Field label="Pricing Per Hour *">
                <input className="input" type="number" value={formData.pricingPerHour} onChange={(e) => updateField('pricingPerHour', e.target.value)} />
              </Field>

              <Field label="Pricing Per Slot">
                <input className="input" type="number" value={formData.pricingPerSlot} onChange={(e) => updateField('pricingPerSlot', e.target.value)} />
              </Field>

              <Field label="Security Deposit">
                <input className="input" type="number" value={formData.securityDeposit} onChange={(e) => updateField('securityDeposit', e.target.value)} />
              </Field>

              <Field label="Venue Description *" className="md:col-span-2">
                <textarea className="input min-h-24" value={formData.venueDescription} onChange={(e) => updateField('venueDescription', e.target.value)} />
              </Field>

              <Field label="Amenities" className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    className="input"
                    placeholder="Add custom amenity (e.g. TV, Stage Lights)"
                    value={newAmenityLabel}
                    onChange={(e) => setNewAmenityLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomAmenity(newAmenityLabel);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-border bg-background-light text-sm"
                    onClick={() => addCustomAmenity(newAmenityLabel)}
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {localAmenities.map((option) => {
                    const active = amenitySet.has(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleAmenity(option.value)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background-light border-border text-foreground-muted hover:text-foreground'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Rules and Restrictions" className="md:col-span-2">
                <textarea className="input min-h-20" value={formData.rulesAndRestrictions} onChange={(e) => updateField('rulesAndRestrictions', e.target.value)} />
              </Field>

              <Field label="Cancellation Policy" className="md:col-span-2">
                <textarea className="input min-h-20" value={formData.cancellationPolicy} onChange={(e) => updateField('cancellationPolicy', e.target.value)} />
              </Field>

              <Field label="GST Number">
                <input className="input" value={formData.gstNumber} onChange={(e) => updateField('gstNumber', e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Venue Images Upload *">
                <div
                  ref={imageDragRef}
                  onDragEnter={handleImageDrag}
                  onDragLeave={handleImageDrag}
                  onDragOver={handleImageDrag}
                  onDrop={handleImageDrop}
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                    dragActiveImage
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background-light hover:border-primary'
                  }`}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Drag and drop images here or click to upload (max 40MB per image)
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {formData.venueImages.length} image(s) uploaded
                    </p>
                  </div>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadFiles(e.target.files, 'image')}
                  disabled={uploading}
                />
              </Field>

              <Field label="Venue Videos Upload">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-border bg-background-light text-sm"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Upload Videos
                  </button>
                  <span className="text-xs text-foreground-muted">{formData.venueVideos.length} uploaded</span>
                </div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadFiles(e.target.files, 'video')}
                />
              </Field>
            </div>
          </section>

          <section className="bg-background-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Owner Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Owner Full Name *">
                <input className="input" value={formData.ownerFullName} onChange={(e) => updateField('ownerFullName', e.target.value)} />
              </Field>
              <Field label="Owner Email *">
                <input className="input" type="email" value={formData.ownerEmail} onChange={(e) => updateField('ownerEmail', e.target.value)} />
              </Field>
              <Field label="Owner Phone Number *">
                <input className="input" value={formData.ownerPhoneNumber} onChange={(e) => updateField('ownerPhoneNumber', e.target.value)} />
              </Field>
              <Field label="Alternate Phone Number">
                <input className="input" value={formData.alternatePhoneNumber} onChange={(e) => updateField('alternatePhoneNumber', e.target.value)} />
              </Field>
              <Field label="Business Name">
                <input className="input" value={formData.businessName} onChange={(e) => updateField('businessName', e.target.value)} />
              </Field>
              <Field label="Organization Type">
                <select className="input" value={formData.organizationType} onChange={(e) => updateField('organizationType', e.target.value)}>
                  <option value="">Select organization type</option>
                  {organizationTypes.map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="PAN/GST">
                <input className="input" value={formData.panOrGst} onChange={(e) => updateField('panOrGst', e.target.value)} />
              </Field>
              <Field label="Internal Admin Notes" className="md:col-span-2">
                <textarea className="input min-h-20" value={formData.internalNotes} onChange={(e) => updateField('internalNotes', e.target.value)} />
              </Field>
            </div>
          </section>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {successMessage && <div className="text-sm text-green-400">{successMessage}</div>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-border text-sm"
              onClick={() => router.push('/sd-admin-x7k9/listed-venues')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-70"
            >
              {submitting ? 'Saving Venue...' : 'Save Venue'}
            </button>
          </div>
        </form>
        </>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          background: var(--background-light);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: var(--foreground);
          outline: none;
        }
        .input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm text-foreground-muted mb-2">{label}</label>
      {children}
    </div>
  );
}
