# Fix for Issue #91: SQL Query Optimization

## Problems Identified

1. **Unnecessary Joins**: All meal queries included LEFT JOINs on food_entries and foods tables even when not needed
2. **Verbose Logging**: SQL query logging was flooding the logs in production
3. **Missing Query Optimization**: No connection pooling optimization, query caching, or index hints
4. **No Selective Loading**: Relations were always loaded regardless of actual needs

## Solutions Implemented

### 1. TypeORM Configuration Optimization
Created `backend/src/config/typeorm.config.ts` with:
- **Conditional Logging**: Only enabled in development when DB_LOGGING=true
- **Connection Pooling**: Optimized pool sizes (25 for production, 10 for development)
- **Query Caching**: Enabled database caching in production (30 seconds)
- **Query Timeout**: Set max execution time to prevent long-running queries
- **Performance Settings**: Added statement timeout and connection optimization

### 2. Selective Relation Loading
Modified meal queries to only join food tables when explicitly requested:
- `includeFoods` parameter now properly controls JOIN behavior
- Reduces query complexity and data transfer
- Improves performance for listing operations

### 3. Query Optimization Service
Created `backend/src/common/services/query-optimization.service.ts` with:
- Query hints for index usage
- Optimal pagination helpers
- Selective relation loading
- Query result caching
- Optimized count queries
- Date range optimization

### 4. Database Module Update
Updated `backend/src/database/database.module.ts` to use the new optimized configuration

## Performance Improvements

### Before Optimization
- All queries included 2 LEFT JOINs regardless of need
- No connection pooling optimization
- Verbose logging in production
- No query caching

### After Optimization
- Conditional JOINs based on actual requirements
- Optimized connection pool (2.5x larger in production)
- Logging disabled in production
- 30-second query cache for repeated queries
- Index hints for better query planning

## Environment Variables

```bash
# Disable SQL logging (default in production)
DB_LOGGING=false

# Connection pool size (optional)
DATABASE_POOL_SIZE=25

# Connection timeout (optional)
DATABASE_CONNECT_TIMEOUT=10000

# Enable SSL for production databases
DATABASE_SSL=true
```

## Docker Configuration
The `docker-compose.yml` already has `DB_LOGGING=false` set, ensuring no verbose logging in Docker environment.

## Monitoring

To monitor query performance:
1. Queries taking >1 second are automatically logged
2. Use `maxQueryExecutionTime` setting to identify slow queries
3. Connection pool metrics available through TypeORM

## Next Steps

1. Add database indexes for commonly queried fields:
   - `meals.date` (already likely indexed)
   - `meals.userId`
   - `food_entries.mealId`
   
2. Implement query result caching for:
   - Daily nutrition summaries
   - Meal statistics
   - Food search results

3. Consider implementing:
   - Read replicas for heavy read operations
   - Materialized views for complex aggregations
   - Query batching for bulk operations