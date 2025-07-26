# 📊 FoodTracker - Project Specification

## Overview
Macro-nutrients and calories tracking application with calendar interface.

## 🎯 Core Features
- **Multi-view calendar**: daily/weekly/monthly
- **Meal management**: add/remove meals by date
- **Food management**: add/modify quantity/remove food items in meals
- **Macro tracking**: proteins, carbs, fats + calories
- **Daily totals**: displayed on calendar

## 🏗️ Technical Architecture

### Languages
- **TypeScript**: Full-stack type safety

### Frontend
- **React + Tailwind + shadcn/ui**
- Interactive calendar with view switching
- Intuitive meal/food management interface

### Backend
- **NestJS + SQLite + MCP Server**
- REST API for CRUD operations
- MCP server for Claude integration
- Local SQLite cache for frequent foods

### Integrations
- **OpenFoodFacts API**: name + barcode search
- **Docker**: full containerization
- **MCP Protocol**: data exposure for Claude

## 📁 Structure
```
foodTracker/
├── backend/          # FastAPI + MCP + SQLite
├── frontend/         # React + Tailwind + shadcn
├── shared/           # Common TypeScript types
├── docker-compose.yml
└── README.md
```

## 🔄 User Workflow
1. **Calendar view** → select date
2. **Add meal** → search foods (name/barcode)
3. **Modify quantities** → auto macro recalculation
4. **View totals** → daily tracking

## 📋 Additional Requirements
- **Documentation**: English, concise, efficient
- **Git-ready**: repository ready for commit
- **Feature-oriented architecture**: easy to add/remove features

## ✅ Finalized Requirements

### Architecture Decisions
- **Backend**: NestJS + SQLite + MCP Server
- **Feature Architecture**: Feature-oriented modules for easy add/remove
- **Calendar**: Day-level granularity (time slots as future feature)
- **Meal Categories**: Auto-assignment by time + customization support
- **Food Cache**: Local SQLite table + OpenFoodFacts sync
- **MCP Integration**: Full CRUD capabilities for Claude

### Ready to implement with extensible architecture for future features.