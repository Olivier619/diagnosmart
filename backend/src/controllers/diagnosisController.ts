import { Request, Response } from 'express';
import axios from 'axios';
import { SymptomDetail, EMERGENCY_SYMPTOMS } from '../types';

// --- CONFIGURATION ---
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
// IMPORTANT: Assurez-vous que cette clé est bien dans votre .env
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// --- STOCKAGE MÉMOIRE ---
const sessionSymptoms = new Map<string, SymptomDetail[]>();

export const diagnosisController = {

  // 1. INIT
  initSession: async (req: Request, res: Response) => {
    // Génère un ID aléatoire
    const sessionId = 'session-' + Math.random().toString(36).substring(2, 9);
    sessionSymptoms.set(sessionId, []);
    console.log(`🟢 Nouvelle session: ${sessionId}`);
    res.json({ sessionId, status: 'created' });
  },

  // 2. ADD
  addSymptom: async (req: Request, res: Response) => {
    const { sessionId, symptom, duration, intensity } = req.body;

    // Ajout avec détails (durée, intensité)
    const current = sessionSymptoms.get(sessionId) || [];

    const symptomDetail: SymptomDetail = {
      name: symptom,
      duration: duration || undefined,
      intensity: intensity || undefined
    };

    // Vérifier si le symptôme n'existe pas déjà
    if (symptom && !current.find(s => s.name === symptom)) {
      current.push(symptomDetail);
      sessionSymptoms.set(sessionId, current);
    }

    console.log(`📝 Symptôme ajouté: ${symptom} (durée: ${duration}j, intensité: ${intensity}/10)`);
    res.json({ success: true });
  },

  // 3. REMOVE
  // 3. REMOVE
  removeSymptom: async (req: Request, res: Response) => {
    const { sessionId, symptom } = req.body;
    const current = sessionSymptoms.get(sessionId) || [];
    
    // Filtrer pour retirer le symptôme spécifié
    const updated = current.filter(s => s.name !== symptom);
    sessionSymptoms.set(sessionId, updated);
    
    console.log(`🗑️ Symptôme retiré: ${symptom}`);
    res.json({ success: true });
  },

  // 4. ANALYZE (Enhanced with emergency detection)
  analyzeDiagnosis: async (req: Request, res: Response) => {
    const { sessionId, age, gender, weight, height, bmi, medicalHistory, allergies } = req.body;
    const symptoms = sessionSymptoms.get(sessionId) || [];

    if (symptoms.length === 0) {
      return res.json({
        diseases: [],
        enrichedDiseases: [],
        disclaimer: "⚠️ AVIS IMPORTANT: Cet outil est uniquement informatif et ne remplace PAS un diagnostic médical professionnel. Consultez toujours un médecin."
      });
    }

    // 🚨 DÉTECTION D'URGENCE
    let isEmergency = false;
    let emergencyReason = '';

    for (const symptom of symptoms) {
      const symptomLower = symptom.name.toLowerCase();

      // Vérifier si c'est un symptôme d'urgence
      if (EMERGENCY_SYMPTOMS.some(emergency => symptomLower.includes(emergency))) {
        isEmergency = true;
        emergencyReason = `Symptôme critique détecté: ${symptom.name}`;
        break;
      }

      // Vérifier l'intensité (>= 9 = urgence)
      if (symptom.intensity && symptom.intensity >= 9) {
        isEmergency = true;
        emergencyReason = `Intensité critique (${symptom.intensity}/10) pour: ${symptom.name}`;
        break;
      }
    }

    console.log(`🧠 Analyse IA pour: ${symptoms.map(s => s.name).join(', ')}`);
    if (isEmergency) {
      console.log(`🚨 URGENCE DÉTECTÉE: ${emergencyReason}`);
    }

    try {
      if (!PERPLEXITY_API_KEY) {
        console.error("❌ CLÉ API MANQUANTE !");
        return res.status(500).json({ error: "Clé API non configurée" });
      }

      // Construction du prompt enrichi avec durée, intensité et profil patient
      let symptomDetails = symptoms.map(s => {
        let detail = s.name;
        if (s.duration) detail += ` (depuis ${s.duration} jours)`;
        if (s.intensity) detail += ` [intensité: ${s.intensity}/10]`;
        return detail;
      }).join(', ');

      // Informations patient
      let patientInfo = `Patient: ${age || 30} ans`;
      if (gender) patientInfo += `, ${gender === 'male' ? 'Homme' : gender === 'female' ? 'Femme' : 'Autre'}`;
      if (weight && height) patientInfo += `, ${weight}kg, ${height}cm`;
      if (bmi) patientInfo += `, IMC: ${bmi}`;

      let additionalInfo = '';
      if (medicalHistory && medicalHistory.length > 0) {
        additionalInfo += `\nAntécédents médicaux: ${medicalHistory.join(', ')}`;
      }
      if (allergies && allergies.length > 0) {
        additionalInfo += `\nAllergies connues: ${allergies.join(', ')}`;
      }

      const userMessage = `${patientInfo}${additionalInfo}
Symptômes détaillés: ${symptomDetails}. 
Trouve 3 diagnostics probables. 
Réponds UNIQUEMENT en JSON format: 
{ 
  "diseases": [
    { 
      "name": "Nom de la maladie", 
      "probability": 75, 
      "description": "Description courte", 
      "treatments": ["Traitement 1", "Traitement 2"], 
      "whenToSeeDoctorUrgently": ["Signe d'alerte 1", "Signe d'alerte 2"] 
    }
  ] 
}`;

      const response = await axios.post(
        PERPLEXITY_API_URL,
        {
          model: 'sonar',
          messages: [
            { role: 'system', content: 'Tu es un assistant médical qui répond uniquement en JSON strict.' },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': 'Bearer ' + PERPLEXITY_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // Récupération et nettoyage du contenu
      let content = response.data.choices[0].message.content;

      // Nettoyage manuel simple
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;

      if (jsonStart !== -1 && jsonEnd !== -1) {
        content = content.substring(jsonStart, jsonEnd);
      }

      const result = JSON.parse(content);

      // Formatage pour le frontend
      const enrichedDiseases = result.diseases.map((d: any, i: number) => ({
        ...d,
        rank: i + 1
      }));

      console.log("✅ Analyse réussie !");

      res.json({
        sessionId,
        diseases: [],
        enrichedDiseases: enrichedDiseases,
        suggestedTests: [],
        isEmergency,
        emergencyReason: isEmergency ? emergencyReason : undefined,
        disclaimer: "⚠️ AVIS IMPORTANT: Cet outil est uniquement informatif et ne remplace PAS un diagnostic médical professionnel. Consultez toujours un médecin. En cas d'urgence, appelez le 15 (SAMU) ou le 112."
      });

    } catch (error: any) {
      console.error("❌ Erreur:", error.message);
      if (error.response) {
        console.error("Détails:", error.response.data);
      }
      res.status(500).json({ error: "Erreur IA" });
    }
  },

  getSuggestedFeatures: async (req: Request, res: Response) => {
    res.json({ features: [] });
  },

  getSuggestedTests: async (req: Request, res: Response) => {
    res.json({ tests: [] });
  }
};
