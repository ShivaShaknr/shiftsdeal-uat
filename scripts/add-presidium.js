import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string,
);

async function addPresidium() {
  const venue = {
    name: "Presidium Indirapuram",
    description:
      "A premier event space at Presidium School Indirapuram featuring a grand atrium and modern facilities. Perfect for corporate events, educational seminars, cultural programs, and community gatherings.",
    type: "institutional",
    images: [
      "/venues/presidium /PresidiumIndirapuramAtrium.jpg",
      "/venues/presidium /PresidiumIndirapuramImage.jpeg",
      "/venues/presidium /PresidiumIndirapuramImage(1).jpeg",
    ],
    address_street: "Presidium School, Niti Khand 2",
    address_city: "Ghaziabad",
    address_state: "Uttar Pradesh",
    address_pincode: "201014",
    address_country: "India",
    capacity_min: 50,
    capacity_max: 500,
    pricing_hourly: 6000,
    pricing_half_day: 24000,
    pricing_full_day: 45000,
    amenities: [
      "WiFi",
      "Projector",
      "AC",
      "Parking",
      "Sound System",
      "Stage",
      "Green Room",
      "Security",
      "Wheelchair Access",
      "Restrooms",
    ],
    availability: "available",
    rating: 4.8,
    reviews_count: 0,
  };

  const { data, error } = await supabase.from("venues").insert(venue).select();

  if (error) {
    console.error("Error adding venue:", error);
    process.exit(1);
  }

  console.log("✅ Presidium venue added successfully!");
  console.log("Venue ID:", data[0].id);
}

addPresidium();
