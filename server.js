const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const trafficRoutes = require('./routes/traffic');
const viewRoutes = require('./routes/views');

app.use('/', viewRoutes);
app.use('/api/traffic', trafficRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: process.env.TOMTOM_API_KEY ? 'healthy' : 'degraded',
        api_configured: !!process.env.TOMTOM_API_KEY,
        default_location: {
            latitude: parseFloat(process.env.DEFAULT_LATITUDE || '28.6139'),
            longitude: parseFloat(process.env.DEFAULT_LONGITUDE || '77.2090')
        },
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ success: false, error: 'Endpoint not found' });
    } else {
        res.status(404).send('<h1>404 - Page Not Found</h1>');
    }
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log('🚗 Traffic Dashboard Server (Express.js)');
    console.log('='.repeat(70));
    console.log(process.env.TOMTOM_API_KEY ? '✅ API key configured' : '⚠️  API key missing');
    console.log('📍 Location:', process.env.DEFAULT_LATITUDE, process.env.DEFAULT_LONGITUDE);
    console.log('🌐 Server: http://localhost:' + PORT);
    console.log('🌐 Dashboard: http://localhost:' + PORT + '/dashboard');
    console.log('='.repeat(70));
});
