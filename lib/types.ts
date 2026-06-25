import { VenueType } from './db/models/Venue';

export interface SearchFilters {
  city?: string;
  venueType?: VenueType;
  capacity?: number;
  budgetMin?: number;
  budgetMax?: number;
  date?: string;
  amenities?: string[];
}

export interface VenueCardData {
  _id: string;
  name: string;
  type: VenueType;
  images: string[];
  address: {
    city: string;
    state: string;
  };
  capacity: {
    min: number;
    max: number;
  };
  pricing: {
    fullDay?: number;
    halfDay?: number;
    hourly?: number;
    currency: string;
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  amenities: string[];
  location: {
    coordinates: [number, number];
  };
  aiScore?: number;
}

export interface BookingFormData {
  // Step 1: Event Details
  eventType: string;
  eventName: string;
  eventDescription: string;
  attendees: number;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Step 2: Date & Time
  date: string;
  startTime: string;
  endTime: string;
  duration: 'hourly' | 'half-day' | 'full-day';
  
  // Step 3: KYC
  kycDocument?: File;
  kycDocumentUrl?: string;
  
  // Step 4: Risk Assessment
  riskLevel?: 'low' | 'medium' | 'high';
  depositPercentage?: number;
  insuranceRequired?: boolean;
  
  // Step 5: Contract
  contractAccepted?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: 'renter' | 'owner' | 'admin';
}
