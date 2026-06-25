import Groq from 'groq-sdk';

// Types for AI responses
export interface SearchFilters {
  city: string | null;
  venueType: string | null;
  capacity: number | null;
  budget: { min: number | null; max: number | null };
  date: string | null;
  amenities: string[];
  eventType: string | null;
}

export interface VenueSuitability {
  suitabilityScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  capacityAnalysis: string;
  amenitiesAnalysis: string;
  budgetAnalysis: string;
}

export interface KYCResult {
  verified: boolean;
  documentType: 'PAN' | 'GST' | 'Aadhaar' | 'Company Registration' | 'Unknown';
  extractedName: string | null;
  extractedId: string | null;
  extractedInfo?: Record<string, any>;
  nameMatch: boolean;
  riskScore: number;
  flags: string[];
  notes: string;
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  depositPercentage: number;
  insuranceRequired: boolean;
  concerns: string[];
  mitigations: string[];
  notes: string;
}

export interface ContractSection {
  heading: string;
  content: string;
}

export interface Contract {
  title: string;
  sections: ContractSection[];
  generatedAt: string;
}

export interface ConciergeResponse {
  response: string;
  suggestions: string[];
  action: { type: 'search' | 'navigate'; payload: Record<string, unknown> } | null;
}

export interface VenueRanking {
  venueIndex: number;
  score: number;
  reason: string;
}

export interface VenueRecommendations {
  rankings: VenueRanking[];
  topPick: {
    venueIndex: number;
    reason: string;
  };
}

// AI Provider interface
export interface AIProvider {
  name: string;
  generateJSON<T>(prompt: string, fallback: T): Promise<T>;
  generateJSONWithImage<T>(prompt: string, base64Image: string, mimeType: string, fallback: T): Promise<T>;
}

// Groq Provider Implementation
class GroqProvider implements AIProvider {
  name = 'Groq';
  private client: Groq;
  private model: string;

  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY || '',
    });
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  async generateJSON<T>(prompt: string, fallback: T): Promise<T> {
    try {
      console.log('\n=== GROQ API PROMPT ===');
      console.log(prompt.substring(0, 500) + '...');
      
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Always respond with valid JSON only, no markdown formatting, no explanations, just the JSON object.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: this.model,
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content || '';
      
      console.log('\\n=== GROQ RAW RESPONSE ===');
      console.log(response);
      console.log('========================\\n');
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as T;
        console.log('=== PARSED JSON ===');
        console.log(JSON.stringify(parsed, null, 2));
        console.log('===================\\n');
        return parsed;
      }
      console.log('⚠️ No JSON found in response, using fallback');
      return fallback;
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return fallback;
    }
  }

  async generateJSONWithImage<T>(prompt: string, base64Image: string, mimeType: string, fallback: T): Promise<T> {
    try {
      console.log('\\n=== GROQ VISION API CALL ===');
      
      const completion = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that can analyze images. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ] as any,
          },
        ],
        model: 'llama-3.2-90b-vision-preview',
        temperature: 0.5,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content || '';
      console.log('Vision API Response:', response);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return fallback;
    } catch (error) {
      console.error(`[${this.name}] Vision Error:`, error);
      return fallback;
    }
  }
}

// Gemini Provider Implementation (kept as fallback)
class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private model: any;
  private initialized = false;

  private async init() {
    if (this.initialized) return;
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.initialized = true;
    } catch (error) {
      console.error('[Gemini] Init error:', error);
    }
  }

  async generateJSON<T>(prompt: string, fallback: T): Promise<T> {
    try {
      await this.init();
      if (!this.model) return fallback;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return fallback;
    } catch (error) {
      console.error(`[${this.name}] Error:`, error);
      return fallback;
    }
  }

  async generateJSONWithImage<T>(prompt: string, base64Image: string, mimeType: string, fallback: T): Promise<T> {
    try {
      await this.init();
      if (!this.model) return fallback;

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = result.response.text();
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      return fallback;
    } catch (error) {
      console.error(`[${this.name}] Vision Error:`, error);
      return fallback;
    }
  }
}

// Get the active AI provider based on env config
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'groq';
  
  if (provider === 'gemini') {
    return new GeminiProvider();
  }
  
  return new GroqProvider();
}

// Singleton instance
let aiProviderInstance: AIProvider | null = null;

export function getAI(): AIProvider {
  if (!aiProviderInstance) {
    aiProviderInstance = getAIProvider();
  }
  return aiProviderInstance;
}
