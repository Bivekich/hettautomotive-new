import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import type { Catalog, Media, Category, Subcategory, Brand, Model, Modification } from '../../../payload-types'; // Assuming types are here

// Helper function to safely stringify complex fields for CSV
// Ensures double quotes around strings and escapes existing double quotes
const csvStringify = (value: any): string => {
  if (value === null || value === undefined) {
    return ''; // Represent null/undefined as empty string
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    try {
      // Convert objects/arrays to JSON string, replace double quotes with single for basic safety
      // Note: This is a simplification. A proper CSV parser/importer should handle escaped JSON.
      const jsonStr = JSON.stringify(value);
      // Escape internal double quotes with double-double quotes ""
      const escapedStr = jsonStr.replace(/"/g, '""');
      return `"${escapedStr}"`; // Enclose the whole JSON string in quotes
    } catch {
      return '"[Object Error]"'
    }
  }
  // Default: stringify and enclose in quotes, escape internal quotes
  const str = String(value);
  const escapedStr = str.replace(/"/g, '""');
  return `"${escapedStr}"`;
};

export async function GET() {
  console.log('Catalog export endpoint called');
  try {
    const payload = await getPayload({ config: configPromise });

    console.log('Fetching catalog items...');
    // Fetch all catalog items. Remove explicit generic type.
    const allCatalogItems = await payload.find({
      collection: 'catalog',
      limit: 0, // Payload 3 uses limit: 0 to disable pagination
      pagination: false, // Ensure pagination is off
      depth: 2, // Adjust depth as needed to get names/filenames of related items
      showHiddenFields: true,
    });

    console.log(`Found ${allCatalogItems.docs.length} items to export.`);

    // Define CSV Headers (should match the columns expected by your import script)
    const headers = [
      'name', 'slug', 'category', 'subcategory', 'brand', 'model', 'modification',
      'description', 'shortDescription', 'oem', 'featured', 'inStock', 'image',
      'images', 'metaTitle', 'metaDescription', 'specifications', 'marketplaceLinks_ozon',
      'marketplaceLinks_wildberries', 'marketplaceLinks_others', 'distributors'
    ];

    const csvRows: string[] = [];
    // Add header row
    csvRows.push(headers.join(','));

    // Process each catalog item
    for (const itemUntyped of allCatalogItems.docs) {
      // Cast the item to Catalog to satisfy TypeScript, assuming depth populated the fields
      const item = itemUntyped as Catalog;
      const row: any[] = [];

      // Helper to safely access nested properties
      const getProp = (obj: any, path: string, defaultValue: any = '') => {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
          if (current === null || current === undefined) return defaultValue;
          current = current[key];
        }
        return current === undefined || current === null ? defaultValue : current;
      };
      
      // Helper to get filename or alt from Media object/ID
      const getImageIdentifier = (media: Media | string | number | null | undefined): string => {
         if (!media) return '';
         if (typeof media === 'object' && media !== null) {
           return media.filename || media.alt || ''; // Prioritize filename
         }
         // If it's just an ID, we can't get the filename without another query, return empty
         return ''; // Or potentially return the ID if the importer can handle it
      };
      
      // Helper to format array fields (like specifications, others, distributors)
      const formatArrayField = (arr: any[] | null | undefined) => {
        if (!Array.isArray(arr) || arr.length === 0) return '';
        // Remove potential 'id' fields added by Payload before stringifying
        const cleanedArr = arr.map(el => {
          if (el && typeof el === 'object') {
            const { id, ...rest } = el;
            return rest;
          }
          return el;
        });
        return JSON.stringify(cleanedArr).replace(/'/g, '"'); // Use double quotes for JSON
      };

      row.push(csvStringify(item.name));
      row.push(csvStringify(item.slug));
      row.push(csvStringify(getProp(item.category, 'name'))); // Get name from related category
      row.push(csvStringify(getProp(item.subcategory, 'name')));
      row.push(csvStringify(getProp(item.brand, 'name')));
      row.push(csvStringify(getProp(item.model, 'name')));
      row.push(csvStringify(getProp(item.modification, 'name')));
      row.push(csvStringify(item.description));
      row.push(csvStringify(item.shortDescription));
      row.push(csvStringify(item.oem));
      row.push(csvStringify(item.featured));
      row.push(csvStringify(item.inStock));
      
      // --- Corrected Image Handling ---
      let firstImageIdentifier = '';
      let allImageIdentifiers: string[] = [];

      // Check if images field exists and is an array
      if (Array.isArray(item.images) && item.images.length > 0) {
          // Process each object in the images array
          for (const imgObj of item.images) {
              // Assuming the media field within the object is named 'image'
              const media = imgObj?.image; // Access the nested media field
              const identifier = getImageIdentifier(media as Media | undefined);
              if (identifier) {
                  allImageIdentifiers.push(identifier);
              }
          }
          // Get the first image identifier if available
          firstImageIdentifier = allImageIdentifiers[0] || '';
      }
      
      // Add first image identifier to the 'image' column
      row.push(csvStringify(firstImageIdentifier));
      
      // Add comma-separated list of all identifiers to the 'images' column
      row.push(csvStringify(allImageIdentifiers.join(', ')));
      // --- End Corrected Image Handling ---
      
      row.push(csvStringify(item.metaTitle));
      row.push(csvStringify(item.metaDescription));
      
      // Format complex fields back to JSON strings (or appropriate format for import)
      row.push(csvStringify(formatArrayField(item.specifications)));
      row.push(csvStringify(getProp(item.marketplaceLinks, 'ozon')));
      row.push(csvStringify(getProp(item.marketplaceLinks, 'wildberries')));
      row.push(csvStringify(formatArrayField(getProp(item.marketplaceLinks, 'others'))));
      row.push(csvStringify(formatArrayField(item.distributors)));

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const filename = `catalog-export-${new Date().toISOString().split('T')[0]}.csv`;

    console.log('Export generated successfully.');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating catalog export:', error);
    return NextResponse.json(
      { success: false, message: `Failed to generate catalog export: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 