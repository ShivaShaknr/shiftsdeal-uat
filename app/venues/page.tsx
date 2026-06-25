'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  Filter,
  X,
  Star,
  SlidersHorizontal,
  Grid3X3,
  Map,
  ChevronDown,
  Brain,
} from 'lucide-react';
import { Button, Card, AIBadge, Badge, VenueCardSkeleton, VenueMap } from '@/components/ui';
import { venueTypes, cities, formatCurrency, amenitiesList, cn } from '@/lib/utils';

function VenuesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const [venues, setVenues] = useState<any[]>([]);

  // AI Search - one-time from homepage
  const originalAIQuery = searchParams.get('ai') === 'true' ? searchParams.get('q') || '' : '';
  const [isAISearch, setIsAISearch] = useState(!!originalAIQuery);
  const [userHasTakenOver, setUserHasTakenOver] = useState(false);

  // Filter states - search bar is for local client-side filtering only (always starts empty)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedCapacity, setSelectedCapacity] = useState(searchParams.get('capacity') || '');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('minPrice') || '0'),
    parseInt(searchParams.get('maxPrice') || '200000')
  ]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    // Fetch venues from API
    const fetchVenues = async () => {
      try {
        console.log('🔍 Fetching venues from API...');
        const response = await fetch('/api/venues');
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log(`✅ Loaded ${result.data.length} venues from database`);
          setVenues(result.data);
        } else {
          console.error('❌ Failed to load venues:', result.error);
        }
      } catch (error) {
        console.error('❌ Error fetching venues:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // Filter venues based on selected filters
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          venue.name.toLowerCase().includes(query) ||
          venue.description.toLowerCase().includes(query) ||
          venue.address.city.toLowerCase().includes(query) ||
          venue.type.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // City filter
      if (selectedCity && venue.address.city.toLowerCase() !== selectedCity.toLowerCase()) return false;

      // Type filter
      if (selectedType && venue.type !== selectedType) return false;

      // Capacity filter
      if (selectedCapacity) {
        const capacity = parseInt(selectedCapacity);
        if (venue.capacity.max < capacity) return false;
      }

      // Price filter
      const venuePrice = venue.pricing.fullDay || 0;
      if (venuePrice < priceRange[0] || venuePrice > priceRange[1]) return false;

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every((amenity) =>
          venue.amenities.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  }, [venues, searchQuery, selectedCity, selectedType, selectedCapacity, priceRange, selectedAmenities]);

  // Sort venues
  const sortedVenues = useMemo(() => {
    const sorted = [...filteredVenues];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.pricing.fullDay || 0) - (b.pricing.fullDay || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.pricing.fullDay || 0) - (a.pricing.fullDay || 0));
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'capacity':
        return sorted.sort((a, b) => b.capacity.max - a.capacity.max);
      case 'recommended':
      default:
        return sorted.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    }
  }, [filteredVenues, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedType('');
    setSelectedCapacity('');
    setPriceRange([0, 200000]);
    setSelectedAmenities([]);
    setUserHasTakenOver(true);
  };

  const hasActiveFilters = searchQuery || selectedCity || selectedType || selectedCapacity || selectedAmenities.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* AI Search Banner - Only shows original AI query, hides when user takes over */}
      {isAISearch && originalAIQuery && !userHasTakenOver && (
        <div className="sticky top-16 z-40 bg-primary/10 border-b border-primary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    AI-Powered Search Active
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Results optimized for: "{originalAIQuery}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserHasTakenOver(true)}
                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Header - Local filtering only, no API calls */}
      <div className="sticky top-16 z-30 bg-background-light border-b border-border" style={{ top: isAISearch && originalAIQuery && !userHasTakenOver ? '72px' : '64px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Refine your search further..."
                className="w-full bg-background-card border border-border rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setUserHasTakenOver(true);
                }}
                className="bg-background-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.value} value={city.value}>{city.label}</option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setUserHasTakenOver(true);
                }}
                className="bg-background-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary hidden sm:block"
              >
                <option value="">All Types</option>
                {venueTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>

              <div className="hidden sm:flex border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-3 transition-colors',
                    viewMode === 'grid' ? 'bg-primary text-background' : 'bg-background-card text-foreground-muted hover:text-foreground'
                  )}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={cn(
                    'p-3 transition-colors',
                    viewMode === 'map' ? 'bg-primary text-background' : 'bg-background-card text-foreground-muted hover:text-foreground'
                  )}
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-background-card border-b border-border overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Capacity
                  </label>
                  <select
                    value={selectedCapacity}
                    onChange={(e) => {
                      setSelectedCapacity(e.target.value);
                      setUserHasTakenOver(true);
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Any capacity</option>
                    <option value="25">Up to 25 people</option>
                    <option value="50">Up to 50 people</option>
                    <option value="100">Up to 100 people</option>
                    <option value="200">Up to 200 people</option>
                    <option value="500">Up to 500 people</option>
                    <option value="1000">500+ people</option>
                  </select>
                </div>

                {/* Venue Type (Mobile) */}
                <div className="sm:hidden">
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Venue Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">All types</option>
                    {venueTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-foreground-muted mb-2">
                    Price Range (per day): {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      step="5000"
                      value={priceRange[0]}
                      onChange={(e) => {
                        setPriceRange([parseInt(e.target.value), priceRange[1]]);
                        setUserHasTakenOver(true);
                      }}
                      className="flex-1 accent-primary"
                    />
                    <input
                      type="range"
                      min="0"
                      max="200000"
                      step="5000"
                      value={priceRange[1]}
                      onChange={(e) => {
                        setPriceRange([priceRange[0], parseInt(e.target.value)]);
                        setUserHasTakenOver(true);
                      }}
                      className="flex-1 accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground-muted mb-3">
                  Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => {
                        setSelectedAmenities((prev) =>
                          prev.includes(amenity)
                            ? prev.filter((a) => a !== amenity)
                            : [...prev, amenity]
                        );
                        setUserHasTakenOver(true);
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm border transition-all',
                        selectedAmenities.includes(amenity)
                          ? 'bg-primary text-background border-primary'
                          : 'bg-background border-border text-foreground-muted hover:border-foreground-muted'
                      )}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isLoading ? (
                <span className="skeleton inline-block w-48 h-8 rounded" />
              ) : (
                <>
                  {sortedVenues.length} venue{sortedVenues.length !== 1 ? 's' : ''} found
                </>
              )}
            </h1>
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCity && (
                  <Badge variant="primary">
                    {selectedCity}
                    <button onClick={() => {
                      setSelectedCity('');
                      setUserHasTakenOver(true);
                    }} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedType && (
                  <Badge variant="primary">
                    {venueTypes.find((t) => t.value === selectedType)?.label}
                    <button onClick={() => {
                      setSelectedType('');
                      setUserHasTakenOver(true);
                    }} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedCapacity && (
                  <Badge variant="primary">
                    Up to {selectedCapacity} people
                    <button onClick={() => {
                      setSelectedCapacity('');
                      setUserHasTakenOver(true);
                    }} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-muted hidden sm:block">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-background-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="recommended">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="capacity">Largest Capacity</option>
            </select>
          </div>
        </div>

        {/* Venue Grid */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              [...Array(8)].map((_, i) => <VenueCardSkeleton key={i} />)
            ) : sortedVenues.length > 0 ? (
              sortedVenues.map((venue, index) => (
                <motion.div
                  key={venue._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hover
                    onClick={() => router.push(`/venues/${venue._id}`)}
                    className="overflow-hidden group"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={venue.images[0]}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {venue.aiScore && venue.aiScore >= 90 && (
                        <div className="absolute top-3 right-3">
                          <AIBadge score={venue.aiScore} size="sm" />
                        </div>
                      )}
                      {venue.isVerified && (
                        <div className="absolute top-3 left-3">
                          <Badge variant="success" size="sm">Verified</Badge>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-medium text-white">{venue.rating}</span>
                        <span className="text-xs text-white/70">({venue.reviewCount})</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {venue.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-foreground-muted mt-1">
                        <MapPin className="w-3 h-3" />
                        {venue.address.city}
                        <span className="mx-1">•</span>
                        <Users className="w-3 h-3" />
                        {venue.capacity.min}-{venue.capacity.max}
                      </div>
                      <p className="text-xs text-foreground-muted mt-2 line-clamp-2">
                        {venue.description}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(venue.pricing.hourly || 0)}
                          </span>
                          <span className="text-xs text-foreground-muted">/hour</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-background-light rounded-full text-foreground-muted capitalize">
                          {venue.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background-card flex items-center justify-center">
                  <Search className="w-8 h-8 text-foreground-muted" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No venues found</h3>
                <p className="text-foreground-muted mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-250px)]">
            {/* Venue List - Airbnb style square cards */}
            <div className="overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                {sortedVenues.map((venue) => (
                  <Card
                    key={venue._id}
                    hover
                    onClick={() => router.push(`/venues/${venue._id}`)}
                    className="overflow-hidden group cursor-pointer"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={venue.images[0]}
                        alt={venue.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {venue.aiScore && venue.aiScore >= 90 && (
                        <div className="absolute top-2 right-2">
                          <AIBadge score={venue.aiScore} size="sm" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-medium text-white">{venue.rating}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                        {venue.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-foreground-muted mt-1">
                        <MapPin className="w-3 h-3" />
                        {venue.address.city}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(venue.pricing.hourly || 0)}
                          <span className="text-xs text-foreground-muted font-normal">/hr</span>
                        </span>
                        <span className="text-xs text-foreground-muted">
                          {venue.capacity.max} guests
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Mapbox Map */}
            <VenueMap
              venues={sortedVenues}
              onVenueClick={(venueId) => router.push(`/venues/${venueId}`)}
              className="h-full min-h-[400px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <VenueCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <VenuesPageContent />
    </Suspense>
  );
}
