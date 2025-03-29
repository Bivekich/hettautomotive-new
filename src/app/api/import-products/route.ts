import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

// Dynamic import for the importCSV function to handle ESM/CommonJS compatibility
async function getImportFunction() {
  try {
    // In Next.js API routes, dynamic imports work better than require
    const module = await import('../../../imports/directImport.js');
    return module.importCSV;
  } catch (error) {
    console.error('Failed to import the CSV import function:', error);
    throw new Error('Import functionality is not available');
  }
}

// Helper function to save uploaded file to temp directory
const saveUploadedFile = async (formData: FormData): Promise<string> => {
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Check file type
  if (!file.name.endsWith('.csv')) {
    throw new Error('Only CSV files are allowed');
  }

  // Create a unique filename
  const tempDir = path.join(os.tmpdir(), 'hett-imports');
  fs.mkdirSync(tempDir, { recursive: true });
  
  const filePath = path.join(tempDir, `${randomUUID()}.csv`);
  
  // Save the file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
};

export async function POST(request: NextRequest) {
  console.log('CSV import endpoint called');
  
  try {
    const formData = await request.formData();
    const filePath = await saveUploadedFile(formData);
    
    console.log(`File saved to ${filePath}, starting import process...`);
    
    // Get the import function
    const importCSV = await getImportFunction();
    
    // Process in the background
    // We return success immediately to avoid timeout
    const importPromise = importCSV(filePath)
      .then((result: any) => {
        console.log('Import complete with result:', result);
        // Clean up the temp file
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.warn('Failed to clean up temp file:', error);
        }
      })
      .catch((error: Error) => {
        console.error('Import failed:', error);
        // Clean up the temp file even on error
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', cleanupError);
        }
      });
    
    // Return success immediately - don't await the import
    return NextResponse.json({
      success: true,
      message: 'Import started successfully. This may take a few minutes to complete. Check server logs for progress.',
    });
  } catch (error) {
    console.error('Error processing CSV import:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during CSV import',
      },
      { status: 500 }
    );
  }
} 