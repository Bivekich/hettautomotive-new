import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Read the template file from the public directory
    const templatePath = path.join(process.cwd(), 'public', 'products.csv');
    const fileContent = fs.readFileSync(templatePath, 'utf-8');

    // Create response with appropriate headers
    const response = new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="products.csv"',
      },
    });

    return response;
  } catch (error) {
    console.error('Error serving template file:', error);
    return NextResponse.json(
      { error: 'Failed to serve template file' },
      { status: 500 }
    );
  }
} 