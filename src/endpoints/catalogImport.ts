import type { Endpoint } from 'payload'
import type { PayloadRequest } from 'payload'
import fs from 'fs'
import { parse } from 'csv-parse'
import type { Response, NextFunction } from 'express'
import { Readable } from 'stream'

// Import the generated Catalog type
import type { Catalog } from '../payload-types'

// Helper to convert CSV string values to boolean
const toBoolean = (value: string): boolean => {
  const lower = value?.toLowerCase()?.trim();
  return lower === 'true' || lower === '1' || lower === 'yes';
}

// Correct relationship types to expect string IDs from CSV
type CatalogCreateData = Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>> & {
  name: string;
  slug: string;
  category: string; // Expecting ID string
  brand?: string; // Expecting ID string
  model?: string; // Expecting ID string
  modification?: string; // Expecting ID string
  subcategory?: string; // Expecting ID string
};

// Define the handler function with explicit return type
const handler = async (
  req: PayloadRequest, 
  res: Response, 
  next: NextFunction
): Promise<Response | void> => {
  const { payload, user } = req

  if (!user) {
    // Ensure response is returned
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let fileProcessingError: Error | null = null;
  let importedCount = 0;
  const errors: string[] = [];

  try {
    // Check if formData method exists
    if (!req.formData) {
       console.error('Error processing CSV upload: req.formData is not available.');
       return res.status(500).json({ error: 'Server error: Request body parsing method not found.' });
    }

    // Use req.formData() to parse the body
    const formData = await req.formData();
    const file = formData.get('file');

    // Check if file exists and is a File object
    if (!file || !(file instanceof Blob)) { // Check if it's a Blob/File
      return res.status(400).json({ error: 'No CSV file uploaded or file format is incorrect.' });
    }
    
    // Ensure it's a CSV file (basic check)
    if (!file.type || !file.type.includes('csv')) {
       return res.status(400).json({ error: 'Uploaded file is not a CSV.' });
    }

    // Get a ReadableStream from the File object
    const fileStream = file.stream();

    // Convert Node Web Stream to Node Legacy Stream if needed by csv-parse
    // csv-parse typically works with Node.js streams
    const nodeStream = Readable.fromWeb(fileStream as any); 

    // Pipe the stream directly into the parser
    const parser = nodeStream.pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }));

    for await (const record of parser) {
      const rowIndex = importedCount + errors.length + 1;
      try {
        if (!record.name || !record.slug || !record.category) {
          throw new Error(`Row ${rowIndex}: Missing required fields (name, slug, category ID)`);
        }

        // Use the corrected type for the data object
        const dataToCreate: CatalogCreateData = {
          name: record.name,
          slug: record.slug,
          category: record.category,
          // Optional fields
          ...(record.shortDescription && { shortDescription: record.shortDescription }),
          ...(record.brand && { brand: record.brand }),
          ...(record.model && { model: record.model }),
          ...(record.modification && { modification: record.modification }),
          ...(record.subcategory && { subcategory: record.subcategory }),
          ...(record.featured && { featured: toBoolean(record.featured) }),
          ...(record.inStock && { inStock: toBoolean(record.inStock) }),
          ...(record.oem && { oem: record.oem }),
          ...(record.metaTitle && { metaTitle: record.metaTitle }),
          ...(record.metaDescription && { metaDescription: record.metaDescription }),
        };

        await payload.create({
          collection: 'catalog',
          data: dataToCreate, // Pass the typed data
          user,
        });
        importedCount++;

      } catch (error: any) {
         console.error(`Error processing CSV row ${rowIndex}:`, error);
         errors.push(`Row ${rowIndex}: ${error.message || 'Unknown error'}`);
      }
    }

  } catch (err: any) {
    console.error('Error processing CSV upload:', err);
    fileProcessingError = err;
  }

  // Ensure response is returned in all cases
  if (fileProcessingError) {
     return res.status(500).json({ error: `Failed to process CSV file: ${fileProcessingError.message}` });
  } else if (errors.length > 0) {
    return res.status(400).json({
      message: `Processed file with ${errors.length} errors. ${importedCount} items imported successfully.`,
      errors: errors,
    });
  } else {
    return res.status(200).json({ message: `Successfully imported ${importedCount} catalog items.` });
  }
  // We don't need to call next() because we always return a response.
}

// Export the endpoint configuration object
export const catalogCsvImportEndpoint: Endpoint = {
  path: '/catalogs/import/csv',
  method: 'post',
  handler: handler, // Assign the handler function
}; 