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

const RotatingText = () => {
  const words = ['Events', 'Meetings', 'Seminars', 'Sessions', 'Trainings'];
  const colors = ['#5ce1e6', '#f45500', '#c0fa27', '#bc674e'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block relative w-[200px] md:w-[350px] lg:w-[450px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="inline-block font-[family-name:var(--font-caveat)] text-[1.3em] md:text-[1.3em] lg:text-[1.3em] text-5xl md:text-8xl lg:text-9xl drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          style={{ color: colors[index % colors.length] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-[50%]" viewBox="0 0 400 12" fill="none" preserveAspectRatio="none">
        <motion.path 
          d="M3 9C80 3 200 1 397 8" 
          stroke="#ffffff" 
          strokeWidth="4" 
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      </svg>
    </span>
  );
};

const Spotlight = ({
  initialX,
  initialY,
  animateX,
  animateY,
  duration = 10,
  delay = 0
}: {
  initialX: string;
  initialY: string;
  animateX: string[];
  animateY: string[];
  duration?: number;
  delay?: number;
}) => {
  return (
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full pointer-events-none z-[1] mix-blend-screen"
      style={{
        background: 'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)',
        filter: 'blur(80px)',
        top: 0,
        left: 0,
      }}
      initial={{ x: initialX, y: initialY, opacity: 0 }}
      animate={{
        x: animateX,
        y: animateY,
        scale: [1, 1.2, 0.9, 1],
        opacity: [1, 1, 1],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay,
      }}
    />
  );
};

// Featured venues (dummy data)
const featuredVenues = [
  {
    id: '1',
    name: 'Grand Business Hub',
    type: 'conference-room',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
    city: 'Mumbai',
    capacity: 200,
    price: 45000,
    rating: 4.9,
    reviews: 128,
    aiScore: 95,
  },
  {
    id: '2',
    name: 'Skyline Training Center',
    type: 'training-hall',
    image: 'https://images.unsplash.com/photo-1560439514-4e9645039924?w=800',
    city: 'Bangalore',
    capacity: 100,
    price: 28000,
    rating: 4.8,
    reviews: 89,
    aiScore: 92,
  },
  {
    id: '3',
    name: 'Heritage Auditorium',
    type: 'auditorium',
    image: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800',
    city: 'Delhi',
    capacity: 500,
    price: 85000,
    rating: 4.7,
    reviews: 156,
    aiScore: 88,
  },
  {
    id: '4',
    name: 'Innovation Workshop Lab',
    type: 'workshop-space',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    city: 'Pune',
    capacity: 50,
    price: 15000,
    rating: 4.9,
    reviews: 67,
    aiScore: 94,
  },
];

const stats = [
  { value: '2,500+', label: 'Venues Listed' },
  { value: '15,000+', label: 'Bookings Made' },
  { value: '500+', label: 'Cities Covered' },
  { value: '4.8★', label: 'Average Rating' },
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
        {/* Background Image */}
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <Image
            src="/Cool Halls and coorporate images/Dark aesthetic hall.png"
            alt="Auditorium"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/75 to-black/85" />
        </motion.div>
        
        {/* Ambient Spotlights */}
        <Spotlight 
          initialX="-20vw" 
          initialY="-15vh" 
          animateX={["-20vw", "50vw", "110vw", "30vw", "-10vw"]} 
          animateY={["-10vh", "30vh", "60vh", "20vh", "-5vh"]}
          duration={10}
        />
        <Spotlight 
          initialX="70vw" 
          initialY="90vh" 
          animateX={["70vw", "30vw", "-15vw", "60vw", "110vw"]} 
          animateY={["90vh", "40vh", "25vh", "70vh", "90vh"]}
          duration={10}
          delay={2}
        />
        <Spotlight 
          initialX="30vw" 
          initialY="30vh" 
          animateX={["30vw", "80vw", "-20vw", "50vw", "30vw"]} 
          animateY={["30vh", "-5vh", "55vh", "85vh", "30vh"]}
          duration={10}
          delay={5}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            {/* Hero Text with Rotating Words */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-[2.75rem] md:text-[3.85rem] lg:text-[4.4rem] font-bold leading-[1.1] mb-7">
                <span className="text-white">Find Your Ideal Space</span>
                <br />
                <span className="text-white ml-9 md:ml-[4.4rem] lg:ml-[12.5rem]">perfect for </span>
                <RotatingText />
              </h1>
              
              <p className="text-[1.1rem] md:text-[1.32rem] text-gray-300/90 mb-9 max-w-2xl mx-auto leading-relaxed">
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
                    <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Try: 'Training hall for 50 people in Mumbai with projector and AC'"
                      className="w-full bg-black/80 border border-white/40 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-white/50 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 shadow-sm"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { value: 'training-hall', label: 'Halls', image: '/img%201%20hall.jpeg' },
              { value: 'auditorium', label: 'Auditoriums', image: '/img%202%20audi.jpeg' },
              { value: 'workshop-space', label: 'Working Spaces', image: '/img%203%20working%20spaces.jpeg' },
            ].map((type, index) => (
              <motion.div
                key={type.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  hover
                  onClick={() => router.push(`/venues?type=${type.value}`)}
                  className="relative p-8 text-center group border-2 border-border overflow-hidden h-56 flex flex-col items-center justify-center cursor-pointer"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 opacity-70 group-hover:opacity-90 transition-all duration-500">
                    <Image
                      src={type.image}
                      alt={type.label}
                      fill
                      className="object-cover group-hover:scale-110 transition-all duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/60 group-hover:via-black/20 group-hover:to-transparent transition-all duration-500" />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors text-2xl drop-shadow-lg">
                      {type.label}
                    </h3>
                  </div>
                </Card>
              </motion.div>
            ))}
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
                    <img
                      src={venue.image}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
      <section className="py-12 md:py-14 bg-background-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-auto py-8 md:py-10 rounded-3xl border border-border bg-background overflow-hidden">
            <div className="relative z-20 w-full max-w-6xl px-4 sm:px-8 mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-7 md:mb-8"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
                <p className="text-foreground-muted max-w-2xl mx-auto mt-4">
                  Book your perfect venue in three simple steps
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                {[
                  {
                    step: '01',
                    title: 'Search & Discover',
                    description: 'Use our AI-powered search to find venues that match your requirements perfectly.',
                    order: 1,
                  },
                  {
                    step: '02',
                    title: 'Compare & Choose',
                    description: 'View detailed information, photos, reviews, and AI suitability scores to make the best choice.',
                    order: 2,
                  },
                  {
                    step: '03',
                    title: 'Book & Confirm',
                    description: 'Complete verification, sign the contract, and get instant confirmation.',
                    order: 3,
                  },
                ].map((item, index) => {
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.12 }}
                      style={{ order: item.order }}
                      className="relative cursor-pointer rounded-2xl px-5 py-6 text-left bg-background-card border border-border text-foreground"
                    >
                      <GlowingEffect glow spread={46} proximity={140} inactiveZone={0.01} borderWidth={3} disabled={false} />
                      <p className="text-sm font-bold mb-3 text-foreground-muted">{item.step}</p>
                      <h3 className="text-2xl font-semibold mb-3 text-foreground">{item.title}</h3>
                      <p className="leading-relaxed text-foreground-muted">{item.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
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
