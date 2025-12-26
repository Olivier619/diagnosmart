import axios, { AxiosInstance } from 'axios';
import CryptoJS from 'crypto-js';

const AUTH_URL = 'https://sandbox-authservice.priaid.ch/login';
const API_URL = 'https://sandbox-healthservice.priaid.ch';

// Note: Replace with Production URLs when ready:
// Auth: https://authservice.priaid.ch/login
// API: https://healthservice.priaid.ch

export class ApiMedicService {
    private client: AxiosInstance;
    private token: string | null = null;
    private apiKey: string;
    private secretKey: string;

    constructor() {
        this.apiKey = process.env.APIMEDIC_API_KEY || '';
        this.secretKey = process.env.APIMEDIC_SECRET_KEY || '';

        this.client = axios.create({
            baseURL: API_URL,
        });
    }

    private async authenticate(): Promise<string> {
        if (!this.apiKey || !this.secretKey) {
            throw new Error('ApiMedic credentials not found in environment variables.');
        }

        try {
            const computedHash = CryptoJS.HmacMD5(AUTH_URL, this.secretKey);
            const computedHashString = computedHash.toString(CryptoJS.enc.Base64);

            const response = await axios.post(AUTH_URL, null, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}:${computedHashString}`
                }
            });

            this.token = response.data.Token;
            return this.token as string;
        } catch (error: any) {
            console.error('ApiMedic Auth Error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with ApiMedic');
        }
    }

    // Basic method to load symptoms (example)
    async loadSymptoms() {
        if (!this.token) await this.authenticate();
        // Implementation to come...
    }
}

export const apiMedicService = new ApiMedicService();
