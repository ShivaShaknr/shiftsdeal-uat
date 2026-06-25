// Seed script to populate Supabase with initial venue data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

// Inline dummy venues data
const dummyVenues = [
  {
    _id: '1',
    name: 'Grand Convention Center',
    description: 'Modern convention center with state-of-the-art facilities',
    type: 'conference-hall',
    images: ['https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800'],
    address: { street: '123 Business Ave', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
    capacity: { min: 100, max: 500 },
    pricing: { hourly: 5000, halfDay: 18000, fullDay: 30000 },
    amenities: ['WiFi', 'Projector', 'AC', 'Parking', 'Catering'],
    availability: 'available',
    rating: 4.5,
    reviewsCount: 120,
  },
  {
    _id: '2',
    name: 'Tech Hub Meeting Room',
    description: 'Compact meeting space perfect for team collaborations',
    type: 'meeting-room',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    address: { street: '45 Tech Park', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
    capacity: { min: 10, max: 50 },
    pricing: { hourly: 1500, halfDay: 5000, fullDay: 8000 },
    amenities: ['WiFi', 'Whiteboard', 'AC', 'Coffee'],
    availability: 'available',
    rating: 4.2,
    reviewsCount: 85,
  },
  {
    _id: '3',
    name: 'Luxury Banquet Hall',
    description: 'Elegant banquet hall for upscale corporate events',
    type: 'banquet-hall',
    images: ['https://images.unsplash.com/photo-1519167758481-83f29da8c680?w=800'],
    address: { street: '789 Palace Road', city: 'Delhi', state: 'Delhi', pincode: '110001', country: 'India' },
    capacity: { min: 200, max: 1000 },
    pricing: { hourly: 8000, halfDay: 28000, fullDay: 50000 },
    amenities: ['WiFi', 'Stage', 'AC', 'Parking', 'Catering', 'Sound System'],
    availability: 'available',
    rating: 4.8,
    reviewsCount: 200,
  },
];

async function seedVenues() {
  console.log('🌱 Starting to seed venues...');

  // First, create a default owner user
  const { data: owner, error: ownerError } = await supabase
    .from('users')
    .upsert([{
      id: '00000000-0000-0000-0000-000000000001',
      email: 'owner@shiftsdeal.com',
      name: 'Default Owner',
      role: 'owner',
    }])
    .select()
    .single();

  if (ownerError) {
    console.error('❌ Error creating owner:', ownerError);
    return;
  }

  console.log('✅ Created default owner');

  // Transform and insert venues
  const transformedVenues = dummyVenues.map(venue => ({
    id: venue._id,
    owner_id: owner.id,
    name: venue.name,
    description: venue.description,
    type: venue.type,
    images: venue.images,
    address_street: venue.address.street,
    address_city: venue.address.city,
    address_state: venue.address.state,
    address_pincode: venue.address.pincode,
    address_country: venue.address.country,
    capacity_min: venue.capacity.min,
    capacity_max: venue.capacity.max,
    pricing_hourly: venue.pricing.hourly,
    pricing_half_day: venue.pricing.halfDay,
    pricing_full_day: venue.pricing.fullDay,
    amenities: venue.amenities,
    availability: venue.availability,
    rating: venue.rating,
    reviews_count: venue.reviewsCount,
  }));

  const { data: venues, error: venuesError } = await supabase
    .from('venues')
    .upsert(transformedVenues, { onConflict: 'id' })
    .select();

  if (venuesError) {
    console.error('❌ Error seeding venues:', venuesError);
    return;
  }

  console.log(`✅ Successfully seeded ${venues?.length || 0} venues`);
  console.log('🎉 Seeding complete!');
}

seedVenues().catch(console.error);
