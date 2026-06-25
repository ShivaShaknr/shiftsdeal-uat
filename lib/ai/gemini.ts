import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function parseSearchQuery(query: string) {
  const prompt = `
    Parse this venue search query and extract structured filters.
    Query: "${query}"
    
    Return a JSON object with these fields (use null for unknown):
    {
      "city": string or null,
      "venueType": one of ["training-hall", "auditorium", "conference-room", "workshop-space", "banquet-hall", "hotel-venue"] or null,
      "capacity": number or null,
      "budget": { "min": number or null, "max": number or null },
      "date": string (YYYY-MM-DD) or null,
      "amenities": string[] or [],
      "eventType": string or null
    }
    
    Only return valid JSON, no markdown or explanation.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI Search Parse Error:', error);
    return null;
  }
}

export async function analyzeVenueSuitability(venue: any, eventDetails: any) {
  const prompt = `
    Analyze how suitable this venue is for the event.
    
    Venue:
    - Name: ${venue.name}
    - Type: ${venue.type}
    - Capacity: ${venue.capacity.min}-${venue.capacity.max}
    - Amenities: ${venue.amenities.join(', ')}
    - Price: ₹${venue.pricing.fullDay}/day
    
    Event:
    - Type: ${eventDetails.eventType}
    - Attendees: ${eventDetails.attendees}
    - Description: ${eventDetails.description || 'Not provided'}
    
    Return JSON:
    {
      "score": number (0-100),
      "summary": "One sentence explaining fit",
      "pros": ["strength 1", "strength 2", "strength 3"],
      "cons": ["concern 1", "concern 2"],
      "recommendation": "Brief recommendation"
    }
    
    Only return valid JSON.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI Suitability Error:', error);
    return null;
  }
}

export async function performKYCVerification(documentText: string, organizationName: string) {
  const prompt = `
    Verify this KYC document for venue booking.
    
    Organization: ${organizationName}
    Document Content: ${documentText}
    
    Analyze and return JSON:
    {
      "verified": boolean,
      "documentType": "PAN" | "GST" | "Aadhaar" | "Company Registration" | "Unknown",
      "extractedName": string or null,
      "extractedId": string or null,
      "riskScore": number (0-100, higher = more risk),
      "flags": ["any concerns"],
      "notes": "Brief verification notes"
    }
    
    Only return valid JSON.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI KYC Error:', error);
    return null;
  }
}

export async function assessBookingRisk(bookingDetails: any) {
  const prompt = `
    Assess the risk level for this venue booking.
    
    Booking Details:
    - Event Type: ${bookingDetails.eventType}
    - Attendees: ${bookingDetails.attendees}
    - Organization: ${bookingDetails.organizationName}
    - Venue Type: ${bookingDetails.venueType}
    - Venue Value: ₹${bookingDetails.venuePrice}
    - KYC Verified: ${bookingDetails.kycVerified}
    
    Consider: crowd size, event type risks, damage potential, liability issues.
    
    Return JSON:
    {
      "riskLevel": "low" | "medium" | "high",
      "depositPercentage": number (10-50),
      "insuranceRequired": boolean,
      "concerns": ["list of specific concerns"],
      "mitigations": ["suggested mitigations"],
      "notes": "Brief risk assessment"
    }
    
    Only return valid JSON.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI Risk Error:', error);
    return null;
  }
}

export async function generateContract(bookingDetails: any) {
  const prompt = `
    Generate a professional venue booking contract.
    
    Details:
    - Venue: ${bookingDetails.venueName}
    - Address: ${bookingDetails.venueAddress}
    - Renter: ${bookingDetails.organizationName}
    - Contact: ${bookingDetails.contactName}
    - Event: ${bookingDetails.eventName}
    - Date: ${bookingDetails.date}
    - Time: ${bookingDetails.startTime} - ${bookingDetails.endTime}
    - Attendees: ${bookingDetails.attendees}
    - Total Amount: ₹${bookingDetails.totalAmount}
    - Deposit: ₹${bookingDetails.depositAmount}
    - Risk Level: ${bookingDetails.riskLevel}
    
    Generate a formal contract with:
    1. Parties (ShiftsDeal as facilitator, NOT liable)
    2. Booking Details
    3. Payment Terms
    4. Cancellation Policy
    5. Damage & Liability (Renter responsible)
    6. Conduct Rules
    7. Dispute Resolution
    8. Signatures Section
    
    Return JSON:
    {
      "title": "Venue Booking Agreement",
      "sections": [
        {
          "heading": "Section Title",
          "content": "Section content..."
        }
      ],
      "generatedAt": "ISO date string"
    }
    
    Only return valid JSON.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI Contract Error:', error);
    return null;
  }
}

export async function getConciergeResponse(message: string, context: any) {
  const prompt = `
    You are the ShiftsDeal AI Concierge. Help users find and book venues.
    
    Context:
    - User Role: ${context.role || 'guest'}
    - Current Page: ${context.page || 'home'}
    - Search Filters: ${JSON.stringify(context.filters || {})}
    
    User Message: "${message}"
    
    Respond helpfully and concisely. If they're looking for venues, suggest filters or recommend exploring our options.
    If they have booking questions, explain the process clearly.
    
    Return JSON:
    {
      "response": "Your helpful response",
      "suggestions": ["Optional action suggestion 1", "Optional action suggestion 2"],
      "action": null or { "type": "search" | "navigate", "payload": {} }
    }
    
    Only return valid JSON.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { response: "I'm here to help you find the perfect venue. What are you looking for?", suggestions: [] };
  } catch (error) {
    console.error('AI Concierge Error:', error);
    return { response: "I'm here to help you find the perfect venue. What are you looking for?", suggestions: [] };
  }
}

export async function getVenueRecommendations(venues: any[], userPreferences: any) {
  const prompt = `
    Rank these venues based on user preferences.
    
    User Preferences:
    - Event Type: ${userPreferences.eventType || 'general'}
    - Capacity Needed: ${userPreferences.capacity || 'any'}
    - Budget: ${userPreferences.budget || 'any'}
    - Priority: ${userPreferences.priority || 'value'}
    
    Venues:
    ${venues.slice(0, 10).map((v, i) => `${i + 1}. ${v.name} - ${v.type}, ₹${v.pricing?.fullDay}/day, ${v.capacity?.max} capacity, ${v.rating}★`).join('\n')}
    
    Return JSON:
    {
      "rankings": [
        {
          "venueIndex": number (0-based),
          "score": number (0-100),
          "reason": "Brief reason"
        }
      ],
      "topPick": {
        "venueIndex": number,
        "reason": "Why this is the best choice"
      }
    }
    
    Only return valid JSON.
  `;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    return null;
  }
}
