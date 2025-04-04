import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { randomUUID } from 'crypto'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

// Dynamic import for the importCSV function
async function getImportFunction() {
  try {
    // Use dynamic import for directImport module без .ts расширения
    const importedModule = await import('../../../imports/directImport')
    // Ensure the named export 'importCSV' exists
    if (!importedModule || typeof importedModule.importCSV !== 'function') {
      throw new Error('importCSV function not found in the imported module.')
    }
    return importedModule.importCSV
  } catch (error) {
    console.error('Failed to import the CSV import function:', error)
    throw new Error('Import functionality is not available')
  }
}

// Helper function to save uploaded file to temp directory
const saveUploadedFile = async (formData: FormData): Promise<string> => {
  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file uploaded')
  }

  // Check file type
  if (!file.name.endsWith('.csv')) {
    throw new Error('Only CSV files are allowed')
  }

  // Create a unique filename
  const tempDir = path.join(os.tmpdir(), 'hett-imports')
  fs.mkdirSync(tempDir, { recursive: true })

  const filePath = path.join(tempDir, `${randomUUID()}.csv`)

  // Save the file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  fs.writeFileSync(filePath, buffer)

  return filePath
}

export async function POST(request: NextRequest) {
  console.log('CSV import endpoint called')

  try {
    const formData = await request.formData()
    const filePath = await saveUploadedFile(formData)

    console.log(`File saved to ${filePath}, starting import process...`)

    // Get the import function
    const importCSV = await getImportFunction()

    // Get the Payload instance
    const payload = await getPayloadHMR({ config: configPromise })

    // Process in the background
    // We return success immediately to avoid timeout
    const _importPromise = importCSV(filePath, payload)
      .then((result: { success: number; failed: number }) => {
        console.log('Import complete with result:', result)
        // Clean up the temp file
        try {
          fs.unlinkSync(filePath)
        } catch (error) {
          console.warn('Failed to clean up temp file:', error)
        }
      })
      .catch((error: Error) => {
        console.error('Import failed:', error)
        // Clean up the temp file even on error
        try {
          fs.unlinkSync(filePath)
        } catch (cleanupError) {
          console.warn('Failed to clean up temp file:', cleanupError)
        }
      })

    // Return success immediately - don't await the import
    return NextResponse.json({
      success: true,
      message:
        'Import started successfully. This may take a few minutes to complete. Check server logs for progress.',
    })
  } catch (error) {
    console.error('Error processing CSV import:', error)
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred during CSV import',
      },
      { status: 500 },
    )
  }
}
