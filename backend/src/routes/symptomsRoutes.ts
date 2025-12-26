import { Router } from 'express';
import { symptomsController } from '../controllers/symptomsController';

const router = Router();

router.get('/search', symptomsController.search);

export default router;
