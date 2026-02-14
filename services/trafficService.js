const axios = require('axios');

class TrafficService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.tomtom.com/traffic/services';
        this.timeout = 10000;
    }

    async getTrafficFlow(latitude, longitude, zoom = 10) {
        try {
            const url = `${this.baseUrl}/4/flowSegmentData/absolute/${zoom}/json`;
            const response = await axios.get(url, {
                params: { 
                    key: this.apiKey, 
                    point: `${latitude},${longitude}`, 
                    unit: 'KMPH' 
                },
                timeout: this.timeout
            });

            const data = response.data;
            if (data.flowSegmentData) {
                const flow = data.flowSegmentData;
                return {
                    success: true,
                    current_speed: flow.currentSpeed || 0,
                    free_flow_speed: flow.freeFlowSpeed || 0,
                    current_travel_time: flow.currentTravelTime || 0,
                    free_flow_travel_time: flow.freeFlowTravelTime || 0,
                    confidence: flow.confidence || 0,
                    road_closure: flow.roadClosure || false
                };
            }
            return { success: false, error: 'No traffic data' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTrafficIncidents(bbox, zoom = 12) {
        try {
            const url = `${this.baseUrl}/5/incidentDetails`;
            const response = await axios.get(url, {
                params: {
                    key: this.apiKey,
                    bbox: bbox,
                    fields: '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},from,to,delay}}}',
                    language: 'en-US',
                    categoryFilter: '0,1,2,3,4,5,6,7,8,9,10,11,14',
                    timeValidityFilter: 'present'
                },
                timeout: this.timeout
            });

            const incidents = [];
            if (response.data.incidents) {
                response.data.incidents.forEach(incident => {
                    const props = incident.properties || {};
                    incidents.push({
                        type: incident.type || 'Unknown',
                        description: (props.events && props.events[0]) ? props.events[0].description : 'No description',
                        icon_category: props.iconCategory || 0,
                        delay: props.delay || 0,
                        magnitude: props.magnitudeOfDelay || 0,
                        from: props.from || '',
                        to: props.to || '',
                        coordinates: incident.geometry?.coordinates || []
                    });
                });
            }

            return { 
                success: true, 
                incident_count: incidents.length, 
                incidents: incidents 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getTrafficSummary(latitude, longitude) {
        const flowData = await this.getTrafficFlow(latitude, longitude);
        const bboxOffset = 0.045;
        const bbox = `${longitude - bboxOffset},${latitude - bboxOffset},${longitude + bboxOffset},${latitude + bboxOffset}`;
        const incidentData = await this.getTrafficIncidents(bbox);
        
        return {
            location: { latitude, longitude },
            traffic_flow: flowData,
            incidents: incidentData
        };
    }
}

module.exports = TrafficService;