/**
 * Script to replace @/ path aliases with relative paths
 * Run with: node fix-path-aliases.js
 * 
 * This script finds all @/ imports and replaces them with relative paths
 * based on file location.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript/JavaScript files
const files = execSync('git ls-files "**/*.{ts,tsx,js,jsx}"', { encoding: 'utf-8' })
  .split('\n')
  .filter(f => f && !f.includes('node_modules') && !f.includes('.next'));

console.log(`Found ${files.length} files to check...`);

let totalReplacements = 0;

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  let modified = false;
  const newLines = [];
  
  // Calculate relative path from file to root
  const fileDir = path.dirname(file);
  const depth = fileDir.split(path.sep).filter(p => p).length;
  const relativeToRoot = '../'.repeat(depth);
  
  lines.forEach((line, index) => {
    // Match @/ imports
    const importMatch = line.match(/from\s+['"]@\/([^'"]+)['"]/);
    if (importMatch) {
      const importPath = importMatch[1];
      const relativePath = relativeToRoot + importPath;
      const newLine = line.replace(/@\/[^'"]+/, relativePath);
      newLines.push(newLine);
      modified = true;
      totalReplacements++;
      console.log(`  ${file}:${index + 1} - ${line.trim()} -> ${newLine.trim()}`);
    } else {
      newLines.push(line);
    }
  });
  
  if (modified) {
    fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
  }
});

console.log(`\nTotal replacements: ${totalReplacements}`);
console.log('Done! Review changes with: git diff');

