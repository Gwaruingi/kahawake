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

// Fix HTML entities in source files
async function fixHtmlEntities(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace HTML entities with actual characters in import statements and string literals
    const fixedContent = content
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    
    if (fixedContent !== content) {
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`Fixed HTML entities in: ${filePath}`);
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
      const fixed = await fixHtmlEntities(file);
      if (fixed) {
        fixedCount++;
      }
    }
    
    console.log(`Fixed HTML entities in ${fixedCount} files`);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
