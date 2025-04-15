import _path from 'path'
import csv from 'csvtojson'
import type { Payload } from 'payload'
import fs from 'fs'
// Импортируем только используемые типы
import type { Catalog, Model, Modification, Media } from '../payload-types'
import type { CollectionSlug, Where } from 'payload' // Correct import path

// Function to slugify text
const slugify = (text: string): string => {
  if (!text) return ''
  
  // Cyrillic to Latin transliteration map
  const translitMap: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
    'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
    'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts',
    'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
    'Я': 'Ya'
  }

  return text
    .toString()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

// Helper to convert CSV string values to boolean
const toBoolean = (value: string | null | undefined): boolean => {
  const lower = value?.toLowerCase()?.trim()
  return lower === 'true' || lower === '1' || lower === 'yes'
}

// Function to safely parse JSON strings (handles single quotes)
const _safeParse = (
  jsonString: string | null | undefined,
  defaultValue: unknown = null,
): unknown => {
  if (!jsonString) return defaultValue
  try {
    // Try direct parsing first
    return JSON.parse(jsonString)
  } catch (_e) {
    try {
      // Replace single quotes with double quotes for valid JSON
      const fixedString = jsonString.replace(/'/g, '"')
      return JSON.parse(fixedString)
    } catch (_e2) {
      console.warn('Failed to parse JSON string after attempting quote fix:', jsonString)
      return defaultValue
    }
  }
}

// Helper function to find or create a SINGLE related document by name
// Returns the ID or undefined if name is empty or error occurs
async function findOrCreateRelated(
  payload: Payload,
  collectionSlug: CollectionSlug, // Use specific type
  name: string,
  parentInfo?: { parentCollection: string; parentId: string | number }, // Optional: for nested collections like model/modification
): Promise<string | number | undefined> {
  if (!name || !name.trim()) {
    return undefined
  }
  const trimmedName = name.trim()
  console.log(`Finding or creating related item in '${collectionSlug}' with name: "${trimmedName}"`)

  try {
    // Define the base query
    const query: Where = { name: { equals: trimmedName } } // Use Where type

    // Add parent filter if provided (for models/modifications)
    if (parentInfo && parentInfo.parentCollection && parentInfo.parentId) {
      query[parentInfo.parentCollection] = { equals: parentInfo.parentId }
      console.log(`  ...within parent ${parentInfo.parentCollection}: ${parentInfo.parentId}`)
    }

    // Find existing
    const existing = await payload.find({
      collection: collectionSlug,
      where: query,
      limit: 1,
      depth: 0,
    })

    if (existing.docs.length > 0) {
      console.log(`  Found existing ${collectionSlug} with ID: ${existing.docs[0].id}`)
      return existing.docs[0].id
    }

    // Create new if not found
    console.log(`  ${collectionSlug} not found, creating new...`)
    const creationData: { name: string; slug: string; [key: string]: unknown } = {
      name: trimmedName,
      slug: slugify(trimmedName), // Assuming related collections have name and slug
    }

    // Add parent ID if provided
    if (parentInfo && parentInfo.parentCollection && parentInfo.parentId) {
      creationData[parentInfo.parentCollection] = parentInfo.parentId
    }

    const created = await payload.create({
      collection: collectionSlug,
      data: creationData,
    })
    console.log(`  Created new ${collectionSlug} with ID: ${created.id}`)
    return created.id
  } catch (err) {
    console.error(
      `Error finding or creating related item in '${collectionSlug}' with name "${trimmedName}":`,
      err,
    )
    return undefined
  }
}

// Helper function to find or create MULTIPLE related documents by name (separated by |)
// Returns an array of IDs
async function findOrCreateMultipleRelated(
  payload: Payload,
  collectionSlug: CollectionSlug, // Use specific type
  namesString: string | null | undefined,
): Promise<(string | number)[]> {
  if (!namesString || !namesString.trim()) {
    return []
  }

  const names = namesString.split('|').map(name => name.trim()).filter(name => name);
  const ids: (string | number)[] = [];

  console.log(`Finding or creating multiple related items in '${collectionSlug}' with names: "${names.join(', ')}"`);

  for (const name of names) {
    const id = await findOrCreateRelated(payload, collectionSlug, name);
    if (id !== undefined) {
      ids.push(id);
    }
  }

  console.log(`  Resolved IDs for ${collectionSlug}: ${ids.join(', ')}`);
  return ids;
}

// Define an interface for the expected structure of a CSV row
interface CsvRow {
  name: string
  category: string // Expecting name, will look up or create
  slug?: string
  description?: string
  shortDescription?: string
  oem?: string
  article: string
  featured?: string // Expecting 'true'/'false' etc.
  inStock?: string // Expecting 'true'/'false' etc.
  metaTitle?: string
  metaDescription?: string
  specifications?: string // Expecting JSON string: [{name: string, value: string}]
  marketplaceLinks_ozon?: string
  marketplaceLinks_wildberries?: string
  marketplaceLinks_others?: string // Expecting JSON string: [{name: string, url: string, logo?: string | number}]
  distributors?: string // Expecting JSON string: [{name: string, url?: string, location?: string}]
  subcategory?: string // Expecting name
  thirdsubcategory?: string // Expecting name
  brand?: string // Expecting name
  model?: string // Expecting name
  modification?: string // Expecting name
  image?: string // Expecting filename or alt text
  images?: string // Expecting comma-separated filenames or alt texts
}

// Helper function to parse specifications
function parseSpecifications(specsString: string): { name: string; value: string }[] {
  if (!specsString) return []
  return specsString.split(',').map((spec) => {
    const [name, value] = spec.split(':')
    return { name, value }
  })
}

// Helper function to ensure URL has https:// prefix
function ensureHttps(url: string): string {
  if (!url) return ''
  url = url.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}

// Helper function to parse marketplace links
function parseMarketplaceLinks(
  linksString: string,
): { name: string; url: string; logo?: string | number | null }[] {
  if (!linksString) return []
  const links = linksString.split(',').map((link) => {
    const parts = link.split(':')
    if (parts.length < 2) {
      console.warn(`Invalid marketplace link format: ${link}`)
      return null
    }
    const result: { name: string; url: string; logo?: string | number | null } = {
      name: parts[0].trim(),
      url: ensureHttps(parts[1].trim()),
    }
    if (parts[2]) {
      result.logo = parts[2].trim()
    }
    return result
  })
  return links.filter(
    (link): link is { name: string; url: string; logo?: string | number | null } => link !== null,
  )
}

// Helper function to parse distributors
function parseDistributors(
  distributorsString: string,
): { name: string; url: string; location: string | null }[] {
  if (!distributorsString) return []
  return distributorsString
    .split(',')
    .map((dist) => {
      const parts = dist.split(':')
      if (parts.length < 2) {
        console.warn(`Invalid distributor format: ${dist}`)
        return null
      }
      return {
        name: parts[0].trim(),
        url: ensureHttps(parts[1].trim()),
        location: parts[2] ? parts[2].trim() : null,
      }
    })
    .filter((dist): dist is { name: string; url: string; location: string | null } => dist !== null)
}

// Main import function
export async function importCSV(
  filePath: string,
  payload: Payload,
): Promise<{ success: number; failed: number }> {
  let successCount = 0
  let skipCount = 0
  let productsData: CsvRow[] = []
  let currentRowIndex = -1; // For error logging

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      return { success: 0, failed: 1 }
    }

    console.log(`Starting import from: ${filePath}`)

    // Specify the delimiter for the CSV parser
    productsData = await csv({ delimiter: ';' }).fromFile(filePath)
    console.log(`Found ${productsData.length} products in CSV.`)

    for (let i = 0; i < productsData.length; i++) {
      currentRowIndex = i;
      const source = productsData[i];
      let productDataForDb: Partial<Catalog> = {}; // Initialize as Partial<Catalog>

      // Basic validation
      if (!source.name || !source.category || !source.article) {
        console.error(`Skipping row ${i + 1}: Missing required fields (name, category, article):`, source)
        skipCount++
        continue
      }

      try {
        const slug = source.slug || slugify(source.name)

        // Helper to find media by filename or alt text
        const findMedia = async (identifier: string): Promise<string | number | undefined> => {
          if (!identifier) return undefined
          try {
            // First try to find by filename
            let media = await payload.find({
              collection: 'media',
              where: { filename: { equals: identifier } },
              limit: 1,
              depth: 0,
            })
            if (media.docs.length > 0) {
              console.log(`Found image by filename: ${identifier}`)
              return media.docs[0].id
            }

            // If not found by filename, try to find by alt text
            media = await payload.find({
              collection: 'media',
              where: { alt: { equals: identifier } },
              limit: 1,
              depth: 0,
            })
            if (media.docs.length > 0) {
              console.log(`Found image by alt text: ${identifier}`)
              return media.docs[0].id
            }

            // If still not found, try to find by name (without extension)
            const nameWithoutExt = identifier.split('.')[0]
            media = await payload.find({
              collection: 'media',
              where: { alt: { equals: nameWithoutExt } },
              limit: 1,
              depth: 0,
            })
            if (media.docs.length > 0) {
              console.log(`Found image by name: ${nameWithoutExt}`)
              return media.docs[0].id
            }

            console.warn(`Image "${identifier}" not found in media collection.`)
            return undefined
          } catch (err) {
            console.error(`Error searching for media "${identifier}":`, err)
            return undefined
          }
        }

        // --- Prepare Base Data --- 
        productDataForDb = {
          name: source.name,
          slug: slug,
          article: source.article,
        };

        // --- Process Optional Fields --- 
        if (source.description) {
          productDataForDb.description = {
                root: {
                  type: 'root',
              version: 1,
              direction: null, // Add default direction
              format: '',      // Add default format
              indent: 0,       // Add default indent
                  children: [
                    {
                      type: 'paragraph',
                  version: 1,
                  children: [{ type: 'text', text: source.description }],
                },
              ],
            },
          };
        }
        if (source.shortDescription) productDataForDb.shortDescription = source.shortDescription;
        if (source.oem) productDataForDb.oem = source.oem;
        productDataForDb.featured = toBoolean(source.featured); // Defaults to false if invalid
        productDataForDb.inStock = source.inStock !== undefined ? toBoolean(source.inStock) : true; // Defaults to true
        if (source.metaTitle) productDataForDb.metaTitle = source.metaTitle;
        if (source.metaDescription) productDataForDb.metaDescription = source.metaDescription;

        // --- Handle Complex Fields --- 
        if (source.specifications) {
          const specs = parseSpecifications(source.specifications);
          if (specs.length > 0) productDataForDb.specifications = specs;
        }

        // Marketplace Links
        const othersLinksRaw = parseMarketplaceLinks(source.marketplaceLinks_others || '' );
        const othersLinksProcessed = [];
        for (const link of othersLinksRaw) {
            let logoId: string | number | undefined | Media | null = undefined;
            if (link.logo && typeof link.logo === 'string') {
                logoId = await findMedia(link.logo);
            }
             othersLinksProcessed.push({
                name: link.name,
                url: link.url,
                logo: logoId as (number | Media | null | undefined), // Assign resolved ID
             });
        }
        if (source.marketplaceLinks_ozon || source.marketplaceLinks_wildberries || othersLinksProcessed.length > 0) {
          productDataForDb.marketplaceLinks = {
            ozon: ensureHttps(source.marketplaceLinks_ozon || '') || null, // Use null for empty optional fields
            wildberries: ensureHttps(source.marketplaceLinks_wildberries || '') || null,
            others: othersLinksProcessed,
          };
        }

        if (source.distributors) {
          const dist = parseDistributors(source.distributors);
          if (dist.length > 0) productDataForDb.distributors = dist;
        }

        // Images
        const imageIdentifiers = (source.images || '').split(',').map(s => s.trim()).filter(s => s);
        const imageRelationArray: { image: number | Media }[] = [];
        for (const identifier of imageIdentifiers) {
            const mediaId = await findMedia(identifier);
            if (mediaId) {
                imageRelationArray.push({ image: mediaId as (number | Media) });
            }
        }
        if (imageRelationArray.length > 0) {
            productDataForDb.images = imageRelationArray;
        }

        // --- Handle Relationships --- 
        const categoryId = await findOrCreateRelated(payload, 'categories', source.category);
        let subcategoryId: string | number | undefined;
        if (source.subcategory && categoryId) { // Only process if subcategory name and categoryId exist
          subcategoryId = await findOrCreateRelated(
            payload,
            'subcategories',
            source.subcategory,
            { parentCollection: 'category', parentId: categoryId } // Pass categoryId as parent context
          );
        }
        
        let thirdsubcategoryId: string | number | undefined;
        if (source.thirdsubcategory && subcategoryId) { // Only process if third subcategory name and subcategoryId exist
           thirdsubcategoryId = await findOrCreateRelated(
            payload,
            'thirdsubcategories',
            source.thirdsubcategory,
            { parentCollection: 'subcategory', parentId: subcategoryId } // Pass subcategoryId as parent context
          );
        }

        const brandIds = await findOrCreateMultipleRelated(payload, 'brands', source.brand);
        let modelId: string | number | undefined;
        let modificationId: string | number | undefined;

        // Model (Example: links first brand)
        if (source.model) {
            const parentBrandId = brandIds.length > 0 ? brandIds[0] : undefined;
            modelId = await findOrCreateRelated(payload, 'models', source.model, parentBrandId ? { parentCollection: 'brand', parentId: parentBrandId } : undefined);
        }

        // Modification (only if model exists)
        if (source.modification && modelId) {
             modificationId = await findOrCreateRelated(payload, 'modifications', source.modification, { parentCollection: 'model', parentId: modelId });
        }

        // --- Assign Relationships to Product --- 
        if (categoryId) productDataForDb.category = categoryId as any;
        else {
             throw new Error(`Required category '${source.category}' could not be resolved.`);
        }
        if (subcategoryId) productDataForDb.subcategory = subcategoryId as any;
        if (thirdsubcategoryId) productDataForDb.thirdsubcategory = thirdsubcategoryId as any;
        if (brandIds.length > 0) productDataForDb.brand = brandIds as any;
        if (modelId) productDataForDb.model = modelId as any;
        if (modificationId) productDataForDb.modification = modificationId as any;
        
        // --- Link Brand(s) to ThirdSubcategory (Re-applying automatic linking despite type errors) ---
        if (thirdsubcategoryId && brandIds.length > 0) {
          // ID is already guaranteed to be string | number here
          const thirdSubIdToAdd = thirdsubcategoryId;

          // Check if we have a valid ID to add before proceeding
          if (thirdSubIdToAdd !== null && thirdSubIdToAdd !== undefined) {
            for (const brandId of brandIds) {
              try {
                // 1. Fetch the current brand document WITH depth: 0
                const brandToUpdate = await payload.findByID({
                  collection: 'brands',
                  id: brandId as any, // Using 'as any' due to persistent type errors
                  depth: 0, // Ensure relationships are IDs
                });

                if (brandToUpdate) {
                  // 2. Get the current list of linked IDs, ensuring they are primitives
                  const currentLinkedIds: (string | number)[] = (brandToUpdate.thirdsubcategories || []).map(
                    (link: string | number | { id: string | number }) => 
                      typeof link === 'object' && link !== null ? link.id : link
                  ).filter(id => id !== null && id !== undefined); // Filter out any potential null/undefined

                  // 3. Check if the ID to add is already present (compare carefully)
                  const alreadyLinked = currentLinkedIds.some(existingId => 
                    String(existingId) === String(thirdSubIdToAdd) // Compare as strings
                  );

                  if (!alreadyLinked) {
                    // 4. If not present, update the brand with the new ID added
                    const newLinkedIds = [...currentLinkedIds, thirdSubIdToAdd];
                    console.log(`Linking Brand ID ${brandId} to ThirdSubcategory ID ${thirdSubIdToAdd}. New links: ${newLinkedIds.join(', ')}`);
                    await payload.update({
                      collection: 'brands',
                      id: brandId as any, // Using 'as any' due to persistent type errors
                      data: {
                        thirdsubcategories: newLinkedIds as any, // Cast to any to bypass overload error
                      },
                    });
              }
            } else {
                   console.warn(`Could not find Brand ID ${brandId} to link ThirdSubcategory ${thirdSubIdToAdd}.`);
                }
              } catch (linkError) {
                console.error(`Error linking Brand ID ${brandId} to ThirdSubcategory ID ${thirdSubIdToAdd}:`, linkError);
              }
            }
            } else {
             console.warn(`Invalid ThirdSubcategory ID (${thirdSubIdToAdd}) provided for Brand linking.`);
          }
        }

        // --- Upsert Product Logic --- 
        const existingProduct = await payload.find({
          collection: 'catalog',
          where: { article: { equals: source.article } },
          limit: 1,
          depth: 0,
        })

        if (existingProduct.docs.length > 0) {
          const productId = existingProduct.docs[0].id
          console.log(`Updating product with Article ${source.article} (ID: ${productId})`)
          await payload.update({
            collection: 'catalog',
            id: productId,
            data: productDataForDb, // Pass the partially constructed data
          })
        } else {
          console.log(`Creating new product with Article ${source.article}`)
          // Ensure required fields are set before creating
          await payload.create({
            collection: 'catalog',
            data: productDataForDb as Catalog, // Assert type for create
          })
        }

        successCount++
      } catch (productError) {
        console.error(`Failed to process row ${currentRowIndex + 1} (Article: ${source?.article || '(No Article)'})`, productError)
        console.error('Errored Row Data:', source)
        skipCount++
      }
    }

    console.log(`Import finished. Success: ${successCount}, Skipped/Failed: ${skipCount}`)

  } catch (error) {
    console.error(`An unexpected error occurred during the CSV import process (around row ${currentRowIndex + 1}):`, error)
    if (productsData && currentRowIndex >= 0 && currentRowIndex < productsData.length) {
      console.error('Data being processed during error:', productsData[currentRowIndex])
    }
    return { success: successCount, failed: (productsData?.length || 0) - successCount }
  }

  return { success: successCount, failed: skipCount }
}
