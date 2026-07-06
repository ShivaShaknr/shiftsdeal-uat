'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  MapPin,
  Camera,
  IndianRupee,
  Settings,
  Upload,
  Plus,
  X,
  Info,
  Loader2,
  AlertCircle,
  LogIn,
  Mail,
  Lock,
  User,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';
import { venueTypes, cities, amenities, cn } from '@/lib/utils';

type OnboardingStep = 'auth' | 'basics' | 'location' | 'photos' | 'pricing' | 'amenities' | 'review';

const steps: { id: OnboardingStep; label: string; icon: any }[] = [
  { id: 'basics', label: 'Basics', icon: Building2 },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'pricing', label: 'Pricing', icon: IndianRupee },
  { id: 'amenities', label: 'Amenities', icon: Settings },
  { id: 'review', label: 'Review', icon: Check },
];

export default function VenueOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signInWithGoogle, signIn, signUp, updateUserRole } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    minCapacity: '',
    maxCapacity: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    photos: [] as string[],
    hourlyRate: '',
    halfDayRate: '',
    fullDayRate: '',
    securityDeposit: '',
    selectedAmenities: [] as string[],
    rules: ['No smoking inside the venue', 'Decorations must be approved in advance'],
  });

  // Check auth status and redirect to basics if logged in
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        setCurrentStep('basics');
      } else {
        setCurrentStep('auth');
      }
    }
  }, [user, authLoading]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter((a) => a !== amenity)
        : [...prev.selectedAmenities, amenity],
    }));
  };

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, ''],
    }));
  };

  const updateRule = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? value : r)),
    }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload photos to Supabase storage
  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is too large. Max size is 5MB.`);
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const response = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucket: 'venue-images',
            fileName,
            file: base64,
          }),
        });

        const result = await response.json();

        if (result.success && result.data?.publicUrl) {
          uploadedUrls.push(result.data.publicUrl);
        } else {
          console.error('Upload failed:', result.error);
          setError(result.error || 'Failed to upload photo');
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...uploadedUrls],
        }));
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (): boolean => {
    setError(null);

    switch (currentStep) {
      case 'basics':
        if (!formData.name.trim()) {
          setError('Venue name is required');
          return false;
        }
        if (!formData.type) {
          setError('Venue type is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Description is required');
          return false;
        }
        if (!formData.minCapacity || !formData.maxCapacity) {
          setError('Capacity range is required');
          return false;
        }
        if (parseInt(formData.minCapacity) > parseInt(formData.maxCapacity)) {
          setError('Minimum capacity cannot be greater than maximum');
          return false;
        }
        break;

      case 'location':
        if (!formData.address.trim()) {
          setError('Street address is required');
          return false;
        }
        if (!formData.city) {
          setError('City is required');
          return false;
        }
        if (!formData.state.trim()) {
          setError('State is required');
          return false;
        }
        if (!formData.pincode.trim() || formData.pincode.length !== 6) {
          setError('Valid 6-digit PIN code is required');
          return false;
        }
        break;

      case 'photos':
        if (formData.photos.length < 3) {
          setError('Please upload at least 3 photos');
          return false;
        }
        break;

      case 'pricing':
        if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
          setError('Hourly rate is required');
          return false;
        }
        break;

      case 'amenities':
        // Optional step
        break;
    }

    return true;
  };

  const goToNextStep = () => {
    if (!validateStep()) return;

    const stepOrder: OnboardingStep[] = ['basics', 'location', 'photos', 'pricing', 'amenities', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: OnboardingStep[] = ['basics', 'location', 'photos', 'pricing', 'amenities', 'review'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to submit');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const venueRequestData = {
        owner_id: user.id,
        name: formData.name,
        type: formData.type,
        description: formData.description,
        capacity_min: formData.minCapacity,
        capacity_max: formData.maxCapacity,
        address_street: formData.address,
        address_city: formData.city,
        address_state: formData.state,
        address_pincode: formData.pincode,
        images: formData.photos,
        pricing_hourly: formData.hourlyRate,
        pricing_half_day: formData.halfDayRate || null,
        pricing_full_day: formData.fullDayRate || null,
        security_deposit: formData.securityDeposit || null,
        amenities: formData.selectedAmenities,
        rules: formData.rules.filter(r => r.trim() !== ''),
      };

      const response = await fetch('/api/venue-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueRequestData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit venue request');
      }

      setSuccessMessage(result.message);
      
      // Redirect to owner dashboard after 2 seconds
      setTimeout(() => {
        router.push('/owner/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit venue request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle('/list-venue/onboarding', 'owner');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password) {
      setError('Please enter email and password');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signIn(authForm.email, authForm.password);
      // Update role to owner since they're signing in to list a venue
      await updateUserRole('owner');
      // Auth state change will trigger redirect to basics step
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email || !authForm.password || !authForm.name) {
      setError('Please fill in all fields');
      return;
    }
    if (authForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await signUp(authForm.email, authForm.password, authForm.name, 'owner');
      // Most setups auto-confirm in dev, so user should be logged in
      // If not, they'll see the sign-in form
    } catch (err: any) {
      // If user already exists, try to sign them in and upgrade to owner
      if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
        try {
          await signIn(authForm.email, authForm.password);
          await updateUserRole('owner');
          // Success - they're now signed in as owner
          return;
        } catch (signInErr: any) {
          setError('Account exists. Please use "Sign In" tab with your existing password.');
          setIsLoading(false);
          return;
        }
      }
      setError(err.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Success screen
  if (successMessage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
          <p className="text-foreground-muted mb-4">{successMessage}</p>
          <p className="text-sm text-foreground-muted">Redirecting to your dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-foreground">List Your Venue</h1>
          <p className="text-foreground-muted">Complete the form to start receiving bookings</p>
        </div>

        {/* Auth Step */}
        {currentStep === 'auth' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {authMode === 'signin' ? 'Sign in to continue' : 'Create an account'}
              </h2>
              <p className="text-foreground-muted">
                {authMode === 'signin' 
                  ? 'Sign in as a venue owner to list your venue'
                  : 'Sign up as a venue owner to start listing'
                }
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Tab Toggle */}
            <div className="flex mb-6 bg-background-light rounded-lg p-1">
              <button
                onClick={() => { setAuthMode('signin'); setError(null); }}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  authMode === 'signin'
                    ? 'bg-primary text-background'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setError(null); }}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  authMode === 'signup'
                    ? 'bg-primary text-background'
                    : 'text-foreground-muted hover:text-foreground'
                )}
              >
                Sign Up
              </button>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={authMode === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4 mb-6">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                      type="text"
                      value={authForm.name}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 bg-background-light border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-background-light border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    className="w-full pl-10 pr-4 py-3 bg-background-light border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
                size="lg"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background-card text-foreground-muted">or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-xs text-foreground-muted text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </Card>
        )}

        {/* Steps after auth */}
        {currentStep !== 'auth' && (
          <>
            {/* Progress Steps */}
            <div className="mb-8 overflow-x-auto">
              <div className="flex items-start justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center relative">
                    <div className="flex items-center">
                      <div
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all z-10',
                          currentStepIndex > index
                            ? 'bg-primary border-primary text-background'
                            : currentStepIndex === index
                            ? 'border-primary text-primary'
                            : 'border-border text-foreground-muted'
                        )}
                      >
                        {currentStepIndex > index ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <step.icon className="w-5 h-5" />
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            'w-12 sm:w-16 lg:w-20 h-0.5 absolute left-[50%] top-5 ml-5',
                            currentStepIndex > index ? 'bg-primary' : 'bg-border'
                          )}
                        />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 text-center whitespace-nowrap',
                        currentStep === step.id ? 'text-primary font-medium' : 'text-foreground-muted'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <Card className="p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Basics */}
                {currentStep === 'basics' && (
                  <motion.div
                    key="basics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Tell us about your venue
                      </h2>
                    </div>

                    <Input
                      label="Venue Name *"
                      placeholder="e.g., Grand Ballroom"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-foreground-muted mb-2">
                        Venue Type <span className="text-error">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full bg-background-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="">Select type</option>
                        {venueTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground-muted mb-2">
                        Description <span className="text-error">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your venue, its unique features, and what makes it special..."
                        rows={4}
                        className="w-full bg-background-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Minimum Capacity *"
                        type="number"
                        placeholder="e.g., 10"
                        value={formData.minCapacity}
                        onChange={(e) => handleInputChange('minCapacity', e.target.value)}
                        required
                      />
                      <Input
                        label="Maximum Capacity *"
                        type="number"
                        placeholder="e.g., 500"
                        value={formData.maxCapacity}
                        onChange={(e) => handleInputChange('maxCapacity', e.target.value)}
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Location */}
                {currentStep === 'location' && (
                  <motion.div
                    key="location"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4">
                        Where is your venue?
                      </h2>
                    </div>

                    <Input
                      label="Street Address *"
                      placeholder="e.g., 123 Business Park Road"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-2">
                          City <span className="text-error">*</span>
                        </label>
                        <select
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full bg-background-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                        >
                          <option value="">Select city</option>
                          {cities.map((city) => (
                            <option key={city.value} value={city.value}>
                              {city.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="State"
                        placeholder="e.g., Maharashtra"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>

                    <Input
                      label="PIN Code"
                      placeholder="e.g., 400001"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      maxLength={6}
                    />

                    <div className="bg-background-light rounded-xl p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Exact location privacy
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Your exact address is only shared with confirmed guests
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Photos */}
                {currentStep === 'photos' && (
                  <motion.div
                    key="photos"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Show off your venue
                      </h2>
                      <p className="text-foreground-muted">
                        Add at least 3 high-quality photos (max 5MB each)
                      </p>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e.target.files)}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                          <p className="text-foreground font-medium">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
                          <p className="text-foreground font-medium mb-1">
                            Drag & drop photos here
                          </p>
                          <p className="text-sm text-foreground-muted mb-4">or click to browse</p>
                          <Button variant="outline" size="sm" type="button">
                            Upload Photos
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Uploaded photos */}
                    {formData.photos.length > 0 && (
                      <div>
                        <p className="text-sm text-foreground-muted mb-3">
                          Uploaded photos ({formData.photos.length})
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {formData.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative aspect-video rounded-lg overflow-hidden group"
                            >
                              <img
                                src={photo}
                                alt={`Venue photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                              {index === 0 && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs bg-primary text-background">
                                  Cover
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-background-light rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Info className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">Photo Tips</span>
                      </div>
                      <ul className="text-xs text-foreground-muted space-y-1 ml-8">
                        <li>• Use natural lighting when possible</li>
                        <li>• Show the venue from multiple angles</li>
                        <li>• Include photos of unique features and amenities</li>
                        <li>• First photo will be used as cover image</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Pricing */}
                {currentStep === 'pricing' && (
                  <motion.div
                    key="pricing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Set your pricing
                      </h2>
                      <p className="text-foreground-muted">
                        Competitive pricing attracts more bookings
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-2">
                          Hourly Rate *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={formData.hourlyRate}
                            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                            placeholder="5,000"
                            className="w-full bg-background-card border border-border rounded-xl pl-8 pr-4 py-3 text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-2">
                          Half Day (4 hrs)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={formData.halfDayRate}
                            onChange={(e) => handleInputChange('halfDayRate', e.target.value)}
                            placeholder="15,000"
                            className="w-full bg-background-card border border-border rounded-xl pl-8 pr-4 py-3 text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground-muted mb-2">
                          Full Day (8 hrs)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={formData.fullDayRate}
                            onChange={(e) => handleInputChange('fullDayRate', e.target.value)}
                            placeholder="25,000"
                            className="w-full bg-background-card border border-border rounded-xl pl-8 pr-4 py-3 text-foreground focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-foreground-muted mb-2">
                        Security Deposit (Optional)
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={formData.securityDeposit}
                          onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                          placeholder="10,000"
                          className="w-full bg-background-card border border-border rounded-xl pl-8 pr-4 py-3 text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                      <p className="text-xs text-foreground-muted mt-2">
                        Refundable deposit for damage protection
                      </p>
                    </div> */}
                  </motion.div>
                )}

                {/* Step 5: Amenities */}
                {currentStep === 'amenities' && (
                  <motion.div
                    key="amenities"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Amenities & Rules
                      </h2>
                      <p className="text-foreground-muted">Select what your venue offers</p>
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-3">Available Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity) => (
                          <button
                            key={amenity.value}
                            onClick={() => toggleAmenity(amenity.value)}
                            className={cn(
                              'px-4 py-2 rounded-full text-sm transition-all',
                              formData.selectedAmenities.includes(amenity.value)
                                ? 'bg-primary text-background'
                                : 'bg-background-light text-foreground-muted hover:text-foreground'
                            )}
                          >
                            {amenity.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">Venue Rules</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addRule}
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          Add Rule
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.rules.map((rule, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={rule}
                              onChange={(e) => updateRule(index, e.target.value)}
                              placeholder="Enter venue rule..."
                              className="flex-1"
                            />
                            <button
                              onClick={() => removeRule(index)}
                              className="p-2 text-foreground-muted hover:text-error transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Review */}
                {currentStep === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">
                        Review Your Listing
                      </h2>
                      <p className="text-foreground-muted">Make sure everything looks good</p>
                    </div>

                    <div className="space-y-4">
                      {/* Cover Photo Preview */}
                      {formData.photos.length > 0 && (
                        <div className="aspect-video rounded-xl overflow-hidden">
                          <img
                            src={formData.photos[0]}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <Card className="p-4">
                        <h3 className="font-medium text-foreground mb-2">Basic Info</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-foreground-muted">Name:</span>
                          <span className="text-foreground">{formData.name || 'Not set'}</span>
                          <span className="text-foreground-muted">Type:</span>
                          <span className="text-foreground capitalize">
                            {formData.type.replace('-', ' ') || 'Not set'}
                          </span>
                          <span className="text-foreground-muted">Capacity:</span>
                          <span className="text-foreground">
                            {formData.minCapacity && formData.maxCapacity
                              ? `${formData.minCapacity} - ${formData.maxCapacity} guests`
                              : 'Not set'}
                          </span>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-medium text-foreground mb-2">Location</h3>
                        <p className="text-sm text-foreground-muted">
                          {formData.address || 'Address not set'}
                          {formData.city && `, ${formData.city}`}
                          {formData.state && `, ${formData.state}`}
                          {formData.pincode && ` - ${formData.pincode}`}
                        </p>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-medium text-foreground mb-2">Pricing</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-foreground-muted">Hourly</p>
                            <p className="text-foreground font-medium">
                              {formData.hourlyRate ? `₹${formData.hourlyRate}` : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground-muted">Half Day</p>
                            <p className="text-foreground font-medium">
                              {formData.halfDayRate ? `₹${formData.halfDayRate}` : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground-muted">Full Day</p>
                            <p className="text-foreground font-medium">
                              {formData.fullDayRate ? `₹${formData.fullDayRate}` : '-'}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-medium text-foreground mb-2">Photos</h3>
                        <div className="flex gap-2 overflow-x-auto">
                          {formData.photos.map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          ))}
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h3 className="font-medium text-foreground mb-2">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedAmenities.length > 0 ? (
                            formData.selectedAmenities.map((amenity) => (
                              <Badge key={amenity}>{amenity}</Badge>
                            ))
                          ) : (
                            <span className="text-sm text-foreground-muted">
                              No amenities selected
                            </span>
                          )}
                        </div>
                      </Card>

                      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              What happens next?
                            </p>
                            <p className="text-xs text-foreground-muted mt-1">
                              Your venue listing will be reviewed by our team within 24-48 hours.
                              Once approved, it will appear in search results and start receiving
                              booking requests.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 'basics'}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                {currentStep === 'review' ? (
                  <Button
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    rightIcon={<Check className="w-4 h-4" />}
                  >
                    Submit for Review
                  </Button>
                ) : (
                  <Button onClick={goToNextStep} rightIcon={<ChevronRight className="w-4 h-4" />}>
                    Continue
                  </Button>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
