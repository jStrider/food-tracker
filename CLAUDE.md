# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
FoodTracker is a full-stack macro-nutrients and calories tracking application with calendar interface. Built with NestJS backend, React frontend, SQLite database, and includes a comprehensive MCP (Model Context Protocol) server for Claude integration.

**Current Status**: Backend implementation completed, frontend implementation in progress.

## Architecture & Key Patterns

### Monorepo Structure
```
foodTracker/
├── backend/          # NestJS + TypeORM + SQLite
├── frontend/         # React + Vite + Tailwind
├── shared/           # Common TypeScript types
└── docker-compose.yml
```

### Feature-Oriented Architecture
The backend uses a feature-oriented module structure where each domain (meals, foods, nutrition, calendar) is self-contained:
- Each feature has its own module, service, controller, entities, and DTOs
- Shared utilities go in `/src/common/`
- Database configuration is centralized in `/src/database/`
- MCP server integration is in `/src/mcp/`

### Database Layer
- **ORM**: TypeORM with SQLite
- **Entities**: All in `src/features/[feature]/entities/`
- **Migrations**: Auto-generated in `src/database/migrations/`
- **Relationships**: User → Meals → FoodEntries → Foods with proper cascade configurations

### MCP Integration
The backend includes a comprehensive MCP server (`/src/mcp/`) that exposes 23+ tools for Claude to interact with the application:
- Full CRUD operations for meals, foods, nutrition tracking
- Food search via OpenFoodFacts API
- Calendar and nutrition analytics
- Auto-categorization logic for time-based meal assignment

## Essential Development Commands

### Workspace Setup
```bash
# Install all dependencies (backend, frontend, shared)
npm run install:all

# Start development servers (both backend and frontend)
npm run dev

# Individual services
npm run dev:backend    # Start NestJS on :3001
npm run dev:frontend   # Start Vite on :3000
```

### Backend Development
```bash
cd backend

# Development
npm run start:dev      # Hot reload development server
npm run build         # Production build
npm test              # Run Jest tests
npm run lint          # ESLint + Prettier

# Database Operations
npm run db:migrate     # Run pending migrations
npm run db:generate    # Generate new migration from entity changes
npm run db:revert     # Rollback last migration
npm run db:show       # Show migration status
```

### Frontend Development
```bash
cd frontend

# Development
npm run dev           # Vite dev server
npm run build         # Production build (TypeScript + Vite)
npm run lint          # ESLint
npm run type-check    # TypeScript compilation check
```

### Docker Development
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose up -d
```

## Key Business Logic

### Meal Auto-Categorization
Meals are automatically categorized by time if no category is provided:
- `06:00-11:00` → breakfast
- `11:00-16:00` → lunch  
- `16:00-21:00` → dinner
- `21:00-06:00` → snack

### Food Search & Caching
- Primary: OpenFoodFacts API integration for comprehensive food database
- Local caching: Frequently used foods stored in SQLite for performance
- Barcode support: Search by name or barcode scan
- Auto-sync: External API data cached locally with timestamp tracking

### Nutrition Calculations
- Real-time macro calculations when food quantities change
- Daily/weekly/monthly nutrition summaries
- Goal tracking with progress indicators
- Computed columns for derived nutritional data

## API Architecture

### REST Endpoints
- **Meals**: `/meals` - Full CRUD with filtering by date/category
- **Foods**: `/foods` - Search, cache management, meal associations
- **Nutrition**: `/nutrition` - Daily/weekly/monthly summaries
- **Calendar**: `/calendar` - Multi-view calendar data with nutrition totals
- **Health**: `/health` - Service health monitoring

### Data Transfer Objects (DTOs)
All API inputs/outputs use TypeScript DTOs with class-validator decorations:
- Input validation through class-validator
- Response serialization through class-transformer
- Swagger documentation auto-generated from DTOs

## TypeScript Integration

### Shared Types
The `/shared` package contains all common TypeScript interfaces and types:
- Entity types mirror database schemas
- API response wrapper types
- Enum definitions for categories and sources
- Search and filter parameter types

### Type Safety
- Strict TypeScript configuration across all packages
- Shared types ensure frontend/backend consistency
- Class-validator decorators for runtime type checking
- TypeORM entities define database schema and TypeScript types

## Database Schema Key Points

### Entity Relationships
```
User (1) → (n) Meal (1) → (n) FoodEntry (n) → (1) Food
DailyNutrition (n) → (1) User
```

### Important Constraints
- Meals are soft-linked to dates (no strict date uniqueness)
- Foods can be from multiple sources (manual, OpenFoodFacts, USDA)
- FoodEntries link meals to foods with quantity tracking
- Computed nutrition values are calculated and stored for performance

## Frontend Architecture (In Progress)

### Tech Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui components
- React Query for state management
- React Router for navigation

### Feature Components
Each domain has its own feature folder:
- `/src/features/calendar/` - Calendar views and navigation
- `/src/features/meals/` - Meal CRUD operations
- `/src/features/foods/` - Food search and management
- `/src/features/nutrition/` - Goal tracking and progress

## Common Development Patterns

### Error Handling
- Backend: NestJS exception filters with proper HTTP status codes
- Validation: class-validator with detailed error messages
- Database: TypeORM error handling with transaction rollbacks

### Testing Strategy
- Backend: Jest unit tests for services and controllers
- Database: In-memory SQLite for test isolation
- E2E: Planned with actual database integration

### Environment Configuration
- Backend: `.env` files with NestJS ConfigModule
- Frontend: Vite environment variables with `VITE_` prefix
- Docker: Environment variable injection through compose files

## Important Implementation Notes

### Date Handling
- All dates stored as ISO strings in database
- Frontend uses date-fns for manipulation
- Timezone considerations handled at application level

### Performance Considerations
- Food search implements local caching to reduce API calls
- Nutrition calculations are pre-computed and stored
- Database queries use proper indexing and relations

### Security
- Input validation on all API endpoints
- CORS configured for frontend integration
- Environment variables for sensitive configuration

## MCP Server Integration

The MCP server (`/src/mcp/`) provides comprehensive Claude integration:
- 23+ tools covering all major application functionality
- Real-time access to application data and operations
- Supports complex workflows like meal planning and nutrition analysis
- Auto-categorization and intelligent food recommendations

Access MCP tools through Claude Code for full application interaction without manual API calls.

## Commandes Claude Personnalisées

### Workflow de Développement

**`/custom:bug [description] [--issue-title] [--branch-name]`**
- Workflow complet de correction de bug avec intégration GitHub
- Crée automatiquement l'issue GitHub avec template bug
- Créé et checkout la branche de fix
- Commit initial avec lien vers l'issue
- Push automatique de la branche

**`/custom:feature [description] [--issue-title] [--branch-name]`**
- Workflow complet de nouvelle fonctionnalité
- Crée l'issue GitHub avec template feature
- Créé la branche feature avec préfixe approprié
- Commit initial avec spécifications
- Push et configuration du tracking

**`/custom:hotfix [description] [--priority critical|high]`**
- Workflow de correction critique en urgence
- Crée l'issue avec label hotfix et priorité élevée
- Branche hotfix depuis main avec timestamp
- Workflow accéléré pour correction rapide

### Gestion des Pull Requests

**`/custom:pr [title] [--base main|develop] [--draft] [--link-issue]`**
- Création intelligente de Pull Request
- Analyse automatique des changements pour générer la description
- Application du template PR avec checklist
- Assignation automatique et demande de review
- Liaison automatique avec les issues correspondantes

**`/custom:finish`**
- Finalise le travail en cours et crée la PR
- Analyse des commits pour générer titre et description
- Vérifie que les tests passent avant création
- Applique les labels appropriés selon les changements

### Gestion Git Avancée

**`/custom:sync [--rebase] [--force]`**
- Synchronisation avec main/develop
- Résolution intelligente des conflits
- Rebase ou merge selon la stratégie choisie
- Vérification de l'intégrité après sync

**`/custom:status`**
- Statut complet du projet et de la branche courante
- Résumé des issues ouvertes et PRs en cours
- Statut des tests et build
- Recommandations d'actions

### Exemples d'utilisation

```bash
# Correction de bug
/custom:bug "Erreur 500 lors de l'ajout d'aliment" --branch-name "fix/add-food-error"

# Nouvelle fonctionnalité
/custom:feature "Ajout graphique nutrition hebdomadaire" --issue-title "Graphiques nutrition avancés"

# Correction critique
/custom:hotfix "API auth cassée en production" --priority critical

# Créer PR avec analyse intelligente
/custom:pr "Fix: Correction erreur 500 ajout aliment" --link-issue

# Synchroniser branche
/custom:sync --rebase

# Statut projet
/custom:status
```