import express from 'express';
import cors from 'cors';
import connectDB from './config/database';
import routes from './routes';

// Connect to Database
connectDB();

const app = express();

// --- Core Middleware ---
// Custom CORS logic for flexible frontend access
const allow = (origin?: string) =>
  !origin || origin === 'http://localhost:5173' ||
  origin === 'https://my-todo-tofu.netlify.app';

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
