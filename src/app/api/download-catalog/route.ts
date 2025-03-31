import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Simple catalog download endpoint that returns a CSV file
export async function GET(_request: NextRequest) {
  try {
    // Check if we have a sample CSV to use as a template
    const samplePath = path.join(process.cwd(), 'src', 'imports', 'data', 'products.csv')

    if (fs.existsSync(samplePath)) {
      // If we have a sample file, use it
      const fileContent = fs.readFileSync(samplePath, 'utf-8')

      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=catalog.csv',
        },
      })
    }

    // Otherwise, return a simple CSV structure
    const csvContent =
      'name,category,subcategory,brand,model,modification,description,shortDescription,oem,featured,inStock\n' +
      '"Example Product 1","Engine Parts","Turbochargers","TurboTech","GT3582R","High Boost","Full description here","Short description","TT-123","true","true"\n' +
      '"Example Product 2","Brakes","Calipers","StopTech","ST-60","6-Piston","Full description here","Short description","ST-456","true","true"'

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=catalog.csv',
      },
    })
  } catch (error) {
    console.error('Error generating catalog CSV:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate catalog CSV',
      },
      { status: 500 },
    )
  }
}
