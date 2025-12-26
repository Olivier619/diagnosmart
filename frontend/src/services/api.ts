import axios from 'axios';

// --- Types intégrés directement pour éviter l'erreur d'import ---
export interface Symptom {
  id: string;
  name: string;
  category?: string;
}

export interface Disease {
  name: string;
  probability: number;
  rank: number;
  variableImportances?: any[];
}

export interface EnrichedDisease extends Disease {
  description: string;
  treatments: string[];
  whenToSeeDoctorUrgently: string[];
  relatedTests: string[];
}

export interface DiagnosisResult {
  sessionId: string;
  diseases: Disease[];
  suggestedTests?: string[];
  enrichedDiseases?: EnrichedDisease[];
}
// -----------------------------------------------------------

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

export const apiService = {
  // Initialiser une session
  initDiagnosis: async (): Promise<string> => {
    const res = await axios.post(`${API_URL}/diagnosis/init`);
    return res.data.sessionId;
  },

  // Ajouter un symptôme
  addSymptom: async (sessionId: string, symptom: string) => {
    await axios.post(`${API_URL}/diagnosis/add-symptom`, {
      sessionId,
      symptom,
      value: 'present'
    });
  },

  // Supprimer un symptôme
  removeSymptom: async (sessionId: string, symptom: string) => {
    await axios.post(`${API_URL}/diagnosis/remove-symptom`, {
      sessionId,
      symptom
    });
  },

  // Lancer l'analyse
  analyze: async (sessionId: string, age?: number, gender?: string): Promise<DiagnosisResult> => {
    const res = await axios.post(`${API_URL}/diagnosis/analyze`, {
      sessionId,
      age,
      gender
    });
    return res.data;
  },

  // Chercher des symptômes
  searchSymptoms: async (query: string) => {
    const res = await axios.get(`${API_URL}/symptoms/search`, {
      params: { q: query }
    });
    return res.data.symptoms;
  }
};
