-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');