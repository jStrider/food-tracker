# 📊 FoodTracker

[![CI Pipeline](https://github.com/username/foodtracker/workflows/🚀%20CI%2FCD%20Pipeline/badge.svg)](https://github.com/username/foodtracker/actions/workflows/ci.yml)
[![Security Scan](https://github.com/username/foodtracker/workflows/🔐%20Security%20Scan/badge.svg)](https://github.com/username/foodtracker/actions/workflows/security.yml)
[![Backend Coverage](https://codecov.io/gh/username/foodtracker/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/username/foodtracker)
[![Frontend Coverage](https://codecov.io/gh/username/foodtracker/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/username/foodtracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

A comprehensive macro-nutrients and calories tracking application with an intuitive calendar interface, built with modern TypeScript technologies.

## 🎯 Features

- **📅 Multi-view Calendar**: Daily, weekly, and monthly nutrition tracking
- **🍽️ Meal Management**: Add, edit, and remove meals by date
- **🥗 Food Database**: Search foods by name or barcode via OpenFoodFacts API
- **📊 Macro Tracking**: Detailed protein, carbs, fats, and calorie monitoring
- **🎨 Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **🔌 MCP Integration**: Claude-compatible Model Context Protocol server

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: NestJS + TypeScript + SQLite + TypeORM
- **Shared**: Common TypeScript types and interfaces
- **Integration**: OpenFoodFacts API + MCP Protocol
- **Deployment**: Docker + Docker Compose

### Project Structure
```
foodTracker/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── features/     # Feature modules (meals, foods, nutrition, calendar)
│   │   ├── common/       # Shared utilities
│   │   ├── database/     # Database configuration
│   │   └── mcp/          # MCP server implementation
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React web application
│   ├── src/
│   │   ├── features/     # Feature components
│   │   ├── components/   # Reusable UI components
│   │   ├── utils/        # Utilities and API client
│   │   └── hooks/        # Custom React hooks
│   ├── Dockerfile
│   └── package.json
├── shared/               # Common TypeScript types
│   ├── src/
│   │   ├── types/        # Entity types
│   │   ├── interfaces/   # Service interfaces
│   │   ├── dtos/         # Data transfer objects
│   │   └── constants/    # Application constants
│   └── package.json
├── docker-compose.yml    # Production deployment
├── docker-compose.dev.yml # Development environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodTracker
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install

   # Install shared types
   cd ../shared && npm install
   ```

3. **Environment setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env

   # Frontend environment
   cp frontend/.env.example frontend/.env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run start:dev

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Docker Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Access application at http://localhost:3000
```

### Production Deployment

```bash
# Build and start production containers
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📱 Usage

### Adding Meals
1. Navigate to the calendar view
2. Click on any date to view the day
3. Click "Add Meal" to create a new meal
4. Choose meal category (breakfast, lunch, dinner, snack)

### Adding Foods
1. In a meal, click "Add Food"
2. Search by food name or scan barcode
3. Select food and specify quantity
4. Nutrition is automatically calculated

### Tracking Progress
- View daily totals on calendar
- Check weekly/monthly trends
- Monitor macro distribution
- Track calorie intake

## 🔌 MCP Integration

The backend includes a Model Context Protocol (MCP) server for Claude integration:

### Available Tools
- `get_meals`: Retrieve meals for a specific date
- `create_meal`: Create new meals
- `search_foods`: Search food database
- `add_food_to_meal`: Add foods to meals
- `get_daily_nutrition`: Get nutrition summaries

### Available Resources
- `foodtracker://meals`: Access all meals
- `foodtracker://foods`: Access food database
- `foodtracker://nutrition`: Access nutrition data

## 🛠️ Development

### Backend Development
```bash
cd backend

# Start development server
npm run start:dev

# Run tests
npm test

# Build for production
npm run build
```

### Frontend Development
```bash
cd frontend

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### Shared Types
```bash
cd shared

# Build types
npm run build

# Watch for changes
npm run watch
```

## 📊 API Documentation

### Meals API
- `GET /meals` - List meals (optionally by date)
- `POST /meals` - Create new meal
- `PUT /meals/:id` - Update meal
- `DELETE /meals/:id` - Delete meal

### Foods API
- `GET /foods/search` - Search foods by name or barcode
- `POST /foods/:mealId/entries` - Add food to meal
- `PUT /foods/entries/:entryId` - Update food entry
- `DELETE /foods/entries/:entryId` - Remove food from meal

### Nutrition API
- `GET /nutrition/daily` - Get daily nutrition summary
- `GET /nutrition/weekly` - Get weekly nutrition data
- `GET /nutrition/monthly` - Get monthly nutrition data

### Calendar API
- `GET /calendar/month` - Get calendar month view
- `GET /calendar/week` - Get calendar week view
- `GET /calendar/day` - Get calendar day view

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
DATABASE_PATH=data/foodtracker.db
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

## 🧪 Testing & Quality

### Test Coverage Requirements
- **Backend**: Minimum 80% coverage (unit + integration tests)
- **Frontend**: Minimum 80% coverage (unit + component tests)
- **E2E Tests**: Critical user flows with Playwright

### Running Tests
```bash
# Backend tests with coverage
cd backend
npm run test:cov              # Coverage report
npm run test:e2e             # Integration tests
npm run test:watch           # Watch mode

# Frontend tests with coverage
cd frontend
npm run test:coverage        # Unit tests with coverage
npm run test:e2e            # E2E tests with Playwright
npm run test:e2e:ui         # Interactive E2E test runner

# Full test suite (from root)
npm run test                # Run all tests
npm run lint                # ESLint + TypeScript checks
```

### Quality Gates
Our CI/CD pipeline enforces these quality standards:
- ✅ **TypeScript**: Strict type checking with no errors
- ✅ **ESLint**: Code style and best practices
- ✅ **Security**: Vulnerability scanning with Trivy & npm audit
- ✅ **Coverage**: 80% minimum for both backend and frontend
- ✅ **Performance**: Lighthouse performance scores >80
- ✅ **Accessibility**: WCAG 2.1 AA compliance (90%+ score)

### Performance & Lighthouse
- **Core Web Vitals**: LCP <2.5s, CLS <0.1, TBT <300ms
- **Bundle Size**: <500KB JavaScript, <100KB CSS
- **Image Optimization**: Modern formats (WebP, AVIF)
- **Network**: HTTP/2, compression, efficient caching

## 📦 Deployment

### Docker Production
```bash
# Build and deploy
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=2

# Update containers
docker-compose pull && docker-compose up -d
```

### Manual Deployment
1. Build all components
2. Configure environment variables
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API specifications

---

Built with ❤️ using modern TypeScript technologies# Repository cleanup completed
