import { Request, Response } from 'express';
// Simule une base de données locale de symptômes pour la recherche
// Dans une vraie app, cela viendrait d'une DB ou de l'API EndlessMedical
const COMMON_SYMPTOMS = [
  { id: 'Fever', name: 'Fièvre', category: 'General' },
  { id: 'Headache', name: 'Maux de tête', category: 'Neurology' },
  { id: 'Cough', name: 'Toux', category: 'Respiratory' },
  { id: 'SoreThroat', name: 'Mal de gorge', category: 'Respiratory' },
  { id: 'Fatigue', name: 'Fatigue', category: 'General' },
  { id: 'Nausea', name: 'Nausée', category: 'Digestive' },
  { id: 'Vomiting', name: 'Vomissement', category: 'Digestive' },
  { id: 'Diarrhea', name: 'Diarrhée', category: 'Digestive' },
  { id: 'AbdominalPain', name: 'Douleur abdominale', category: 'Digestive' },
  { id: 'ChestPain', name: 'Douleur thoracique', category: 'Cardiology' },
  { id: 'ShortnessOfBreath', name: 'Essoufflement', category: 'Respiratory' },
  { id: 'Dizziness', name: 'Vertiges', category: 'Neurology' }
];

export const symptomsController = {
  search: (req: Request, res: Response) => {
    const query = (req.query.q as string || '').toLowerCase();
    
    if (!query) {
      return res.json({ symptoms: [] });
    }

    const filtered = COMMON_SYMPTOMS.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.id.toLowerCase().includes(query)
    );

    res.json({ symptoms: filtered });
  }
};
