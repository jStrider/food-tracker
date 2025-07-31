const fs = require('fs');
const path = require('path');

// Fix nutrition controller integration spec
const nutritionControllerPath = path.join(__dirname, 'src/features/nutrition/nutrition.controller.integration.spec.ts');
let nutritionContent = fs.readFileSync(nutritionControllerPath, 'utf8');

// Fix variable declarations and references
const nutritionFixes = [
  { from: 'const _foodRepo =', to: 'const foodRepo =' },
  { from: 'const _apple = await foodRepo.save', to: 'const apple = await foodRepo.save' },
  { from: 'const _chickenBreast = await foodRepo.save', to: 'const chickenBreast = await foodRepo.save' },
  { from: 'const _brownRice = await foodRepo.save', to: 'const brownRice = await foodRepo.save' },
  { from: 'const _mealRepo =', to: 'const mealRepo =' },
  { from: 'const _breakfast = await mealRepo.save', to: 'const breakfast = await mealRepo.save' },
  { from: 'const _lunch = await mealRepo.save', to: 'const lunch = await mealRepo.save' },
  { from: 'const _foodEntryRepo =', to: 'const foodEntryRepo =' },
  { from: 'const _response = await request', to: 'const response = await request' },
  { from: 'const _dayWithData = response.body.find', to: 'const dayWithData = response.body.find' },
  { from: 'const _goals =', to: 'const goals =' },
  { from: 'const _userRepo =', to: 'const userRepo =' },
  { from: 'const _user = await userRepo.findOne', to: 'const user = await userRepo.findOne' },
  { from: 'const _mealRepo =', to: 'const mealRepo =' },
  { from: 'const _foodEntryRepo =', to: 'const foodEntryRepo =' },
  { from: 'const _foodRepo =', to: 'const foodRepo =' },
  { from: 'const _apple = await foodRepo.findOne', to: 'const apple = await foodRepo.findOne' },
  { from: 'for (let _i = 1; i <= 7; i++)', to: 'for (let i = 1; i <= 7; i++)' },
  { from: 'const _meal = await mealRepo.save', to: 'const meal = await mealRepo.save' },
  { from: 'const _total = protein + carbs + fat;', to: 'const total = protein + carbs + fat;' }
];

nutritionFixes.forEach(fix => {
  nutritionContent = nutritionContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
});

fs.writeFileSync(nutritionControllerPath, nutritionContent);
console.log('Fixed nutrition controller integration spec');

// Fix meals controller spec
const mealsControllerPath = path.join(__dirname, 'src/features/meals/meals.controller.spec.ts');
let mealsControllerContent = fs.readFileSync(mealsControllerPath, 'utf8');

const mealsControllerFixes = [
  { from: 'const _mockMealsService =', to: 'const mockMealsService =' },
  { from: 'const _mockNutritionService =', to: 'const mockNutritionService =' },
  { from: 'const _mockResult =', to: 'const mockResult =' },
  { from: 'const _query = { page: 1, limit: 10 };', to: 'const query = { page: 1, limit: 10 };' },
  { from: 'const _result = await controller.findAll(query);', to: 'const result = await controller.findAll(query);' },
  { from: 'const _query =', to: 'const query =' },
  { from: 'const _mockMeal =', to: 'const mockMeal =' },
  { from: 'const _result = await controller.', to: 'const result = await controller.' },
  { from: 'const _mockMeals =', to: 'const mockMeals =' },
  { from: 'const _mockSummary =', to: 'const mockSummary =' },
  { from: 'const _createDto =', to: 'const createDto =' },
  { from: 'const _updateDto =', to: 'const updateDto =' },
  { from: 'const _mockStats =', to: 'const mockStats =' },
  { from: 'const _goals =', to: 'const goals =' },
  { from: 'const _mockProgress =', to: 'const mockProgress =' },
  { from: 'const _mockDistribution =', to: 'const mockDistribution =' },
  { from: 'const _mockTrends =', to: 'const mockTrends =' },
  { from: 'const _mockSuggestions =', to: 'const mockSuggestions =' }
];

mealsControllerFixes.forEach(fix => {
  mealsControllerContent = mealsControllerContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
});

fs.writeFileSync(mealsControllerPath, mealsControllerContent);
console.log('Fixed meals controller spec');

// Fix meals service spec
const mealsServicePath = path.join(__dirname, 'src/features/meals/meals.service.spec.ts');
let mealsServiceContent = fs.readFileSync(mealsServicePath, 'utf8');

const mealsServiceFixes = [
  { from: 'const _mockQueryBuilder =', to: 'const mockQueryBuilder =' },
  { from: 'const _mockQueryRunner =', to: 'const mockQueryRunner =' },
  { from: 'const _mockMeals =', to: 'const mockMeals =' },
  { from: 'const _mockTotal =', to: 'const mockTotal =' },
  { from: 'const _result = await service.', to: 'const result = await service.' },
  { from: 'const _mockMeal =', to: 'const mockMeal =' },
  { from: 'const _createDto =', to: 'const createDto =' },
  { from: 'const _updateDto =', to: 'const updateDto =' },
  { from: 'const _existingMeal =', to: 'const existingMeal =' },
  { from: 'const _updatedMeal =', to: 'const updatedMeal =' },
  { from: 'const _existingEntries =', to: 'const existingEntries =' },
  { from: 'const _mockFood =', to: 'const mockFood =' },
  { from: 'const _customRanges =', to: 'const customRanges =' }
];

mealsServiceFixes.forEach(fix => {
  mealsServiceContent = mealsServiceContent.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
});

fs.writeFileSync(mealsServicePath, mealsServiceContent);
console.log('Fixed meals service spec');

console.log('All remaining test variable issues fixed!');