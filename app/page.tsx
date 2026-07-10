'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Brain,
  Wand2,
  Cpu,
  Star,
  Building2,
  Trophy,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Button, Card, AIBadge } from '@/components/ui';
import { venueTypes, cities, formatCurrency } from '@/lib/utils';
import { GlowingEffect } from '@/components/ui/glowing-effect';

import WatermarkedImage from '@/components/ui/WatermarkedImage';
import { ThreeDPhotoCarousel } from '@/components/ui/3d-carousel';

const heroImages = ['/bg1.jpg', '/bg2.jpg', '/bg3.jpg'];

const venueTypeCards = [
  { label: 'Halls', href: '/venues?q=hall', keyword: 'hall', image: '/img%201%20hall.jpeg' },
  { label: 'Auditoriums', href: '/venues?q=auditorium', keyword: 'auditorium', image: '/img%202%20audi.jpeg' },
  {
    label: 'Rooftops',
    href: '/venues?q=rooftop',
    keyword: 'rooftop',
    image: 'https://piyaatvbigxjqxwyopqj.supabase.co/storage/v1/object/public/venue-images/1778400616815-terrace_1_.jpeg',
  },
  { label: 'Creative Studios', href: '/venues?type=photography-studio', type: 'photography-studio', image: '/Cool Halls and coorporate images/Coorporate campus 2.png' },
  { label: 'Event Spaces', href: '/venues?type=workshop-space', type: 'workshop-space', image: '/img%203%20working%20spaces.jpeg' },
];

// Featured venues (live data)
const featuredVenues = [
  {
    id: 'd69c2cea-ab74-47df-9f73-c1caf7f3f27d',
    name: 'Rooftop In Gurgaon',
    type: 'workshop-space',
    image: 'https://piyaatvbigxjqxwyopqj.supabase.co/storage/v1/object/public/venue-images/1778400616815-terrace_1_.jpeg',
    city: 'Sector 43',
    capacity: 20,
    price: 3000,
    rating: 0,
    reviews: 0,
    aiScore: 95,
  },
  {
    id: '7c37e2e0-3e2c-4b16-9509-cc050ab3a3ad',
    name: 'workshop space',
    type: 'private',
    image: 'https://piyaatvbigxjqxwyopqj.supabase.co/storage/v1/object/public/venue-images/1778325357933-caf2.png',
    city: 'Pritampura',
    capacity: 20,
    price: 2000,
    rating: 0,
    reviews: 0,
    aiScore: 92,
  },
  {
    id: '84c22564-20e6-4545-bc76-7d8f77cf81ae',
    name: '90 Seater Auditorium',
    type: 'auditorium',
    image: 'https://piyaatvbigxjqxwyopqj.supabase.co/storage/v1/object/public/venue-images/1778328484186-preview__6_.jpg',
    city: 'Sector 62',
    capacity: 90,
    price: 10000,
    rating: 0,
    reviews: 0,
    aiScore: 88,
  },
  {
    id: 'dc2d7e2a-5b83-4808-b31e-17e3c553c170',
    name: 'Event Space in Gurgaon',
    type: 'workshop-space',
    image: 'https://piyaatvbigxjqxwyopqj.supabase.co/storage/v1/object/public/venue-images/1778400289688-2_hall_1_.jpeg',
    city: 'Sector 43',
    capacity: 25,
    price: 3500,
    rating: 0,
    reviews: 0,
    aiScore: 94,
  },
];

const stats = [
  { value: '2,500+', label: 'Venues Listed' },
  { value: '15,000+', label: 'Bookings Made' },
  { value: '500+', label: 'Cities Covered' },
  { value: '4.8★', label: 'Average Rating' },
];

const howItWorksSteps = [
  {
    step: '01',
    title: 'Search & Discover',
    description: 'Use our AI-powered search to find venues that match your requirements perfectly.',
  },
  {
    step: '02',
    title: 'Compare & Choose',
    description: 'View detailed information, photos, reviews, and AI suitability scores to make the best choice.',
  },
  {
    step: '03',
    title: 'Book & Confirm',
    description: 'Complete verification, sign the contract, and get instant confirmation.',
  },
];

const features = [
  {
    icon: Cpu,
    title: 'AI-Powered Search',
    description: 'Tell us what you need in plain English. Our AI finds the perfect match.',
  },
  {
    icon: Shield,
    title: 'Verified Venues',
    description: 'Every venue is verified with photos, reviews, and accurate information.',
  },
  {
    icon: Zap,
    title: 'Instant Booking',
    description: 'Book your venue in minutes with our streamlined booking process.',
  },
  {
    icon: Trophy,
    title: 'Best Price Guarantee',
    description: 'Get competitive prices with transparent pricing. No hidden fees.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [venueType, setVenueType] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isAISearching, setIsAISearching] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  useEffect(() => {
    const handleScroll = () => {
      const heroGradient = document.querySelector('.hero-bottom-gradient');
      if (heroGradient) {
        const scrollPosition = window.scrollY;
        // Show gradient only when scrolling (fade in from 0 to 150px scroll)
        if (scrollPosition > 0) {
          (heroGradient as HTMLElement).style.opacity = Math.min(scrollPosition / 150, 1).toString();
        } else {
          (heroGradient as HTMLElement).style.opacity = '0';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call to set correct state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  useEffect(() => {
    const loadCategoryImages = async () => {
      try {
        const res = await fetch('/api/venues');
        const data = await res.json();
        const allVenues: any[] = data?.data || [];

        const images: Record<string, string> = {};
        const usedVenueIds = new Set<string>();

        // Exact-type cards claim their venue first (some types have only one
        // live match), so keyword-based cards don't steal the only candidate.
        const sortedCards = [...venueTypeCards].sort((a, b) => (a.type ? -1 : 0) - (b.type ? -1 : 0));

        for (const card of sortedCards) {
          let candidates: any[] = [];
          if (card.type) {
            candidates = allVenues.filter((v) => v.type === card.type);
          } else if (card.keyword) {
            const kw = card.keyword.toLowerCase();
            candidates = allVenues.filter(
              (v) =>
                v.name?.toLowerCase().includes(kw) ||
                v.description?.toLowerCase().includes(kw) ||
                v.type?.toLowerCase().includes(kw)
            );
          }

          const match = candidates.find((v) => !usedVenueIds.has(v.id)) || candidates[0];
          if (match) {
            usedVenueIds.add(match.id);
            if (match.images?.[0]) images[card.label] = match.images[0];
          }
        }
        setCategoryImages(images);

        const liveGalleryImages = allVenues
          .map((v) => v.images?.[0])
          .filter((src): src is string => Boolean(src))
          .slice(0, 10);
        setGalleryImages(liveGalleryImages);
      } catch (error) {
        // Keep the fallback images for every category
      }
    };

    loadCategoryImages();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (city) params.set('city', city);
    if (venueType) params.set('type', venueType);
    if (capacity) params.set('capacity', capacity);
    router.push(`/venues?${params.toString()}`);
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsAISearching(true);
    try {
      // Parse search query with AI
      const response = await fetch('/api/ai/parse-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      
      const data = await response.json();
      
      if (data.filters) {
        // Build search params from AI-parsed filters
        const params = new URLSearchParams();
        params.set('q', searchQuery);
        params.set('ai', 'true');
        
        if (data.filters.city) params.set('city', data.filters.city);
        if (data.filters.venueType) params.set('type', data.filters.venueType);
        if (data.filters.capacity) params.set('capacity', data.filters.capacity.toString());
        if (data.filters.budget?.max) params.set('maxPrice', data.filters.budget.max.toString());
        if (data.filters.budget?.min) params.set('minPrice', data.filters.budget.min.toString());
        if (data.filters.amenities?.length) params.set('amenities', data.filters.amenities.join(','));
        
        router.push(`/venues?${params.toString()}`);
      } else {
        // Fallback to basic search
        router.push(`/venues?q=${encodeURIComponent(searchQuery)}&ai=true`);
      }
    } catch (error) {
      console.error('AI search error:', error);
      // Fallback to basic search
      router.push(`/venues?q=${encodeURIComponent(searchQuery)}`);
    } finally {
      setIsAISearching(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={currentSlide}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
              <Image
                src={heroImages[currentSlide]}
                alt="Venue background"
                fill
                className="object-cover"
                priority={currentSlide === 0}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
        </div>

        {/* Carousel Arrows */}
        <button
          onClick={goToPrevSlide}
          aria-label="Previous background image"
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={goToNextSlide}
          aria-label="Next background image"
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-left mb-12">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-[2.25rem] md:text-[3.1rem] lg:text-[3.6rem] font-bold leading-[1.1] mb-7">
                <span className="text-white">Find the </span>
                <span className="inline-block bg-[#D7FF3E] text-black px-3 rounded-xl">perfect</span>
                <br />
                <span className="text-white">venue for your</span>
                <br />
                <span className="text-white">next event</span>
              </h1>

              <p className="text-[1.1rem] md:text-[1.32rem] text-gray-200/90 mb-9 max-w-2xl leading-relaxed">
                THE coolest new way to find spaces for ideas, communities and experiences
              </p>
            </motion.div>
          </div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/45" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              {/* AI Search Bar */}
              <GlowingEffect glow spread={46} proximity={160} inactiveZone={0.01} borderWidth={3} disabled={false} />
              <div className="relative mb-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Try: 'Training hall for 50 people in Mumbai with projector and AC'"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-4 text-black placeholder:text-gray-500 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 shadow-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                    />
                  </div>
                  <Button
                    onClick={handleAISearch}
                    size="lg"
                    isLoading={isAISearching}
                    leftIcon={<Brain className="w-5 h-5" />}
                    className="hidden sm:flex shadow-lg !bg-white !text-black hover:!bg-neutral-200"
                  >
                    AI Search
                  </Button>
                </div>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 z-10" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-black/80 border border-white/35 rounded-xl pl-10 pr-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-white shadow-sm"
                  >
                    <option value="">Any City</option>
                    {cities.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 z-10" />
                  <select
                    value={venueType}
                    onChange={(e) => setVenueType(e.target.value)}
                    className="w-full bg-black/80 border border-white/35 rounded-xl pl-10 pr-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-white shadow-sm"
                  >
                    <option value="">Venue Type</option>
                    {venueTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 z-10" />
                  <select
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full bg-black/80 border border-white/35 rounded-xl pl-10 pr-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-white shadow-sm"
                  >
                    <option value="">Capacity</option>
                    <option value="25">Up to 25</option>
                    <option value="50">Up to 50</option>
                    <option value="100">Up to 100</option>
                    <option value="200">Up to 200</option>
                    <option value="500">Up to 500</option>
                    <option value="1000">500+</option>
                  </select>
                </div>

                <Button onClick={handleSearch} size="lg" className="w-full shadow-lg !bg-white !text-black hover:!bg-neutral-200">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <span className="text-[0.625rem] text-gray-400 uppercase tracking-wider">Scroll</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
              <path d="M12 5v14m0 0l-7-7m7 7l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>

        {/* Bottom gradient transition */}
        <div className="hero-bottom-gradient absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent via-black/50 to-background pointer-events-none z-10 opacity-0 transition-opacity duration-300" />
      </section>

      {/* Venue Types Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Explore by <span className="text-primary">Venue Type</span>
            </h2>
            <p className="text-foreground-muted max-w-2xl mx-auto">
              From intimate workshops to grand auditoriums, find the right space for every occasion.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {venueTypeCards.map((type, index) => {
              const imgSrc = categoryImages[type.label] || type.image;
              const isRemoteImage = imgSrc.startsWith('http');
              return (
                <motion.div
                  key={type.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card
                    hover
                    onClick={() => router.push(type.href)}
                    className="group cursor-pointer border-0"
                  >
                    <div className="relative h-40 sm:h-48 lg:h-52">
                      {isRemoteImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgSrc}
                          alt={type.label}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <Image
                          src={imgSrc}
                          alt={type.label}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="px-3 py-3">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                        {type.label}
                      </h3>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Venues */}
      <section className="py-20 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-2">
                Featured <span className="text-primary">Venues</span>
              </h2>
              <p className="text-foreground-muted">
                Top-rated spaces loved by organizers
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push('/venues')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View All
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  hover
                  onClick={() => router.push(`/venues/${venue.id}`)}
                  className="overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <WatermarkedImage
                      src={venue.image}
                      alt={venue.name}
                      className="w-full h-full"
                      imageClassName="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <AIBadge score={venue.aiScore} size="sm" />
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium text-white">{venue.rating}</span>
                      <span className="text-xs text-white/70">({venue.reviews})</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-foreground-muted mt-1">
                      <MapPin className="w-3 h-3" />
                      {venue.city}
                      <span className="mx-1">•</span>
                      <Users className="w-3 h-3" />
                      {venue.capacity}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(venue.price)}
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
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Steps */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">How It Works</h2>
              <div>
                {howItWorksSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15, duration: 0.5 }}
                    className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-black mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 pt-1">{item.step}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 3D rotating visual */}
            {galleryImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <ThreeDPhotoCarousel images={galleryImages} />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-white">
              Why Choose ShiftsDeal
            </h2>
            <p className="text-foreground-muted max-w-2xl mx-auto">
              We make venue booking as easy as booking a hotel room
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {features.map((feature, index) => {
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="relative cursor-pointer bg-[#111111] border border-white/15 rounded-2xl p-5 md:p-6"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  <GlowingEffect
                    glow
                    spread={34}
                    proximity={80}
                    inactiveZone={0.02}
                    borderWidth={2}
                    disabled={false}
                  />
                  <h3 className="text-3xl font-bold text-white/40 mb-4">0{index + 1}</h3>
                  <h4 className="text-2xl font-semibold text-white mb-3 leading-tight">{feature.title}</h4>
                  <p className="text-white/70 text-lg leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background relative overflow-hidden">
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Ready to Find Your <span className="text-primary">Perfect Venue</span>?
            </h2>
            <p className="text-lg text-foreground-muted mb-8 max-w-2xl mx-auto">
              Join thousands of organizers who trust ShiftsDeal for their events. 
              Start your search today and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="xl"
                onClick={() => router.push('/venues')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Start Searching
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => router.push('/list-venue')}
              >
                List Your Venue
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
