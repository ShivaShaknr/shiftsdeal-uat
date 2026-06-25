import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookingStatus = 
  | 'pending'
  | 'kyc-pending'
  | 'kyc-verified'
  | 'risk-assessed'
  | 'contract-pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  venueId: mongoose.Types.ObjectId;
  renterId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  
  // Event Details
  eventType: string;
  eventName: string;
  eventDescription: string;
  attendees: number;
  
  // Organization Details
  organizationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  
  // Booking Details
  date: Date;
  startTime: string;
  endTime: string;
  duration: 'hourly' | 'half-day' | 'full-day';
  
  // Pricing
  basePrice: number;
  depositAmount: number;
  totalAmount: number;
  currency: string;
  
  // Status
  status: BookingStatus;
  
  // KYC
  kycDocumentUrl?: string;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  kycRiskScore?: number;
  kycNotes?: string;
  
  // Risk Assessment
  riskLevel?: 'low' | 'medium' | 'high';
  depositPercentage?: number;
  insuranceRequired?: boolean;
  riskNotes?: string;
  
  // Contract
  contractUrl?: string;
  contractAccepted?: boolean;
  contractAcceptedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: 'Venue',
      required: true,
    },
    renterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    eventType: { type: String, required: true },
    eventName: { type: String, required: true },
    eventDescription: String,
    attendees: { type: Number, required: true },
    
    organizationName: { type: String, required: true },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: {
      type: String,
      enum: ['hourly', 'half-day', 'full-day'],
      required: true,
    },
    
    basePrice: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    
    status: {
      type: String,
      enum: ['pending', 'kyc-pending', 'kyc-verified', 'risk-assessed', 'contract-pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
    
    kycDocumentUrl: String,
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
    },
    kycRiskScore: Number,
    kycNotes: String,
    
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    depositPercentage: Number,
    insuranceRequired: Boolean,
    riskNotes: String,
    
    contractUrl: String,
    contractAccepted: Boolean,
    contractAcceptedAt: Date,
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ venueId: 1, date: 1 });
BookingSchema.index({ renterId: 1, status: 1 });
BookingSchema.index({ ownerId: 1, status: 1 });

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
