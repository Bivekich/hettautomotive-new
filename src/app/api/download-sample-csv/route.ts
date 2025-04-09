import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type {
  Catalog,
  // Media не используется напрямую в коде, поэтому удаляем импорт
} from '../../../payload-types' // Assuming types are here

// Helper function to safely stringify complex fields for CSV
// Ensures double quotes around strings and escapes existing double quotes
const csvStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '' // Represent null/undefined as empty string
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'object') {
    try {
      // Convert objects/arrays to JSON string, replace double quotes with single for basic safety
      // Note: This is a simplification. A proper CSV parser/importer should handle escaped JSON.
      const jsonStr = JSON.stringify(value)
      // Escape internal double quotes with double-double quotes ""
      const escapedStr = jsonStr.replace(/"/g, '""')
      return `"${escapedStr}"` // Enclose the whole JSON string in quotes
    } catch {
      return '"[Object Error]"'
    }
  }
  // Default: stringify and enclose in quotes, escape internal quotes
  const str = String(value)
  const escapedStr = str.replace(/"/g, '""')
  return `"${escapedStr}"`
}

export async function GET() {
  console.log('Catalog export endpoint called')
  try {
    const payload = await getPayload({ config: configPromise })

    console.log('Fetching catalog items...')
    // Fetch all catalog items. Remove explicit generic type.
    const allCatalogItems = await payload.find({
      collection: 'catalog',
      limit: 0, // Payload 3 uses limit: 0 to disable pagination
      pagination: false, // Ensure pagination is off
      depth: 2, // Adjust depth as needed to get names/filenames of related items
      showHiddenFields: true,
    })

    console.log(`Found ${allCatalogItems.docs.length} items to export.`)

    // Define CSV Headers (should match the columns expected by your import script)
    const headers = [
      'name',
      'category',
      'slug',
      'description',
      'shortDescription',
      'oem',
      'article',
      'featured',
      'inStock',
      'subcategory',
      'thirdsubcategory',
      'brand',
      'model',
      'modification',
      'image',
      'images',
      'metaTitle',
      'metaDescription',
      'specifications',
      'marketplaceLinks_ozon',
      'marketplaceLinks_wildberries',
      'marketplaceLinks_others',
      'distributors',
    ]

    const csvRows: string[] = []
    // Add header row with semicolon delimiter
    csvRows.push(headers.join(';'))

    // Process each catalog item
    for (const itemUntyped of allCatalogItems.docs) {
      const item = itemUntyped as Catalog
      const row: string[] = []

      // Helper to safely access nested properties
      const getProp = (obj: unknown, path: string, defaultValue = ''): unknown => {
        if (obj === null || obj === undefined) return defaultValue

        const keys = path.split('.')
        let current = obj as Record<string, unknown>

        for (const key of keys) {
          if (current === null || current === undefined) return defaultValue
          current = current[key] as Record<string, unknown>
        }

        return current === undefined || current === null ? defaultValue : current
      }

      // Helper to get filename or alt from Media object/ID
      const getImageIdentifier = (media: unknown): string => {
        if (!media) return ''
        if (typeof media === 'object' && media !== null) {
          const mediaObj = media as Record<string, unknown>
          return (mediaObj.filename as string) || (mediaObj.alt as string) || ''
        }
        return ''
      }

      // Helper to format specifications for CSV
      const formatSpecifications = (specs: unknown[] | null | undefined): string => {
        if (!Array.isArray(specs) || specs.length === 0) return ''
        return specs
          .map((spec) => {
            const typedSpec = spec as { name: string; value: string }
            return `${typedSpec.name}:${typedSpec.value}`
          })
          .join(',')
      }

      // Helper to format marketplace links for CSV
      const formatMarketplaceLinks = (links: unknown[] | null | undefined): string => {
        if (!Array.isArray(links) || links.length === 0) return ''
        return links
          .map((link) => {
            const typedLink = link as { name: string; url: string; logo?: unknown }
            const logo = typedLink.logo ? getImageIdentifier(typedLink.logo) : ''
            return `${typedLink.name}:${typedLink.url}${logo ? `:${logo}` : ''}`
          })
          .join(',')
      }

      // Helper to format distributors for CSV
      const formatDistributors = (distributors: unknown[] | null | undefined): string => {
        if (!Array.isArray(distributors) || distributors.length === 0) return ''
        return distributors
          .map((dist) => {
            const typedDist = dist as { name: string; url: string; location?: string }
            return `${typedDist.name}:${typedDist.url}:${typedDist.location || ''}`
          })
          .join(',')
      }

      row.push(csvStringify(item.name))
      row.push(csvStringify(getProp(item.category, 'name')))
      row.push(csvStringify(item.slug))

      // Fix description access with proper type checking
      let description = ''
      if (
        item.description &&
        typeof item.description === 'object' &&
        'root' in item.description &&
        item.description.root &&
        typeof item.description.root === 'object' &&
        'children' in item.description.root &&
        Array.isArray(item.description.root.children) &&
        item.description.root.children.length > 0 &&
        typeof item.description.root.children[0] === 'object' &&
        item.description.root.children[0] !== null &&
        'children' in item.description.root.children[0] &&
        Array.isArray(item.description.root.children[0].children) &&
        item.description.root.children[0].children.length > 0 &&
        typeof item.description.root.children[0].children[0] === 'object' &&
        item.description.root.children[0].children[0] !== null &&
        'text' in item.description.root.children[0].children[0]
      ) {
        description = item.description.root.children[0].children[0].text as string
      }
      row.push(csvStringify(description))

      row.push(csvStringify(item.shortDescription))
      row.push(csvStringify(item.oem))
      row.push(csvStringify(item.article))
      row.push(csvStringify(item.featured))
      row.push(csvStringify(item.inStock))
      row.push(csvStringify(getProp(item.subcategory, 'name')))
      row.push(csvStringify(getProp(item.thirdsubcategory, 'name'))) // Added third subcategory
      row.push(csvStringify(getProp(item.brand, 'name')))
      row.push(csvStringify(getProp(item.model, 'name')))
      row.push(csvStringify(getProp(item.modification, 'name')))

      // Handle images
      let firstImageIdentifier = ''
      const allImageIdentifiers: string[] = []

      if (Array.isArray(item.images) && item.images.length > 0) {
        for (const imgObj of item.images) {
          if (imgObj && typeof imgObj === 'object' && 'image' in imgObj) {
            const media = imgObj.image
            const identifier = getImageIdentifier(media)
            if (identifier) {
              allImageIdentifiers.push(identifier)
            }
          }
        }
        firstImageIdentifier = allImageIdentifiers[0] || ''
      }

      row.push(csvStringify(firstImageIdentifier))
      row.push(csvStringify(allImageIdentifiers.join(',')))

      row.push(csvStringify(item.metaTitle))
      row.push(csvStringify(item.metaDescription))

      // Check that item.specifications is an array before passing to formatSpecifications
      const specifications = Array.isArray(item.specifications) ? item.specifications : null
      row.push(csvStringify(formatSpecifications(specifications)))

      row.push(csvStringify(getProp(item.marketplaceLinks, 'ozon')))
      row.push(csvStringify(getProp(item.marketplaceLinks, 'wildberries')))

      // Check that others is an array before passing to formatMarketplaceLinks
      const marketplaceOthers = Array.isArray(getProp(item.marketplaceLinks, 'others'))
        ? (getProp(item.marketplaceLinks, 'others') as unknown[])
        : null
      row.push(csvStringify(formatMarketplaceLinks(marketplaceOthers)))

      // Check that distributors is an array
      const distributors = Array.isArray(item.distributors) ? item.distributors : null
      row.push(csvStringify(formatDistributors(distributors)))

      // Join row with semicolon delimiter
      csvRows.push(row.join(';'))
    }

    const csvContent = csvRows.join('\n')
    const filename = `catalog-export-${new Date().toISOString().split('T')[0]}.csv`

    console.log('Export generated successfully.')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating catalog export:', error)
    return NextResponse.json(
      {
        success: false,
        message: `Failed to generate catalog export: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    )
  }
}
