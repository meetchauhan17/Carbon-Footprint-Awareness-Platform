import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import Modular Routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import entriesRoutes from './routes/entries.js';
import tipsRoutes from './routes/tips.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed origins — local dev + all Vercel previews + production
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://carbon-footprint-awareness-platform-alpha.vercel.app',
];

// Security Headers Middleware
app.use(helmet());

// CORS Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app subdomain (preview deployments)
    if (/\.vercel\.app$/.test(origin) || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle OPTIONS preflight for all routes
app.options('*', cors());

// JSON Parsing Middleware
app.use(express.json());

/**
 * @route GET /api/health
 * @description Health check endpoint. Used by frontend to wake up Render on cold start.
 * @access Public
 */
app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// Register Modular API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/tips', tipsRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`CarbonWise Backend Server running on port ${PORT}`);
});
