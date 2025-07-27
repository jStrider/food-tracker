# Architecture Review - FoodTracker

Date : 2025-01-27  
**Mise à jour** : 2025-01-27 - Authentification JWT implémentée (commit 31d3864)

## 1. SYNTHÈSE HAUT NIVEAU

### Forces du projet ✅
- **Architecture monorepo** bien organisée (backend/frontend/shared)
- **Stack moderne** : NestJS + React + TypeScript + SQLite
- **Séparation des responsabilités** correcte avec modules fonctionnels
- **Intégration API externe** OpenFoodFacts bien encapsulée
- **Tests unitaires et E2E** présents
- **Types TypeScript** bien utilisés

### Faiblesses structurelles ❌
- **Authentification partiellement implémentée** : JWT existe mais guard global désactivé ⚠️
- **Gestion d'état frontend** basique (pas de store global)
- **Absence de validation côté frontend**
- **DTOs partagés non utilisés** (dossier shared inutilisé)
- **Configuration environnement** manquante (.env non versionnés)
- **Pas de gestion des erreurs globale** côté frontend

### Points critiques à revoir en priorité 🔴
1. **Sécurité** : Activer le JwtAuthGuard global (actuellement commenté ligne 60)
2. **Configuration** : Centraliser la config (JWT_SECRET en dur)
3. **TEMP_USER_ID** : Encore utilisé malgré l'auth fonctionnelle
4. **Shared module** : Utiliser les types partagés au lieu de dupliquer
5. **Gestion d'erreurs** : Implémenter un intercepteur global frontend
6. **Validation** : Ajouter validation frontend (zod/yup)

### Zones stables ✅
- Structure des entités TypeORM
- Services backend bien architecturés
- Composants UI (shadcn/ui)
- Configuration build (Vite + TypeScript)

### Niveau de maturité : **MVP Ready** (70%)
- Fonctionnalités core implémentées
- Architecture scalable
- Manque polish production (auth, monitoring, error handling)

## 2. ANALYSE DE COHÉRENCE

### Erreurs de logique détectées
1. **Double guard dans app.module.ts** : ThrottlerGuard défini 2 fois
2. ✅ **Routes React corrigées** : Structure avec Layout et ProtectedRoute OK maintenant
3. **TEMP_USER_ID** encore utilisé dans MealsService malgré l'auth JWT fonctionnelle
4. **Calculs nutritionnels dupliqués** entre entités et services
5. **JWT sans refresh token** : Risque de déconnexion après 7 jours

### Anti-patterns identifiés
1. **God Service** : MealsService fait trop (500+ lignes)
2. **Eager loading systématique** dans FoodEntry
3. **Pas de DTO de réponse** : Entités exposées directement
4. **Configuration en dur** : URLs, timeouts, secrets

## 3. REVUE D'ARCHITECTURE

### Structure discutable
```
backend/
├── features/        # ✅ Bonne approche modulaire
│   ├── auth/       # ✅ Implémenté mais guard global désactivé
│   ├── meals/      # ⚠️ Service trop volumineux
│   └── foods/      # ✅ Bien organisé
├── common/         # ⚠️ Sous-utilisé
└── database/       # ✅ Migrations OK + seed user

frontend/
├── features/       # ✅ Cohérent avec backend
├── components/     # ⚠️ Mélange UI générique et métier
├── contexts/       # ✅ AuthContext implémenté
└── pages/          # ✅ Login/Register ajoutés

shared/            # ❌ Complètement inutilisé !
```

### Choix architecturaux discutables
1. **SQLite en production** : OK pour POC, limité pour scale
2. **Pas de cache Redis** : Performance OpenFoodFacts API
3. **Pas de queue** : Appels API synchrones
4. **Monolithique** : Pas de microservices (OK pour MVP)

## 4. OPTIMISATIONS POSSIBLES

### Performance
1. **Cache OpenFoodFacts** : Redis ou in-memory
2. **Pagination frontend** : Virtual scrolling pour listes
3. **Lazy loading routes** React
4. **Indices DB manquants** sur date, userId

### Lisibilité
1. **Extraire logique métier** des entités vers services
2. **Créer des custom hooks** pour la logique réutilisable
3. **Utiliser des enums** pour les constantes (units, etc.)

### Maintenabilité
1. **Centraliser les types** dans shared/
2. **Créer des factories** pour les tests
3. **Ajouter des logs structurés** (winston)

### Testabilité
1. **Mocks centralisés** pour les services externes
2. **Tests d'intégration** pour les workflows complets
3. **Tests de performance** pour les calculs nutritionnels

## 5. SÉCURITÉ ET ROBUSTESSE

### Vulnérabilités détectées 🔴
1. **JWT_SECRET en dur** dans le code
2. **Pas de validation des inputs** côté frontend
3. **CORS trop permissif** (accept all origins)
4. **Pas de rate limiting** sur l'authentification
5. **SQL injection possible** via queryBuilder sans sanitization

### Zones non protégées
1. **Upload d'images** non implémenté mais prévu (imageUrl)
2. **Pas de CSRF protection**
3. **Sessions non gérées** (JWT only)
4. **Logs sensibles** (passwords potentiellement loggés)

## 6. RESPECT DES CONVENTIONS

### Écarts détectés
1. **Naming** : Mélange camelCase et snake_case dans la DB
2. **Imports** : Pas d'ordre cohérent (absolute/relative)
3. **Tests** : Pas de convention de nommage (.spec vs .test)
4. **Comments** : Mélange français/anglais

## 7. EFFETS DE BORD

1. **Getters calculés** dans les entités : Performance impact
2. **Auto-categorization** : Side effect dans BeforeInsert
3. **Usage tracking** : Mutation dans incrementUsage()
4. **Global axios config** : Affecte toutes les requêtes

## 8. COMPORTEMENTS INCOMPLETS

1. **Timezone handling** : User timezone stocké mais pas utilisé
2. **Offline mode** : Pas de gestion hors ligne
3. **Image upload** : Field exists mais pas d'implémentation
4. **Nutrition goals** : Stockés mais pas de tracking
5. **MCP module** : Présent mais pas documenté/utilisé

## 9. REVUE PAR MODULE

### Backend Modules

#### Auth Module ✅⚠️
- **Points forts** :
  - JWT authentication implémentée
  - Login/Register fonctionnels
  - AuthContext côté frontend
  - Protected routes
- **Problèmes restants** :
  - JwtAuthGuard commenté dans app.module.ts (ligne 60)
  - Pas de refresh token (déconnexion après 7j)
  - Pas de logout côté serveur (blacklist)
  - JWT_SECRET en dur
- **Recommandations** :
  - Activer le guard global immédiatement
  - Implémenter refresh token avec rotation
  - Ajouter blacklist des tokens
  - Variables d'environnement pour secrets

#### Meals Module ⚠️
- **Problèmes** :
  - Service trop volumineux (538 lignes)
  - Logique métier dans les entités
  - Pas de cache pour les stats
  - Transactions manuelles partout
- **Recommandations** :
  - Extraire MealCategorizationService
  - Créer MealStatsService
  - Utiliser @Transaction decorator

#### Foods Module ✅
- **Points forts** :
  - Bonne séparation avec OpenFoodFactsService
  - Cache service bien pensé
  - Gestion des erreurs correcte
- **Améliorations** :
  - Ajouter queue pour sync OpenFoodFacts
  - Implémenter batch operations

#### Nutrition Module ⚠️
- **Problèmes** :
  - Peu utilisé
  - Pas de tracking des goals
  - Calculs dupliqués avec Meals
- **Recommandations** :
  - Centraliser tous les calculs nutritionnels ici
  - Ajouter tracking des objectifs

### Frontend Components

#### Calendar Components ⚠️
- **Problèmes** :
  - Navigation complexe entre vues
  - Pas de state partagé
  - Re-fetch à chaque changement
- **Recommandations** :
  - Utiliser un state manager
  - Implémenter cache côté client

#### Food Search ✅
- **Points forts** :
  - Debounce bien implémenté
  - Gestion loading states
- **Améliorations** :
  - Ajouter recherche offline
  - Historique des recherches

#### Auth Context ⚠️
- **Problèmes** :
  - Axios interceptor global
  - Pas de gestion token expiration
  - Loading state basique
- **Recommandations** :
  - Utiliser instance axios dédiée
  - Auto-refresh token
  - Meilleur loading/error state

## 10. PLAN DE REFACTORISATION

### Phase 1 : Sécurité et Authentification (Priorité CRITIQUE)

#### 1.1 Finaliser JWT Authentication ⚠️ PARTIELLEMENT FAIT
```typescript
// À faire :
- [ ] Décommenter JwtAuthGuard dans app.module.ts (ligne 60) 🔴 URGENT
- [ ] Remplacer TEMP_USER_ID par req.user.userId dans tous les services
- [ ] Configurer JWT_SECRET via variables d'environnement
- [ ] Implémenter refresh token mechanism (actuellement 7j seulement)
- [ ] Ajouter logout avec blacklist Redis
- [ ] Gérer expiration token côté frontend

// Déjà fait ✅ :
- [x] Auth module avec JWT strategy
- [x] Login/Register endpoints  
- [x] AuthContext frontend
- [x] Protected routes
- [x] Axios interceptor pour tokens
```

#### 1.2 Sécuriser les endpoints
```typescript
// À faire :
- [ ] Ajouter validation DTOs sur tous les controllers
- [ ] Implémenter CSRF protection
- [ ] Configurer CORS correctement (whitelist origins)
- [ ] Rate limiting spécifique sur /auth routes
- [ ] Sanitizer les inputs pour éviter XSS
```

#### 1.3 Configuration sécurisée
```typescript
// À faire :
- [ ] Créer .env.example avec toutes les variables
- [ ] Utiliser @nestjs/config avec validation schema
- [ ] Séparer config dev/staging/prod
- [ ] Secrets management (AWS Secrets Manager ou similar)
```

### Phase 2 : Architecture et Performance

#### 2.1 Refactorer MealsService
```typescript
// Créer ces services :
- [ ] MealCategorizationService
- [ ] MealStatsService  
- [ ] MealNutritionCalculator
- [ ] MealRepository (custom queries)
```

#### 2.2 Optimiser la base de données
```sql
-- Migrations à créer :
- [ ] ADD INDEX idx_meals_user_date ON meals(userId, date)
- [ ] ADD INDEX idx_foods_barcode ON foods(barcode)
- [ ] ADD INDEX idx_food_entries_meal ON food_entries(mealId)
- [ ] Implémenter soft deletes avec deletedAt
```

#### 2.3 Améliorer le frontend
```typescript
// À implémenter :
- [ ] State management avec Zustand
- [ ] Error boundary global avec Sentry
- [ ] React.lazy() pour routes
- [ ] react-hook-form + zod pour validation
- [ ] React Query cache optimization
```

#### 2.4 Implémenter le cache
```typescript
// Architecture cache :
- [ ] Redis pour cache partagé
- [ ] Cache OpenFoodFacts results (TTL 7 jours)
- [ ] Cache user preferences (TTL 1 heure)
- [ ] Cache daily stats (TTL jusqu'à minuit)
```

### Phase 3 : Qualité et Maintenabilité

#### 3.1 Utiliser le module shared
```typescript
// shared/src/types/
- [ ] nutrition.types.ts
- [ ] meal.types.ts
- [ ] user.types.ts
- [ ] common.types.ts

// shared/src/constants/
- [ ] meal.constants.ts
- [ ] nutrition.constants.ts

// shared/src/utils/
- [ ] date.utils.ts
- [ ] nutrition.calculator.ts
```

#### 3.2 Améliorer les tests
```typescript
// Nouveaux tests :
- [ ] Fixtures avec @faker-js/faker
- [ ] E2E : workflow complet création repas
- [ ] E2E : authentification flow
- [ ] Performance : calculs sur 1000 meals
- [ ] Integration : OpenFoodFacts avec mocks
```

#### 3.3 Documentation et monitoring
```typescript
// À ajouter :
- [ ] Swagger complet avec examples
- [ ] Winston logger avec correlation IDs
- [ ] Health checks détaillés (/health/live, /health/ready)
- [ ] Sentry pour error tracking
- [ ] Prometheus metrics
```

### Phase 4 : Features manquantes

#### 4.1 Fonctionnalités core
- [ ] Upload d'images pour custom foods
- [ ] Tracking nutrition goals avec notifications
- [ ] Mode offline avec IndexedDB + sync
- [ ] Export CSV/PDF des données
- [ ] Import depuis MyFitnessPal/Cronometer

#### 4.2 Améliorer l'UX
- [ ] Dashboard avec Chart.js
- [ ] Suggestions ML basées sur historique
- [ ] Scan barcode (QuaggaJS)
- [ ] PWA avec notifications push
- [ ] Dark mode

#### 4.3 Features avancées
- [ ] Multi-user / famille
- [ ] Recipes avec scaling
- [ ] Meal planning hebdomadaire
- [ ] Shopping list generation
- [ ] Intégration wearables (Fitbit, etc.)

## 11. ROADMAP PRIORISÉE

### 🚨 URGENT (1-2 semaines)
1. **Finaliser l'authentification JWT** 🔴
   - Activer JwtAuthGuard global (1 ligne à décommenter!)
   - Remplacer TEMP_USER_ID par req.user.userId
   - JWT_SECRET dans .env
2. **Variables d'environnement pour config**
3. **Validation des inputs (backend + frontend)**
4. **Fix double ThrottlerGuard**
5. **Sécuriser CORS et ajouter CSRF**

### ⚠️ IMPORTANT (1 mois)
1. **Refactoring du MealsService**
2. **State management frontend (Zustand)**
3. **Utilisation du module shared**
4. **Tests E2E pour workflows critiques**
5. **Cache Redis pour OpenFoodFacts**
6. **Error boundary et logging**

### 💡 NICE TO HAVE (2-3 mois)
1. **Mode offline avec sync**
2. **Export/Import de données**
3. **Multi-langue (i18n)**
4. **Dashboard analytics**
5. **PWA avec notifications**
6. **Scan de codes-barres**

## 12. MÉTRIQUES DE SUCCÈS

### Performance
- [ ] Page load < 3s (3G)
- [ ] API response < 200ms (p95)
- [ ] Bundle size < 500KB

### Qualité
- [ ] Test coverage > 80%
- [ ] 0 vulnerabilities (npm audit)
- [ ] Lighthouse score > 90

### Sécurité
- [ ] OWASP Top 10 compliance
- [ ] Pentest passed
- [ ] GDPR compliant

## 13. CONCLUSION

Le projet FoodTracker a une base solide avec une architecture moderne et scalable. Les principaux efforts doivent porter sur :

1. **La sécurisation** (authentification, validation, configuration)
2. **L'optimisation** (cache, indices, lazy loading)
3. **La maintenabilité** (shared types, tests, documentation)

Avec ces améliorations, le projet passera d'un MVP fonctionnel à une application production-ready capable de scaler et d'évoluer sereinement.