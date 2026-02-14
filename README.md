# Traffic Dashboard - Express.js

Real-time traffic monitoring dashboard using Express.js and TomTom Traffic API.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Traffic+Dashboard)

## 🚀 Features

- ✅ Real-time traffic flow data
- ✅ Traffic incident monitoring
- ✅ Interactive map with Leaflet.js
- ✅ Location search
- ✅ Auto-refresh every 30 seconds
- ✅ Responsive design
- ✅ TomTom API integration

## 📋 Prerequisites

- Node.js v18+ and npm
- TomTom API key ([Get one here](https://developer.tomtom.com/))

## 🛠️ Installation

1. **Clone the repository**
   \\\ash
   git clone https://github.com/YOUR_USERNAME/traffic-dashboard-express.git
   cd traffic-dashboard-express
   \\\

2. **Install dependencies**
   \\\ash
   npm install
   \\\

3. **Configure environment variables**
   \\\ash
   cp .env.example .env
   \\\
   
   Edit \.env\ and add your TomTom API key:
   \\\env
   TOMTOM_API_KEY=your-actual-api-key-here
   DEFAULT_LATITUDE=16.5062
   DEFAULT_LONGITUDE=80.6480
   \\\

4. **Start the server**
   \\\ash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   \\\

5. **Open in browser**
   \\\
   http://localhost:3000/dashboard
   \\\

## 📁 Project Structure

\\\
traffic-dashboard-express/
├── server.js              # Main Express server
├── package.json          # Dependencies
├── .env.example         # Environment template
├── routes/
│   ├── traffic.js      # Traffic API routes
│   └── views.js       # Page routes
├── services/
│   └── trafficService.js  # TomTom API integration
├── views/
│   ├── dashboard.ejs     # Main dashboard
│   └── index.ejs        # Home page
└── public/
    ├── css/            # Stylesheets
    └── js/            # Client-side JavaScript
\\\

## 🔧 API Endpoints

- \GET /\ - Home page
- \GET /dashboard\ - Main dashboard
- \GET /api/health\ - Health check
- \GET /api/traffic/flow\ - Traffic flow data
- \GET /api/traffic/incidents\ - Traffic incidents
- \GET /api/traffic/summary\ - Complete traffic summary

## 🌐 Technologies Used

- **Backend:** Node.js, Express.js
- **Template Engine:** EJS
- **HTTP Client:** Axios
- **Map:** Leaflet.js
- **API:** TomTom Traffic API
- **Styling:** Custom CSS

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \PORT\ | Server port | 3000 |
| \TOMTOM_API_KEY\ | TomTom API key | Required |
| \DEFAULT_LATITUDE\ | Default map latitude | 16.5062 |
| \DEFAULT_LONGITUDE\ | Default map longitude | 80.6480 |
| \MAP_ZOOM_LEVEL\ | Initial map zoom | 12 |
| \TRAFFIC_UPDATE_INTERVAL\ | Refresh interval (ms) | 30000 |

## 🚢 Deployment

### Heroku
\\\ash
heroku create your-app-name
heroku config:set TOMTOM_API_KEY=your-key
git push heroku main
\\\

### Vercel
\\\ash
vercel
\\\

## 📄 License

MIT License - feel free to use this project for learning or production!

## 👥 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📧 Contact

Your Name - your.email@example.com

Project Link: [https://github.com/YOUR_USERNAME/traffic-dashboard-express](https://github.com/YOUR_USERNAME/traffic-dashboard-express)

## 🙏 Acknowledgments

- [TomTom Traffic API](https://developer.tomtom.com/)
- [Leaflet.js](https://leafletjs.com/)
- [Express.js](https://expressjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
