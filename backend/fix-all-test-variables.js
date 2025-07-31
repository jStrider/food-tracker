const fs = require('fs');
const path = require('path');
const glob = require('glob');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Common variable naming fixes - these apply to all test files
  const commonFixes = [
    // Mock declarations
    { from: /const _mock([A-Z][a-zA-Z]*) = /g, to: 'const mock$1 = ' },
    
    // Basic variables
    { from: /const _([a-z][a-zA-Z]*) = /g, to: 'const $1 = ' },
    { from: /let _([a-z][a-zA-Z]*) = /g, to: 'let $1 = ' },
    
    // Function parameters and loops
    { from: /for \(let _([a-z]) = /g, to: 'for (let $1 = ' },
    { from: /for \(let _([a-z]); /g, to: 'for (let $1; ' },
    
    // Variable references - need to be careful with these
  ];

  commonFixes.forEach(fix => {
    const newContent = content.replace(fix.from, fix.to);
    if (newContent !== content) {
      hasChanges = true;
      content = newContent;
    }
  });

  // Fix specific reference patterns
  const referencePatterns = [
    // Common pattern: expect(result)
    { from: /expect\(_result\)/g, to: 'expect(result)' },
    { from: /expect\(_([a-z][a-zA-Z]*)\)/g, to: 'expect($1)' },
    
    // Service method calls with _result
    { from: /const _result = await ([a-zA-Z]+)\.([a-zA-Z]+)/g, to: 'const result = await $1.$2' },
    
    // Mock service calls
    { from: /mock([A-Z][a-zA-Z]*)\.([a-zA-Z]+)\.mockResolvedValue\(_([a-zA-Z]+)\)/g, to: 'mock$1.$2.mockResolvedValue($3)' },
    
    // Repository saves
    { from: /const _([a-z][a-zA-Z]*) = await ([a-zA-Z]+)\.save/g, to: 'const $1 = await $2.save' },
    
    // Test variables
    { from: /const _([a-z][a-zA-Z]*) = \{/g, to: 'const $1 = {' },
    { from: /const _([a-z][a-zA-Z]*) = \[/g, to: 'const $1 = [' },
  ];

  referencePatterns.forEach(fix => {
    const newContent = content.replace(fix.from, fix.to);
    if (newContent !== content) {
      hasChanges = true;
      content = newContent;
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }

  return hasChanges;
}

// Find all test files
const testFiles = glob.sync('src/**/*.spec.ts', { cwd: __dirname });

console.log(`Found ${testFiles.length} test files to process...`);

let totalFixed = 0;
testFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (processFile(fullPath)) {
    totalFixed++;
  }
});

console.log(`\nFixed ${totalFixed} files with variable naming issues`);

// Now fix specific files with custom issues
console.log('\nFixing specific file issues...');

// Fix meals service spec missing import
const mealsServicePath = path.join(__dirname, 'src/features/meals/meals.service.spec.ts');
if (fs.existsSync(mealsServicePath)) {
  let content = fs.readFileSync(mealsServicePath, 'utf8');
  
  // Add missing NotFoundException import
  if (!content.includes('import { NotFoundException }')) {
    content = content.replace(
      'import { Test, TestingModule } from "@nestjs/testing";',
      'import { Test, TestingModule } from "@nestjs/testing";\nimport { NotFoundException } from "@nestjs/common";'
    );
    fs.writeFileSync(mealsServicePath, content);
    console.log('Fixed: Added NotFoundException import to meals.service.spec.ts');
  }
}

// Fix throttler guard spec
const throttlerGuardPath = path.join(__dirname, 'src/common/guards/custom-throttler.guard.spec.ts');
if (fs.existsSync(throttlerGuardPath)) {
  let content = fs.readFileSync(throttlerGuardPath, 'utf8');
  
  // Fix THROTTLER_OPTIONS import
  content = content.replace(
    'import { ThrottlerStorage, THROTTLER_OPTIONS } from "@nestjs/throttler";',
    'import { ThrottlerStorage } from "@nestjs/throttler";'
  );
  
  // Remove THROTTLER_OPTIONS provider and add proper module setup
  content = content.replace(
    /\{\s*provide: THROTTLER_OPTIONS,[\s\S]*?\},\s*/g,
    ''
  );
  
  fs.writeFileSync(throttlerGuardPath, content);
  console.log('Fixed: throttler guard spec imports');
}

console.log('\nAll test variable issues fixed!');