'use client';

import { useState, useRef } from 'react';
import { cn, formatCurrency } from '@/lib/utils';

// Icons as simple SVG components
const Icons = {
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Loader: () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>,
};

interface VenueData {
  id: string;
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
  commission_percentage?: number | null;
  amenities: string[];
  rules?: string[];
  availability?: string;
  status?: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  owner?: { id: string; name: string; email: string } | null;
}

interface VenueEditModalProps {
  venue: VenueData;
  mode: 'venue_request' | 'venue';
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVenue: Partial<VenueData>) => Promise<void>;
  isLoading?: boolean;
}

export default function VenueEditModal({
  venue,
  mode,
  isOpen,
  onClose,
  onSave,
  isLoading = false
}: VenueEditModalProps) {
  const [formData, setFormData] = useState<VenueData>({ ...venue });
  const [newAmenity, setNewAmenity] = useState('');
  const [newRule, setNewRule] = useState('');
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const venueTypes = [
    'banquet-hall', 'hotel', 'restaurant', 'outdoor-space',
    'conference-room', 'wedding-venue', 'other'
  ];

  const availabilityOptions = [
    { value: 'available', label: 'Available' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `venue-${venue.id}-${Date.now()}-${i}.${file.name.split('.').pop()}`;

      setUploadingImages(prev => [...prev, fileName]);

      try {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        // Upload to Supabase storage
        const uploadResponse = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucket: 'venue-images',
            fileName,
            file: base64,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        const uploadData = await uploadResponse.json();

        if (uploadData.success) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, uploadData.data.publicUrl]
          }));
        }
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image');
      } finally {
        setUploadingImages(prev => prev.filter(name => name !== fileName));
      }
    }
  };

  const handleImageRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const handleAddRule = () => {
    if (newRule.trim() && !formData.rules?.includes(newRule.trim())) {
      setFormData(prev => ({
        ...prev,
        rules: [...(prev.rules || []), newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare the update data excluding read-only fields
    const { id, owner, status, ...updateData } = formData;

    await onSave(updateData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background-card">
            <h2 className="text-lg font-bold text-foreground">
              Edit {mode === 'venue_request' ? 'Venue Request' : 'Venue'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-background-light rounded-lg text-foreground"
            >
              <Icons.X />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                >
                  {venueTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Min Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity_min}
                  onChange={(e) => handleInputChange('capacity_min', parseInt(e.target.value))}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Max Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity_max}
                  onChange={(e) => handleInputChange('capacity_max', parseInt(e.target.value))}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground-muted">
                Address
              </label>
              <div>
                <input
                  type="text"
                  placeholder="Street Address"
                  required
                  value={formData.address_street}
                  onChange={(e) => handleInputChange('address_street', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary mb-3"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  required
                  value={formData.address_city}
                  onChange={(e) => handleInputChange('address_city', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="State"
                  required
                  value={formData.address_state}
                  onChange={(e) => handleInputChange('address_state', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  required
                  value={formData.address_pincode}
                  onChange={(e) => handleInputChange('address_pincode', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-3">
                Images
              </label>

              {/* Image Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Venue ${index + 1}`}
                      className="w-full aspect-video object-cover rounded-lg border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                ))}

                {/* Upload placeholder images */}
                {uploadingImages.map((fileName, index) => (
                  <div key={fileName} className="aspect-video bg-background-light border border-border rounded-lg flex items-center justify-center">
                    <Icons.Loader />
                  </div>
                ))}
              </div>

              {/* Upload Button */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-background-light border border-border rounded-lg hover:border-primary text-foreground"
              >
                <Icons.Upload />
                Upload Images
              </button>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Hourly Rate (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formData.pricing_hourly}
                  onChange={(e) => handleInputChange('pricing_hourly', parseFloat(e.target.value))}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Half Day Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pricing_half_day || ''}
                  onChange={(e) => handleInputChange('pricing_half_day', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Full Day Rate (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pricing_full_day || ''}
                  onChange={(e) => handleInputChange('pricing_full_day', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Security Deposit */}
            {/* <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.security_deposit || ''}
                onChange={(e) => handleInputChange('security_deposit', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              />
            </div> */}

            {/* Commission Percentage */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-2">
                Commission Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.commission_percentage ?? ''}
                onChange={(e) =>
                  handleInputChange(
                    'commission_percentage',
                    e.target.value === '' ? null : parseFloat(e.target.value)
                  )
                }
                placeholder="e.g. 10"
                className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              />
              <p className="mt-1.5 text-xs text-foreground-muted">
                Platform fee on bookings. Leave empty to use default.
              </p>
            </div>

            {/* Availability (for live venues only) */}
            {mode === 'venue' && (
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-2">
                  Availability Status
                </label>
                <select
                  value={formData.availability || 'available'}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                  className="w-full bg-background-light border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                >
                  {availabilityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium text-foreground-muted mb-3">
                Amenities
              </label>

              {/* Amenities List */}
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.amenities.map((amenity, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-background-light rounded-full text-sm text-foreground">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(index)}
                      className="text-red-400 hover:text-red-500"
                    >
                      <Icons.X />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Amenity */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Add amenity..."
                  className="flex-1 bg-background-light border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover"
                >
                  <Icons.Plus />
                </button>
              </div>
            </div>

            {/* Rules (for venue requests) */}
            {mode === 'venue_request' && (
              <div>
                <label className="block text-sm font-medium text-foreground-muted mb-3">
                  Venue Rules
                </label>

                {/* Rules List */}
                <div className="space-y-2 mb-3">
                  {formData.rules?.map((rule, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-background-light rounded-lg">
                      <span className="flex-1 text-sm text-foreground">{rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(index)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <Icons.X />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Rule */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add venue rule..."
                    className="flex-1 bg-background-light border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover"
                  >
                    <Icons.Plus />
                  </button>
                </div>
              </div>
            )}

            {/* Owner Info (read-only) */}
            {formData.owner && (
              <div className="bg-background-light rounded-lg p-4">
                <h3 className="text-sm font-medium text-foreground-muted mb-2">Owner Information</h3>
                <p className="text-foreground font-medium">{formData.owner.name}</p>
                <p className="text-sm text-foreground-muted">{formData.owner.email}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-background-light border border-border rounded-lg text-foreground hover:bg-background-light/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? <Icons.Loader /> : null}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}