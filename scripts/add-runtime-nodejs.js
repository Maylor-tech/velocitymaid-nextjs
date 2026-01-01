const fs = require('fs');
const path = require('path');

function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function addRuntimeExport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has runtime export
  if (content.includes('export const runtime = "nodejs"')) {
    return false;
  }
  
  // Only process files that use Prisma
  if (!content.includes('prisma') && !content.includes('@/lib/prisma')) {
    return false;
  }
  
  // Find the first export const dynamic line and add runtime before it
  if (content.includes('export const dynamic')) {
    content = content.replace(
      /export const dynamic = "force-dynamic";/,
      'export const runtime = "nodejs";\nexport const dynamic = "force-dynamic";'
    );
  } else {
    // If no dynamic export, add runtime after the first comment block or at the top
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find end of initial comment block
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('*') && !lines[i].trim().startsWith('/**')) {
        insertIndex = i;
        break;
      }
    }
    
    lines.splice(insertIndex, 0, 'export const runtime = "nodejs";');
    content = lines.join('\n');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// Find all route.ts files
const apiDir = path.join(__dirname, '..', 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

let updated = 0;
routeFiles.forEach(file => {
  if (addRuntimeExport(file)) {
    console.log(`Updated: ${file}`);
    updated++;
  }
});

console.log(`\nTotal files updated: ${updated}`);

