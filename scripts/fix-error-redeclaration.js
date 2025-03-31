const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Function to recursively find all TypeScript files
async function findTsFiles(dir) {
  const files = await fs.promises.readdir(dir, { withFileTypes: true });
  const tsFiles = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      // Skip node_modules and .next directories
      if (file.name !== 'node_modules' && file.name !== '.next') {
        const nestedFiles = await findTsFiles(fullPath);
        tsFiles.push(...nestedFiles);
      }
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      tsFiles.push(fullPath);
    }
  }
  
  return tsFiles;
}

// Function to fix error redeclaration in catch blocks
async function fixErrorRedeclaration(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Regular expression to match error redeclaration pattern
    const errorRedeclarationRegex = /catch\s*\(\s*error\s*\)\s*{\s*\n\s*const\s+error\s*=/g;
    
    if (errorRedeclarationRegex.test(content)) {
      // Replace the error redeclaration with errorObj
      const fixedContent = content.replace(
        /catch\s*\(\s*error\s*\)\s*{\s*\n\s*const\s+error\s*=/g, 
        'catch (error) {\n      const errorObj ='
      );
      
      // Replace subsequent references to the redeclared error with errorObj
      const finalContent = fixedContent.replace(
        /(\s*console\.error\([^)]*:?\s*)error(.*\);)/g,
        '$1errorObj$2'
      ).replace(
        /(\s*return\s+[^;]*\()error(\s*,)/g,
        '$1errorObj$2'
      ).replace(
        /(\s*setError\()error\.message/g,
        '$1errorObj.message'
      ).replace(
        /(\s*toast\.error\()error\.message/g,
        '$1errorObj.message'
      ).replace(
        /(\s*message:\s*)error\.message/g,
        '$1errorObj.message'
      ).replace(
        /(\s*error\.stack)/g,
        'errorObj.stack'
      );
      
      await writeFile(filePath, finalContent, 'utf8');
      console.log(`Fixed error redeclaration in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return false;
  }
}

// Main function
async function main() {
  try {
    const rootDir = process.cwd();
    const tsFiles = await findTsFiles(rootDir);
    
    console.log(`Found ${tsFiles.length} TypeScript files to process`);
    
    let fixedCount = 0;
    
    for (const file of tsFiles) {
      const fixed = await fixErrorRedeclaration(file);
      if (fixed) {
        fixedCount++;
      }
    }
    
    console.log(`Fixed error redeclaration in ${fixedCount} files`);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
