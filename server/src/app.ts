import express from 'express';
import cors from 'cors';
import connectDB from './config/database';
import routes from './routes';

// Connect to Database
connectDB();

const app = express();

// --- Core Middleware ---
// Custom CORS logic for flexible frontend access
// Allow from env (comma-separated), with sensible defaults for local/dev deployments
const allowedOriginsFromEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://my-todo-tofu.netlify.app',
  'https://my-todo-tofu-deploy.vercel.app',
];

const allowedOrigins = new Set<string>([...defaultAllowedOrigins, ...allowedOriginsFromEnv]);

const allow = (origin?: string) => !origin || allowedOrigins.has(origin);

app.use(
  cors({
    origin: (origin, cb) => cb(null, allow(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.options('*', cors());

// If using cookies/sessions behind proxy:
app.set('trust proxy', 1);

// Parse incoming JSON requests
app.use(express.json());
// Parse URL-encoded data
app.use(express.urlencoded({ extended: true }));

// This is where we mount our API routes
app.use('/api', routes);

app.get('/', (_req, res) => {
  res.send('API is running...');
});

export default app;
