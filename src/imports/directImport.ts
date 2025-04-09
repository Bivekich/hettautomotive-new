import _path from 'path'
import csv from 'csvtojson'
import type { Payload } from 'payload'
import fs from 'fs'
// Импортируем только используемые типы
import type { Catalog, Model, Modification } from '../payload-types'

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
  let productsData: CsvRow[] = [] // Define productsData here so it's accessible in the final catch block

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      return { success: 0, failed: 1 }
    }

    console.log(`Starting import from: ${filePath}`)

    // Specify the delimiter for the CSV parser
    productsData = await csv({ delimiter: ';' }).fromFile(filePath)
    console.log(`Found ${productsData.length} products in CSV.`)

    for (const source of productsData) {
      // Basic validation
      if (!source.name || !source.category || !source.article) {
        console.error('Skipping product with missing required fields (name, category, article):', source)
        skipCount++
        continue
      }
      const productData: Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>> = {} // Define outside try block for error logging

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

        // Prepare data structure matching Catalog collection type
        const productData: Pick<Catalog, 'name' | 'slug' | 'article'> &
          Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt' | 'name' | 'slug' | 'article'>> = {
          name: source.name,
          slug: slug,
          article: source.article,
          description: source.description
            ? {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          text: source.description,
                          version: 1,
                        },
                      ],
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              }
            : undefined,
          shortDescription: source.shortDescription || undefined,
          oem: source.oem || undefined,
          featured: toBoolean(source.featured),
          inStock: toBoolean(source.inStock ?? 'true'),
          metaTitle: source.metaTitle || undefined,
          metaDescription: source.metaDescription || undefined,
          specifications: [], // Initialize empty
          marketplaceLinks: {
            // Initialize structure
            ozon: source.marketplaceLinks_ozon || undefined,
            wildberries: source.marketplaceLinks_wildberries || undefined,
            others: [],
          },
          distributors: [], // Initialize empty
        }

        // Parse specifications
        let specifications: { name: string; value: string }[] = []
        try {
          specifications = parseSpecifications(source.specifications || '')
        } catch (error) {
          console.error(`Failed to parse specifications for product ${source.name}:`, error)
        }

        // Handle specifications (array of name/value pairs)
        if (specifications.length > 0) {
          productData.specifications = specifications
            .filter((item) => item && typeof item === 'object' && item.name && item.value)
            .map((item) => ({ id: undefined, name: item.name, value: item.value }))
        } else {
          console.warn(
            `Invalid format for specifications for "${source.name}". Expected JSON array.`,
          )
        }

        // Parse marketplace links
        let marketplaceLinks_others: {
          name: string
          url: string
          logo?: string | number | null
        }[] = []
        try {
          marketplaceLinks_others = parseMarketplaceLinks(source.marketplaceLinks_others || '')
        } catch (error) {
          console.error(`Failed to parse marketplace links for product ${source.name}:`, error)
        }

        // Handle marketplace links
        if (productData.marketplaceLinks) {
          productData.marketplaceLinks.ozon = source.marketplaceLinks_ozon || undefined
          productData.marketplaceLinks.wildberries =
            source.marketplaceLinks_wildberries || undefined

          if (marketplaceLinks_others.length > 0) {
            console.log(
              `Processing ${marketplaceLinks_others.length} other marketplace links for ${source.name}`,
            )
            const processedLinks = await Promise.all(
              marketplaceLinks_others.map(async (item) => {
                console.log(`Processing marketplace link: ${item.name} - ${item.url}`)
                if (item.logo) {
                  const media = await payload.find({
                    collection: 'media',
                    where: { filename: { equals: item.logo } },
                    limit: 1,
                    depth: 0,
                  })

                  if (media.docs.length > 0) {
                    console.log(`Found logo for ${item.name}: ${media.docs[0].id}`)
                    return {
                      id: undefined,
                      name: item.name,
                      url: item.url,
                      logo: media.docs[0].id,
                    }
                  }
                }
                return {
                  id: undefined,
                  name: item.name,
                  url: item.url,
                }
              }),
            )

            // Only set others if we have processed links
            if (processedLinks.length > 0) {
              console.log(`Setting ${processedLinks.length} marketplace links for ${source.name}`)
              productData.marketplaceLinks.others = processedLinks
            }
          }
        }

        // Parse distributors
        let distributors: { name: string; url: string; location: string | null }[] = []
        try {
          distributors = parseDistributors(source.distributors || '')
        } catch (error) {
          console.error(`Failed to parse distributors for product ${source.name}:`, error)
        }

        // Handle distributors
        if (distributors.length > 0) {
          console.log(`Processing ${distributors.length} distributors for ${source.name}`)
          productData.distributors = distributors.map((item) => {
            console.log(`Processing distributor: ${item.name} - ${item.url} - ${item.location}`)
            return {
              id: undefined,
              name: item.name,
              url: item.url,
              location: item.location,
            }
          })
        }

        // --- Handle Relationships ---
        let categoryId: string | number | undefined
        let brandId: string | number | undefined
        let modelId: string | number | undefined

        // Category (required)
        try {
          const categories = await payload.find({
            collection: 'categories',
            where: { name: { equals: source.category } },
            limit: 1,
            depth: 0,
          })
          if (categories.docs.length > 0) {
            categoryId = categories.docs[0].id
          } else {
            console.warn(`Category "${source.category}" not found. Creating it.`)
            const newCategory = await payload.create({
              collection: 'categories',
              data: { name: source.category, slug: slugify(source.category) },
            })
            categoryId = newCategory.id
          }
          productData.category = categoryId
        } catch (error) {
          console.error(
            `Error processing category "${source.category}" for product "${source.name}":`,
            error,
          )
          skipCount++
          continue // Skip product if category fails
        }

        // Subcategory (optional)
        if (source.subcategory) {
          try {
            const subcategories = await payload.find({
              collection: 'subcategories',
              where: { name: { equals: source.subcategory } },
              limit: 1,
              depth: 0,
            })
            if (subcategories.docs.length > 0) {
              productData.subcategory = subcategories.docs[0].id
              
              // Third subcategory (optional)
              if (source.thirdsubcategory) {
                try {
                  const thirdSubcategories = await payload.find({
                    collection: 'thirdsubcategories',
                    where: { 
                      name: { equals: source.thirdsubcategory },
                      subcategory: { equals: subcategories.docs[0].id }
                    },
                    limit: 1,
                    depth: 0,
                  })
                  if (thirdSubcategories.docs.length > 0) {
                    productData.thirdsubcategory = thirdSubcategories.docs[0].id
                  } else {
                    console.warn(`Third subcategory "${source.thirdsubcategory}" not found. Creating it.`)
                    const newThirdSubcategory = await payload.create({
                      collection: 'thirdsubcategories',
                      data: {
                        name: source.thirdsubcategory,
                        slug: slugify(source.thirdsubcategory),
                        subcategory: subcategories.docs[0].id,
                      },
                    })
                    productData.thirdsubcategory = newThirdSubcategory.id
                  }
                } catch (error) {
                  console.warn(
                    `Error processing third subcategory "${source.thirdsubcategory}" for product "${source.name}". Skipping field.`,
                    error,
                  )
                }
              }
            } else {
              console.warn(`Subcategory "${source.subcategory}" not found. Creating it.`)
              // Ensure categoryId is valid before creating subcategory
              if (categoryId) {
                const newSubcategory = await payload.create({
                  collection: 'subcategories',
                  data: {
                    name: source.subcategory,
                    slug: slugify(source.subcategory),
                    category: categoryId,
                  },
                })
                productData.subcategory = newSubcategory.id
                
                // Create third subcategory if specified
                if (source.thirdsubcategory) {
                  try {
                    const newThirdSubcategory = await payload.create({
                      collection: 'thirdsubcategories',
                      data: {
                        name: source.thirdsubcategory,
                        slug: slugify(source.thirdsubcategory),
                        subcategory: newSubcategory.id,
                      },
                    })
                    productData.thirdsubcategory = newThirdSubcategory.id
                  } catch (error) {
                    console.warn(
                      `Error creating third subcategory "${source.thirdsubcategory}" for product "${source.name}". Skipping field.`,
                      error,
                    )
                  }
                }
              } else {
                console.warn(
                  `Cannot create subcategory "${source.subcategory}" because category ID is missing.`,
                )
              }
            }
          } catch (error) {
            console.warn(
              `Error processing subcategory "${source.subcategory}" for product "${source.name}". Skipping field.`,
              error,
            )
          }
        }

        // Brand (optional)
        if (source.brand) {
          try {
            const brands = await payload.find({
              collection: 'brands',
              where: { name: { equals: source.brand } },
              limit: 1,
              depth: 0,
            })
            if (brands.docs.length > 0) {
              brandId = brands.docs[0].id
            } else {
              console.warn(`Brand "${source.brand}" not found. Creating it.`)
              const newBrand = await payload.create({
                collection: 'brands',
                data: { name: source.brand, slug: slugify(source.brand) },
              })
              brandId = newBrand.id
            }
            productData.brand = brandId
          } catch (error) {
            console.warn(
              `Error processing brand "${source.brand}" for product "${source.name}". Skipping field.`,
              error,
            )
          }
        }

        // Model (optional)
        if (source.model) {
          try {
            const models = await payload.find({
              collection: 'models',
              where: { name: { equals: source.model } },
              limit: 1,
              depth: 0,
            })
            if (models.docs.length > 0) {
              modelId = models.docs[0].id
            } else {
              console.warn(`Model "${source.model}" not found. Creating it.`)
              // Ensure brandId is potentially available if needed for the model
              const modelData: Pick<Model, 'name' | 'slug'> & { brand?: string | number } = {
                name: source.model,
                slug: slugify(source.model),
              }
              if (brandId) {
                // Assign the ID directly, ensuring it's string or number
                modelData.brand = brandId as string | number
              }
              const newModel = await payload.create({
                collection: 'models',
                // @ts-expect-error - Suppress persistent type error for create data
                data: modelData as Partial<Model>,
              })
              modelId = newModel.id
            }
            productData.model = modelId
          } catch (error) {
            console.warn(
              `Error processing model "${source.model}" for product "${source.name}". Skipping field.`,
              error,
            )
          }
        }

        // Modification (optional)
        if (source.modification) {
          try {
            const modifications = await payload.find({
              collection: 'modifications',
              where: { name: { equals: source.modification } },
              limit: 1,
              depth: 0,
            })
            if (modifications.docs.length > 0) {
              productData.modification = modifications.docs[0].id
            } else {
              console.warn(`Modification "${source.modification}" not found. Creating it.`)
              // Ensure modelId is potentially available if needed
              const modificationData: Pick<Modification, 'name' | 'slug'> & {
                model?: string | number
              } = {
                name: source.modification,
                slug: slugify(source.modification),
              }
              if (modelId) {
                // Assign the ID directly, ensuring it's string or number
                modificationData.model = modelId as string | number
              }
              const newModification = await payload.create({
                collection: 'modifications',
                // @ts-expect-error - Suppress persistent type error for create data
                data: modificationData as Partial<Modification>,
              })
              productData.modification = newModification.id
            }
          } catch (error) {
            console.warn(
              `Error processing modification "${source.modification}" for product "${source.name}". Skipping field.`,
              error,
            )
          }
        }

        // --- Handle Images ---
        // Additional images (comma-separated)
        if (source.images) {
          const imageIdentifiers = source.images
            .split(',')
            .map((img) => img.trim())
            .filter((img) => img)
          const imageRelationArray: { image: string | number }[] = [] // Initialize correct structure
          for (const identifier of imageIdentifiers) {
            const foundId = await findMedia(identifier)
            if (foundId) {
              // Avoid duplicates - check if an object with this ID already exists
              if (!imageRelationArray.some((item) => item.image === foundId)) {
                // Cast foundId to string | number for the relation
                imageRelationArray.push({ image: foundId as string | number })
              }
            }
          }
          if (imageRelationArray.length > 0) {
            // Assert the type to match the expected Array Block structure for the operation
            productData.images = imageRelationArray as NonNullable<Catalog['images']>
          }
        }

        // --- Upsert Logic ---
        // Check if product with the same slug already exists
        const existingProducts = await payload.find({
          collection: 'catalog',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 0, // Don't need related data here
        })

        // Clean data before sending (remove undefined array/object fields if necessary based on collection config)
        const cleanData = (data: Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>>) => {
          const cleaned: Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>> = { ...data }

          // Handle potentially undefined nested structure
          if (cleaned.marketplaceLinks) {
            // Don't remove empty others array
            if (cleaned.marketplaceLinks.others === undefined) {
              cleaned.marketplaceLinks.others = []
            }
            // If marketplaceLinks only contains undefined values after cleaning, remove the parent object
            if (Object.values(cleaned.marketplaceLinks).every((v) => v === undefined)) {
              cleaned.marketplaceLinks = undefined
            }
          } else {
            cleaned.marketplaceLinks = undefined
          }

          if (
            cleaned.distributors === undefined ||
            (Array.isArray(cleaned.distributors) && cleaned.distributors.length === 0)
          ) {
            cleaned.distributors = undefined
          }
          if (
            cleaned.specifications === undefined ||
            (Array.isArray(cleaned.specifications) && cleaned.specifications.length === 0)
          ) {
            cleaned.specifications = undefined
          }
          if (
            cleaned.images === undefined ||
            (Array.isArray(cleaned.images) && cleaned.images.length === 0)
          ) {
            cleaned.images = undefined
          }

          // Remove top-level undefined keys to avoid sending them in the API call
          Object.keys(cleaned).forEach((key) => {
            if (cleaned[key as keyof typeof cleaned] === undefined) {
              delete cleaned[key as keyof typeof cleaned]
            }
          })

          return cleaned
        }

        if (existingProducts.docs.length > 0) {
          const existingId = existingProducts.docs[0].id
          console.log(`Updating existing product: ${source.name} (ID: ${existingId})`)
          const updateData = cleanData(productData)

          await payload.update({
            collection: 'catalog',
            id: existingId,
            data: updateData, // Pass the cleaned, structured data
          })
        } else {
          console.log(`Creating new product: ${source.name}`)
          const createData = cleanData(productData)

          // Assert the data type for create, ensuring required fields are present
          await payload.create({
            collection: 'catalog',
            data: createData as Pick<Catalog, 'name' | 'slug' | 'category' | 'article'> & typeof createData,
          })
        }

        successCount++
      } catch (error: any) {
        // Catch specific Payload validation errors
        if (error.name === 'ValidationError' && error.data?.fieldErrors) {
          console.error(`Validation error processing product "${source.name}":`)
          // Log specific field errors
          error.data.fieldErrors.forEach((fieldError: { field: string; message: string }) => {
            console.error(`  - Field: '${fieldError.field}', Message: ${fieldError.message}`)
          })
          // Log the data that caused the error
          console.error('Data causing validation error:', JSON.stringify(productData, null, 2))
        } else {
          // Log other unexpected errors
          console.error(`Unexpected error processing product "${source.name}":`, error)
          // Log the data that might have caused the error
          console.error('Data at time of error:', JSON.stringify(productData, null, 2))
        }
        skipCount++
      }
    }

    console.log('\nImport complete!')
    console.log(`Successfully imported/updated: ${successCount}`)
    console.log(`Skipped/failed: ${skipCount}`)

    return { success: successCount, failed: skipCount }
  } catch (error) {
    console.error('Fatal error during import process:', error)
    // Calculate failed count more accurately in case of early exit
    const totalProducts = productsData?.length || 0
    const processed = successCount + skipCount
    const remainingFailed = totalProducts > processed ? totalProducts - processed : 0
    return { success: successCount, failed: skipCount + remainingFailed }
  }
}
