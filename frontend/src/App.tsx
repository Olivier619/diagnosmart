import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- DÉFINITIONS LOCALES ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Disease {
  name: string;
  probability: number;
  rank: number;
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
  isEmergency?: boolean;
  emergencyReason?: string;
  disclaimer?: string;
}

export interface SymptomDetail {
  name: string;
  duration?: number;
  intensity?: number;
}

export interface PatientProfile {
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  medicalHistory?: string[];
  allergies?: string[];
}

const apiService = {
  initDiagnosis: async (): Promise<string> => {
    const res = await axios.post(`${API_URL}/diagnosis/init`);
    return res.data.sessionId;
  },

  addSymptom: async (sessionId: string, symptom: string, duration?: number, intensity?: number) => {
    await axios.post(`${API_URL}/diagnosis/add-symptom`, {
      sessionId,
      symptom,
      duration,
      intensity,
      value: 'present'
    });
  },

  removeSymptom: async (sessionId: string, symptom: string) => {
    await axios.post(`${API_URL}/diagnosis/remove-symptom`, {
      sessionId,
      symptom
    });
  },

  analyze: async (sessionId: string, profile: PatientProfile): Promise<DiagnosisResult> => {
    const res = await axios.post(`${API_URL}/diagnosis/analyze`, {
      sessionId,
      ...profile
    });
    return res.data;
  },

  getBaseUrl: () => API_URL
};

// Listes prédéfinies
const MEDICAL_HISTORY_OPTIONS = [
  'Diabète',
  'Hypertension',
  'Asthme',
  'Allergies saisonnières',
  'Maladie cardiaque',
  'Problèmes thyroïdiens',
  'Dépression/Anxiété',
  'Arthrite'
];

const ALLERGY_OPTIONS = [
  'Pénicilline',
  'Aspirine',
  'Pollen',
  'Acariens',
  'Lactose',
  'Gluten',
  'Fruits à coque',
  'Fruits de mer'
];

// Composant Graphique Circulaire
const ProbabilityChart = ({ probability }: { probability: number }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (probability / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="90" height="90" className="transform -rotate-90">
        <circle
          cx="45" cy="45" r={radius}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-gray-200 dark:text-gray-700 opacity-30"
        />
        <circle
          cx="45" cy="45" r={radius}
          stroke="url(#gradient)"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
          {probability}%
        </span>
      </div>
    </div>
  );
};



function App() {
  // Mode text / bar sizing constants
  const MODE_TEXT_HEIGHT = '1.4rem'; // height used for the mode text line
  const MODE_BAR_HEIGHT = `calc(${MODE_TEXT_HEIGHT} + 4px)`; // +2px top +2px bottom
  const HEADER_PADDING_TOP = `calc(${MODE_BAR_HEIGHT} / 2)`; // ensure header content is centered relative to bar

  // Probability bar sizing (used under each disease entry)
  const PROB_BAR_TEXT_HEIGHT = '0.75rem'; // base visual text height reference (approx 12px)
  const PROB_BAR_HEIGHT = `calc(${PROB_BAR_TEXT_HEIGHT} + 4px)`; // +2px top +2px bottom
  const PROB_BAR_BORDER_RADIUS = '9999px';

  // Generic band sizing for full-width animated bands (text-controlled)
  const BAND_TEXT_HEIGHT = '1rem'; // default text height for bands
  const BAND_HEIGHT = `calc(${BAND_TEXT_HEIGHT} + 4px)`; // +2px top +2px bottom
  const BAND_BORDER_RADIUS = '6px';

  const [symptomInput, setSymptomInput] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomDetail[]>([]);
  const [results, setResults] = useState<EnrichedDisease[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const [currentDuration, setCurrentDuration] = useState<number>(1);
  const [currentIntensity, setCurrentIntensity] = useState<number>(5);

  // Profil patient
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState<string>('');
  const [weight, setWeight] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [bmi, setBmi] = useState<number>(0);
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  // Calculer IMC automatiquement
  useEffect(() => {
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      const calculatedBmi = weight / (heightInMeters * heightInMeters);
      setBmi(Math.round(calculatedBmi * 10) / 10);
    } else {
      setBmi(0);
    }
  }, [weight, height]);

  // Charger le thème sauvegardé
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Set CSS variable --mode-text-size on the container based on the actual button font-size
  useEffect(() => {
    const setModeSize = () => {
      try {
        const btn = modeBtnRef.current;
        const container = containerRef.current;
        if (btn && container) {
          const fs = getComputedStyle(btn).fontSize || MODE_TEXT_HEIGHT;
          container.style.setProperty('--mode-text-size', fs);
        }
      } catch (e) {
        /* ignore */
      }
    };

    setModeSize();
    window.addEventListener('resize', setModeSize);
    return () => window.removeEventListener('resize', setModeSize);
  }, [MODE_TEXT_HEIGHT]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleAddSymptom = async () => {
    if (!symptomInput.trim()) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        currentSessionId = await apiService.initDiagnosis();
        setSessionId(currentSessionId);
      } catch (e: any) {
        console.error("Erreur init:", e);
        alert(`Erreur connexion backend:\nURL: ${apiService.getBaseUrl()}\nErreur: ${e.message}`);
        return;
      }
    }

    try {
      await apiService.addSymptom(currentSessionId!, symptomInput, currentDuration, currentIntensity);
      const newSymptom: SymptomDetail = {
        name: symptomInput,
        duration: currentDuration,
        intensity: currentIntensity
      };

      // Check if symptom already exists (update case)
      const existingIndex = selectedSymptoms.findIndex(s => s.name === symptomInput);
      if (existingIndex >= 0) {
        const updated = [...selectedSymptoms];
        updated[existingIndex] = newSymptom;
        setSelectedSymptoms(updated);
      } else {
        setSelectedSymptoms([...selectedSymptoms, newSymptom]);
      }

      setSymptomInput('');
      setCurrentDuration(1);
      setCurrentIntensity(5);
    } catch (e) {
      alert("Erreur ajout symptôme");
    }
  };

  const handleDeleteSymptom = async (symptomName: string) => {
    if (!sessionId) return;
    try {
      await apiService.removeSymptom(sessionId, symptomName);
      setSelectedSymptoms(selectedSymptoms.filter(s => s.name !== symptomName));
    } catch (e) {
      console.error("Erreur suppression", e);
      alert("Impossible de supprimer le symptôme");
    }
  };

  const handleEditSymptom = (s: SymptomDetail) => {
    setSymptomInput(s.name);
    setCurrentDuration(s.duration || 1);
    setCurrentIntensity(s.intensity || 5);
    // Optionally remove it from list immediately or wait for update?
    // Let's remove it so it feels like "moving to edit mode"
    handleDeleteSymptom(s.name);
  };

  const handleAnalyze = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const profile: PatientProfile = {
        age: age || undefined,
        gender: gender || undefined,
        weight: weight || undefined,
        height: height || undefined,
        bmi: bmi || undefined,
        medicalHistory: medicalHistory.length > 0 ? medicalHistory : undefined,
        allergies: allergies.length > 0 ? allergies : undefined
      };

      const data = await apiService.analyze(sessionId, profile);
      setResults(data.enrichedDiseases || []);
      setDisclaimer(data.disclaimer || '');

      if (data.isEmergency) {
        setEmergencyMessage(data.emergencyReason || 'Symptômes critiques détectés');
        setShowEmergencyModal(true);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur analyse");
    }
    setLoading(false);
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'text-red-600 dark:text-red-400';
    if (intensity >= 5) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getBmiCategory = (bmiValue: number) => {
    if (bmiValue === 0) return { text: '-', color: 'text-gray-500' };
    if (bmiValue < 18.5) return { text: 'Insuffisance pondérale', color: 'text-blue-600 dark:text-blue-400' };
    if (bmiValue < 25) return { text: 'Normal', color: 'text-green-600 dark:text-green-400' };
    if (bmiValue < 30) return { text: 'Surpoids', color: 'text-orange-600 dark:text-orange-400' };
    return { text: 'Obésité', color: 'text-red-600 dark:text-red-400' };
  };

  const toggleMedicalHistory = (item: string) => {
    if (medicalHistory.includes(item)) {
      setMedicalHistory(medicalHistory.filter(h => h !== item));
    } else {
      setMedicalHistory([...medicalHistory, item]);
    }
  };

  const toggleAllergy = (item: string) => {
    if (allergies.includes(item)) {
      setAllergies(allergies.filter(a => a !== item));
    } else {
      setAllergies([...allergies, item]);
    }
  };

  const bmiCategory = getBmiCategory(bmi);

  return (
    <div className="min-h-screen p-4 md:p-8 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div ref={containerRef} className="max-w-7xl mx-auto relative">
        {/* Top gradient bar (controlled height) */}
        <div
          className="top-gradient-bar absolute left-0 right-0"
          style={{
            height: `calc(var(--mode-text-size, ${MODE_TEXT_HEIGHT}) + 4px)`,
            top: 0,
            zIndex: 0,
            borderRadius: BAND_BORDER_RADIUS,
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
        {/* Header */}
        <header className="mb-8 text-center relative" style={{ zIndex: 60, paddingTop: HEADER_PADDING_TOP }}>
          <div className="absolute top-0 left-0 flex flex-row items-center gap-3 pl-4">
            <button
              ref={modeBtnRef}
              onClick={toggleDarkMode}
              className="text-sm md:text-base font-bold theme-legend cursor-pointer transition-colors duration-200 ease-in-out border-2 border-transparent hover:shadow-md"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                height: MODE_TEXT_HEIGHT,
                lineHeight: MODE_TEXT_HEIGHT,
                // expose the button font-size as a CSS variable so the gradient bar can size itself
                ['--mode-text-size' as any]: '1em',
                color: darkMode ? '#ffffff' : 'var(--text-primary)',
                backgroundColor: darkMode ? '#14b8a6' : 'transparent',
                boxShadow: darkMode ? '0 2px 8px rgba(20,184,166,0.12)' : 'none',
                boxSizing: 'border-box',
                border: darkMode ? '2px solid #0ea5a4' : '2px solid transparent',
                position: 'relative',
                zIndex: 80,
                transition: 'border-color 200ms ease, box-shadow 200ms ease, background-color 200ms ease, padding 200ms ease'
              }}
              aria-label={`Basculer le thème. Actuellement ${darkMode ? 'sombre' : 'clair'}`}>
              Mode {darkMode ? 'Sombre' : 'Clair'} (nuit/jour)
            </button>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 animated-gradient bg-clip-text text-transparent" style={{ position: 'relative', zIndex: 70, color: 'var(--text-primary)' }}>
            DiagnoSmart 🏥
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'var(--text-secondary)', paddingTop: `calc((var(--mode-text-size, ${MODE_TEXT_HEIGHT}) + 4px) / 2)` }}>
            Assistant de diagnostic médical intelligent
          </p>
        </header>

        {/* Disclaimer Principal */}
        <div className="mb-6 p-6 rounded-xl shadow-lg border-4 relative overflow-hidden border-pulse"
          style={{
            background: darkMode
              ? 'linear-gradient(135deg, rgba(220, 20, 60, 0.15), rgba(239, 68, 68, 0.15))'
              : 'linear-gradient(135deg, #FEE2E2, #FECACA)',
            borderColor: '#DC143C'
          }}>

          {/* Croix Suisse en arrière-plan */}
          <div className="absolute top-4 right-4 opacity-10">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 bg-red-600 w-4 left-6"></div>
              <div className="absolute inset-0 bg-red-600 h-4 top-6"></div>
            </div>
          </div>

          <div className="flex items-start gap-4 relative z-10">
            <span className="text-4xl pulse-medical">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-red-800 dark:text-red-400 text-lg mb-2 flex items-center gap-2">
                🏥 AVIS MÉDICAL IMPORTANT
              </p>
              <p className="text-red-700 dark:text-red-300 mb-4 leading-relaxed">
                Cet outil est <strong>UNIQUEMENT informatif</strong> et ne remplace PAS un diagnostic médical professionnel.
                Consultez toujours un médecin.
              </p>

              {/* Boutons d'urgence cliquables */}
              <div className="flex flex-wrap gap-3">
                <a href="tel:144"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all hover:scale-105 glow-red"
                  aria-label="Appeler 144 - Urgence Suisse">
                  <svg width="40" height="28" viewBox="0 0 512 512" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect width="512" height="512" fill="#FF0000" />
                    {/* Swiss white cross: centered equal-arms */}
                    <rect x="196" y="96" width="120" height="320" fill="#fff" />
                    <rect x="96" y="196" width="320" height="120" fill="#fff" />
                  </svg>
                  <span>📞 Urgence Suisse: 144</span>
                </a>
                <a href="tel:112"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all hover:scale-105"
                  aria-label="Appeler 112 - Urgence Européenne">
                  <svg width="40" height="28" viewBox="0 0 48 32" className="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect width="48" height="32" fill="#003399" />
                    {/* 12 five-point stars arranged in a circle */}
                    <g fill="#FFCC00">
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(24 7) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(28.5 8.2) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(31.8 11.5) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(33 16) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(31.8 20.5) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(28.5 23.8) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(24 25) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(19.5 23.8) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(16.2 20.5) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(15 16) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(16.2 11.5) scale(3)" />
                      <polygon points="0,-1 0.224,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.381 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.224,-0.309" transform="translate(19.5 8.2) scale(3)" />
                    </g>
                  </svg>
                  <span>📞 Urgence Européenne: 112</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Colonne Gauche - Formulaire */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profil Patient */}
            <div className="card card-premium p-5 rounded-xl shadow-md">
              <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>👤</span> Profil Patient
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Âge</label>
                  <input
                    type="number"
                    value={age || ''}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    placeholder="30"
                    min="1"
                    max="120"
                    className="w-full p-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sexe</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <option value="">Non spécifié</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Poids (kg)</label>
                    <input
                      type="number"
                      value={weight || ''}
                      onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                      placeholder="70"
                      min="1"
                      max="300"
                      className="w-full p-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Taille (cm)</label>
                    <input
                      type="number"
                      value={height || ''}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                      placeholder="170"
                      min="1"
                      max="250"
                      className="w-full p-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)'
                      }}
                    />
                  </div>
                </div>

                {bmi > 0 && (
                  <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>IMC</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{bmi}</div>
                    <div className={`text-xs font-semibold ${bmiCategory.color}`}>{bmiCategory.text}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Antécédents Médicaux */}
            <div className="card card-premium p-5 rounded-xl shadow-md">
              <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>📋</span> Antécédents
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {MEDICAL_HISTORY_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <input
                      type="checkbox"
                      checked={medicalHistory.includes(item)}
                      onChange={() => toggleMedicalHistory(item)}
                      className="w-4 h-4 rounded accent-teal-600"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="card card-premium p-5 rounded-xl shadow-md">
              <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>🚫</span> Allergies
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ALLERGY_OPTIONS.map((item) => (
                  <label key={item} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                    <input
                      type="checkbox"
                      checked={allergies.includes(item)}
                      onChange={() => toggleAllergy(item)}
                      className="w-4 h-4 rounded accent-teal-600"
                    />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne Milieu - Symptômes */}
          <div className="lg:col-span-1 space-y-4">
            {/* Symptômes */}
            <div className="card card-premium p-5 rounded-xl shadow-md">
              <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>🔍</span> Symptômes
              </h2>

              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSymptom()}
                placeholder="Ex: Fièvre, Toux..."
                className="w-full p-3 rounded-lg outline-none transition-all mb-3"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)'
                }}
              />

              {/* Durée */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Durée: <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {currentDuration} jour{currentDuration > 1 ? 's' : ''}
                  </span>
                  <span className="block text-[10px] opacity-60 italic">(Cliquer et tirer le point vert)</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={currentDuration}
                  onChange={(e) => setCurrentDuration(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  <span>1j</span>
                  <span>30j</span>
                </div>
              </div>

              {/* Intensité */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Intensité: <span className={`font-bold ${getIntensityColor(currentIntensity)}`}>
                    {currentIntensity}/10
                  </span>
                  <span className="block text-[10px] opacity-60 italic">(Cliquer et tirer le point vert)</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentIntensity}
                  onChange={(e) => setCurrentIntensity(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  <span>Léger</span>
                  <span>Modéré</span>
                  <span>Sévère</span>
                </div>
              </div>

              <button
                onClick={handleAddSymptom}
                className="w-full animated-gradient text-white px-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg btn-3d btn-add-symptom"
                style={{ height: BAND_HEIGHT, lineHeight: BAND_TEXT_HEIGHT, borderRadius: BAND_BORDER_RADIUS }}>
                + Ajouter Symptôme
              </button>
            </div>

            {/* Symptômes sélectionnés */}
            <div className="card card-premium p-5 rounded-xl shadow-md">
              <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span>✓</span> Sélectionnés ({selectedSymptoms.length})
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedSymptoms.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border transition-all hover:scale-105 group relative"
                    style={{
                      background: darkMode
                        ? 'linear-gradient(to right, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.1))'
                        : 'linear-gradient(to right, #f0fdfa, #ecfeff)',
                      borderColor: 'var(--border)'
                    }}>
                    <div className="grid grid-cols-3 items-center">
                      <div className="font-semibold break-words text-left col-span-1" style={{ color: 'var(--accent-primary)' }}>{s.name}</div>
                      <div className="flex justify-center gap-1 col-span-1">
                        <button
                          onClick={() => handleEditSymptom(s)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-2 rounded transition-colors"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSymptom(s.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded transition-colors"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="col-span-1"></div> {/* Spacer to maintain center alignment */}
                    </div>
                    <div className="text-xs mt-1 flex gap-3" style={{ color: 'var(--text-secondary)' }}>
                      <span>📅 {s.duration || 1} jour{(s.duration || 1) > 1 ? 's' : ''}</span>
                      <span className={s.intensity && s.intensity >= 8 ? 'font-bold text-red-600 dark:text-red-400' : ''}>
                        💪 {s.intensity || 5}/10
                      </span>
                    </div>
                  </div>
                ))}
                {selectedSymptoms.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                    Aucun symptôme
                  </p>
                )}
              </div>
            </div>

            {/* Bouton Analyser */}
            <button
              onClick={handleAnalyze}
              disabled={selectedSymptoms.length === 0 || loading}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg btn-3d btn-analyze ${selectedSymptoms.length === 0 || loading
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'animated-gradient hover:shadow-2xl glow-effect'
                }`}>
              {loading ? '🔬 Analyse en cours...' : '🔬 Lancer le Diagnostic'}
            </button>
          </div>

          {/* Colonne Droite - Résultats */}
          <div className="lg:col-span-2">
            {results ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>📋 Résultats</h2>
                  <button
                    onClick={() => {
                      setResults(null);
                      setSelectedSymptoms([]);
                      setSessionId(null);
                    }}
                    className="text-sm card px-4 py-2 rounded-lg hover:shadow-md transition-all"
                  >
                    Nouvelle analyse
                  </button>
                </div>

                {disclaimer && (
                  <div className="p-4 rounded-r-lg mb-4 border-l-4 border-yellow-500"
                    style={{
                      background: darkMode
                        ? 'rgba(251, 191, 36, 0.1)'
                        : '#fefce8'
                    }}>
                    <p className="text-sm" style={{ color: darkMode ? '#fcd34d' : '#a16207' }}>{disclaimer}</p>
                  </div>
                )}

                {results.map((disease, idx) => (
                  <div key={idx} className="card p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {disease.name}
                          </h3>
                          <span className="px-4 py-2 rounded-full text-lg font-bold shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
                              color: 'white'
                            }}>
                            {disease.probability}%
                          </span>
                        </div>
                      </div>
                      <ProbabilityChart probability={disease.probability} />
                    </div>

                    <div className="w-full mb-4" style={{ backgroundColor: 'var(--border)', height: PROB_BAR_HEIGHT, borderRadius: PROB_BAR_BORDER_RADIUS }}>
                      <div
                        className="transition-all duration-1000 animated-gradient"
                        style={{ width: `${disease.probability}%`, height: PROB_BAR_HEIGHT, borderRadius: PROB_BAR_BORDER_RADIUS }}
                      ></div>
                    </div>

                    <p className="mb-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {disease.description || "Pas de description disponible."}
                    </p>

                    {disease.treatments && disease.treatments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                          💊 Traitements
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {disease.treatments.map((t, i) => (
                            <span key={i} className="text-sm px-3 py-1 rounded-full border"
                              style={{
                                backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                                color: darkMode ? '#93c5fd' : '#1e40af',
                                borderColor: darkMode ? '#3b82f6' : '#bfdbfe'
                              }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {disease.whenToSeeDoctorUrgently && disease.whenToSeeDoctorUrgently.length > 0 && (
                      <div className="mt-4 p-4 rounded-r-lg border-l-4 border-red-500"
                        style={{
                          background: darkMode
                            ? 'rgba(239, 68, 68, 0.1)'
                            : '#fef2f2'
                        }}>
                        <h4 className="text-sm font-bold uppercase mb-2" style={{ color: darkMode ? '#fca5a5' : '#991b1b' }}>
                          🚨 Consultez immédiatement si:
                        </h4>
                        <ul className="list-disc list-inside text-sm space-y-1" style={{ color: darkMode ? '#fca5a5' : '#991b1b' }}>
                          {disease.whenToSeeDoctorUrgently.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center card rounded-xl p-12 border-2 border-dashed">
                <div className="text-6xl mb-4 opacity-50 float-animation">👈</div>
                <p className="text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Remplissez votre profil, ajoutez des symptômes et lancez l'analyse
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal d'Urgence */}
        {showEmergencyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-md"
            style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="card rounded-2xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden slide-in-up"
              style={{ border: '4px solid #DC143C' }}>

              {/* Croix Suisse en arrière-plan */}
              <div className="absolute top-0 right-0 opacity-5">
                <div className="w-32 h-32 relative">
                  <div className="absolute inset-0 bg-red-600 w-8 left-12"></div>
                  <div className="absolute inset-0 bg-red-600 h-8 top-12"></div>
                </div>
              </div>
              <div className="text-center relative z-10">
                <div className="text-7xl mb-6 pulse-medical">🚨</div>
                <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
                  URGENCE DÉTECTÉE
                </h2>

                <p className="mb-6 text-lg" style={{ color: 'var(--text-primary)' }}>
                  {emergencyMessage}
                </p>
                <div className="p-6 rounded-xl mb-6 border-4 glow-red"
                  style={{
                    background: darkMode ? 'rgba(220, 20, 60, 0.2)' : '#FEE2E2',
                    borderColor: '#DC143C'
                  }}>
                  <p className="font-bold text-red-800 dark:text-red-400 text-xl mb-4">
                    Appelez immédiatement:
                  </p>

                  <div className="space-y-3">
                    <a href="tel:144"
                      className="block w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg font-bold text-2xl transition-all hover:scale-105 shadow-lg">
                      🇨🇭 144 (SUISSE)
                    </a>
                    <a href="tel:112"
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-2xl transition-all hover:scale-105 shadow-lg">
                      🇪🇺 112 (EUROPE)
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors">
                  J'ai compris
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
