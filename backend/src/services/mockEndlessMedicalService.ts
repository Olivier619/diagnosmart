import { Disease } from '../types';

export class MockEndlessMedicalService {
    private sessions: Set<string> = new Set();

    async initSession(): Promise<string> {
        const sessionId = 'mock-session-' + Math.random().toString(36).substring(7);
        this.sessions.add(sessionId);
        console.log(`[Mock] Session initialized: ${sessionId}`);
        return sessionId;
    }

    async acceptTermsOfUse(sessionId: string): Promise<boolean> {
        console.log(`[Mock] Terms accepted for session: ${sessionId}`);
        return true;
    }

    async updateFeature(sessionId: string, name: string, value: string | number): Promise<boolean> {
        console.log(`[Mock] Feature updated for ${sessionId}: ${name} = ${value}`);
        return true;
    }

    async deleteFeature(sessionId: string, name: string): Promise<boolean> {
        console.log(`[Mock] Feature deleted for ${sessionId}: ${name}`);
        return true;
    }

    async analyze(sessionId: string): Promise<Disease[]> {
        console.log(`[Mock] Analyze called for ${sessionId}`);
        return [
            {
                name: 'Viral Upper Respiratory Tract Infection',
                probability: 85,
                rank: 1,
                variableImportances: []
            },
            {
                name: 'Influenza',
                probability: 60,
                rank: 2,
                variableImportances: []
            },
            {
                name: 'Common Cold',
                probability: 45,
                rank: 3,
                variableImportances: []
            },
            {
                name: 'Allergic Rhinitis',
                probability: 30,
                rank: 4,
                variableImportances: []
            },
            {
                name: 'COVID-19',
                probability: 25,
                rank: 5,
                variableImportances: []
            }
        ];
    }

    async getSuggestedTests(sessionId: string): Promise<string[]> {
        console.log(`[Mock] GetSuggestedTests called for ${sessionId}`);
        return ['Complete Blood Count', 'Chest X-Ray', 'Influenza Rapid Test'];
    }

    async getSuggestedFeatures(sessionId: string, type: 'PatientProvided' | 'PhysicianProvided' = 'PatientProvided'): Promise<string[]> {
        console.log(`[Mock] GetSuggestedFeatures called for ${sessionId}`);
        return ['Cough', 'Fever', 'Headache', 'Sore Throat', 'Fatigue'];
    }
}

export const mockEndlessMedicalService = new MockEndlessMedicalService();
