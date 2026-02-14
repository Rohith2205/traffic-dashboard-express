const express = require('express');
const router = express.Router();
const TrafficService = require('../services/trafficService');

const trafficService = new TrafficService(process.env.TOMTOM_API_KEY);

router.get('/flow', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat || process.env.DEFAULT_LATITUDE);
        const lng = parseFloat(req.query.lng || process.env.DEFAULT_LONGITUDE);
        const zoom = parseInt(req.query.zoom || '10');
        const data = await trafficService.getTrafficFlow(lat, lng, zoom);
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/incidents', async (req, res) => {
    try {
        const bbox = req.query.bbox;
        if (!bbox) {
            return res.status(400).json({ success: false, error: 'bbox required' });
        }
        const data = await trafficService.getTrafficIncidents(bbox);
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/summary', async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat || process.env.DEFAULT_LATITUDE);
        const lng = parseFloat(req.query.lng || process.env.DEFAULT_LONGITUDE);
        const data = await trafficService.getTrafficSummary(lat, lng);
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
