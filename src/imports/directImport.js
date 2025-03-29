const dotenv = require('dotenv');
const path = require('path');
const csv = require('csvtojson');
const payload = require('payload');
const fs = require('fs');

// Function to slugify text
const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .trim();
};

// Function to safely parse JSON strings
const safeParse = (jsonString, defaultValue = null) => {
  if (!jsonString) return defaultValue;
  
  try {
    // First try to parse it directly
    return JSON.parse(jsonString);
  } catch (e) {
    // If that fails, try to replace single quotes with double quotes
    try {
      // Replace single quotes with double quotes for valid JSON
      const fixedString = jsonString.replace(/'/g, '"');
      return JSON.parse(fixedString);
    } catch (e2) {
      console.warn('Failed to parse JSON string:', jsonString);
      return defaultValue;
    }
  }
};

// Main import function
async function importCSV(filePath) {
  let successCount = 0;
  let skipCount = 0;
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return { success: 0, failed: 1 };
    }
    
    // Initialize Payload
    await payload.init({
      secret: process.env.PAYLOAD_SECRET,
      local: true, // This works in the CLI script
    });
    
    console.log(`Starting import from: ${filePath}`);
    
    // Read the CSV file
    const productsData = await csv().fromFile(filePath);
    console.log(`Found ${productsData.length} products in CSV.`);
    
    // Process each product
    for (const source of productsData) {
      // Basic validation
      if (!source.name || !source.category) {
        console.error('Skipping product with missing required fields:', source);
        skipCount++;
        continue;
      }
      
      try {
        // Generate a slug from the name if not provided
        const slug = source.slug || slugify(source.name);
        
        // Build the product data object
        const productData = {
          name: source.name,
          slug: slug,
          description: source.description || undefined,
          shortDescription: source.shortDescription || undefined,
          oem: source.oem || undefined,
          featured: source.featured?.toLowerCase() === 'true',
          inStock: source.inStock?.toLowerCase() !== 'false', // Default to true unless explicitly set to false
          metaTitle: source.metaTitle || undefined,
          metaDescription: source.metaDescription || undefined
        };
        
        // Handle specifications (array of name/value pairs)
        if (source.specifications) {
          try {
            const specData = safeParse(source.specifications, []);
            if (Array.isArray(specData)) {
              productData.specifications = specData;
            }
          } catch (error) {
            console.warn(`Error parsing specifications for "${source.name}":`, error);
          }
        }
        
        // Handle marketplace links
        if (source.marketplaceLinks_ozon || source.marketplaceLinks_wildberries || source.marketplaceLinks_others) {
          const marketplaceLinks = {
            ozon: source.marketplaceLinks_ozon || undefined,
            wildberries: source.marketplaceLinks_wildberries || undefined
          };
          
          // Parse others as array of objects
          if (source.marketplaceLinks_others) {
            try {
              const othersData = safeParse(source.marketplaceLinks_others, []);
              if (Array.isArray(othersData)) {
                marketplaceLinks.others = othersData;
              }
            } catch (error) {
              console.warn(`Error parsing marketplace others for "${source.name}":`, error);
            }
          }
          
          productData.marketplaceLinks = marketplaceLinks;
        }
        
        // Handle distributors array
        if (source.distributors) {
          try {
            const distributorsData = safeParse(source.distributors, []);
            if (Array.isArray(distributorsData)) {
              productData.distributors = distributorsData;
            }
          } catch (error) {
            console.warn(`Error parsing distributors for "${source.name}":`, error);
          }
        }
        
        // Handle relationships - we need to look up IDs for related collections
        
        // Category (required)
        let categoryId = null;
        try {
          const categories = await payload.find({
            collection: 'categories',
            where: {
              name: { equals: source.category },
            },
          });
          
          if (categories.docs.length > 0) {
            categoryId = categories.docs[0].id;
          } else {
            console.warn(`Category "${source.category}" not found. Creating it.`);
            const newCategory = await payload.create({
              collection: 'categories',
              data: { 
                name: source.category,
                slug: slugify(source.category),
              },
            });
            categoryId = newCategory.id;
          }
          
          productData.category = categoryId;
        } catch (error) {
          console.error(`Error processing category "${source.category}":`, error);
          skipCount++;
          continue;
        }
        
        // Subcategory (optional)
        if (source.subcategory) {
          try {
            const subcategories = await payload.find({
              collection: 'subcategories',
              where: {
                name: { equals: source.subcategory },
              },
            });
            
            if (subcategories.docs.length > 0) {
              productData.subcategory = subcategories.docs[0].id;
            } else {
              console.warn(`Subcategory "${source.subcategory}" not found. Creating it.`);
              const newSubcategory = await payload.create({
                collection: 'subcategories',
                data: { 
                  name: source.subcategory,
                  slug: slugify(source.subcategory),
                  category: categoryId,
                },
              });
              productData.subcategory = newSubcategory.id;
            }
          } catch (error) {
            console.warn(`Error processing subcategory "${source.subcategory}". Skipping this field.`, error);
            // Continue without subcategory if there's an error
          }
        }
        
        // Brand (optional)
        if (source.brand) {
          try {
            const brands = await payload.find({
              collection: 'brands',
              where: {
                name: { equals: source.brand },
              },
            });
            
            if (brands.docs.length > 0) {
              productData.brand = brands.docs[0].id;
            } else {
              console.warn(`Brand "${source.brand}" not found. Creating it.`);
              const newBrand = await payload.create({
                collection: 'brands',
                data: { 
                  name: source.brand,
                  slug: slugify(source.brand),
                },
              });
              productData.brand = newBrand.id;
            }
          } catch (error) {
            console.warn(`Error processing brand "${source.brand}". Skipping this field.`, error);
            // Continue without brand if there's an error
          }
        }
        
        // Model (optional)
        if (source.model) {
          try {
            const models = await payload.find({
              collection: 'models',
              where: {
                name: { equals: source.model },
              },
            });
            
            if (models.docs.length > 0) {
              productData.model = models.docs[0].id;
            } else {
              console.warn(`Model "${source.model}" not found. Creating it.`);
              const newModel = await payload.create({
                collection: 'models',
                data: { 
                  name: source.model,
                  slug: slugify(source.model),
                  brand: productData.brand, // Link to brand if available
                },
              });
              productData.model = newModel.id;
            }
          } catch (error) {
            console.warn(`Error processing model "${source.model}". Skipping this field.`, error);
            // Continue without model if there's an error
          }
        }
        
        // Modification (optional)
        if (source.modification) {
          try {
            const modifications = await payload.find({
              collection: 'modifications',
              where: {
                name: { equals: source.modification },
              },
            });
            
            if (modifications.docs.length > 0) {
              productData.modification = modifications.docs[0].id;
            } else {
              console.warn(`Modification "${source.modification}" not found. Creating it.`);
              const newModification = await payload.create({
                collection: 'modifications',
                data: { 
                  name: source.modification,
                  slug: slugify(source.modification),
                  model: productData.model, // Link to model if available
                },
              });
              productData.modification = newModification.id;
            }
          } catch (error) {
            console.warn(`Error processing modification "${source.modification}". Skipping this field.`, error);
            // Continue without modification if there's an error
          }
        }
        
        // Handle image associations (optional)
        if (source.image) {
          try {
            // Look for existing image in the media collection
            // First try by filename
            const media = await payload.find({
              collection: 'media',
              where: {
                filename: { equals: source.image },
              },
            });
            
            // If not found by filename, try by alt text
            if (media.docs.length === 0) {
              const mediaByAlt = await payload.find({
                collection: 'media',
                where: {
                  alt: { equals: source.image },
                },
              });
              
              if (mediaByAlt.docs.length > 0) {
                productData.image = mediaByAlt.docs[0].id;
                console.log(`Found image by alt text: ${source.image}`);
              } else {
                console.warn(`Image "${source.image}" not found in media collection. Upload it manually with the same name.`);
              }
            } else {
              productData.image = media.docs[0].id;
              console.log(`Found image by filename: ${source.image}`);
            }
          } catch (error) {
            console.warn(`Error processing image "${source.image}". Skipping this field.`, error);
          }
        }
        
        // Handle product images (array of image objects)
        if (source.images) {
          try {
            const imageNames = source.images.split(',').map(img => img.trim());
            const imageObjects = [];
            
            for (const imageName of imageNames) {
              // Look for existing image in the media collection
              const media = await payload.find({
                collection: 'media',
                where: {
                  or: [
                    { filename: { equals: imageName } },
                    { alt: { equals: imageName } }
                  ]
                },
              });
              
              if (media.docs.length > 0) {
                imageObjects.push({
                  image: media.docs[0].id,
                  alt: media.docs[0].alt || imageName.replace(/\.[^/.]+$/, '') // Use alt or filename without extension
                });
                console.log(`Found image: ${imageName}`);
              } else {
                console.warn(`Image "${imageName}" not found in media collection. Upload it manually with the same name.`);
              }
            }
            
            if (imageObjects.length > 0) {
              productData.images = imageObjects;
            }
          } catch (error) {
            console.warn(`Error processing images "${source.images}". Skipping this field.`, error);
          }
        }
        
        // Check if the product already exists by slug
        const existingProducts = await payload.find({
          collection: 'catalog',
          where: {
            slug: { equals: slug },
          },
        });
        
        if (existingProducts.docs.length > 0) {
          console.log(`Updating existing product: ${source.name}`);
          await payload.update({
            collection: 'catalog',
            id: existingProducts.docs[0].id,
            data: productData,
          });
        } else {
          console.log(`Creating new product: ${source.name}`);
          await payload.create({
            collection: 'catalog',
            data: productData,
          });
        }
        
        successCount++;
      } catch (error) {
        console.error(`Error processing product "${source.name}":`, error);
        skipCount++;
      }
    }
    
    console.log('\nImport complete!');
    console.log(`Successfully imported/updated: ${successCount}`);
    console.log(`Skipped/failed: ${skipCount}`);
    
    return { success: successCount, failed: skipCount };
  } catch (error) {
    console.error('Import failed:', error);
    return { success: successCount, failed: skipCount };
  }
}

// If called directly
if (require.main === module) {
  // Load environment variables
  dotenv.config();
  
  // Get the file path from command-line arguments or use a default path
  const filePath = process.argv[2] || path.resolve(__dirname, 'data/products.csv');
  
  importCSV(filePath)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error during import:', error);
      process.exit(1);
    });
}

// Make the importCSV function available for both CommonJS and ES modules
module.exports = { importCSV };

// For ES Module compatibility
export { importCSV }; 