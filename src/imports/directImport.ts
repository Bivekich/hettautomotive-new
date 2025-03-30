import path from 'path';
import csv from 'csvtojson';
import type { Payload } from 'payload';
import fs from 'fs';
// Assuming your generated types are here
import type { Catalog, Category, Subcategory, Brand, Model, Modification, Media } from '../../payload-types';

// Function to slugify text
const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString() // Ensure input is a string
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Helper to convert CSV string values to boolean
const toBoolean = (value: string | null | undefined): boolean => {
  const lower = value?.toLowerCase()?.trim();
  return lower === 'true' || lower === '1' || lower === 'yes';
};

// Function to safely parse JSON strings (handles single quotes)
const safeParse = (jsonString: string | null | undefined, defaultValue: any = null): any => {
  if (!jsonString) return defaultValue;
  try {
    // Try direct parsing first
    return JSON.parse(jsonString);
  } catch (e) {
    try {
      // Replace single quotes with double quotes for valid JSON
      const fixedString = jsonString.replace(/'/g, '"');
      return JSON.parse(fixedString);
    } catch (e2) {
      console.warn('Failed to parse JSON string after attempting quote fix:', jsonString);
      return defaultValue;
    }
  }
};

// Define an interface for the expected structure of a CSV row
interface CsvRow {
  name: string;
  category: string; // Expecting name, will look up or create
  slug?: string;
  description?: string;
  shortDescription?: string;
  oem?: string;
  featured?: string; // Expecting 'true'/'false' etc.
  inStock?: string;  // Expecting 'true'/'false' etc.
  metaTitle?: string;
  metaDescription?: string;
  specifications?: string; // Expecting JSON string: [{name: string, value: string}]
  marketplaceLinks_ozon?: string;
  marketplaceLinks_wildberries?: string;
  marketplaceLinks_others?: string; // Expecting JSON string: [{name: string, url: string, logo?: string | number}]
  distributors?: string; // Expecting JSON string: [{name: string, url?: string, location?: string}]
  subcategory?: string; // Expecting name
  brand?: string; // Expecting name
  model?: string; // Expecting name
  modification?: string; // Expecting name
  image?: string; // Expecting filename or alt text
  images?: string; // Expecting comma-separated filenames or alt texts
}


// Main import function
export async function importCSV(
  filePath: string,
  payload: Payload
): Promise<{ success: number; failed: number }> {
  let successCount = 0;
  let skipCount = 0;
  let productsData: CsvRow[] = []; // Define productsData here so it's accessible in the final catch block

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return { success: 0, failed: 1 };
    }

    console.log(`Starting import from: ${filePath}`);

    productsData = await csv().fromFile(filePath);
    console.log(`Found ${productsData.length} products in CSV.`);

    for (const source of productsData) {
      // Basic validation
      if (!source.name || !source.category) {
        console.error('Skipping product with missing required fields (name, category):', source);
        skipCount++;
        continue;
      }

      let productData: Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>> = {}; // Define outside try block for error logging

      try {
        const slug = source.slug || slugify(source.name);

        // Prepare data structure matching Catalog collection type
        productData = {
          name: source.name,
          slug: slug,
          description: source.description || undefined,
          shortDescription: source.shortDescription || undefined,
          oem: source.oem || undefined,
          featured: toBoolean(source.featured),
          inStock: toBoolean(source.inStock ?? 'true'), // Default inStock to true if not provided
          metaTitle: source.metaTitle || undefined,
          metaDescription: source.metaDescription || undefined,
          specifications: [], // Initialize empty
          marketplaceLinks: { // Initialize structure
            ozon: undefined,
            wildberries: undefined,
            others: [],
          },
          distributors: [], // Initialize empty
          // Relationship fields will be populated below
        };

        // Handle specifications (array of name/value pairs)
        if (source.specifications) {
           const specData = safeParse(source.specifications, []);
           if (Array.isArray(specData)) {
              // Basic validation for spec items
              productData.specifications = specData.filter(item => item && typeof item === 'object' && item.name && item.value).map(item => ({ id: undefined, name: item.name, value: item.value }));
           } else {
              console.warn(`Invalid format for specifications for "${source.name}". Expected JSON array.`);
           }
        }

        // Handle marketplace links
        if (productData.marketplaceLinks) { // Check if marketplaceLinks exists
          productData.marketplaceLinks.ozon = source.marketplaceLinks_ozon || undefined;
          productData.marketplaceLinks.wildberries = source.marketplaceLinks_wildberries || undefined;
          if (source.marketplaceLinks_others) {
            const othersData = safeParse(source.marketplaceLinks_others, []);
            if (Array.isArray(othersData)) {
               // Filter/map to ensure required fields are present if any
               productData.marketplaceLinks.others = othersData
                  .filter(item => item && typeof item === 'object' && item.name && item.url) // Assuming name and url are key
                  .map(item => ({
                     id: undefined, // Ensure ID is not carried over unless explicitly handled
                     name: item.name,
                     url: item.url,
                     logo: item.logo || undefined // Handle logo - assume it's a relation ID (string/number) or undefined
                  }));
            } else {
               console.warn(`Invalid format for marketplaceLinks_others for "${source.name}". Expected JSON array.`);
            }
          }
           // Ensure 'others' is undefined if empty and field definition allows it
          if (!productData.marketplaceLinks.others?.length) {
             productData.marketplaceLinks.others = undefined;
          }
        }


        // Handle distributors array
        if (source.distributors) {
          const distributorsData = safeParse(source.distributors, []);
          if (Array.isArray(distributorsData)) {
             // Filter/map to ensure required fields are present if any
             productData.distributors = distributorsData
                .filter(item => item && typeof item === 'object' && item.name) // Assuming name is key
                .map(item => ({
                  id: undefined, // Ensure ID is not carried over
                   name: item.name,
                   url: item.url || undefined,
                   location: item.location || undefined
                }));
          } else {
             console.warn(`Invalid format for distributors for "${source.name}". Expected JSON array.`);
          }
        }
         // Ensure 'distributors' is undefined if empty and field definition allows it
        if (!productData.distributors?.length) {
           productData.distributors = undefined;
        }

        // --- Handle Relationships ---
        let categoryId: string | number | undefined;
        let brandId: string | number | undefined;
        let modelId: string | number | undefined;

        // Category (required)
        try {
          const categories = await payload.find<Category>({
            collection: 'categories',
            where: { name: { equals: source.category } },
            limit: 1,
            depth: 0,
          });
          if (categories.docs.length > 0) {
            categoryId = categories.docs[0].id;
          } else {
            console.warn(`Category "${source.category}" not found. Creating it.`);
            const newCategory = await payload.create<Category>({
              collection: 'categories',
              data: { name: source.category, slug: slugify(source.category) },
            });
            categoryId = newCategory.id;
          }
          productData.category = categoryId;
        } catch (error) {
          console.error(`Error processing category "${source.category}" for product "${source.name}":`, error);
          skipCount++;
          continue; // Skip product if category fails
        }

        // Subcategory (optional)
        if (source.subcategory) {
          try {
            const subcategories = await payload.find<Subcategory>({
              collection: 'subcategories',
              where: { name: { equals: source.subcategory } },
              limit: 1,
              depth: 0,
            });
            if (subcategories.docs.length > 0) {
              productData.subcategory = subcategories.docs[0].id;
            } else {
              console.warn(`Subcategory "${source.subcategory}" not found. Creating it.`);
              // Ensure categoryId is valid before creating subcategory
               if (categoryId) {
                 const newSubcategory = await payload.create<Subcategory>({
                   collection: 'subcategories',
                   data: { name: source.subcategory, slug: slugify(source.subcategory), category: categoryId }, // Requires category
                 });
                 productData.subcategory = newSubcategory.id;
               } else {
                 console.warn(`Cannot create subcategory "${source.subcategory}" because category ID is missing.`);
               }
            }
          } catch (error) {
            console.warn(`Error processing subcategory "${source.subcategory}" for product "${source.name}". Skipping field.`, error);
          }
        }

        // Brand (optional)
        if (source.brand) {
          try {
            const brands = await payload.find<Brand>({
              collection: 'brands',
              where: { name: { equals: source.brand } },
              limit: 1,
              depth: 0,
            });
            if (brands.docs.length > 0) {
              brandId = brands.docs[0].id;
            } else {
              console.warn(`Brand "${source.brand}" not found. Creating it.`);
              const newBrand = await payload.create<Brand>({
                collection: 'brands',
                data: { name: source.brand, slug: slugify(source.brand) },
              });
              brandId = newBrand.id;
            }
            productData.brand = brandId;
          } catch (error) {
            console.warn(`Error processing brand "${source.brand}" for product "${source.name}". Skipping field.`, error);
          }
        }

        // Model (optional)
        if (source.model) {
          try {
            const models = await payload.find<Model>({
              collection: 'models',
              where: { name: { equals: source.model } },
              limit: 1,
              depth: 0,
            });
            if (models.docs.length > 0) {
              modelId = models.docs[0].id;
            } else {
              console.warn(`Model "${source.model}" not found. Creating it.`);
              // Ensure brandId is potentially available if needed for the model
              const newModel = await payload.create<Model>({
                collection: 'models',
                data: { name: source.model, slug: slugify(source.model), brand: brandId }, // Link to brand if found
              });
              modelId = newModel.id;
            }
            productData.model = modelId;
          } catch (error) {
            console.warn(`Error processing model "${source.model}" for product "${source.name}". Skipping field.`, error);
          }
        }

        // Modification (optional)
        if (source.modification) {
          try {
            const modifications = await payload.find<Modification>({
              collection: 'modifications',
              where: { name: { equals: source.modification } },
              limit: 1,
              depth: 0,
            });
            if (modifications.docs.length > 0) {
              productData.modification = modifications.docs[0].id;
            } else {
              console.warn(`Modification "${source.modification}" not found. Creating it.`);
               // Ensure modelId is potentially available if needed
              const newModification = await payload.create<Modification>({
                collection: 'modifications',
                data: { name: source.modification, slug: slugify(source.modification), model: modelId }, // Link to model if found
              });
              productData.modification = newModification.id;
            }
          } catch (error) {
            console.warn(`Error processing modification "${source.modification}" for product "${source.name}". Skipping field.`, error);
          }
        }

        // --- Handle Images ---
        // Helper to find media by filename or alt text
        const findMedia = async (identifier: string): Promise<string | number | undefined> => {
           if (!identifier) return undefined;
           try {
              // Prioritize filename match
              let media = await payload.find<Media>({
                 collection: 'media',
                 where: { filename: { equals: identifier } },
                 limit: 1,
                 depth: 0, // No need for depth here
              });
              if (media.docs.length > 0) {
                 console.log(`Found image by filename: ${identifier}`);
                 return media.docs[0].id;
              }

              // Fallback to alt text match
              media = await payload.find<Media>({
                 collection: 'media',
                 where: { alt: { equals: identifier } },
                 limit: 1,
                  depth: 0,
              });
              if (media.docs.length > 0) {
                 console.log(`Found image by alt text: ${identifier}`);
                 return media.docs[0].id;
              }

              console.warn(`Image "${identifier}" not found in media collection.`);
              return undefined;
           } catch (err) {
              console.error(`Error searching for media "${identifier}":`, err);
              return undefined;
           }
        };

        // Main image
        if (source.image) {
           productData.image = await findMedia(source.image.trim());
        }

        // Additional images (comma-separated)
        if (source.images) {
          const imageIdentifiers = source.images.split(',').map(img => img.trim()).filter(img => img);
          const imageIds: (string | number)[] = [];
          for (const identifier of imageIdentifiers) {
             const foundId = await findMedia(identifier);
             if (foundId) {
                // Avoid duplicates
                if (!imageIds.includes(foundId)) {
                  imageIds.push(foundId);
                }
             }
          }
           if (imageIds.length > 0) {
             productData.images = imageIds;
           }
        }


        // --- Upsert Logic ---
        // Check if product with the same slug already exists
        const existingProducts = await payload.find<Catalog>({
          collection: 'catalog',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 0, // Don't need related data here
        });

         // Clean data before sending (remove undefined array/object fields if necessary based on collection config)
        const cleanData = (data: Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>>) => {
           const cleaned: Partial<Omit<Catalog, 'id' | 'createdAt' | 'updatedAt'>> = { ...data };

           // Handle potentially undefined nested structure
           if (cleaned.marketplaceLinks) {
             if (cleaned.marketplaceLinks.others === undefined || (Array.isArray(cleaned.marketplaceLinks.others) && cleaned.marketplaceLinks.others.length === 0)) {
               cleaned.marketplaceLinks.others = undefined;
             }
             // If marketplaceLinks only contains undefined values after cleaning, remove the parent object
             if (Object.values(cleaned.marketplaceLinks).every(v => v === undefined)) {
               cleaned.marketplaceLinks = undefined;
             }
           } else {
              cleaned.marketplaceLinks = undefined;
           }

           if (cleaned.distributors === undefined || (Array.isArray(cleaned.distributors) && cleaned.distributors.length === 0)) {
             cleaned.distributors = undefined;
           }
           if (cleaned.specifications === undefined || (Array.isArray(cleaned.specifications) && cleaned.specifications.length === 0)) {
             cleaned.specifications = undefined;
           }
           if (cleaned.images === undefined || (Array.isArray(cleaned.images) && cleaned.images.length === 0)) {
             cleaned.images = undefined;
           }

           // Remove top-level undefined keys to avoid sending them in the API call
           Object.keys(cleaned).forEach(key => {
               if (cleaned[key as keyof typeof cleaned] === undefined) {
                   delete cleaned[key as keyof typeof cleaned];
               }
           });

           return cleaned;
        };


        if (existingProducts.docs.length > 0) {
          const existingId = existingProducts.docs[0].id;
          console.log(`Updating existing product: ${source.name} (ID: ${existingId})`);
          const updateData = cleanData(productData);

          await payload.update<Catalog>({
            collection: 'catalog',
            id: existingId,
            data: updateData, // Pass the cleaned, structured data
          });
        } else {
          console.log(`Creating new product: ${source.name}`);
          const createData = cleanData(productData);

          await payload.create<Catalog>({
            collection: 'catalog',
            data: createData, // Pass the cleaned, structured data
          });
        }

        successCount++;
      } catch (error: any) {
         // Catch specific Payload validation errors
        if (error.name === 'ValidationError' && error.data?.fieldErrors) {
          console.error(`Validation error processing product "${source.name}":`);
          // Log specific field errors
          error.data.fieldErrors.forEach((fieldError: { field: string, message: string }) => {
             console.error(`  - Field: '${fieldError.field}', Message: ${fieldError.message}`);
          });
           // Log the data that caused the error
           console.error('Data causing validation error:', JSON.stringify(productData, null, 2));
        } else {
          // Log other unexpected errors
          console.error(`Unexpected error processing product "${source.name}":`, error);
           // Log the data that might have caused the error
           console.error('Data at time of error:', JSON.stringify(productData, null, 2));

        }
        skipCount++;
      }
    }

    console.log('\nImport complete!');
    console.log(`Successfully imported/updated: ${successCount}`);
    console.log(`Skipped/failed: ${skipCount}`);

    return { success: successCount, failed: skipCount };
  } catch (error) {
    console.error('Fatal error during import process:', error);
    // Calculate failed count more accurately in case of early exit
    const totalProducts = productsData?.length || 0;
    const processed = successCount + skipCount;
    const remainingFailed = totalProducts > processed ? totalProducts - processed : 0;
    return { success: successCount, failed: skipCount + remainingFailed };
  }
}