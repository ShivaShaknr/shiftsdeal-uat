'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Users,
  Star,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Brain,
  Target,
  Heart,
  Share2,
  Phone,
  Mail,
  Shield,
  Info,
  X,
} from 'lucide-react';
import { Button, Card, AIBadge, Badge, Modal, VenueDetailSkeleton, VenueMap } from '@/components/ui';
import { formatCurrency, formatTime, cn, amenitiesList } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';

export default function VenueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [venue, setVenue] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userRequirements, setUserRequirements] = useState({
    eventName: '',
    eventType: '',
    eventDate: '',
    attendees: '',
    budget: '',
    requiredAmenities: [] as string[],
    specialRequirements: '',
  });

  // Get ownerId from search params
  const searchParams = useSearchParams();

  useEffect(() => {
    const ownerId = searchParams.get("ownerId");

    if (ownerId) {
      console.log("owner referred", ownerId);
      sessionStorage.setItem("ownerId", ownerId);
      sessionStorage.setItem("isOwnerReferred", "true");
      sessionStorage.setItem("venueId", id as string);
    } else {
      console.log("owner not referred, normal user");
      sessionStorage.removeItem("ownerId");
      sessionStorage.removeItem("isOwnerReferred");
      sessionStorage.removeItem("venueId");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchVenue = async () => {
      console.log('🔍 Fetching venue from API:', id);
      setIsLoading(true);
      try {
        const response = await fetch(`/api/venues/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Loaded venue from database:', result.data.title);
          setVenue(result.data);
        } else {
          console.error('❌ Failed to load venue:', result.error);
        }
      } catch (error) {
        console.error('❌ Error fetching venue:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchVenue();
    }
  }, [id]);

  const nextImage = () => {
    if (venue) {
      setCurrentImageIndex((prev) => (prev + 1) % venue.images.length);
    }
  };

  const prevImage = () => {
    if (venue) {
      setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length);
    }
  };

  const validateBookingForm = () => {
    // Only validate if values are provided (nothing is required on this page)
    
    // Validate attendees only if entered
    if (userRequirements.attendees) {
      const attendeeCount = parseInt(userRequirements.attendees);
      if (isNaN(attendeeCount) || attendeeCount <= 0) {
        alert('Number of attendees must be greater than 0');
        return false;
      }

      if (venue && attendeeCount > venue.capacity.max) {
        alert(`Number of attendees (${attendeeCount}) exceeds venue capacity (${venue.capacity.max})`);
        return false;
      }
    }

    // Validate date only if provided
    if (userRequirements.eventDate) {
      const selectedDate = new Date(userRequirements.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        alert('Event date cannot be in the past');
        return false;
      }
    }

    return true;
  };

  const analyzeVenue = async () => {
    if (!venue) return;
    
    // Basic validation for AI analysis (need at least event type and attendees)
    if (!userRequirements.eventType || !userRequirements.attendees) {
      alert('Please fill in event type and number of attendees for AI analysis');
      return;
    }
    
    // Validate the values if provided
    if (!validateBookingForm()) {
      return;
    }

    setIsAnalyzing(true);
    setShowAIAnalysis(true);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue: {
            name: venue.name,
            type: venue.type,
            description: venue.description,
            capacity: venue.capacity,
            amenities: venue.amenities,
            pricing: venue.pricing,
            rating: venue.rating,
            location: venue.address,
            availability: venue.availability,
          },
          requirements: {
            eventName: userRequirements.eventName,
            eventType: userRequirements.eventType,
            eventDate: userRequirements.eventDate,
            attendees: parseInt(userRequirements.attendees) || 0,
            budget: userRequirements.budget ? parseInt(userRequirements.budget) : null,
            requiredAmenities: userRequirements.requiredAmenities,
            specialRequirements: userRequirements.specialRequirements,
          },
        }),
      });

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAiAnalysis({
          score: data.analysis.suitabilityScore,
          summary: data.analysis.summary,
          strengths: data.analysis.strengths,
          weaknesses: data.analysis.weaknesses,
          recommendation: data.analysis.recommendation,
          capacityAnalysis: data.analysis.capacityAnalysis,
          amenitiesAnalysis: data.analysis.amenitiesAnalysis,
          budgetAnalysis: data.analysis.budgetAnalysis,
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to basic analysis
      setAiAnalysis({
        score: venue.aiScore || 85,
        summary: `${venue.name} is a well-equipped venue suitable for various professional events.`,
        strengths: ['Good facilities', 'Professional setting', 'Convenient location'],
        weaknesses: ['Limited availability during peak seasons'],
        recommendation: 'Suitable for your event. Book early to secure your preferred date.',
        capacityAnalysis: `Venue can accommodate various group sizes comfortably.`,
        amenitiesAnalysis: 'Standard amenities available for professional events.',
        budgetAnalysis: 'Pricing is competitive for the quality and location offered.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <VenueDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Venue Not Found</h1>
          <p className="text-foreground-muted mb-4">The venue you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/venues')}>Browse Venues</Button>
        </div>
      </div>
    );
  }

  const reviews = [
    {
      id: 1,
      author: 'Rahul S.',
      rating: 5,
      date: 'Dec 2024',
      comment: 'Excellent venue with top-notch facilities. The staff was very professional and helped us set up everything perfectly.',
    },
    {
      id: 2,
      author: 'Priya M.',
      rating: 4,
      date: 'Nov 2024',
      comment: 'Great space for our corporate training. The AV equipment worked flawlessly. Only wish parking was easier.',
    },
    {
      id: 3,
      author: 'Amit K.',
      rating: 5,
      date: 'Nov 2024',
      comment: 'Used this venue for our annual conference. The team was super accommodating with our last-minute changes.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Image Gallery */}
      <div className="relative h-[50vh] lg:h-[60vh] bg-background-card overflow-hidden">
        <motion.img
          key={currentImageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          src={venue.images[currentImageIndex]}
          alt={venue.name}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows */}
        {venue.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Image Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {venue.images.map((_img: string, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentImageIndex ? 'w-8 bg-primary' : 'bg-white/50 hover:bg-white/70'
              )}
            />
          ))}
        </div>

        {/* View All Button */}
        <button
          onClick={() => setShowAllImages(true)}
          className="absolute bottom-4 right-4 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white text-sm hover:bg-black/70 transition-colors"
        >
          View all {venue.images.length} photos
        </button>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              'w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors',
              isLiked ? 'bg-error text-white' : 'bg-black/50 text-white hover:bg-black/70'
            )}
          >
            <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {venue.isVerified && <Badge variant="success">Verified</Badge>}
                <Badge>{venue.type.replace('-', ' ')}</Badge>
                {venue.aiScore && venue.aiScore >= 90 && (
                  <AIBadge score={venue.aiScore} label="AI Top Pick" />
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{venue.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-foreground-muted">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venue.address.street}, {venue.address.city}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-foreground">{venue.rating}</span>
                  <span>({venue.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {venue.capacity.min}-{venue.capacity.max} people
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">About This Venue</h2>
              <p className="text-foreground-muted leading-relaxed">{venue.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {venue.amenities.map((amenity: string) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 p-3 bg-background-card rounded-xl border border-border"
                  >
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Map */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Location</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">{venue.address.street}</p>
                    <p className="text-foreground-muted">{venue.address.city}, {venue.address.state} {venue.address.pincode}</p>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border border-border">
                  <VenueMap
                    venues={[venue]}
                    className="h-[400px]"
                  />
                </div>
                <p className="text-sm text-foreground-muted">
                  Exact location will be provided after booking confirmation
                </p>
              </div>
            </div>

            {/* Availability */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Availability</h2>
              <Card className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                    (day) => (
                      <span
                        key={day}
                        className={cn(
                          'px-3 py-1 rounded-full text-sm',
                          venue.availability.days.includes(day)
                            ? 'bg-primary/10 text-primary'
                            : 'bg-background-light text-foreground-muted'
                        )}
                      >
                        {day.slice(0, 3)}
                      </span>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatTime(venue.availability.startTime)} - {formatTime(venue.availability.endTime)}
                  </span>
                </div>
              </Card>
            </div>

            {/* Rules */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Venue Rules</h2>
              <div className="space-y-2">
                {venue.rules.map((rule: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-foreground-muted mt-0.5" />
                    <span className="text-foreground-muted">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews - Only show if venue has reviews */}
            {venue.reviewsCount > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            {review.author[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{review.author}</p>
                            <p className="text-xs text-foreground-muted">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < review.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-foreground-muted'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-foreground-muted">{review.comment}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(venue.pricing.hourly || 0)}
                    </span>
                    <span className="text-foreground-muted">/hour</span>
                  </div>
                  <div className="flex gap-4 text-sm text-foreground-muted">
                    {venue.pricing.halfDay && (
                      <span>{formatCurrency(venue.pricing.halfDay)} /4 hours</span>
                    )}
                    {venue.pricing.fullDay && (
                      <span>{formatCurrency(venue.pricing.fullDay)} /8 hours</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Event Type <span className="text-error">*</span>
                    </label>
                    <select
                      value={userRequirements.eventType}
                      onChange={(e) => setUserRequirements({ ...userRequirements, eventType: e.target.value })}
                      className="w-full bg-background-light border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select event type</option>
                      <option value="training">Training Session</option>
                      <option value="conference">Conference</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="meeting">Corporate Meeting</option>
                      <option value="product-launch">Product Launch</option>
                      <option value="team-building">Team Building</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Event Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={userRequirements.eventDate}
                        onChange={(e) => setUserRequirements({ ...userRequirements, eventDate: e.target.value })}
                        className="w-full bg-background-light border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Number of Attendees <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                      <input
                        type="number"
                        placeholder="Enter attendees"
                        value={userRequirements.attendees}
                        onChange={(e) => setUserRequirements({ ...userRequirements, attendees: e.target.value })}
                        min={venue.capacity.min}
                        max={venue.capacity.max}
                        className="w-full bg-background-light border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <p className="text-xs text-foreground-muted mt-1">
                      Capacity: {venue.capacity.min}-{venue.capacity.max} people
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Required Amenities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.slice(0, 6).map((amenity) => (
                        <button
                          key={amenity}
                          onClick={() => {
                            setUserRequirements({
                              ...userRequirements,
                              requiredAmenities: userRequirements.requiredAmenities.includes(amenity)
                                ? userRequirements.requiredAmenities.filter(a => a !== amenity)
                                : [...userRequirements.requiredAmenities, amenity]
                            });
                          }}
                          className={cn(
                            'px-2 py-1 rounded-lg text-xs border transition-all',
                            userRequirements.requiredAmenities.includes(amenity)
                              ? 'bg-primary text-background border-primary'
                              : 'bg-background border-border text-foreground-muted hover:border-foreground-muted'
                          )}
                        >
                          {amenity}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2">
                      Special Requirements
                    </label>
                    <textarea
                      value={userRequirements.specialRequirements}
                      onChange={(e) => setUserRequirements({ ...userRequirements, specialRequirements: e.target.value })}
                      placeholder="Any specific needs..."
                      rows={2}
                      className="w-full bg-background-light border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary resize-none text-sm"
                    />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full mb-3"
                  onClick={analyzeVenue}
                  isLoading={isAnalyzing}
                  leftIcon={<Brain className="w-4 h-4" />}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Check Suitability'}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full mb-4"
                  onClick={() => {
                    // Check if user is logged in
                    if (!user) {
                      // Store current venue URL for redirect after login
                      const currentUrl = `/venues/${venue._id}`;
                      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
                      return;
                    }
                    
                    // Only validate if values are provided (allow proceeding with empty form)
                    if (userRequirements.attendees || userRequirements.eventDate) {
                      if (!validateBookingForm()) {
                        return;
                      }
                    }
                    
                    // Store user requirements for autofill on booking page
                    localStorage.setItem('bookingPreFill', JSON.stringify({
                      eventType: userRequirements.eventType,
                      eventDate: userRequirements.eventDate,
                      attendees: userRequirements.attendees,
                      requiredAmenities: userRequirements.requiredAmenities,
                      specialRequirements: userRequirements.specialRequirements,
                      eventName: userRequirements.eventName,
                    }));
                    router.push(`/book/${venue._id}`);
                  }}
                >
                  {user ? 'Book This Venue' : 'Sign In to Book'}
                </Button>

                <p className="text-xs text-center text-foreground-muted">
                  You won't be charged yet. Review booking details first.
                </p>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-foreground-muted mb-3">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Secure booking protected by ShiftsDeal</span>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <Modal
        isOpen={showAIAnalysis}
        onClose={() => setShowAIAnalysis(false)}
        title="AI Venue Analysis"
        size="lg"
      >
        <div className="p-4 sm:p-6">
          {isAnalyzing ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Analyzing Venue...</h3>
              <p className="text-foreground-muted">
                Our AI is evaluating this venue based on your requirements
              </p>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-4">
              {/* Score */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl ai-glow">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-primary">{aiAnalysis.score}%</span>
                  <span className="text-sm text-foreground-muted">Match</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <p className="text-sm text-foreground-muted text-center">{aiAnalysis.summary}</p>
              </div>

              {/* Detailed Analysis Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3">
                  <h5 className="text-xs font-medium text-foreground-muted mb-1">Capacity</h5>
                  <p className="text-xs text-foreground">{aiAnalysis.capacityAnalysis}</p>
                </Card>
                <Card className="p-3">
                  <h5 className="text-xs font-medium text-foreground-muted mb-1">Amenities</h5>
                  <p className="text-xs text-foreground">{aiAnalysis.amenitiesAnalysis}</p>
                </Card>
                <Card className="p-3">
                  <h5 className="text-xs font-medium text-foreground-muted mb-1">Budget</h5>
                  <p className="text-xs text-foreground">{aiAnalysis.budgetAnalysis}</p>
                </Card>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-success" />
                    Strengths
                  </h4>
                  <ul className="space-y-1.5">
                    {aiAnalysis?.strengths?.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-1.5 text-xs text-foreground-muted">
                        <Check className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-warning" />
                    Considerations
                  </h4>
                  <ul className="space-y-1.5">
                    {aiAnalysis?.weaknesses?.map((weakness: string, index: number) => (
                      <li key={index} className="flex items-start gap-1.5 text-xs text-foreground-muted">
                        <Info className="w-3 h-3 text-warning mt-0.5 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation */}
              <Card className="p-3 bg-primary/5 border-primary/20">
                <h4 className="text-sm font-semibold text-foreground mb-1">AI Recommendation</h4>
                <p className="text-xs text-foreground-muted">{aiAnalysis?.recommendation}</p>
              </Card>

              <div className="flex gap-2 sticky bottom-0 bg-background-card pt-3 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-1">
                <Button className="flex-1" onClick={() => {
                  // Store user requirements for autofill on booking page
                  localStorage.setItem('bookingPreFill', JSON.stringify({
                    eventType: userRequirements.eventType,
                    eventDate: userRequirements.eventDate,
                    attendees: userRequirements.attendees,
                    requiredAmenities: userRequirements.requiredAmenities,
                    specialRequirements: userRequirements.specialRequirements,
                    eventName: userRequirements.eventName,
                  }));
                  router.push(`/book/${venue._id}`);
                }}>
                  Proceed to Book
                </Button>
                <Button variant="outline" onClick={() => setShowAIAnalysis(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* All Images Modal */}
      <Modal
        isOpen={showAllImages}
        onClose={() => setShowAllImages(false)}
        title="All Photos"
        size="xl"
      >
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {venue.images.map((image: string, index: number) => (
              <motion.img
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                src={image}
                alt={`${venue.name} ${index + 1}`}
                className="w-full h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setCurrentImageIndex(index);
                  setShowAllImages(false);
                }}
              />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
