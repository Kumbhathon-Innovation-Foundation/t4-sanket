import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toolsRouter } from './routes/tools.js';
import { agentRouter } from './routes/agent.js';
import { adminRouter } from './routes/admin.js';
import { isSupabaseConfigured } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Strict CORS: Only allow specified frontend domains, NEVER '*' in production
const defaultAllowedOrigins = [
  'http://localhost:5173', // Pilgrim app dev
  'http://localhost:5174', // Admin console dev
  'http://localhost:5175', // Kiosk dev
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://pilgrim.kumbhsaathi.in',
  'https://admin.kumbhsaathi.in',
  'https://kiosk.kumbhsaathi.in'
];

const envAllowed = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envAllowed]));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser calls (like curl, postman, server-to-server) or matching allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy violation: Origin ${origin} is not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health & Status Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    service: 'Kumbh Saathi API',
    version: '1.0.0',
    database: isSupabaseConfigured ? 'Supabase Postgres Connected' : 'Local Mock Data Store Active',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes under both /api and root paths for maximum compatibility
app.use('/api', toolsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/admin', adminRouter);

// Direct aliases
app.use('/agent', agentRouter);
app.use('/admin', adminRouter);
app.use('/', toolsRouter);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🛕 Kumbh Saathi Backend API running on port ${PORT}`);
    console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
    console.log(`📊 DB Mode: ${isSupabaseConfigured ? 'Live Supabase Cloud' : 'Local In-Memory / Fallback'}`);
    console.log(`=======================================================`);
  });
}

export default app;
