const fs = require('fs');
const path = require('path');

// Fix the meals service spec - last remaining issue
const mealsServicePath = path.join(__dirname, 'src/features/meals/meals.service.spec.ts');
let mealsServiceContent = fs.readFileSync(mealsServicePath, 'utf8');

// Fix the specific issue with _result in the autoCategorizeByTime test
mealsServiceContent = mealsServiceContent.replace(
  'const _result = (service as any).autoCategorizeByTime(time);',
  'const result = (service as any).autoCategorizeByTime(time);'
);

fs.writeFileSync(mealsServicePath, mealsServiceContent);
console.log('Fixed final meals service spec issue');

console.log('All test issues fixed!');