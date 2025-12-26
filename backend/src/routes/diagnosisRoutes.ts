import { Router, Request, Response, NextFunction } from 'express';
import { diagnosisController } from '../controllers/diagnosisController';

const router = Router();

// Initialize diagnosis session
router.post('/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await diagnosisController.initSession(req, res);
  } catch (error) {
    next(error);
  }
});

// Add symptom
router.post('/add-symptom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await diagnosisController.addSymptom(req, res);
  } catch (error) {
    next(error);
  }
});

// Remove symptom
router.post('/remove-symptom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await diagnosisController.removeSymptom(req, res);
  } catch (error) {
    next(error);
  }
});

// Analyze and get diagnosis
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await diagnosisController.analyzeDiagnosis(req, res);
  } catch (error) {
    next(error);
  }
});

// Get suggested next questions
router.get('/suggested-features/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await diagnosisController.getSuggestedFeatures(req, res);
  } catch (error) {
    next(error);
  }
});

// Get suggested tests
router.get('/suggested-tests/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await diagnosisController.getSuggestedTests(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
