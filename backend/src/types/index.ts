// EndlessMedical API Types
export interface EndlessMedicalSession {
  SessionID: string;
  createdAt: Date;
  expiresAt: Date;
  termsAccepted: boolean;
}

export interface SymptomDetail {
  name: string;
  duration?: number;        // Duration in days
  intensity?: number;       // Scale 1-10
  frequency?: 'constant' | 'intermittent' | 'occasional';
}

export interface PatientProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  weight?: number;          // kg
  height?: number;          // cm
  bmi?: number;             // calculated
  medicalHistory?: string[];  // ['diabetes', 'hypertension', etc.]
  allergies?: string[];     // ['penicillin', 'pollen', etc.]
  currentMedications?: string[];
  smoker?: boolean;
  pregnant?: boolean;
}

export interface DiagnosisRequest {
  symptoms: string[] | SymptomDetail[];  // Support both formats
  patientProfile?: PatientProfile;
  age?: number;  // Deprecated, use patientProfile
  gender?: 'male' | 'female' | 'other';  // Deprecated
  duration?: string;
  otherFeatures?: Record<string, string | number>;
}

export interface Disease {
  name: string;
  probability: number;
  rank: number;
  riskLevel?: 'high' | 'medium' | 'low' | 'emergency';
  variableImportances?: Array<{
    feature: string;
    importance: number;
  }>;
}

export interface DiagnosisResult {
  sessionId: string;
  diseases: Disease[];
  suggestedTests?: string[];
  suggestedQuestions?: string[];
  enrichedDiseases?: EnrichedDisease[];
  disclaimer: string;
  timestamp: Date;
  isEmergency?: boolean;           // Emergency detected
  emergencyReason?: string;        // Why it's an emergency
}

export interface EnrichedDisease {
  name: string;
  probability: number;
  description: string;
  treatments: string[];
  whenToSeeDoctorUrgently: string[];
  commonCauses: string[];
  relatedTests: string[];
}

export interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SymptomSearchResult {
  id: string;
  name: string;
  category: string;
  frequency?: string;
}

// Emergency Detection
export const EMERGENCY_SYMPTOMS = [
  'chest pain',
  'severe chest pain',
  'difficulty breathing',
  'shortness of breath',
  'severe dyspnea',
  'loss of consciousness',
  'unconscious',
  'confusion',
  'severe bleeding',
  'heavy bleeding',
  'severe abdominal pain',
  'sudden severe headache',
  'paralysis',
  'weakness in limbs',
  'seizure',
  'convulsion',
  'stroke symptoms',
  'heart attack',
  'anaphylaxis',
  'severe allergic reaction'
] as const;
