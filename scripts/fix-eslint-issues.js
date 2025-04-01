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

// Fix unescaped entities in JSX
async function fixUnescapedEntities(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace unescaped entities
    let fixedContent = content
      .replace(/(\s|>)'/g, '$1&apos;')  // Fix single quotes
      .replace(/(\s|>)"/g, '$1&quot;'); // Fix double quotes
    
    if (fixedContent !== content) {
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`Fixed unescaped entities in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return false;
  }
}

// Fix img tags to use Next.js Image component
async function fixImgTags(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Check if the file has img tags
    if (content.includes('<img ')) {
      // Check if Next.js Image is already imported
      let fixedContent = content;
      
      if (!content.includes("import Image from 'next/image'") && !content.includes('import { Image }')) {
        // Add Image import if not present
        fixedContent = fixedContent.replace(
          /import (.*?) from ['"]next\/.*?['"]/,
          (match) => `import Image from 'next/image';\n${match}`
        );
        
        if (fixedContent === content) {
          // If no Next.js imports found, add at the top after 'use client'
          if (content.includes("'use client'")) {
            fixedContent = content.replace(
              /'use client';/,
              "'use client';\n\nimport Image from 'next/image';"
            );
          } else {
            // Add at the very top
            fixedContent = `import Image from 'next/image';\n${content}`;
          }
        }
      }
      
      // Replace img tags with Image component
      fixedContent = fixedContent.replace(
        /<img\s+([^>]*)src=["']([^"']*)["']([^>]*)>/g,
        (match, beforeSrc, src, afterSrc) => {
          // Extract alt text if present
          const altMatch = (beforeSrc + afterSrc).match(/alt=["']([^"']*)["']/);
          const alt = altMatch ? altMatch[1] : 'Image';
          
          // Extract width and height if present
          const widthMatch = (beforeSrc + afterSrc).match(/width=["']([^"']*)["']/);
          const heightMatch = (beforeSrc + afterSrc).match(/height=["']([^"']*)["']/);
          
          const width = widthMatch ? widthMatch[1] : '100';
          const height = heightMatch ? heightMatch[1] : '100';
          
          // Extract other attributes
          const otherAttrs = (beforeSrc + afterSrc)
            .replace(/alt=["'][^"']*["']/g, '')
            .replace(/width=["'][^"']*["']/g, '')
            .replace(/height=["'][^"']*["']/g, '')
            .trim();
          
          return `<Image src="${src}" alt="${alt}" width={${width}} height={${height}} ${otherAttrs} />`;
        }
      );
      
      if (fixedContent !== content) {
        await writeFile(filePath, fixedContent, 'utf8');
        console.log(`Fixed img tags in: ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return false;
  }
}

// Fix let variables that should be const
async function fixLetToConst(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace 'let' with 'const' for variables that are never reassigned
    // This is a simple approach and might not catch all cases
    const fixedContent = content.replace(
      /let\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+);(?!\s*\1\s*=)/g,
      'const $1 = $2;'
    );
    
    if (fixedContent !== content) {
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`Fixed let to const in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return false;
  }
}

// Fix @ts-ignore to @ts-expect-error
async function fixTsIgnore(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace @ts-ignore with @ts-expect-error
    const fixedContent = content.replace(
      /\/\/ @ts-ignore/g,
      '// @ts-expect-error'
    );
    
    if (fixedContent !== content) {
      await writeFile(filePath, fixedContent, 'utf8');
      console.log(`Fixed @ts-ignore to @ts-expect-error in: ${filePath}`);
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
    
    let fixedUnescapedCount = 0;
    let fixedImgCount = 0;
    let fixedLetCount = 0;
    let fixedTsIgnoreCount = 0;
    
    for (const file of tsFiles) {
      const fixedUnescaped = await fixUnescapedEntities(file);
      if (fixedUnescaped) {
        fixedUnescapedCount++;
      }
      
      const fixedImg = await fixImgTags(file);
      if (fixedImg) {
        fixedImgCount++;
      }
      
      const fixedLet = await fixLetToConst(file);
      if (fixedLet) {
        fixedLetCount++;
      }
      
      const fixedTsIgnore = await fixTsIgnore(file);
      if (fixedTsIgnore) {
        fixedTsIgnoreCount++;
      }
    }
    
    console.log(`Fixed unescaped entities in ${fixedUnescapedCount} files`);
    console.log(`Fixed img tags in ${fixedImgCount} files`);
    console.log(`Fixed let to const in ${fixedLetCount} files`);
    console.log(`Fixed @ts-ignore to @ts-expect-error in ${fixedTsIgnoreCount} files`);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
