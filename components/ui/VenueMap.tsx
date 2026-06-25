'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatCurrency } from '@/lib/utils';
import { useTheme } from '@/lib/theme/ThemeContext';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Server-side API usage tracking
async function checkMapUsage(): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
  try {
    const res = await fetch('/api/map-usage', { method: 'GET' });
    return await res.json();
  } catch (error) {
    console.error('Failed to check map usage:', error);
    return { allowed: true, currentCount: 0, limit: 25000 }; // Fail open
  }
}

async function incrementMapUsage(): Promise<{ allowed: boolean; currentCount: number; limit: number }> {
  try {
    const res = await fetch('/api/map-usage', { method: 'POST' });
    return await res.json();
  } catch (error) {
    console.error('Failed to increment map usage:', error);
    return { allowed: true, currentCount: 0, limit: 25000 }; // Fail open
  }
}

interface Venue {
  _id: string;
  name: string;
  type: string;
  images: string[];
  address: {
    city: string;
    state: string;
    street?: string;
  };
  location?: {
    type?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  capacity: {
    min: number;
    max: number;
  };
  pricing: {
    hourly?: number;
    fullDay?: number;
  };
  rating: number;
}

interface VenueMapProps {
  venues: Venue[];
  onVenueClick?: (venueId: string) => void;
  selectedVenueId?: string | null;
  className?: string;
}

// Default coordinates for major Indian cities
const cityCoordinates: Record<string, [number, number]> = {
  'Mumbai': [72.8777, 19.0760],
  'Delhi': [77.1025, 28.7041],
  'Bangalore': [77.5946, 12.9716],
  'Hyderabad': [78.4867, 17.3850],
  'Chennai': [80.2707, 13.0827],
  'Kolkata': [88.3639, 22.5726],
  'Pune': [73.8567, 18.5204],
  'Ahmedabad': [72.5714, 23.0225],
  'Jaipur': [75.7873, 26.9124],
  'Lucknow': [80.9462, 26.8467],
  'Gurgaon': [77.0266, 28.4595],
  'Noida': [77.3910, 28.5355],
  'Ghaziabad': [77.4538, 28.6692],
};

// Get coordinates for a venue - use actual coords or fallback to city coords
function getVenueCoordinates(venue: Venue): [number, number] | null {
  // If venue has valid coordinates, use them
  if (venue.location?.coordinates && 
      venue.location.coordinates.length === 2 &&
      venue.location.coordinates[0] !== 0 &&
      venue.location.coordinates[1] !== 0) {
    return venue.location.coordinates;
  }
  
  // Fallback to city coordinates with small random offset
  const cityCoords = cityCoordinates[venue.address.city];
  if (cityCoords) {
    // Add small random offset so markers don't stack exactly
    const offset = () => (Math.random() - 0.5) * 0.02;
    return [cityCoords[0] + offset(), cityCoords[1] + offset()];
  }
  
  return null;
}

export function VenueMap({ venues, onVenueClick, selectedVenueId, className = '' }: VenueMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapDisabled, setMapDisabled] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(25000);
  const [checkingUsage, setCheckingUsage] = useState(true);
  const { theme } = useTheme();

  // Check server-side usage on mount
  useEffect(() => {
    let mounted = true;
    
    const checkUsage = async () => {
      const { allowed, currentCount, limit } = await checkMapUsage();
      if (mounted) {
        setMapDisabled(!allowed);
        setUsageCount(currentCount);
        setUsageLimit(limit);
        setCheckingUsage(false);
      }
    };
    
    checkUsage();
    
    return () => { mounted = false; };
  }, []);

  // Update map style when theme changes
  useEffect(() => {
    if (!map.current || !mapLoaded || mapDisabled || checkingUsage) return;
    
    const newStyle = theme === 'light' 
      ? 'mapbox://styles/mapbox/light-v11' 
      : 'mapbox://styles/mapbox/dark-v11';
    
    map.current.setStyle(newStyle);
  }, [theme, mapLoaded, mapDisabled, checkingUsage]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || mapDisabled || checkingUsage) return;

    // Increment usage counter on server when map is actually loaded
    const initMap = async () => {
      const { allowed, currentCount, limit } = await incrementMapUsage();
      setUsageCount(currentCount);
      setUsageLimit(limit);
      
      // Check if we just hit the limit
      if (!allowed) {
        setMapDisabled(true);
        return;
      }

      const initialStyle = theme === 'light' 
        ? 'mapbox://styles/mapbox/light-v11' 
        : 'mapbox://styles/mapbox/dark-v11';

      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: initialStyle,
        center: [78.9629, 20.5937], // Center of India
        zoom: 4,
        attributionControl: false, // Remove Mapbox branding
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setMapLoaded(true);
      });
    };

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapDisabled, checkingUsage]);

  // Update markers when venues change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Close any open popup
    popupRef.current?.remove();

    // Get venues with valid coordinates
    const venuesWithCoords = venues
      .map(venue => ({
        venue,
        coords: getVenueCoordinates(venue),
      }))
      .filter((item): item is { venue: Venue; coords: [number, number] } => item.coords !== null);

    if (venuesWithCoords.length === 0) return;

    // Add markers for each venue
    venuesWithCoords.forEach(({ venue, coords }) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'venue-marker';
      el.innerHTML = `
        <div class="marker-pin ${selectedVenueId === venue._id ? 'selected' : ''}">
          <span class="marker-price">₹${formatCurrency(venue.pricing.hourly || 0).replace('₹', '')}</span>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        maxWidth: '280px',
        closeOnClick: false,
      }).setHTML(`
        <div class="venue-popup">
          <img src="${venue.images[0] || '/placeholder-venue.jpg'}" alt="${venue.name}" class="popup-image" />
          <div class="popup-content">
            <h3 class="popup-title">${venue.name}</h3>
            <p class="popup-location">${venue.address.city}, ${venue.address.state}</p>
            <div class="popup-details">
              <span class="popup-price">${formatCurrency(venue.pricing.hourly || 0)}/hr</span>
              <span class="popup-capacity">${venue.capacity.max} guests</span>
            </div>
            <div class="popup-rating">⭐ ${venue.rating}</div>
          </div>
        </div>
      `);

      // Create and add marker (without popup attached - we'll show on hover)
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .addTo(map.current!);

      // Show popup on hover
      el.addEventListener('mouseenter', () => {
        popup.setLngLat(coords).addTo(map.current!);
        popupRef.current = popup;
      });

      el.addEventListener('mouseleave', () => {
        popup.remove();
      });

      // Handle click - navigate to venue
      el.addEventListener('click', () => {
        if (onVenueClick) {
          onVenueClick(venue._id);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (venuesWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      venuesWithCoords.forEach(({ coords }) => {
        bounds.extend(coords);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [venues, mapLoaded, selectedVenueId, onVenueClick]);

  // Highlight selected venue
  useEffect(() => {
    if (!selectedVenueId || !map.current) return;

    const venueIndex = venues.findIndex(v => v._id === selectedVenueId);
    if (venueIndex >= 0 && markersRef.current[venueIndex]) {
      const marker = markersRef.current[venueIndex];
      
      const lngLat = marker.getLngLat();
      map.current?.flyTo({
        center: lngLat,
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedVenueId, venues]);

  // Loading state while checking usage
  if (checkingUsage) {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-background-card border border-border ${className}`}>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-foreground-muted text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // If map is disabled, show fallback UI
  if (mapDisabled) {
    return (
      <div className={`relative rounded-xl overflow-hidden bg-background-card border border-border ${className}`}>
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
          {/* Logo - different for light/dark mode */}
          <img 
            src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} 
            alt="ShiftsDeal" 
            className="mb-6 h-12 sm:h-14 w-auto object-contain"
          />
          <p className="text-foreground-muted text-lg max-w-md">
            Find the perfect venue for your next corporate event
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-2xl" />
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-background-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm border border-border">
        <span className="text-primary font-semibold">{venues.length}</span>
        <span className="text-foreground-muted ml-1">venues in view</span>
      </div>

      {/* Styles for markers and popups */}
      <style jsx global>{`
        .venue-marker {
          cursor: pointer;
        }
        
        .marker-pin {
          background: #c8ff00;
          color: #000;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }
        
        .marker-pin:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        
        .marker-pin.selected {
          background: #fff;
          transform: scale(1.15);
        }
        
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          overflow: hidden;
          background: #1a1a1a;
          border: 1px solid #333;
        }
        
        .venue-popup {
          width: 240px;
        }
        
        .popup-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        
        .popup-content {
          padding: 12px;
        }
        
        .popup-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .popup-location {
          font-size: 12px;
          color: #888;
          margin: 0 0 8px 0;
        }
        
        .popup-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .popup-price {
          color: #c8ff00;
          font-weight: 600;
          font-size: 13px;
        }
        
        .popup-capacity {
          font-size: 11px;
          color: #666;
        }
        
        .popup-rating {
          font-size: 12px;
          color: #fff;
        }
        
        .mapboxgl-popup-tip {
          border-top-color: #1a1a1a;
        }
      `}</style>
    </div>
  );
}

export default VenueMap;
