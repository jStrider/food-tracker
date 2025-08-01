# 📚 FoodTracker API - Swagger Documentation Guide

## 🚀 Quick Start

### Access the Documentation

1. **Start the backend server:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Open Swagger UI:**
   - **URL:** http://localhost:3001/api/docs
   - **Interactive docs** with try-it-out functionality

### 🔐 Authentication Setup

1. **Create an account** (if needed):
   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "name": "Test User", 
       "password": "SecurePass123!"
     }'
   ```

2. **Login to get JWT token:**
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "SecurePass123!"
     }'
   ```

3. **Use the token in Swagger UI:**
   - Click the 🔒 **Authorize** button
   - Enter your JWT token (without "Bearer " prefix)
   - All protected endpoints will now be accessible

## 📋 API Overview

### 🏷️ Available Tags

| Tag | Description | Endpoints |
|-----|-------------|-----------|
| 🔐 **auth** | Authentication & User Management | Login, Register, Profile |
| 👤 **users** | User Profile Management | CRUD operations, preferences |
| 🍽️ **meals** | Meal Tracking & Management | Create, track, analyze meals |
| 🥗 **foods** | Food Database & Search | Search, nutrition data, cache |
| 📊 **nutrition** | Nutrition Analysis & Goals | Daily/weekly/monthly summaries |
| 📅 **calendar** | Calendar Views & Statistics | Monthly/weekly views, streaks |
| ⚙️ **Configuration** | Application Configuration | Config validation, system info |
| ❤️ **health** | Health Monitoring | System health checks |

## 🔑 Key Endpoints

### Authentication Flow
```
POST /auth/register  → Create account
POST /auth/login     → Get JWT token  
GET  /auth/me        → Get profile (requires token)
```

### Core Nutrition Tracking
```
POST /meals                    → Create meal
POST /foods/{mealId}/entries   → Add food to meal
GET  /nutrition/daily          → Get daily nutrition summary
GET  /calendar/month           → Get monthly calendar view
```

## 📊 Rate Limiting

The API implements intelligent rate limiting:

| Category | Limit | Usage |
|----------|-------|-------|
| **Auth** | 5/min | Login, registration |
| **Query** | 100/min (prod) / 200/min (dev) | Data retrieval |
| **Mutation** | 30/min (prod) / 60/min (dev) | Data modification |
| **Expensive** | 10/5min | Food search, heavy operations |

## 🎯 Testing Workflow

### 1. Basic Setup
```bash
# Create test user (development only)
POST /users/init-default

# Or register normally
POST /auth/register
POST /auth/login
```

### 2. Create Your First Meal
```bash
# Create a meal
POST /meals
{
  "name": "Breakfast",
  "category": "breakfast", 
  "date": "2025-01-15",
  "time": "08:00"
}

# Add food to meal
POST /foods/{mealId}/entries
{
  "foodId": "some-food-id",
  "quantity": 100,
  "unit": "g"
}
```

### 3. Track Nutrition
```bash
# Get daily summary
GET /nutrition/daily?date=2025-01-15

# Get calendar view
GET /calendar/month?month=1&year=2025
```

## 🔍 Search & Discovery

### Food Search
```bash
# Autocomplete search
GET /foods/search/autocomplete?q=banana&limit=5

# Full search with external APIs  
GET /foods/search?q=organic banana

# Barcode search
GET /foods/search?barcode=1234567890123
```

### Nutrition Analysis
```bash
# Weekly nutrition trends
GET /nutrition/weekly?startDate=2025-01-13

# Macro breakdown
GET /nutrition/macro-breakdown?date=2025-01-15

# Compare to goals
POST /nutrition/goals/compare?date=2025-01-15
{
  "calories": 2000,
  "protein": 150,
  "carbs": 250,
  "fat": 67
}
```

## 🚨 Error Handling

The API returns consistent error responses:

| Status | Description | Example |
|--------|-------------|---------|
| 400 | Bad Request | Invalid input data, validation errors |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |

## 📱 Mobile Development

### React Native / Flutter
All endpoints support CORS and are mobile-friendly:
- RESTful JSON API
- JWT authentication
- Proper HTTP status codes
- Comprehensive error messages

### Offline Support Considerations
- Cache frequently used foods
- Store user preferences locally
- Sync when connectivity restored

## 🧪 Testing with Different Tools

### Postman
1. Import the API using OpenAPI spec: http://localhost:3001/api/docs-json
2. Set up authentication with JWT bearer token
3. Use the collection for automated testing

### Insomnia
1. Import from OpenAPI: http://localhost:3001/api/docs-json
2. Set environment variables for base URL and token
3. Test all endpoints with proper authentication

### curl Examples
```bash
# With authentication
curl -X GET http://localhost:3001/nutrition/daily?date=2025-01-15 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# File upload (if supported)
curl -X POST http://localhost:3001/foods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Apple", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3}'
```

## 🔧 Development Tips

### Swagger UI Features
- **Try it out**: Test endpoints directly in the browser
- **Schema explorer**: View detailed request/response schemas
- **Authentication**: Use the Authorize button for protected endpoints
- **Download**: Export OpenAPI spec for code generation

### API Versioning
- Current version: **1.0.0**
- Backward compatibility maintained
- Deprecation notices in documentation

### Performance Optimization
- Use pagination for large data sets
- Cache frequently accessed data
- Batch operations when possible
- Monitor rate limits via headers

## 📞 Support

- **Documentation Issues**: Check the interactive docs at `/api/docs`
- **API Questions**: Review the comprehensive endpoint descriptions
- **Authentication Problems**: Verify JWT token format and expiration
- **Rate Limiting**: Check response headers for limit information

## 🎉 Features Implemented

✅ **Complete API Documentation**
- All endpoints documented with examples
- Request/response schemas
- Authentication requirements
- Rate limiting information

✅ **Interactive Testing**
- Swagger UI with try-it-out functionality
- JWT authentication integration
- Real-time validation

✅ **Developer Experience**
- Comprehensive error messages
- Detailed examples for all operations
- Multiple authentication flows
- Clear data formats and constraints

✅ **Production Ready**
- Security best practices documented
- Performance considerations
- Error handling patterns
- Monitoring endpoints

---

**Happy API Testing! 🚀**

> The Swagger documentation is now comprehensive and ready for development, testing, and integration.