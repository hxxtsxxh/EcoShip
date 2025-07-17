# UPS EcoShip - Sustainable Shipping Calculator & Carbon Footprint Analysis

> A comprehensive full-stack application built for the 2025 UPS Hackathon, featuring real-time shipping calculations, carbon footprint analysis, and sustainability rewards.

[![React Native](https://img.shields.io/badge/React%20Native-0.79+-blue.svg)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053+-black.svg)](https://expo.dev/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)

## 🏆 2025 UPS Hackathon Project

This project was developed for the **2025 UPS Hackathon** by the **Rapid-Rabbits** team. It combines cutting-edge mobile technology with advanced backend analytics to promote sustainable shipping practices while optimizing business value.

## 🌟 Features Overview

### 📱 Mobile Application (React Native + Expo)
- **Shipping Calculator**: Compare UPS services with real-time carbon footprint analysis
- **Package Tracking**: Interactive tracking with intelligent demo patterns
- **AI Chat Assistant**: Google Gemini-powered shipping guidance
- **Rewards System**: Gamified sustainability tracking with eco-points
- **Smart City Search**: Autocomplete with fallback for US destinations

### 🚀 Backend API (FastAPI + Python)
- **Carbon Footprint Engine**: Industry-standard CO₂ calculations
- **Eco-Efficiency Scoring**: 0-25 point business-focused sustainability rating
- **Route Optimization**: 15+ major US shipping corridors with fallback logic
- **UPS Service Integration**: All 6 UPS service types with realistic pricing
- **SOLID Architecture**: Maintainable, scalable backend design

### 🌱 Sustainability Features
- **Real-time Carbon Analysis**: Precise CO₂ emissions for every shipment
- **Environmental Comparisons**: Tree equivalents, car miles, carbon offset costs
- **Green Recommendations**: Actionable insights for sustainable shipping
- **Reward System**: Points for eco-friendly shipping choices that balance business profitability

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** or **Android Emulator** (optional)

### 🔥 One-Command Setup

```bash
# Clone the repository
git clone https://github.com/2025-UPS-Hackathon/Rapid-Rabbits.git
cd Rapid-Rabbits

# Backend setup and start (automatically installs dependencies)
cd backend
chmod +x deploy.sh
./deploy.sh setup && ./deploy.sh start &

# Frontend setup and start (in a new terminal)
cd .. # Return to root directory
npm install
npm run dev

# Open app: Follow the QR code or press 'i' for iOS, 'a' for Android
```

### 📱 Alternative Frontend Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for web
npm run build:web

# Test backend integration
npm run test:backend
```

### 🐍 Backend Manual Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py

# Alternative: Use uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📱 App Modes

### 🔗 Backend Mode (Enhanced Experience)
When connected to the FastAPI backend:
- ✅ **Real-time carbon calculations** with industry-standard emission factors
- ✅ **Eco-efficiency scoring** balancing cost and environmental impact
- ✅ **Enhanced delivery estimates** with business day handling
- ✅ **Route optimization** across 15+ major US shipping corridors
- ✅ **Live backend health monitoring** with status indicators

### 🎮 Demo Mode (Fallback/Development)
Intelligent mock data system:
- **"delivered123"** → Shows delivered package with signature
- **"transit456"** → Shows package in transit between facilities
- **"outfordelivery789"** → Shows package out for delivery today
- **Any tracking number** → Generates unique realistic tracking experience

## 🏗️ Project Architecture

```
ups-ecoship/
├── 📱 Frontend (React Native + Expo)
│   ├── app/(tabs)/                 # Tab-based navigation
│   │   ├── index.tsx              # Shipping calculator
│   │   ├── track.tsx              # Package tracking
│   │   ├── chat.tsx               # AI chat interface
│   │   ├── rewards.tsx            # Sustainability rewards
│   │   └── settings.tsx           # App settings
│   ├── components/                # Reusable UI components
│   │   ├── ShippingOptionCard.js  # Service comparison cards
│   │   ├── ChatInterface.js       # AI chat component
│   │   ├── BackendStatus.tsx      # Health monitoring
│   │   └── CitySearchInput.js     # Smart location search
│   ├── contexts/                  # React contexts
│   │   ├── AuthContext.tsx        # Authentication
│   │   ├── UserContext.tsx        # User data & rewards
│   │   └── ThemeContext.tsx       # UI theming
│   └── services/                  # API integrations
│       ├── backendAPI.ts          # FastAPI integration
│       ├── gemini.js              # Google AI
│       ├── userService.js         # User management
│       └── shippingCalculator.js  # Fallback calculations
├── � Backend (FastAPI + Python)
│   ├── main.py                    # FastAPI application
│   ├── config.py                  # Configuration management
│   ├── models/                    # Data models
│   │   ├── shipping.py            # Shipping request/response models
│   │   ├── data_models.py         # Core data structures
│   │   └── interfaces.py          # Abstract interfaces
│   ├── services/                  # Business logic (SOLID principles)
│   │   ├── ups_services.py        # UPS service definitions
│   │   ├── implementations.py     # Service implementations
│   │   ├── factory.py             # Factory pattern
│   │   └── quote_generator.py     # Quote generation logic
│   ├── utils/                     # Utility functions
│   │   ├── carbon_calculator.py   # CO₂ calculations
│   │   ├── delivery_calculator.py # Delivery date logic
│   │   ├── eco_efficiency_scorer.py # Sustainability scoring
│   │   └── validators.py          # Input validation
│   └── tests/                     # Comprehensive test suite
└── � Configuration
    ├── package.json               # Node.js dependencies
    ├── app.json                   # Expo configuration
    ├── tsconfig.json              # TypeScript configuration
    └── requirements.txt           # Python dependencies
```

## 🔧 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Backend health check with status |
| `GET` | `/demo` | Quick demo of available features |
| `POST` | `/calculate-shipping` | Get shipping quotes with carbon analysis |
| `GET` | `/routes` | Available shipping routes (15+ corridors) |
| `GET` | `/services` | UPS service information with eco-scoring |

### Example API Usage

```bash
# Health check
curl http://localhost:8000/health

# Calculate shipping rates
curl -X POST "http://localhost:8000/calculate-shipping" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {
      "city": "New York",
      "state": "NY", 
      "zip_code": "10001"
    },
    "destination": {
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90210"
    },
    "package": {
      "weight_kg": 5.0,
      "category": "medium"
    }
  }'
```

### API Documentation
When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🌱 Carbon Footprint Analysis

### How It Works
The app calculates CO₂ emissions using:
- **Transportation mode** (air vs. ground percentages)
- **Distance calculations** (great circle distance between cities)
- **Package weight** and density factors
- **Industry-standard emission factors** (kg CO₂ per kg⋅km)

### Example Output
```json
{
  "service": "UPS Ground",
  "carbon_footprint_kg": 2.14,
  "environmental_context": {
    "trees_equivalent": 0.32,
    "car_miles_equivalent": 5.2,
    "carbon_offset_cost_usd": 0.04
  },
  "eco_efficiency": {
    "points": 23,
    "tier": "excellent",
    "explanation": "Outstanding balance of cost and environmental performance"
  }
}
```

## 🏆 Eco-Efficiency Scoring System

### Business-Focused 0-25 Point Scale
- **21-25**: Excellent - Outstanding balance of cost and environmental performance
- **17-20**: Very Good - Strong cost-effective option with good value
- **13-16**: Good - Moderate eco-friendly choice with reasonable trade-offs
- **9-12**: Fair - Balanced medium-speed service option
- **5-8**: Poor - Express service with higher costs and impact
- **0-4**: Very Poor - Premium express with significant trade-offs

### Calculation Methodology
- **Cost Effectiveness (70%)**: Price competitiveness and business value
- **Environmental Impact (30%)**: Carbon efficiency and sustainability
- **Tighter Scoring**: Medium-speed services have more competitive ranges
## 📱 App Features

### 🏠 Home Screen (Shipping Calculator)
- Origin and destination city search with autocomplete
- Package weight input with validation (0.1-68 kg)
- Real-time UPS service comparison
- Carbon footprint analysis for each option
- Eco-efficiency scoring and recommendations
- Backend health monitoring

### 📦 Tracking Screen
- Package tracking with visual timeline
- Smart demo patterns:
  - `"delivered123"` → Delivered package with signature
  - `"transit456"` → Package in transit between facilities
  - `"outfordelivery789"` → Out for delivery today
  - Any other number → Generates realistic tracking data
- Real-time status updates
- Delivery estimation with business day logic

### 💬 Chat Screen
- Google Gemini AI-powered assistant
- Natural language shipping queries
- Carbon footprint information
- Sustainability recommendations
- Fallback responses for offline scenarios

### 🏆 Rewards Screen
- Real-time eco-points tracking
- Sustainability statistics and achievements
- Available and upcoming rewards
- Carbon savings visualization
- Earning tips and recommendations

### ⚙️ Settings Screen  
- Theme switching (light/dark mode)
- Backend connection status
- User profile management
- Demo mode toggle

## 🎮 Demo Mode Features

### Intelligent Fallback System
When backend is unavailable, the app provides:
- Realistic shipping calculations using local algorithms
- Smart tracking patterns based on tracking number
- Cached city data for common destinations
- Offline AI responses for common queries

### Demo Route Examples
- **NYC ↔ Los Angeles**: 3,944 km, Coast-to-coast corridor
- **Chicago ↔ Houston**: 1,742 km, Midwest-South route
- **Miami ↔ Seattle**: 4,308 km, Diagonal transcontinental
## 🧪 Testing & Quality Assurance

### Test Files Included
- `test-backend-integration.js` - Backend API integration tests
- `test-data-mapping.js` - Frontend-backend data mapping validation
- `test-rewards-logic.js` - Reward calculation verification
- `test-realtime-workflow.js` - Real-time update testing
- `test-frontend-backend-integration.js` - End-to-end flow validation

### Running Tests
```bash
# Test backend integration
npm run test:backend

# Manual test files
node test-rewards-logic.js
node test-data-mapping.js
```

### Backend Testing
```bash
cd backend
python -m pytest tests/ -v   # Run all backend tests
./deploy.sh verify           # Verify setup and functionality
```

## 🚀 Deployment

### Production Backend (Docker)
```bash
cd backend
docker build -t ups-ecoship-backend .
docker run -p 8000:8000 ups-ecoship-backend
```

### Production Frontend (Expo)
```bash
# Build for production
npm run build:web

# Deploy to Expo
expo publish
```

### Environment Variables
```bash
# Backend (.env)
DEBUG=false
HOST=0.0.0.0
PORT=8000

# Frontend (app configuration)
EXPO_NO_TELEMETRY=1
```

## 🔍 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check Python version
python3 --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check port availability
lsof -i :8000
```

**Frontend connection issues:**
```bash
# Clear Expo cache
expo start --clear

# Reset Metro bundler
npx react-native start --reset-cache

# Check backend health
curl http://localhost:8000/health
```

**Build errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
expo start --clear
```
cd backend && ./deploy.sh dev

# Frontend (Terminal 2) 
npm start
```

### Production

**Option 1: Traditional Deployment**
```bash
# Backend
cd backend && ./deploy.sh start

# Frontend
npm run build  # or deploy to App Store/Google Play
```

**Option 2: Docker Deployment**
```bash
cd backend && ./deploy.sh docker-bg  # Background mode
npm start  # Frontend
```

**Option 3: Full Docker Stack**
```bash
cd backend
docker-compose up -d  # Starts backend services
# Deploy frontend to mobile app stores or web
```

## 🔍 Troubleshooting

### Common Issues

**Backend not starting:**
```bash
# Check Python version (requires 3.8+)
python3 --version

# Reinstall dependencies
cd backend
rm -rf venv
./deploy.sh setup
```

**Frontend connection issues:**
```bash
# Check backend health
curl http://localhost:8000/health

# Verify environment configuration
cat .env

# Reset Expo cache
npx expo start --clear
```

**Port conflicts:**
```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9

# Use different port
cd backend
HOST=0.0.0.0 PORT=8001 ./deploy.sh start
```

### Debug Mode
```bash
# Backend with detailed logging
cd backend && DEBUG=true ./deploy.sh dev

# Frontend with debug output
EXPO_DEBUG=true npm start
```

## 📚 API Documentation

### Request/Response Models

**Shipping Request:**
```typescript
interface ShippingRequest {
  origin: {
    city: string;
    state: string;
    zip_code: string;
  };
  destination: {
    city: string;
    state: string; 
    zip_code: string;
  };
  package: {
    weight_kg: number;
    category: "small" | "medium" | "large" | "extra_large";
  };
}
```

**Shipping Response:**
```typescript
interface ShippingResponse {
  quotes: Array<{
    service_name: string;
    cost_usd: number;
    eta_hours: number;
    carbon_breakdown: {
      total_co2_kg: number;
      air_co2_kg: number;
      ground_co2_kg: number;
      trees_offset: number;
      car_miles_equivalent: number;
      offset_cost_usd: number;
    };
    eco_efficiency: {
      score: number;
      tier: string;
      reasoning: string;
    };
  }>;
  route_info: {
    origin_city: string;
    destination_city: string;
    air_distance_km: number;
    estimated_ground_distance_km: number;
  };
}
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- **Frontend**: TypeScript, ESLint, Prettier
- **Backend**: Python 3.8+, Black formatting, type hints
- **Testing**: Comprehensive test coverage for new features
- **Documentation**: Update README for significant changes

## 🏗️ Technical Stack

### Frontend Technologies
- **React Native 0.79+** - Cross-platform mobile development
- **Expo SDK 53** - Development platform and toolchain
- **TypeScript 5.8+** - Type-safe JavaScript development
- **Expo Router** - File-based navigation system
- **React Navigation** - Navigation library
- **Lucide React Native** - Beautiful icon set

### Backend Technologies
- **FastAPI 0.104+** - Modern Python web framework
- **Pydantic** - Data validation and serialization
- **Uvicorn** - Lightning-fast ASGI server
- **Geopy** - Geographic distance calculations
- **Python 3.8+** - Core programming language

### External Integrations
- **Google Gemini AI** - Advanced chat interface
- **Firebase** - User authentication and data storage
- **Expo Secure Store** - Secure local storage
- **React Native Async Storage** - Local data persistence

### Development Tools
- **Expo CLI** - Development toolchain
- **Metro Bundler** - JavaScript bundling
- **Babel** - JavaScript compilation
- **Docker** - Containerized deployment

## 📊 Performance & Scalability

### Backend Performance
- **Sub-100ms response times** for shipping calculations
- **Concurrent request handling** with FastAPI async support
- **Efficient caching** for route and service data
- **Graceful error handling** with fallback responses

### Frontend Optimization
- **Lazy loading** for screen components
- **Efficient state management** with React Context
- **Image optimization** with Expo image processing
- **Bundle size optimization** with Metro tree-shaking

### Scalability Features
- **Microservice-ready architecture** with SOLID principles
- **Database-agnostic design** for easy integration
- **API versioning support** for backward compatibility
- **Horizontal scaling support** with stateless design

## 🔒 Security & Privacy

### Data Protection
- **Secure API endpoints** with validation
- **Local data encryption** using Expo Secure Store
- **No sensitive data logging** in production
- **CORS protection** for API endpoints

### Privacy Considerations
- **Minimal data collection** - only necessary shipping information
- **Local-first approach** - demo mode works offline
- **No tracking** - user data stays on device in demo mode
- **Optional authentication** - full functionality without account

## 📈 Business Impact

### Sustainability Goals
- **Carbon awareness** - Every shipment shows environmental impact
- **Behavior change** - Rewards incentivize eco-friendly choices
- **Cost optimization** - Balance environmental and business benefits
- **Transparency** - Clear carbon calculations and comparisons

### Revenue Optimization
- **Smart pricing** - Higher-priced eco options earn more rewards
- **Service promotion** - Highlight premium services with value
- **Customer retention** - Gamified sustainability engagement
- **Data insights** - Track customer preferences and behavior

## 📄 License

This project was developed for the **2025 UPS Hackathon** and is intended for demonstration and educational purposes.

## 🏆 Team Rapid-Rabbits

Developed with ❤️ for the 2025 UPS Hackathon by Team Rapid-Rabbits

### Key Achievements
- ✅ **Full-stack implementation** - Complete mobile app with robust backend
- ✅ **Real-time carbon analysis** - Industry-standard calculations
- ✅ **Business-focused scoring** - Balances profit and sustainability  
- ✅ **Comprehensive testing** - Multiple test suites and validation
- ✅ **Production-ready code** - SOLID principles and best practices
- ✅ **User experience focus** - Intuitive design and offline capabilities

---

**Happy sustainable shipping! 🌱📦**

*For questions, issues, or contributions, please create an issue in the GitHub repository.*
