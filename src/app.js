const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const campaignRoutes = require('./routes/campaign.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payment.routes');
const moderationRoutes = require('./routes/moderation.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adRoutes = require('./routes/ad.routes');
const publisherRoutes = require('./routes/publisher.routes');

const app = express();

// --- Security & parsing ---
// ...alongside your other route imports

app.use('/api/ads', adRoutes);
app.use('/api/publishers', publisherRoutes);
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use('/api', apiLimiter);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Static dashboard (public/dashboard/index.html fetches these APIs) ---
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


app.get('/career', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'career.html'));
});

app.get('/aboutus', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'aboutus.html'));
});



app.get('/cookie', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cookie.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/partner', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'partner.html'));
});
app.get('/privacypolicy', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'privacypolicy.html'));
});

app.get('/service', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'service.html'));
});
app.get('/termsofservice', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'termsofservice.html'));
});

app.get('/verticals', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'verticals.html'));
});
// src/app.js — add near your other static/route setup
app.get('/dashboard/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'admin.html'));
});
app.get('/dashboard/advertiser', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'advertiser.html'));
});
app.get('/dashboard/publisher', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard', 'publisher.html'));
});

// --- Fallback + error handling ---
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

module.exports = app;