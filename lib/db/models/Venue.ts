import mongoose, { Schema, Document, Model } from 'mongoose';

export type VenueType = 
  | 'training-hall'
  | 'auditorium'
  | 'conference-room'
  | 'workshop-space'
  | 'banquet-hall'
  | 'hotel-venue'
  | 'institutional'
  | 'private';

export interface IVenue extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: VenueType;
  images: string[];
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  capacity: {
    min: number;
    max: number;
  };
  pricing: {
    hourly?: number;
    halfDay?: number;
    fullDay?: number;
    currency: string;
  };
  amenities: string[];
  rules: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
  aiScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['training-hall', 'auditorium', 'conference-room', 'workshop-space', 'banquet-hall', 'hotel-venue', 'institutional', 'private'],
      required: true,
    },
    images: [{
      type: String,
    }],
    address: {
      street: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: String,
      country: { type: String, default: 'India' },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    capacity: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    pricing: {
      hourly: Number,
      halfDay: Number,
      fullDay: Number,
      currency: { type: String, default: 'INR' },
    },
    amenities: [String],
    rules: [String],
    availability: {
      days: [String],
      startTime: String,
      endTime: String,
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    aiScore: Number,
  },
  {
    timestamps: true,
  }
);

VenueSchema.index({ location: '2dsphere' });
VenueSchema.index({ city: 1, type: 1 });
VenueSchema.index({ 'pricing.fullDay': 1 });

const Venue: Model<IVenue> = mongoose.models.Venue || mongoose.model<IVenue>('Venue', VenueSchema);

export default Venue;
