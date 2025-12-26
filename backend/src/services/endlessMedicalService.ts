import axios, { AxiosInstance } from 'axios';
import { EndlessMedicalSession, Disease } from '../types';
import { mockEndlessMedicalService } from './mockEndlessMedicalService';

const API_URL = 'https://api.endlessmedical.com/v1/dx';
const TERMS_PASSPHRASE = 'I have read, understood and I accept and agree to comply with the Terms of Use of EndlessMedicalAPI and Endless Medical services. The Terms of Use are available on endlessmedical.com';

export class EndlessMedicalService {
  private client: AxiosInstance;
  private sessions: Map<string, EndlessMedicalSession> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });
  }

  async initSession(): Promise<string> {
    try {
      const response = await this.client.get('/InitSession');

      if (response.data.status === 'error') {
        throw new Error(response.data.error);
      }

      const sessionId = response.data.SessionID;
      const session: EndlessMedicalSession = {
        SessionID: sessionId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
        termsAccepted: false
      };

      this.sessions.set(sessionId, session);
      return sessionId;
    } catch (error) {
      throw new Error(`Failed to initialize session: ${error}`);
    }
  }

  async acceptTermsOfUse(sessionId: string): Promise<boolean> {
    try {
      const response = await this.client.post('/AcceptTermsOfUse', null, {
        params: {
          SessionID: sessionId,
          passphrase: TERMS_PASSPHRASE
        }
      });

      if (response.data.status === 'ok') {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.termsAccepted = true;
          this.sessions.set(sessionId, session);
        }
        return true;
      }
      throw new Error(response.data.error || 'Failed to accept terms');
    } catch (error) {
      throw new Error(`Terms of Use acceptance failed: ${error}`);
    }
  }

  async updateFeature(sessionId: string, name: string, value: string | number): Promise<boolean> {
    try {
      const response = await this.client.post('/UpdateFeature', null, {
        params: {
          SessionID: sessionId,
          name,
          value
        }
      });

      if (response.data.status !== 'ok') {
        throw new Error(response.data.error || 'Failed to update feature');
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to update feature ${name}: ${error}`);
    }
  }

  async deleteFeature(sessionId: string, name: string): Promise<boolean> {
    try {
      const response = await this.client.post('/DeleteFeature', null, {
        params: {
          SessionID: sessionId,
          name
        }
      });

      if (response.data.status !== 'ok') {
        throw new Error(response.data.error || 'Failed to delete feature');
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to delete feature ${name}: ${error}`);
    }
  }

  async analyze(sessionId: string): Promise<Disease[]> {
    try {
      const response = await this.client.get('/Analyze', {
        params: { SessionID: sessionId }
      });

      if (response.data.status !== 'ok') {
        throw new Error(response.data.error || 'Analysis failed');
      }

      // Parse diseases from response
      const diseases: Disease[] = [];
      const diseaseData = response.data.Diseases || [];

      // Correction ici: gestion correcte des types pour la boucle
      if (Array.isArray(diseaseData)) {
        diseaseData.forEach((item: any, index: number) => {
          // item est un objet du type { "Maladie": "Probabilité" }
          const name = Object.keys(item)[0];
          const probabilityStr = Object.values(item)[0] as string;
          const probability = parseFloat(probabilityStr);

          // Correction de l'accès à VariableImportances
          let importances: any[] = [];
          if (response.data.VariableImportances && response.data.VariableImportances[index]) {
            const importanceObj = response.data.VariableImportances[index];
            // Vérifier si le nom de la maladie existe comme clé
            if (importanceObj[name]) {
              importances = importanceObj[name];
            }
          }

          diseases.push({
            name,
            probability: Math.round(probability * 100),
            rank: index + 1,
            variableImportances: importances
          });
        });
      }

      return diseases.slice(0, 5); // Top 5 diseases
    } catch (error) {
      throw new Error(`Analysis failed: ${error}`);
    }
  }

  async getSuggestedTests(sessionId: string): Promise<string[]> {
    try {
      const response = await this.client.get('/GetSuggestedTests', {
        params: { SessionID: sessionId }
      });

      if (response.data.status !== 'ok') {
        throw new Error(response.data.error);
      }

      return response.data.Tests || [];
    } catch (error) {
      throw new Error(`Failed to get suggested tests: ${error}`);
    }
  }

  async getSuggestedFeatures(sessionId: string, type: 'PatientProvided' | 'PhysicianProvided' = 'PatientProvided'): Promise<string[]> {
    try {
      const endpoint = `/GetSuggestedFeatures_${type}`;
      const response = await this.client.get(endpoint, {
        params: { SessionID: sessionId }
      });

      if (response.data.status !== 'ok') {
        throw new Error(response.data.error);
      }

      return response.data.SuggestedFeatures || [];
    } catch (error) {
      throw new Error(`Failed to get suggested features: ${error}`);
    }
  }
}

const useMock = process.env.USE_MOCK_API === 'true';

export const endlessMedicalService = useMock
  ? (mockEndlessMedicalService as unknown as EndlessMedicalService)
  : new EndlessMedicalService();
