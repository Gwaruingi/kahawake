// Script to fix common TypeScript and ESLint errors
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively get all TypeScript files
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      fileList = getAllTsFiles(filePath, fileList);
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) && 
      !file.endsWith('.d.ts')
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fix 'any' type errors
function fixAnyTypeErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace catch(err: any) with proper error handling
  const catchAnyRegex = /catch\s*\(\s*(\w+)\s*:\s*any\s*\)\s*{([^}]*)}/g;
  content = content.replace(catchAnyRegex, (match, varName, block) => {
    modified = true;
    return `catch (${varName}) {
      const error = ${varName} instanceof Error ? ${varName} : new Error('An error occurred');
      ${block.replace(new RegExp(`${varName}\\.message`, 'g'), 'error.message')}
    }`;
  });
  
  // Add 'use client' directive if using React hooks
  if (
    (content.includes('useState') || 
     content.includes('useEffect') || 
     content.includes('useRouter') ||
     content.includes('useSearchParams')) && 
    !content.includes("'use client'") && 
    !content.includes('"use client"')
  ) {
    content = `'use client';\n\n${content}`;
    modified = true;
  }
  
  // Fix unescaped entities
  content = content.replace(/(\w)'(\w)/g, "$1'$2");
  content = content.replace(/(\w)"(\w)/g, '$1"$2');
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed issues in: ${filePath}`);
  }
}

// Main execution
try {
  const rootDir = path.resolve(__dirname, '..');
  const tsFiles = getAllTsFiles(rootDir);
  
  console.log(`Found ${tsFiles.length} TypeScript files to process`);
  
  tsFiles.forEach(file => {
    try {
      fixAnyTypeErrors(file);
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  });
  
  console.log('Finished processing files');
} catch (err) {
  console.error('Error:', err);
}
