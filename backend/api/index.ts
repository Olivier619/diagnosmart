import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import diagnosisRoutes from '../src/routes/diagnosisRoutes';
import symptomsRoutes from '../src/routes/symptomsRoutes';
import { errorHandler } from '../src/middleware/errorHandler';

const app: Express = express();

// Middleware
// Middleware
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
    origin: allowedOrigin,
    credentials: allowedOrigin !== '*', // Credentials only allowed with specific origin, not '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/symptoms', symptomsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling
app.use(errorHandler);

// 404
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Export for Vercel Serverless
export default app;
