import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to our sample CSV
    const sampleCSVPath = path.join(process.cwd(), 'src', 'imports', 'data', 'products.csv');
    
    // If the sample file exists, send it
    if (fs.existsSync(sampleCSVPath)) {
      const fileContent = fs.readFileSync(sampleCSVPath, 'utf-8');
      
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=sample-products.csv',
        },
      });
    }
    
    // If the file doesn't exist, return a basic sample
    const sampleCSV = 
      'name,category,subcategory,brand,model,modification,description,shortDescription,oem,featured,inStock\n' +
      '"Sample Product","Test Category","Test Subcategory","Test Brand","Test Model","Test Modification","This is a sample product description","Short description","ABC-123","true","true"';
    
    return new NextResponse(sampleCSV, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=sample-products.csv',
      },
    });
  } catch (error) {
    console.error('Error serving sample CSV:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate sample CSV' },
      { status: 500 }
    );
  }
} 