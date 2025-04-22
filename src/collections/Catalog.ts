import { CollectionConfig } from 'payload'

// Add slugify function with Cyrillic support
const slugify = (text: string): string => {
  if (!text) return ''

  // Cyrillic to Latin transliteration map
  const translitMap: { [key: string]: string } = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    А: 'A',
    Б: 'B',
    В: 'V',
    Г: 'G',
    Д: 'D',
    Е: 'E',
    Ё: 'Yo',
    Ж: 'Zh',
    З: 'Z',
    И: 'I',
    Й: 'Y',
    К: 'K',
    Л: 'L',
    М: 'M',
    Н: 'N',
    О: 'O',
    П: 'P',
    Р: 'R',
    С: 'S',
    Т: 'T',
    У: 'U',
    Ф: 'F',
    Х: 'H',
    Ц: 'Ts',
    Ч: 'Ch',
    Ш: 'Sh',
    Щ: 'Sch',
    Ъ: '',
    Ы: 'Y',
    Ь: '',
    Э: 'E',
    Ю: 'Yu',
    Я: 'Ya',
  }

  return text
    .toString()
    .split('')
    .map((char) => translitMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

const Catalog: CollectionConfig = {
  slug: 'catalog',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'updatedAt'],
    group: 'Content',
    listSearchableFields: [
      'name',
      'oem',
      'article',
      'category.name',
      'subcategory.name',
      'thirdsubcategory.name',
    ],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data }: { data?: { name?: string; slug?: string } }) => {
        if (data && !data.slug && data.name) {
          data.slug = slugify(data.name)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Product Description',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Short Description',
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'model',
      type: 'relationship',
      relationTo: 'models',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'modification',
      type: 'relationship',
      relationTo: 'modifications',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'thirdsubcategory',
      type: 'relationship',
      relationTo: 'thirdsubcategories',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'images',
      type: 'array',
      label: 'Product Images',
      minRows: 1,
      maxRows: 10,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'alt',
          type: 'text',
          label: 'Alt Text',
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured Product',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'inStock',
      type: 'checkbox',
      label: 'In Stock',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'specifications',
      type: 'array',
      label: 'Specifications',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'oem',
      type: 'text',
      label: 'OEM Number',
    },
    {
      name: 'article',
      type: 'text',
      label: 'Артикуль',
      required: true,
      unique: true,
      admin: {
        description: 'Уникальный артикуль товара',
      },
    },
    {
      name: 'marketplaceLinks',
      type: 'group',
      label: 'Marketplace Links',
      fields: [
        {
          name: 'ozon',
          type: 'text',
          label: 'Ozon URL',
        },
        {
          name: 'wildberries',
          type: 'text',
          label: 'Wildberries URL',
        },
        {
          name: 'others',
          type: 'array',
          label: 'Other Marketplaces',
          fields: [
            {
              name: 'name',
              type: 'text',
              label: 'Marketplace Name',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              label: 'URL',
              required: true,
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Marketplace Logo',
            },
          ],
        },
      ],
    },
    {
      name: 'distributors',
      type: 'array',
      label: 'Distributors',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Distributor Name',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'Website URL',
          required: true,
        },
        {
          name: 'location',
          type: 'text',
          label: 'Location',
        },
      ],
    },
    {
      name: 'metaTitle',
      type: 'text',
      label: 'Meta Title',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta Description',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}

export default Catalog
