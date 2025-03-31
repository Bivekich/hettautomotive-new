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
      'name', 'category', 'slug', 'description', 'shortDescription', 'oem', 'featured', 'inStock',
      'subcategory', 'brand', 'model', 'modification', 'image', 'images', 'metaTitle', 'metaDescription',
      'specifications', 'marketplaceLinks_ozon', 'marketplaceLinks_wildberries', 'marketplaceLinks_others', 'distributors'
    ];

    const csvRows: string[] = [];
    // Add header row with semicolon delimiter
    csvRows.push(headers.join(';'));

    // Process each catalog item
    for (const itemUntyped of allCatalogItems.docs) {
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
           return media.filename || media.alt || '';
         }
         return '';
      };
      
      // Helper to format specifications for CSV
      const formatSpecifications = (specs: any[] | null | undefined): string => {
        if (!Array.isArray(specs) || specs.length === 0) return '';
        return specs.map(spec => `${spec.name}:${spec.value}`).join(',');
      };

      // Helper to format marketplace links for CSV
      const formatMarketplaceLinks = (links: any[] | null | undefined): string => {
        if (!Array.isArray(links) || links.length === 0) return '';
        return links.map(link => {
          const logo = link.logo ? getImageIdentifier(link.logo) : '';
          return `${link.name}:${link.url}${logo ? `:${logo}` : ''}`;
        }).join(',');
      };

      // Helper to format distributors for CSV
      const formatDistributors = (distributors: any[] | null | undefined): string => {
        if (!Array.isArray(distributors) || distributors.length === 0) return '';
        return distributors.map(dist => `${dist.name}:${dist.url}:${dist.location || ''}`).join(',');
      };

      row.push(csvStringify(item.name));
      row.push(csvStringify(getProp(item.category, 'name')));
      row.push(csvStringify(item.slug));
      row.push(csvStringify(item.description?.root?.children?.[0]?.children?.[0]?.text || ''));
      row.push(csvStringify(item.shortDescription));
      row.push(csvStringify(item.oem));
      row.push(csvStringify(item.featured));
      row.push(csvStringify(item.inStock));
      row.push(csvStringify(getProp(item.subcategory, 'name')));
      row.push(csvStringify(getProp(item.brand, 'name')));
      row.push(csvStringify(getProp(item.model, 'name')));
      row.push(csvStringify(getProp(item.modification, 'name')));
      
      // Handle images
      let firstImageIdentifier = '';
      let allImageIdentifiers: string[] = [];

      if (Array.isArray(item.images) && item.images.length > 0) {
        for (const imgObj of item.images) {
          const media = imgObj?.image;
          const identifier = getImageIdentifier(media as Media | undefined);
          if (identifier) {
            allImageIdentifiers.push(identifier);
          }
        }
        firstImageIdentifier = allImageIdentifiers[0] || '';
      }
      
      row.push(csvStringify(firstImageIdentifier));
      row.push(csvStringify(allImageIdentifiers.join(',')));
      
      row.push(csvStringify(item.metaTitle));
      row.push(csvStringify(item.metaDescription));
      row.push(csvStringify(formatSpecifications(item.specifications)));
      row.push(csvStringify(getProp(item.marketplaceLinks, 'ozon')));
      row.push(csvStringify(getProp(item.marketplaceLinks, 'wildberries')));
      row.push(csvStringify(formatMarketplaceLinks(getProp(item.marketplaceLinks, 'others'))));
      row.push(csvStringify(formatDistributors(item.distributors)));

      // Join row with semicolon delimiter
      csvRows.push(row.join(';'));
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