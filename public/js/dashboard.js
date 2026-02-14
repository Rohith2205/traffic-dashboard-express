// ===== DASHBOARD JAVASCRIPT =====

// Global variables
let map;
let currentMarker;
let incidentMarkers = [];
let heatmapLayer;
let trafficLayer;
let currentLocation = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };  // ← Uses DEFAULT_LAT/LNG
let autoRefreshInterval;
let settings = {
    refreshInterval: 30000,
    zoomLevel: 12,
    soundAlerts: false
};

// Rate limiting for Nominatim API
let lastSearchTime = 0;
const SEARCH_RATE_LIMIT = 1000; // 1 second between requests

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    loadTrafficData();
    startAutoRefresh();
});

// ===== MAP INITIALIZATION =====
function initializeMap() {
    // Initialize Leaflet map
    map = L.map('map').setView([currentLocation.lat, currentLocation.lng], settings.zoomLevel);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Add current location marker
    currentMarker = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: L.divIcon({
            className: 'current-location-marker',
            html: '<i class="fas fa-map-marker-alt" style="color: #2196F3; font-size: 2rem;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(map);

    // Map click event
    map.on('click', function(e) {
        currentLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        updateCurrentMarker();
        loadTrafficData();
    });

    console.log('Map initialized successfully');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        this.querySelector('i').classList.add('fa-spin');
        loadTrafficData();
        setTimeout(() => {
            this.querySelector('i').classList.remove('fa-spin');
        }, 1000);
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', function() {
        document.getElementById('settingsModal').classList.add('active');
    });

    // Close modal
    document.querySelector('.close-btn').addEventListener('click', function() {
        document.getElementById('settingsModal').classList.remove('active');
    });

    // Save settings
    document.getElementById('saveSettings').addEventListener('click', saveSettings);

    // Search button
    document.getElementById('searchBtn').addEventListener('click', searchLocation);

    // Enter key for search
    document.getElementById('locationSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });

    // Current location button
    document.getElementById('currentLocationBtn').addEventListener('click', getCurrentLocation);

    // Toggle controls
    document.getElementById('toggleHeatmap').addEventListener('click', toggleHeatmap);
    document.getElementById('toggleIncidents').addEventListener('click', toggleIncidents);
    document.getElementById('toggleTraffic').addEventListener('click', toggleTrafficLayer);

    // Auto refresh checkbox
    document.getElementById('autoRefresh').addEventListener('change', function() {
        if (this.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });

    // Zoom slider
    document.getElementById('zoomLevel').addEventListener('input', function() {
        document.getElementById('zoomValue').textContent = this.value;
    });
}

// ===== TRAFFIC DATA LOADING =====
async function loadTrafficData() {
    showLoading(true);
    
    try {
        // Load traffic flow data
        const flowResponse = await fetch(
            `/api/traffic/flow?lat=${currentLocation.lat}&lng=${currentLocation.lng}&zoom=10`,
            { 
                signal: AbortSignal.timeout(10000) // 10 second timeout
            }
        );
        const flowData = await flowResponse.json();

        if (flowData.success) {
            updateTrafficStats(flowData);
        }

        // Load traffic incidents
        const bbox = calculateBBox(currentLocation.lat, currentLocation.lng, 0.05);
        const incidentsResponse = await fetch(
            `/api/traffic/incidents?bbox=${bbox}`,
            { 
                signal: AbortSignal.timeout(10000) // 10 second timeout
            }
        );
        const incidentsData = await incidentsResponse.json();

        if (incidentsData.success) {
            updateIncidents(incidentsData.incidents);
            displayIncidentsOnMap(incidentsData.incidents);
        }

        updateLastUpdateTime();
        updateConnectionStatus(true);
        
    } catch (error) {
        console.error('Error loading traffic data:', error);
        updateConnectionStatus(false);
        
        if (error.name === 'AbortError') {
            showNotification('Request timed out. Please try again.', 'error');
        } else {
            showNotification('Failed to load traffic data', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// ===== UPDATE TRAFFIC STATS =====
function updateTrafficStats(data) {
    const currentSpeed = data.current_speed || 0;
    const freeFlowSpeed = data.free_flow_speed || 0;
    const currentTravelTime = data.current_travel_time || 0;
    const freeFlowTravelTime = data.free_flow_travel_time || 0;

    // Update speed displays
    document.getElementById('currentSpeed').textContent = `${Math.round(currentSpeed)} km/h`;
    document.getElementById('normalSpeed').textContent = `${Math.round(freeFlowSpeed)} km/h`;

    // Calculate and display congestion level
    const congestionLevel = calculateCongestionLevel(currentSpeed, freeFlowSpeed);
    const congestionElement = document.getElementById('congestionLevel');
    const congestionIcon = document.getElementById('congestionIcon');
    
    congestionElement.textContent = congestionLevel;
    
    // Update congestion color
    const colors = {
        'Low': '#4CAF50',
        'Moderate': '#FFC107',
        'High': '#FF5722',
        'Severe': '#D32F2F',
        'Unknown': '#9E9E9E'
    };
    congestionIcon.style.background = colors[congestionLevel] || colors['Unknown'];

    // Update travel time
    const travelTimeIncrease = currentTravelTime - freeFlowTravelTime;
    const travelTimeDisplay = travelTimeIncrease > 0 
        ? `+${Math.round(travelTimeIncrease)}s delay`
        : 'No delay';
    document.getElementById('travelTime').textContent = travelTimeDisplay;
}

// ===== CALCULATE CONGESTION LEVEL =====
function calculateCongestionLevel(currentSpeed, freeFlowSpeed) {
    if (freeFlowSpeed === 0) return 'Unknown';
    
    const ratio = currentSpeed / freeFlowSpeed;
    
    if (ratio >= 0.8) return 'Low';
    if (ratio >= 0.5) return 'Moderate';
    if (ratio >= 0.3) return 'High';
    return 'Severe';
}

// ===== UPDATE INCIDENTS =====
function updateIncidents(incidents) {
    const incidentsList = document.getElementById('incidentsList');
    
    if (!incidents || incidents.length === 0) {
        incidentsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-info-circle"></i>
                <p>No incidents in this area</p>
            </div>
        `;
        return;
    }

    incidentsList.innerHTML = incidents.map(incident => `
        <div class="incident-item severity-${incident.magnitude > 2 ? 'high' : 'low'}">
            <div class="incident-header">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${escapeHtml(getIncidentType(incident.icon_category))}</span>
            </div>
            <div class="incident-description">
                ${escapeHtml(incident.description || 'No description available')}
            </div>
            <div class="incident-meta">
                <span><i class="fas fa-road"></i> ${escapeHtml(incident.from || 'Unknown location')}</span>
                ${incident.delay > 0 ? `<span><i class="fas fa-clock"></i> ${incident.delay}s delay</span>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== DISPLAY INCIDENTS ON MAP =====
function displayIncidentsOnMap(incidents) {
    // Clear existing incident markers
    incidentMarkers.forEach(marker => map.removeLayer(marker));
    incidentMarkers = [];

    if (!incidents || incidents.length === 0) return;

    incidents.forEach(incident => {
        if (!incident.coordinates || incident.coordinates.length === 0) return;

        const coords = incident.coordinates[0];
        const icon = getIncidentIcon(incident.icon_category);
        
        const marker = L.marker([coords[1], coords[0]], {
            icon: L.divIcon({
                className: 'incident-marker',
                html: `<i class="fas ${icon}" style="color: #FF5722; font-size: 1.5rem;"></i>`,
                iconSize: [25, 25],
                iconAnchor: [12, 25]
            })
        }).addTo(map);

        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0;">${escapeHtml(getIncidentType(incident.icon_category))}</h4>
                <p style="margin: 5px 0;">${escapeHtml(incident.description || 'No description')}</p>
                ${incident.delay > 0 ? `<p style="margin: 5px 0; color: #FF5722;"><strong>Delay:</strong> ${incident.delay}s</p>` : ''}
            </div>
        `);

        incidentMarkers.push(marker);
    });
}

// ===== HELPER FUNCTIONS =====
function getIncidentType(iconCategory) {
    const types = {
        0: 'Unknown',
        1: 'Accident',
        2: 'Fog',
        3: 'Dangerous Conditions',
        4: 'Rain',
        5: 'Ice',
        6: 'Jam',
        7: 'Lane Closed',
        8: 'Road Closed',
        9: 'Road Works',
        10: 'Wind',
        11: 'Flooding',
        14: 'Broken Down Vehicle'
    };
    return types[iconCategory] || 'Traffic Event';
}

function getIncidentIcon(iconCategory) {
    const icons = {
        1: 'fa-car-crash',
        6: 'fa-car',
        7: 'fa-road',
        8: 'fa-ban',
        9: 'fa-tools',
        14: 'fa-wrench'
    };
    return icons[iconCategory] || 'fa-exclamation-triangle';
}

function calculateBBox(lat, lng, offset) {
    return `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== SEARCH LOCATION =====
const searchLocationDebounced = debounce(async function() {
    const query = document.getElementById('locationSearch').value.trim();
    if (!query) {
        showNotification('Please enter a location', 'warning');
        return;
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastSearchTime < SEARCH_RATE_LIMIT) {
        showNotification('Please wait before searching again', 'warning');
        return;
    }
    lastSearchTime = now;

    showLoading(true);
    
    try {
        // Use Nominatim for geocoding (with proper User-Agent header)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
            {
                headers: {
                    'User-Agent': 'TrafficDashboard/1.0 (Educational Project)'
                },
                signal: AbortSignal.timeout(10000)
            }
        );
        const data = await response.json();

        if (data && data.length > 0) {
            const location = data[0];
            currentLocation = {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lon)
            };
            
            map.setView([currentLocation.lat, currentLocation.lng], settings.zoomLevel);
            updateCurrentMarker();
            loadTrafficData();
            showNotification('Location found!', 'success');
        } else {
            showNotification('Location not found', 'error');
        }
    } catch (error) {
        console.error('Error searching location:', error);
        if (error.name === 'AbortError') {
            showNotification('Search timed out', 'error');
        } else {
            showNotification('Search failed', 'error');
        }
    } finally {
        showLoading(false);
    }
}, 500);

async function searchLocation() {
    searchLocationDebounced();
}

// ===== GET CURRENT LOCATION =====
function getCurrentLocation() {
    if ('geolocation' in navigator) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setView([currentLocation.lat, currentLocation.lng], settings.zoomLevel);
                updateCurrentMarker();
                loadTrafficData();
                showNotification('Location updated!', 'success');
                showLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Failed to get location';
                if (error.code === error.PERMISSION_DENIED) {
                    message = 'Location access denied';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = 'Location unavailable';
                } else if (error.code === error.TIMEOUT) {
                    message = 'Location request timed out';
                }
                showNotification(message, 'error');
                showLoading(false);
            },
            {
                timeout: 10000,
                enableHighAccuracy: true
            }
        );
    } else {
        showNotification('Geolocation not supported', 'error');
    }
}

// ===== UPDATE CURRENT MARKER =====
function updateCurrentMarker() {
    if (currentMarker) {
        currentMarker.setLatLng([currentLocation.lat, currentLocation.lng]);
    }
    updateCoordinatesDisplay();
}

// ===== TOGGLE FEATURES =====
function toggleHeatmap() {
    const btn = document.getElementById('toggleHeatmap');
    btn.classList.toggle('active');
    
    if (btn.classList.contains('active')) {
        // Create heatmap (placeholder - requires actual traffic data points)
        showNotification('Heatmap feature coming soon!', 'info');
    } else {
        if (heatmapLayer) {
            map.removeLayer(heatmapLayer);
        }
    }
}

function toggleIncidents() {
    const btn = document.getElementById('toggleIncidents');
    btn.classList.toggle('active');
    
    if (btn.classList.contains('active')) {
        incidentMarkers.forEach(marker => marker.addTo(map));
    } else {
        incidentMarkers.forEach(marker => map.removeLayer(marker));
    }
}

function toggleTrafficLayer() {
    const btn = document.getElementById('toggleTraffic');
    btn.classList.toggle('active');
    // Traffic layer toggle functionality
}

// ===== AUTO REFRESH =====
function startAutoRefresh() {
    stopAutoRefresh();
    autoRefreshInterval = setInterval(() => {
        loadTrafficData();
    }, settings.refreshInterval);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ===== SETTINGS =====
function saveSettings() {
    // Validate inputs
    const refreshInterval = parseInt(document.getElementById('refreshInterval').value);
    const zoomLevel = parseInt(document.getElementById('zoomLevel').value);
    
    if (isNaN(refreshInterval) || refreshInterval < 10 || refreshInterval > 300) {
        showNotification('Refresh interval must be between 10 and 300 seconds', 'error');
        return;
    }
    
    if (isNaN(zoomLevel) || zoomLevel < 8 || zoomLevel > 18) {
        showNotification('Zoom level must be between 8 and 18', 'error');
        return;
    }

    settings.refreshInterval = refreshInterval * 1000;
    settings.zoomLevel = zoomLevel;
    settings.soundAlerts = document.getElementById('soundAlerts').checked;

    map.setZoom(settings.zoomLevel);
    
    if (document.getElementById('autoRefresh').checked) {
        startAutoRefresh();
    }

    document.getElementById('settingsModal').classList.remove('active');
    showNotification('Settings saved!', 'success');
}

// ===== UI UPDATES =====
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = `Last updated: ${timeString}`;
}

function updateCoordinatesDisplay() {
    document.getElementById('currentCoords').textContent = 
        `Lat: ${currentLocation.lat.toFixed(4)}, Lng: ${currentLocation.lng.toFixed(4)}`;
}

// FIXED: Corrected the status dot reference bug
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    
    if (connected) {
        statusElement.innerHTML = '<span class="status-dot"></span> Connected';
        const dot = statusElement.querySelector('.status-dot');
        if (dot) {
            dot.style.background = '#4CAF50';
        }
    } else {
        statusElement.innerHTML = '<span class="status-dot"></span> Disconnected';
        const dot = statusElement.querySelector('.status-dot');
        if (dot) {
            dot.style.background = '#F44336';
        }
    }
}

// IMPROVED: Better notification system with visual feedback
function showNotification(message, type) {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred', 'error');
});

// ===== INITIALIZE =====
console.log('Dashboard script loaded successfully');