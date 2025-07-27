# TODO - FoodTracker

## 🚨 Urgent / Critical

### Authentication System
- [ ] Implement proper authentication system (JWT/Session based)
- [ ] Remove hardcoded userId from frontend and backend
- [ ] Add user context/session management
- [ ] Implement login/logout functionality
- [ ] Add user registration flow

### Database & Migrations
- [ ] Set up proper database migrations
- [ ] Disable `synchronize: true` in production
- [ ] Create initial migration scripts
- [ ] Document migration process
- [ ] Add seed data for development

## 🐛 Bugs to Fix

### UI/UX Issues
- [ ] Add meal button visibility on calendar (PR #9 pending merge)
- [ ] Improve mobile responsiveness for meal creation modal
- [ ] Fix date picker format consistency

### API Issues
- [ ] Standardize error responses across all endpoints
- [ ] Add proper error logging and monitoring
- [ ] Implement request validation middleware

## ✨ Features to Implement

### Core Features
- [ ] Food search and selection when creating meals
- [ ] Nutrition goals setting and tracking
- [ ] Weekly/Monthly nutrition reports
- [ ] Meal templates/favorites
- [ ] Barcode scanning for food items

### DatePicker Implementation
- [ ] Install date-fns and date-fns-tz
- [ ] Create timezone-aware DatePicker component at `/src/components/ui/DatePicker.tsx`
- [ ] Add date utilities at `/src/utils/date.ts`
- [ ] Integrate with meal forms and calendar

### Calendar Features
- [ ] Drag and drop meals between days
- [ ] Copy meals to other dates
- [ ] Meal planning mode
- [ ] Export calendar data

### Food Management
- [ ] Custom food creation
- [ ] Recipe builder
- [ ] Portion size calculator
- [ ] Food category management

## 🔧 Technical Improvements

### Backend
- [ ] Add comprehensive unit tests
- [ ] Implement integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add API documentation (Swagger)
  - [ ] Configure Swagger in main.ts
  - [ ] Add @ApiTags decorators to controllers
  - [ ] Add @ApiProperty decorators to DTOs
  - [ ] Document all endpoints with @ApiOperation
  - [ ] Add authentication documentation
  - [ ] Generate OpenAPI spec file
- [ ] Implement caching strategy
- [ ] Add rate limiting per user

### Frontend
- [ ] Add unit tests for components
- [ ] Implement E2E tests with Playwright
- [ ] Optimize bundle size
- [ ] Add PWA support
- [ ] Implement offline mode
- [ ] Add loading states and error boundaries

### DevOps
- [ ] Set up production deployment
- [ ] Configure environment variables properly
- [ ] Add health check endpoints
- [ ] Implement logging and monitoring
- [ ] Set up backup strategy
- [ ] Configure HTTPS/SSL

## 📚 Documentation

- [ ] Complete API documentation
- [ ] Add user guide
- [ ] Create developer setup guide
- [ ] Document deployment process
- [ ] Add architecture decisions record (ADR)

## 🎯 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Integration with fitness trackers
- [ ] AI-powered meal suggestions
- [ ] Social features (share meals/recipes)
- [ ] Nutritionist consultation feature
- [ ] Multi-language support

## 📝 Notes

### Known Issues
- Current implementation uses hardcoded userId: `a3aa41df-b467-40c8-867c-beb5edc4d032`
- Database synchronize is enabled (should use migrations in production)
- No authentication system in place
- Limited error handling in frontend

### Dependencies to Update
- Regular security updates needed
- Check for major version updates quarterly

---

Last updated: 2025-07-26