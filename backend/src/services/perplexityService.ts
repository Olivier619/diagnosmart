import axios, { AxiosInstance } from 'axios';
import { PerplexityResponse, EnrichedDisease } from '../types';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  PERPLEXITY_API_KEY not set');
    }

    this.client = axios.create({
      baseURL: PERPLEXITY_API_URL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000,
    });
  }

  async enrichDisease(diseaseName: string, probability: number): Promise<EnrichedDisease | null> {
    try {
      const prompt = `You are a medical information provider. Give a concise, accurate response about: ${diseaseName}

Please provide ONLY JSON in this exact format:
{
  "description": "Brief medical description (1-2 sentences)",
  "treatments": ["Treatment option 1", "Treatment option 2", "Treatment option 3"],
  "whenToSeeDoctorUrgently": ["Symptom warning 1", "Symptom warning 2"],
  "commonCauses": ["Cause 1", "Cause 2"],
  "relatedTests": ["Test 1", "Test 2", "Test 3"]
}

Be accurate and concise. No markdown, only JSON.`;

      const response = await this.client.post('', {
        model: 'sonar',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.2,
        max_tokens: 500
      });

      const content = response.data.choices.message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return null;
      }

      const enrichedData = JSON.parse(jsonMatch);

      return {
        name: diseaseName,
        probability,
        description: enrichedData.description || '',
        treatments: enrichedData.treatments || [],
        whenToSeeDoctorUrgently: enrichedData.whenToSeeDoctorUrgently || [],
        commonCauses: enrichedData.commonCauses || [],
        relatedTests: enrichedData.relatedTests || []
      };
    } catch (error) {
      console.error(`Error enriching disease ${diseaseName}:`, error);
      return null;
    }
  }

  async enrichDiseases(diseases: Array<{ name: string; probability: number }>): Promise<EnrichedDisease[]> {
    const enriched: EnrichedDisease[] = [];

    for (const disease of diseases) {
      const enrichedData = await this.enrichDisease(disease.name, disease.probability);
      if (enrichedData) {
        enriched.push(enrichedData);
      }
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return enriched;
  }

  async generateTreatmentAdvice(diseaseName: string): Promise<string> {
    try {
      const prompt = `Give specific, practical medical advice for ${diseaseName}. Include when to see a doctor immediately.`;

      const response = await this.client.post('', {
        model: 'sonar',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 300
      });

      return response.data.choices.message.content;
    } catch (error) {
      console.error(`Error generating treatment advice for ${diseaseName}:`, error);
      return '';
    }
  }
}

export const perplexityService = new PerplexityService();
