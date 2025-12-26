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
