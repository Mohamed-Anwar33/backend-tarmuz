const express = require('express');
const crypto = require('crypto');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const contentRoutes = require('./src/routes/contentRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const testimonialRoutes = require('./src/routes/testimonialRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const blogRoutes = require('./src/routes/blogRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

dotenv.config();
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // trust first proxy for correct IP (rate limiting/logging)
// Environment sanity warnings (do not crash app to avoid downtime)
if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY] JWT_SECRET is not set. Set a strong secret in .env');
}
if (!process.env.MONGO_URI) {
  console.warn('[CONFIG] MONGO_URI is not set. Ensure database connection string is configured.');
}

// CORS configuration (allowlist from env with safe defaults)
const defaultOrigins = [
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowlist = envOrigins.length ? envOrigins : defaultOrigins;

// Assign a request id for tracing
app.use((req, res, next) => {
  const rid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  req.id = rid;
  res.setHeader('X-Request-Id', rid);
  next();
});

// Lightweight request logger (method, url, status, response time)
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durMs = Number((process.hrtime.bigint() - start) / 1000000n);
    console.log(`[${req.id}] ${req.method} ${req.originalUrl} -> ${res.statusCode} ${durMs}ms`);
  });
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser or same-origin
    if (allowlist.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
}));

// Note: No explicit app.options wildcard handler (Express 5 + path-to-regexp v8).
// Global CORS middleware above handles preflight automatically.

// Security headers via Helmet (relaxed CSP for dev)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'img-src': ['*', 'data:', 'blob:'],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'connect-src': ['*'],
    },
  },
  referrerPolicy: { policy: 'no-referrer' },
}));

// Prevent HTTP Parameter Pollution
app.use(hpp());

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Guard against extremely long URLs
app.use((req, res, next) => {
  if ((req.originalUrl || '').length > 2048) {
    return res.status(414).json({ msg: 'URI Too Long' });
  }
  next();
});

// Handle malformed JSON payloads gracefully
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ msg: 'Malformed JSON' });
  }
  next(err);
});

// Minimal Permissions-Policy to reduce API surface
app.use((req, res, next) => {
  // Deny powerful features we don't use
  res.setHeader('Permissions-Policy', [
    'geolocation=()',
    'camera=()',
    'microphone=()',
    'payment=()',
    'fullscreen=(self)'
  ].join(', '));
  next();
});

// Static file serving with proper CORS headers
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'ignore',
  etag: false,
  lastModified: false,
  setHeaders: (res, filePath) => {
    // Short cache to avoid 304 header stripping while debugging, can increase later
    res.setHeader('Cache-Control', 'public, max-age=600');
  }
}));

// Basic rate limiting for sensitive routes
const standardLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

app.use('/api', standardLimiter);
app.use('/api/auth', authLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/contact', contactLimiter);

// Reject unsafe/rare methods early
app.use((req, res, next) => {
  const m = req.method.toUpperCase();
  if (m === 'TRACE' || m === 'TRACK') return res.status(405).json({ msg: 'Method Not Allowed' });
  next();
});

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

// Health and readiness endpoints
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz', (req, res) => {
  // If DB connection helper exposes state, could check it here; keeping minimal
  res.status(200).json({ ready: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: 'Not Found' });
});

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';
  // Minimal safe logging
  console.error('[ERROR]', {
    method: req.method,
    url: req.originalUrl,
    status,
    message: err.message,
  });
  res.status(status).json({
    msg: err.message || 'Internal Server Error',
    ...(isProd ? {} : { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));