import { createClient } from '@supabase/supabase-js';

// For local Supabase, use: http://localhost:54321
// Update this URL when you move to cloud
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'renter' | 'owner' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'renter' | 'owner' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'renter' | 'owner' | 'admin';
          updated_at?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          type: string;
          images: string[];
          address_street: string;
          address_city: string;
          address_state: string;
          address_pincode: string;
          address_country: string;
          capacity_min: number;
          capacity_max: number;
          pricing_hourly: number;
          pricing_half_day: number;
          pricing_full_day: number;
          amenities: string[];
          availability: string;
          rating: number;
          reviews_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description: string;
          type: string;
          images?: string[];
          address_street: string;
          address_city: string;
          address_state: string;
          address_pincode: string;
          address_country: string;
          capacity_min: number;
          capacity_max: number;
          pricing_hourly: number;
          pricing_half_day: number;
          pricing_full_day: number;
          amenities?: string[];
          availability?: string;
          rating?: number;
          reviews_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_id?: string;
          name?: string;
          description?: string;
          type?: string;
          images?: string[];
          address_street?: string;
          address_city?: string;
          address_state?: string;
          address_pincode?: string;
          address_country?: string;
          capacity_min?: number;
          capacity_max?: number;
          pricing_hourly?: number;
          pricing_half_day?: number;
          pricing_full_day?: number;
          amenities?: string[];
          availability?: string;
          rating?: number;
          reviews_count?: number;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          venue_id: string;
          renter_id: string;
          event_name: string;
          event_type: string;
          event_description: string;
          date: string;
          start_time: string;
          end_time: string;
          attendees: number;
          organization_name: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          special_requirements: string;
          kyc_document_type: string;
          kyc_document_url: string;
          kyc_face_photo_url: string;
          contract_data: any;
          signature: string;
          total_amount: number;
          deposit_amount: number;
          balance_amount: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
          payment_status: 'pending' | 'deposit_paid' | 'fully_paid' | 'expired';
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          renter_id: string;
          event_name: string;
          event_type: string;
          event_description?: string;
          date: string;
          start_time: string;
          end_time: string;
          attendees: number;
          organization_name: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          special_requirements?: string;
          kyc_document_type: string;
          kyc_document_url: string;
          kyc_face_photo_url: string;
          contract_data?: any;
          signature: string;
          total_amount: number;
          deposit_amount: number;
          balance_amount: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
          payment_status?: 'pending' | 'deposit_paid' | 'fully_paid' | 'expired';
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          venue_id?: string;
          renter_id?: string;
          event_name?: string;
          event_type?: string;
          event_description?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          attendees?: number;
          organization_name?: string;
          contact_name?: string;
          contact_email?: string;
          contact_phone?: string;
          special_requirements?: string;
          kyc_document_type?: string;
          kyc_document_url?: string;
          kyc_face_photo_url?: string;
          contract_data?: any;
          signature?: string;
          total_amount?: number;
          deposit_amount?: number;
          balance_amount?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
          payment_status?: 'pending' | 'deposit_paid' | 'fully_paid' | 'expired';
          approved_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}

export type TypedSupabaseClient = typeof supabase;
