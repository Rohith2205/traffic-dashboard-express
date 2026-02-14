const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {
        title: 'Traffic Dashboard - Home',
        default_lat: parseFloat(process.env.DEFAULT_LATITUDE || '28.6139'),
        default_lng: parseFloat(process.env.DEFAULT_LONGITUDE || '77.2090')
    });
});

router.get('/dashboard', (req, res) => {
    let defaultLat = parseFloat(process.env.DEFAULT_LATITUDE || '28.6139');
    let defaultLng = parseFloat(process.env.DEFAULT_LONGITUDE || '77.2090');

    if (req.query.lat && req.query.lng) {
        const customLat = parseFloat(req.query.lat);
        const customLng = parseFloat(req.query.lng);
        if (!isNaN(customLat) && !isNaN(customLng)) {
            defaultLat = customLat;
            defaultLng = customLng;
        }
    }

    res.render('dashboard', {
        title: 'Traffic Dashboard',
        default_lat: defaultLat,
        default_lng: defaultLng
    });
});

module.exports = router;
