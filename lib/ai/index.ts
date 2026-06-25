// AI Functions - Uses provider abstraction (Groq or Gemini based on env config)
import { 
  getAI, 
  SearchFilters, 
  VenueSuitability, 
  KYCResult, 
  RiskAssessment, 
  Contract,
  ConciergeResponse,
  VenueRecommendations
} from './provider';

// Re-export types
export type { SearchFilters, VenueSuitability, KYCResult, RiskAssessment, Contract, ConciergeResponse, VenueRecommendations };

// Legacy export for backward compatibility (not used with new provider)
export const geminiModel = null;

// Extract document info using vision AI
export async function extractDocumentInfo(base64Image: string, mimeType: string, documentType: string): Promise<Record<string, any> | null> {
  const ai = getAI();
  
  const prompt = `
Analyze this ${documentType} document image and extract all visible text and information.

IMPORTANT: Read the document carefully and extract:
- Full name(s)
- ID/Registration numbers
- Company/Organization name (if applicable)
- Address
- Date of issue/validity
- Any other relevant details

For ${documentType}:
${documentType === 'PAN' ? '- Extract: Name, PAN Number, Father Name, Date of Birth' : ''}
${documentType === 'GST' ? '- Extract: Business Name, GSTIN, Address, Registration Date' : ''}
${documentType === 'Aadhaar' ? '- Extract: Name, Aadhaar Number (masked), Address, Date of Birth' : ''}
${documentType === 'Company Registration' ? '- Extract: Company Name, CIN, Registration Number, Registration Date, Address' : ''}

Return JSON with extracted fields:
{
  "name": "extracted full name",
  "idNumber": "extracted ID/registration number",
  "companyName": "company/business name if applicable",
  "address": "full address",
  "issuedDate": "date of issue",
  "otherDetails": "any other important details",
  "isReadable": boolean (true if document is clear and readable),
  "confidence": number (0-100, confidence in extraction accuracy)
}

Only return valid JSON.
  `.trim();

  const fallback = {
    name: '',
    idNumber: '',
    companyName: '',
    address: '',
    issuedDate: '',
    otherDetails: '',
    isReadable: false,
    confidence: 0
  };

  // Use vision API with image
  return ai.generateJSONWithImage<Record<string, any>>(prompt, base64Image, mimeType, fallback);
}

export async function performKYCVerification(
  documentText: string, 
  organizationName: string,
  contactName: string,
  documentType: string
): Promise<KYCResult | null> {
  const ai = getAI();
  
  let extractedInfo: any = {};
  try {
    extractedInfo = JSON.parse(documentText);
  } catch (e) {
    extractedInfo = { raw: documentText };
  }
  
  const prompt = `
Verify this KYC document for a venue booking request on ShiftsDeal platform.

DOCUMENT TYPE: ${documentType}
EXTRACTED INFORMATION: ${JSON.stringify(extractedInfo, null, 2)}

USER PROVIDED INFORMATION:
- Organization Name: ${organizationName}
- Contact Person: ${contactName}

VERIFICATION TASKS:
1. Check if document is readable and authentic-looking (based on extracted info quality)
2. Verify if extracted name matches contact person name "${contactName}"
3. Check for any red flags or inconsistencies
4. Assess risk level

NAME MATCHING RULES:
- Exact match is best
- Partial match is acceptable (e.g., "John" matches "John Doe")
- Case insensitive comparison
- Consider middle names optional

Return JSON:
{
  "verified": boolean (true if document is clear, readable, and name matches reasonably),
  "documentType": "${documentType}",
  "extractedName": string or null (name from document),
  "extractedId": string or null (ID number, partially masked),
  "nameMatch": boolean (does extracted name match contact person name),
  "riskScore": number (0-100, where 0 is no risk, 100 is high risk),
  "flags": ["list any concerns or red flags"],
  "notes": "Brief verification summary"
}

Only return valid JSON.
  `.trim();

  const fallback: KYCResult = {
    verified: false,
    documentType: documentType as any,
    extractedName: null,
    extractedId: null,
    nameMatch: false,
    riskScore: 50,
    flags: ['Unable to process document automatically'],
    notes: 'Manual verification recommended'
  };

  return ai.generateJSON<KYCResult>(prompt, fallback);
}

export async function parseSearchQuery(query: string): Promise<SearchFilters | null> {
  const ai = getAI();
  
  const prompt = `
Parse this venue search query and extract structured filters.
Query: "${query}"

Return a JSON object with these fields (use null for unknown):
{
  "city": string or null (e.g., "Mumbai", "Delhi", "Bangalore"),
  "venueType": one of ["training-hall", "auditorium", "conference-room", "workshop-space", "banquet-hall", "hotel-venue"] or null,
  "capacity": number or null,
  "budget": { "min": number or null, "max": number or null },
  "date": string (YYYY-MM-DD) or null,
  "amenities": string[] or [],
  "eventType": string or null (e.g., "wedding", "conference", "training", "party")
}

Examples:
- "conference room in mumbai for 50 people" → {"city": "Mumbai", "venueType": "conference-room", "capacity": 50, ...}
- "cheap wedding venue under 50000" → {"venueType": "banquet-hall", "budget": {"min": null, "max": 50000}, "eventType": "wedding", ...}

Only return valid JSON.
  `.trim();

  const fallback: SearchFilters = {
    city: null,
    venueType: null,
    capacity: null,
    budget: { min: null, max: null },
    date: null,
    amenities: [],
    eventType: null
  };

  return ai.generateJSON<SearchFilters>(prompt, fallback);
}

export async function analyzeVenueSuitability(venue: {
  name: string;
  type: string;
  description?: string;
  capacity: { min: number; max: number };
  amenities: string[];
  pricing: { fullDay?: number; halfDay?: number; hourly?: number };
  rating?: number;
  location?: any;
}, eventDetails: {
  eventType: string;
  eventName?: string;
  eventDate?: string;
  attendees: number;
  budget?: number;
  duration?: string;
  requiredAmenities?: string[];
  specialRequirements?: string;
}): Promise<VenueSuitability | null> {
  const ai = getAI();
  
  const prompt = `
You are analyzing venue suitability. Be specific, honest, and helpful.

VENUE DETAILS:
- Name: ${venue.name}
- Type: ${venue.type}
- Description: ${venue.description || 'N/A'}
- Capacity: ${venue.capacity.min}-${venue.capacity.max} people
- Amenities Available: ${venue.amenities.join(', ')}
- Pricing: ${venue.pricing.fullDay ? `₹${venue.pricing.fullDay}/day` : 'N/A'}, ${venue.pricing.halfDay ? `₹${venue.pricing.halfDay}/half-day` : ''}, ${venue.pricing.hourly ? `₹${venue.pricing.hourly}/hour` : ''}
- Rating: ${venue.rating || 'N/A'}/5
- Location: ${venue.location ? `${venue.location.city}, ${venue.location.state}` : 'N/A'}

USER EVENT REQUIREMENTS:
- Event Name: ${eventDetails.eventName || 'Not specified'}
- Event Type: ${eventDetails.eventType}
- Event Date: ${eventDetails.eventDate || 'Not specified'}
- Expected Attendees: ${eventDetails.attendees} people
- Budget: ${eventDetails.budget ? `₹${eventDetails.budget}` : 'Not specified'}
- Duration: ${eventDetails.duration || 'Not specified'}
- Required Amenities: ${eventDetails.requiredAmenities?.join(', ') || 'None specified'}
- Special Requirements: ${eventDetails.specialRequirements || 'None'}

ANALYSIS TASK:
Evaluate how well this venue matches the user's needs. Consider:
1. Capacity fit (does venue capacity match attendee count?)
2. Amenities match (does venue have required amenities?)
3. Budget fit (is pricing within budget?)
4. Venue type appropriateness (is venue type suitable for event type?)
5. Overall value and suitability

Be honest and specific. Don't suggest negotiations or alternatives - just analyze THIS venue's suitability.

Return JSON:
{
  "suitabilityScore": number (0-100, be realistic),
  "summary": "One clear sentence explaining overall fit",
  "strengths": ["Specific strength 1 with details", "Specific strength 2 with details", "Specific strength 3 with details", "Specific strength 4 with details"],
  "weaknesses": ["Specific concern/limitation 1", "Specific concern/limitation 2", "Specific concern/limitation 3"],
  "recommendation": "One clear sentence: either 'This venue is suitable for your event' or 'Consider alternative options' with brief reason",
  "capacityAnalysis": "Brief analysis of capacity match",
  "amenitiesAnalysis": "Brief analysis of amenities match",
  "budgetAnalysis": "Brief analysis of budget fit"
}

Only return valid JSON.
  `.trim();

  const fallback: VenueSuitability = {
    suitabilityScore: 75,
    summary: 'This venue appears to be a reasonable match for your event.',
    strengths: ['Adequate capacity for your group', 'Good location accessibility', 'Professional venue type', 'Reasonable pricing structure'],
    weaknesses: ['Some amenities may need confirmation', 'Budget alignment needs verification'],
    recommendation: 'This venue is suitable for your event, but confirm specific amenity requirements.',
    capacityAnalysis: `Venue capacity (${venue.capacity.min}-${venue.capacity.max}) can accommodate ${eventDetails.attendees} attendees.`,
    amenitiesAnalysis: 'Venue has most standard amenities required.',
    budgetAnalysis: 'Pricing appears to be within reasonable market range.'
  };

  return ai.generateJSON<VenueSuitability>(prompt, fallback);
}

export async function assessBookingRisk(bookingDetails: {
  eventType: string;
  attendees: number;
  organizationName: string;
  venueType: string;
  venuePrice: number;
  kycVerified: boolean;
}): Promise<RiskAssessment | null> {
  const ai = getAI();
  
  const prompt = `
Assess the risk level for this venue booking on ShiftsDeal platform.

BOOKING DETAILS:
- Event Type: ${bookingDetails.eventType}
- Expected Attendees: ${bookingDetails.attendees}
- Organization: ${bookingDetails.organizationName}
- Venue Type: ${bookingDetails.venueType}
- Venue Value: ₹${bookingDetails.venuePrice}
- KYC Verified: ${bookingDetails.kycVerified ? 'Yes' : 'No'}

Consider these risk factors:
1. Crowd size and management requirements
2. Event type risks (noise, alcohol, property damage potential)
3. Property damage potential based on event nature
4. Liability concerns
5. Payment default risk
6. Reputation risk

Return JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "depositPercentage": number (10-50, higher for riskier events),
  "insuranceRequired": boolean (true for high-risk events),
  "concerns": ["specific concern 1", "specific concern 2"],
  "mitigations": ["suggested mitigation 1", "suggested mitigation 2"],
  "notes": "Brief risk assessment summary"
}

Only return valid JSON.
  `.trim();

  const fallback: RiskAssessment = {
    riskLevel: 'medium',
    depositPercentage: 25,
    insuranceRequired: false,
    concerns: ['Standard event risks apply'],
    mitigations: ['Collect security deposit', 'Verify organization details'],
    notes: 'Standard booking with typical risk profile'
  };

  return ai.generateJSON<RiskAssessment>(prompt, fallback);
}

export async function generateContract(bookingDetails: {
  venueName: string;
  venueAddress: string;
  organizationName: string;
  contactName: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  totalAmount: number;
  depositAmount: number;
  riskLevel: string;
}): Promise<Contract | null> {
  const ai = getAI();
  
  const prompt = `
Generate a professional venue booking contract for ShiftsDeal platform.

BOOKING DETAILS:
- Venue: ${bookingDetails.venueName}
- Address: ${bookingDetails.venueAddress}
- Renter Organization: ${bookingDetails.organizationName}
- Contact Person: ${bookingDetails.contactName}
- Event Name: ${bookingDetails.eventName}
- Date: ${bookingDetails.date}
- Time: ${bookingDetails.startTime} - ${bookingDetails.endTime}
- Expected Attendees: ${bookingDetails.attendees}
- Total Amount: ₹${bookingDetails.totalAmount}
- Security Deposit: ₹${bookingDetails.depositAmount}
- Risk Level: ${bookingDetails.riskLevel}

Generate a formal, legally-sound contract with these sections:
1. Parties - Define ShiftsDeal as platform/facilitator (NOT directly liable), Venue Owner, and Renter
2. Booking Details - All event specifics
3. Payment Terms - Deposit, balance, refund conditions
4. Cancellation Policy - Timeframes and refund percentages
5. Damage & Liability - Renter is responsible for damages
6. Conduct Rules - Noise levels, capacity limits, cleanup
7. Force Majeure - Natural disasters, government actions
8. Dispute Resolution - Arbitration clause
9. Signatures - Placeholders for all parties

Return JSON:
{
  "title": "Venue Booking Agreement",
  "sections": [
    {
      "heading": "Section Title",
      "content": "Detailed section content with proper legal language..."
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Only return valid JSON.
  `.trim();

  const fallback: Contract = {
    title: 'Venue Booking Agreement',
    sections: [
      { heading: 'Parties', content: `This agreement is between ${bookingDetails.organizationName} (Renter) and the Venue Owner, facilitated by ShiftsDeal (Platform).` },
      { heading: 'Booking Details', content: `Venue: ${bookingDetails.venueName}. Date: ${bookingDetails.date}. Time: ${bookingDetails.startTime} - ${bookingDetails.endTime}. Attendees: ${bookingDetails.attendees}.` },
      { heading: 'Payment', content: `Total: ₹${bookingDetails.totalAmount}. Deposit: ₹${bookingDetails.depositAmount}. Balance due before event.` },
      { heading: 'Terms', content: 'Standard terms and conditions apply. Renter is responsible for any damages.' }
    ],
    generatedAt: new Date().toISOString()
  };

  return ai.generateJSON<Contract>(prompt, fallback);
}

export async function getConciergeResponse(message: string, context: {
  role?: string;
  page?: string;
  filters?: Record<string, unknown>;
  conversationHistory?: Array<{ role: string; content: string }>;
}): Promise<ConciergeResponse> {
  const ai = getAI();
  
  // Build conversation history context
  let historyContext = '';
  if (context.conversationHistory && context.conversationHistory.length > 0) {
    historyContext = '\n\nCONVERSATION HISTORY:\n' + 
      context.conversationHistory.slice(-6).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
  }
  
  const prompt = `
You are the ShiftsDeal AI Concierge - a helpful assistant for venue booking. Be friendly, concise, and helpful.

ABOUT SHIFTSDEAL:
- ShiftsDeal is India's leading venue discovery and booking platform
- Based in Delhi, India
- Operating across major Indian cities (Delhi, Mumbai, Bangalore, Hyderabad, etc.)
- All venues are in India, prices in INR (₹)
- Contact: team.shiftsdeal@gmail.com, +91 99909 44319

CONTEXT:
- User Role: ${context.role || 'guest visitor'}
- Current Page: ${context.page || 'home'}
- Active Filters: ${JSON.stringify(context.filters || {})}${historyContext}

USER MESSAGE: "${message}"

Help the user with:
- Finding suitable venues in India (suggest filters, recommend exploring options)
- Understanding the booking process
- Answering questions about ShiftsDeal platform
- Providing tips for event planning in India
- Remember previous messages and build on the conversation

Be conversational but efficient. If they're searching, help narrow down options.
If they have booking questions, explain the 5-step process (Details → KYC → Risk Assessment → Contract → Confirm).

IMPORTANT: Always remember we are based in Delhi, India and serve Indian venues. Mention Indian cities when relevant.

Return JSON:
{
  "response": "Your helpful, conversational response (2-3 sentences max)",
  "suggestions": ["Optional clickable suggestion 1", "Optional clickable suggestion 2"],
  "action": null or { "type": "search" | "navigate", "payload": { "filters": {...} or "path": "..." } }
}

Only return valid JSON.
  `.trim();

  const fallback: ConciergeResponse = {
    response: "Hey! I'm here to help you find the perfect venue. Tell me about your event - what type of space are you looking for, and roughly how many guests?",
    suggestions: ['Browse venues', 'How booking works'],
    action: null
  };

  return ai.generateJSON<ConciergeResponse>(prompt, fallback);
}

export async function getVenueRecommendations(venues: Array<{
  name: string;
  type: string;
  pricing?: { fullDay: number };
  capacity?: { max: number };
  rating: number;
}>, userPreferences: {
  eventType?: string;
  capacity?: number | string;
  budget?: number | string;
  priority?: string;
}): Promise<VenueRecommendations | null> {
  const ai = getAI();
  
  const venueList = venues.slice(0, 10).map((v, i) => 
    `${i + 1}. ${v.name} - ${v.type}, ₹${v.pricing?.fullDay || 'N/A'}/day, ${v.capacity?.max || 'N/A'} capacity, ${v.rating}★`
  ).join('\n');
  
  const prompt = `
Rank these venues based on user preferences for ShiftsDeal platform.

USER PREFERENCES:
- Event Type: ${userPreferences.eventType || 'general event'}
- Capacity Needed: ${userPreferences.capacity || 'flexible'}
- Budget: ${userPreferences.budget || 'flexible'}
- Priority: ${userPreferences.priority || 'best value'}

AVAILABLE VENUES:
${venueList}

Consider:
1. How well each venue matches the event type
2. Capacity fit (not too small, not wastefully large)
3. Value for money based on budget
4. Overall ratings

Return JSON:
{
  "rankings": [
    {
      "venueIndex": number (0-based index),
      "score": number (0-100),
      "reason": "One sentence explaining why this ranking"
    }
  ],
  "topPick": {
    "venueIndex": number (0-based),
    "reason": "Clear explanation of why this is the best choice for the user"
  }
}

Only return valid JSON.
  `.trim();

  const fallback: VenueRecommendations = {
    rankings: venues.slice(0, 5).map((_, i) => ({
      venueIndex: i,
      score: 90 - (i * 10),
      reason: 'Matches your search criteria'
    })),
    topPick: {
      venueIndex: 0,
      reason: 'Best overall match for your requirements'
    }
  };

  return ai.generateJSON<VenueRecommendations>(prompt, fallback);
}
