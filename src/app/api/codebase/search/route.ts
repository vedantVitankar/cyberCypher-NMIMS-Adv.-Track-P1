import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to recursively get all file paths
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Filter for relevant code files only
      if (/\.(ts|tsx|js|jsx|sql|css|md)$/.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    const searchTerms = query ? query.toLowerCase().split(' ').filter((t: string) => t.length > 3) : [];
    
    const srcDir = path.join(process.cwd(), 'src');
    const allFiles = getAllFiles(srcDir);
    
    // 1. Generate File Tree (for agent awareness of structure)
    const fileTree = allFiles.map(f => path.relative(process.cwd(), f)).join('\n');

    // 2. Score and Select Files
    const scoredFiles = allFiles.map(filePath => {
      const relativePath = path.relative(process.cwd(), filePath);
      let score = 0;
      
      // Prefer Schema/Types
      if (filePath.includes('schema.sql') || filePath.includes('types.ts')) score += 5;
      
      // Search in path
      searchTerms.forEach((term: string) => {
        if (relativePath.toLowerCase().includes(term)) score += 3;
      });

      return { filePath, relativePath, score };
    });

    // Also read content to search inside files (expensive but necessary for "full access" feel)
    // Optimization: Only read top 50 likely files by path first, or just read all if < 100 files.
    // Given the project size, we'll do a hybrid: 
    // We will pick the top 20 files by path match OR core files, and read them.
    // Then we refine score based on content.
    
    // For now, let's keep it simple and efficient:
    // 1. Always include schema/db definitions.
    // 2. Include files where path matches query keywords.
    // 3. Include generic core files if few matches found.

    const relevantFiles = scoredFiles
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15); // Limit to 15 files to prevent token overflow

    // Always ensure schema is there if not already
    const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.sql');
    if (!relevantFiles.find(f => f.filePath === schemaPath) && fs.existsSync(schemaPath)) {
      relevantFiles.unshift({ filePath: schemaPath, relativePath: 'src/lib/db/schema.sql', score: 100 });
    }

    const results = await Promise.all(relevantFiles.map(async (f) => {
      try {
        const content = fs.readFileSync(f.filePath, 'utf-8');
        return {
          path: f.relativePath,
          content: content.slice(0, 8000) // 8kb limit per file
        };
      } catch (e) {
        return null;
      }
    }));

    return NextResponse.json({ 
      fileTree,
      files: results.filter(Boolean) 
    });

  } catch (error) {
    console.error('Codebase Search Error:', error);
    return NextResponse.json({ error: 'Failed to search codebase' }, { status: 500 });
  }
}
