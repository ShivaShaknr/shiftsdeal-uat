'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Calendar,
  FileText,
  CheckCircle,
  FileCheck2,
  Download,
  Loader2,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '@/components/ui';
import { formatCurrency, cn } from '@/lib/utils';

type BookingStep = 'details' | 'contract' | 'confirm';

const steps: { id: BookingStep; label: string; icon: any }[] = [
  { id: 'details', label: 'Event Details', icon: User },
  { id: 'contract', label: 'Contract & Sign', icon: FileText },
  { id: 'confirm', label: 'Confirm', icon: CheckCircle },
];

export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [venue, setVenue] = useState<any | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>('details');
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Event Details
    eventType: '',
    eventName: '',
    eventDescription: '',
    attendees: '',
    organizationName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    date: '',
    startTime: '09:00',
    endTime: '18:00',

    specialRequirements: '',

    // Contract
    contractAccepted: false,
    signature: '',
  });

  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      if (!id) return;
      
      console.log('🔍 Fetching venue for booking:', id);
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
      }
    };

    fetchVenue();

    // Autofill email from user
    if (user?.email && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: user?.email || '',
      }));
    }

    // Auto-fill form with data from venue detail page
    const preFillData = localStorage.getItem('bookingPreFill');
    if (preFillData) {
      try {
        const data = JSON.parse(preFillData);
        
        // Map event types from venue page to booking page format
        const eventTypeMap: { [key: string]: string } = {
          'training': 'Corporate Training',
          'conference': 'Conference',
          'workshop': 'Workshop',
          'seminar': 'Seminar',
          'meeting': 'Meeting',
          'product-launch': 'Product Launch',
          'team-building': 'Other',
          'other': 'Other',
        };
        
        setFormData(prev => ({
          ...prev,
          eventType: eventTypeMap[data.eventType] || '',
          eventName: data.eventName || '',
          attendees: data.attendees || '',
          date: data.eventDate || '',
          specialRequirements: data.specialRequirements || '',
        }));
        // Clear the prefill data after using it
        localStorage.removeItem('bookingPreFill');
      } catch (error) {
        console.error('Error parsing prefill data:', error);
      }
    }
  }, [id]);

  // Auto-generate contract when entering contract step
  useEffect(() => {
    if (currentStep === 'contract' && !contract && venue) {
      generateContract();
    }
  }, [currentStep]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const calculateHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diffMinutes = endMinutes - startMinutes;
    return Math.max(0, Math.ceil(diffMinutes / 60));
  };

  const calculatePrice = () => {
    if (!venue) return 0;
    const hours = calculateHours();
    const hourlyRate = venue.pricing.hourly || 0;
    return hours * hourlyRate;
  };

  // Calculate full pricing with GST and platform fee
  const calculateFullPricing = () => {
    const basePrice = calculatePrice();
    const platformFee = Math.round(basePrice * (Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE))); // 5% platform fee
    const subtotal = basePrice + platformFee;
    const gst = Math.round(subtotal * 0.18); // 18% GST
    const totalAmount = subtotal + gst;
    const depositPercent = 30;
    const depositAmount = Math.round(totalAmount * (depositPercent / 100));
    const balanceAmount = totalAmount - depositAmount;
    
    return {
      basePrice,
      platformFee,
      subtotal,
      gst,
      totalAmount,
      depositPercent,
      depositAmount,
      balanceAmount,
    };
  };

  const downloadContractPDF = () => {
    if (!contract) return;
    
    // Create text content for the contract
    let textContent = `${contract.title}\n\n`;
    textContent += `Generated on: ${new Date(contract.generatedAt).toLocaleDateString()}\n\n`;
    contract.sections.forEach((section: any) => {
      textContent += `${section.heading}\n${section.content}\n\n`;
    });
    textContent += `\n\nSigned by: ${formData.signature || '[Pending Signature]'}\n`;
    textContent += `Date: ${new Date().toLocaleDateString()}\n`;
    
    // Create blob and download
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Venue-Booking-Contract-${formData.organizationName.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateContract = async () => {
    setIsLoading(true);
    
    try {
      const pricing = calculateFullPricing();
      const hours = calculateHours();

      // Generate contract directly without API call
      setContract({
        title: 'Venue Booking Agreement',
        generatedAt: new Date().toISOString(),
        sections: [
          {
            heading: '1. Parties to the Agreement',
            content: `This Venue Booking Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()} between:\n\nVenue Owner: ${venue?.name}\nAddress: ${venue?.address.street}, ${venue?.address.city}, ${venue?.address.state} ${venue?.address.pincode}\n\nand\n\nRenter: ${formData.organizationName}\nContact Person: ${formData.contactName}\nEmail: ${formData.contactEmail}\nPhone: ${formData.contactPhone}`,
          },
          {
            heading: '2. Event Details',
            content: `Event Name: ${formData.eventName}\nEvent Type: ${formData.eventType}\nDate: ${formData.date}\nTime: ${formData.startTime} to ${formData.endTime} (${hours} hours)\nExpected Attendees: ${formData.attendees}\nSpecial Requirements: ${formData.specialRequirements || 'None'}`,
          },
          {
            heading: '3. Venue Description',
            content: `The venue "${venue?.name}" located at ${venue?.address.street}, ${venue?.address.city} with a maximum capacity of ${venue?.capacity.max} persons is hereby booked for the above-mentioned event.`,
          },
          {
            heading: '4. Payment Terms',
            content: `Venue Charges: ${formatCurrency(pricing.basePrice)}\nPlatform Fee (5%): ${formatCurrency(pricing.platformFee)}\nSubtotal: ${formatCurrency(pricing.subtotal)}\nGST (18%): ${formatCurrency(pricing.gst)}\n\nTotal Amount: ${formatCurrency(pricing.totalAmount)}\nDeposit (${pricing.depositPercent}%): ${formatCurrency(pricing.depositAmount)}\nBalance Amount: ${formatCurrency(pricing.balanceAmount)}\n\nThe deposit amount must be paid within 24 hours of signing this agreement to confirm the booking. The balance amount is due 7 days before the event date.`,
          },
          {
            heading: '5. Cancellation Policy',
            content: `- Cancellation 30+ days before event: Full refund minus 10% processing fee\n- Cancellation 15-29 days before event: 50% refund\n- Cancellation less than 15 days before event: No refund\n- No-show: No refund`,
          },
          {
            heading: '6. Renter Responsibilities',
            content: `The Renter agrees to:\n- Use the venue only for the stated purpose\n- Comply with all venue rules and regulations\n- Maintain proper conduct and ensure guests do the same\n- Be responsible for any damage to the venue or equipment\n- Vacate the premises by the agreed time\n- Not sublet or transfer this booking to any third party`,
          },
          {
            heading: '7. Venue Owner Responsibilities',
            content: `The Venue Owner agrees to:\n- Provide a clean and functional venue\n- Ensure all amenities listed are available\n- Provide access to the venue at the agreed time\n- Maintain safety standards and emergency protocols`,
          },
          {
            heading: '8. Liability and Insurance',
            content: `The Renter shall be liable for any damage caused to the venue during the booking period. The Venue Owner is not liable for any injury, loss, or damage to persons or property during the event. The Renter is advised to obtain appropriate event insurance.`,
          },
          {
            heading: '9. Force Majeure',
            content: `Neither party shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in ${venue?.address.city}.`,
          },
          {
            heading: '10. Tax Information',
            content: `This booking is subject to Goods and Services Tax (GST) at 18% as per Indian tax regulations. The GST amount of ${formatCurrency(pricing.gst)} is included in the total amount. GSTIN will be provided on the invoice.`,
          },
        ],
        ...pricing,
      });
    } catch (error) {
      console.error('Contract generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if event details are valid (without showing alerts)
  const isEventDetailsValid = () => {
    // Check required fields
    if (!formData.eventType || !formData.eventName || !formData.attendees || 
        !formData.date || !formData.organizationName || !formData.contactName || 
        !formData.contactEmail || !formData.contactPhone) {
      return false;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return false;
    }

    // Validate time range
    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      return false;
    }

    // Validate attendees
    const attendeeCount = parseInt(formData.attendees);
    if (isNaN(attendeeCount) || attendeeCount <= 0) {
      return false;
    }

    if (venue && attendeeCount > venue.capacity.max) {
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      return false;
    }

    // Validate phone number
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(formData.contactPhone.replace(/\s/g, ''))) {
      return false;
    }

    return true;
  };

  const validateEventDetails = () => {
    // Check required fields
    if (!formData.eventType || !formData.eventName || !formData.attendees || 
        !formData.date || !formData.organizationName || !formData.contactName || 
        !formData.contactEmail || !formData.contactPhone) {
      alert('Please fill in all required fields');
      return false;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      alert('Event date cannot be in the past');
      return false;
    }

    // Validate time range
    const [startHour, startMin] = formData.startTime.split(':').map(Number);
    const [endHour, endMin] = formData.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      alert('End time must be after start time');
      return false;
    }

    // Validate attendees
    const attendeeCount = parseInt(formData.attendees);
    if (isNaN(attendeeCount) || attendeeCount <= 0) {
      alert('Number of attendees must be greater than 0');
      return false;
    }

    if (venue && attendeeCount > venue.capacity.max) {
      alert(`Number of attendees (${attendeeCount}) exceeds venue capacity (${venue.capacity.max})`);
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      alert('Please enter a valid email address');
      return false;
    }

    // Validate phone number (Indian format)
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(formData.contactPhone.replace(/\s/g, ''))) {
      alert('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const goToNextStep = async () => {
    if (currentStep === 'details') {
      if (!validateEventDetails()) {
        return;
      }
      setCurrentStep('contract');
    } else if (currentStep === 'contract') {
      if (!formData.contractAccepted) {
        alert('Please accept the contract terms');
        return;
      }
      if (!formData.signature || formData.signature.trim().length < 3) {
        alert('Please provide your signature');
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: BookingStep[] = ['details', 'contract', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleConfirmBooking = async () => {
    if (!venue || !contract) return;
    
    setIsLoading(true);
    
    try {
      const bookingData = {
        venue_id: venue._id,
        renter_id: user?.id || null,
        event_name: formData.eventName,
        event_type: formData.eventType,
        event_description: formData.eventDescription,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        attendees: parseInt(formData.attendees),
        organization_name: formData.organizationName,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        special_requirements: formData.specialRequirements,
        kyc_document_type: 'N/A',
        kyc_document_url: 'N/A',
        kyc_face_photo_url: 'N/A',
        contract_data: contract,
        signature: formData.signature,
        // Store full pricing breakdown
        base_price: contract.basePrice,
        platform_fee: contract.platformFee,
        subtotal: contract.subtotal,
        gst_amount: contract.gst,
        total_amount: contract.totalAmount,
        deposit_amount: contract.depositAmount,
        balance_amount: contract.balanceAmount,
        status: 'pending',
        payment_status: 'pending',
      };
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Store booking data for receipt download on success page
        const receiptData = {
          bookingId: result.data?.id || `SD-${Date.now().toString(36).toUpperCase()}`,
          venueName: venue?.name,
          venueAddress: `${venue?.address.street}, ${venue?.address.city}, ${venue?.address.state}`,
          eventName: formData.eventName,
          eventType: formData.eventType,
          date: formData.date,
          time: `${formData.startTime} - ${formData.endTime}`,
          attendees: formData.attendees,
          organizationName: formData.organizationName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          pricing: {
            basePrice: contract.basePrice,
            platformFee: contract.platformFee,
            subtotal: contract.subtotal,
            gst: contract.gst,
            totalAmount: contract.totalAmount,
            depositAmount: contract.depositAmount,
            balanceAmount: contract.balanceAmount,
          },
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('lastBookingReceipt', JSON.stringify(receiptData));
        router.push('/booking-success');
      } else {
        alert('Failed to create booking. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while creating your booking.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!venue) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-foreground-muted">Loading venue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to venue
          </button>
          <h1 className="text-2xl font-bold text-foreground">Book {venue.name}</h1>
          <p className="text-foreground-muted">{venue.address.city} • {venue.capacity.max} capacity</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 px-2">
          <div className="flex items-start">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn('flex', index < steps.length - 1 && 'flex-1')}
              >
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background transition-all',
                      currentStepIndex > index
                        ? 'border-primary bg-primary text-background'
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
                  <span
                    className={cn(
                      'mt-2 max-w-[88px] text-center text-xs',
                      currentStep === step.id ? 'text-primary font-medium' : 'text-foreground-muted'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex flex-1 items-start px-2 pt-5">
                    <div
                      className={cn(
                        'h-0.5 w-full',
                        currentStepIndex > index ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Event Details */}
                {currentStep === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-4">Event Details</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Event Name"
                          placeholder="Annual Training Session"
                          value={formData.eventName}
                          onChange={(e) => handleInputChange('eventName', e.target.value)}
                          required
                        />
                        <div>
                          <label className="block text-sm font-medium text-foreground-muted mb-2">
                            Event Type <span className="text-error">*</span>
                          </label>
                          <select
                            value={formData.eventType}
                            onChange={(e) => handleInputChange('eventType', e.target.value)}
                            className="w-full bg-background-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                          >
                            <option value="">Select type</option>
                            <option value="Corporate Training">Corporate Training</option>
                            <option value="Conference">Conference</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Seminar">Seminar</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Product Launch">Product Launch</option>
                            <option value="Award Ceremony">Award Ceremony</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <Input
                      label="Event Description"
                      placeholder="Brief description of your event..."
                      value={formData.eventDescription}
                      onChange={(e) => handleInputChange('eventDescription', e.target.value)}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Event Date"
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        required
                      />
                      <Input
                        label="Start Time"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => {
                          const newStartTime = e.target.value;
                          handleInputChange('startTime', newStartTime);
                          
                          // If end time is before or equal to new start time, reset it
                          if (formData.endTime && formData.endTime <= newStartTime) {
                            const [hours, minutes] = newStartTime.split(':');
                            const newEndHour = (parseInt(hours) + 1).toString().padStart(2, '0');
                            handleInputChange('endTime', `${newEndHour}:${minutes}`);
                          }
                        }}
                        required
                      />
                      <Input
                        label="End Time"
                        type="time"
                        min={formData.startTime}
                        value={formData.endTime}
                        onChange={(e) => {
                          const newEndTime = e.target.value;
                          // Validate end time is after start time
                          if (formData.startTime && newEndTime <= formData.startTime) {
                            alert('End time must be after start time');
                            return;
                          }
                          handleInputChange('endTime', newEndTime);
                        }}
                        required
                      />
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-foreground-muted">Duration</p>
                          <p className="text-lg font-semibold text-foreground">{calculateHours()} hours</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-foreground-muted">Total Price</p>
                          <p className="text-xl font-bold text-primary">{formatCurrency(calculatePrice())}</p>
                        </div>
                      </div>
                      <p className="text-xs text-foreground-muted mt-2">Rate: {formatCurrency(venue?.pricing.hourly || 0)}/hour</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Number of Attendees"
                          type="number"
                          placeholder="50"
                          min="1"
                          max={venue?.capacity.max || 1000}
                          value={formData.attendees}
                          onChange={(e) => handleInputChange('attendees', e.target.value)}
                          required
                        />
                        {venue && (
                          <p className="text-xs text-foreground-muted mt-1">
                            Maximum capacity: {venue.capacity.max} people
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Organization Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Organization Name"
                          placeholder="Your Company Pvt Ltd"
                          value={formData.organizationName}
                          onChange={(e) => handleInputChange('organizationName', e.target.value)}
                          required
                        />
                        <Input
                          label="Contact Person"
                          placeholder="John Doe"
                          value={formData.contactName}
                          onChange={(e) => handleInputChange('contactName', e.target.value)}
                          required
                        />
                        <div>
                          <Input
                            label="Email"
                            type="email"
                            placeholder="contact@company.com"
                            value={formData.contactEmail}
                            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                            required
                          />
                          {formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail) && (
                            <p className="text-xs text-error mt-1">Please enter a valid email address</p>
                          )}
                        </div>
                        <div>
                          <Input
                            label="Phone"
                            type="tel"
                            placeholder="+91 99909 44319"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            required
                          />
                          {formData.contactPhone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(formData.contactPhone.replace(/\s/g, '')) && (
                            <p className="text-xs text-error mt-1">Please enter a valid phone number</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Contract */}
                {currentStep === 'contract' && (
                  <motion.div
                    key="contract"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">Booking Agreement</h2>
                      <p className="text-foreground-muted">
                        Review the contract and provide your e-signature to proceed.
                      </p>
                    </div>

                    {!contract ? (
                      <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                        <p className="text-foreground-muted">Generating your contract...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-background-light rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileCheck2 className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">Booking Contract</p>
                              <p className="text-xs text-foreground-muted">Generated on {new Date(contract.generatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={downloadContractPDF} leftIcon={<Download className="w-4 h-4" />}>
                            Download
                          </Button>
                        </div>

                        <div className="bg-background-card border border-border rounded-xl p-6 max-h-[500px] overflow-y-auto">
                          <h3 className="text-lg font-bold text-center text-foreground mb-6">
                            {contract.title}
                          </h3>
                          <div className="space-y-6">
                            {contract.sections.map((section: any, i: number) => (
                              <div key={i}>
                                <h4 className="font-semibold text-foreground mb-2">{section.heading}</h4>
                                <p className="text-sm text-foreground-muted whitespace-pre-line leading-relaxed">
                                  {section.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-start gap-3 p-4 bg-background-light rounded-xl cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.contractAccepted}
                              onChange={(e) => handleInputChange('contractAccepted', e.target.checked)}
                              className="w-5 h-5 rounded border-border text-primary focus:ring-primary mt-0.5 flex-shrink-0"
                            />
                            <span className="text-sm text-foreground">
                              I have read and agree to all the terms and conditions of this booking agreement
                            </span>
                          </label>

                          {formData.contractAccepted && (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-foreground-muted">
                                E-Signature <span className="text-error">*</span>
                              </label>
                              <Input
                                placeholder="Type your full name as signature"
                                value={formData.signature}
                                onChange={(e) => handleInputChange('signature', e.target.value)}
                                className="font-serif text-lg"
                              />
                              <p className="text-xs text-foreground-muted">
                                By typing your name, you agree that this constitutes a legal signature confirming your agreement to the contract terms.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {/* Step 5: Confirm */}
                {currentStep === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground mb-2">Ready to Book!</h2>
                      <p className="text-foreground-muted">
                        Review your booking details and confirm to complete the reservation.
                      </p>
                    </div>

                    <Card className="p-4 divide-y divide-border">
                      <div className="pb-4">
                        <h4 className="font-medium text-foreground mb-2">Event</h4>
                        <p className="text-foreground-muted">{formData.eventName}</p>
                        <p className="text-sm text-foreground-muted">{formData.eventType}</p>
                      </div>
                      <div className="py-4">
                        <h4 className="font-medium text-foreground mb-2">Date & Time</h4>
                        <p className="text-foreground-muted">{formData.date}</p>
                        <p className="text-sm text-foreground-muted">
                          {formData.startTime} - {formData.endTime}
                        </p>
                      </div>
                      <div className="py-4">
                        <h4 className="font-medium text-foreground mb-2">Organization</h4>
                        <p className="text-foreground-muted">{formData.organizationName}</p>
                        <p className="text-sm text-foreground-muted">{formData.contactName}</p>
                      </div>
                      <div className="pt-4">
                        <h4 className="font-medium text-foreground mb-2">Status</h4>
                        <Badge variant="success">Contract Signed</Badge>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 'details'}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back
                </Button>

                {currentStep === 'confirm' ? (
                  <Button
                    onClick={handleConfirmBooking}
                    isLoading={isLoading}
                    rightIcon={<Check className="w-4 h-4" />}
                  >
                    Confirm Booking
                  </Button>
                ) : (
                  <Button
                    onClick={goToNextStep}
                    isLoading={isLoading}
                    disabled={currentStep === 'details' && !isEventDetailsValid()}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    {currentStep === 'contract' && !contract
                      ? 'Generate Contract'
                      : 'Continue'}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Booking Summary</h3>

              <div className="flex gap-3 mb-4">
                <img
                  src={venue.images[0]}
                  alt={venue.name}
                  className="w-20 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-foreground text-sm">{venue.name}</h4>
                  <p className="text-xs text-foreground-muted">{venue.address.city}</p>
                </div>
              </div>

              <div className="space-y-3 py-4 border-t border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Date</span>
                  <span className="text-foreground">{formData.date || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Time</span>
                  <span className="text-foreground">{formData.startTime && formData.endTime ? `${formData.startTime} - ${formData.endTime}` : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Duration</span>
                  <span className="text-foreground">{calculateHours()} hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Attendees</span>
                  <span className="text-foreground">{formData.attendees || '-'}</span>
                </div>
              </div>

              <div className="space-y-3 py-4 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Venue Charges ({calculateHours()} hrs × {formatCurrency(venue.pricing.hourly)}/hr)</span>
                  <span className="text-foreground">{formatCurrency(calculateFullPricing().basePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Platform Fee (${(Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENTAGE) * 100)}%)</span>
                  <span className="text-foreground">{formatCurrency(calculateFullPricing().platformFee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(calculateFullPricing().subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-muted">GST (18%)</span>
                  <span className="text-foreground">{formatCurrency(calculateFullPricing().gst)}</span>
                </div>
                {contract && (
                  <>
                    <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                      <span className="text-foreground-muted">
                        Deposit Due ({contract.depositPercent}%)
                      </span>
                      <span className="text-foreground font-medium">{formatCurrency(contract.depositAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground-muted">Balance (Due before event)</span>
                      <span className="text-foreground">{formatCurrency(contract.balanceAmount)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <span className="font-semibold text-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(calculateFullPricing().totalAmount)}</span>
              </div>

              <p className="text-xs text-foreground-muted mt-4">
                * All prices are inclusive of GST. You'll only be charged after the venue owner confirms your booking.
              </p>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
