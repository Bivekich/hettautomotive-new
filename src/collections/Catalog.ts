import { CollectionConfig } from 'payload'

const Catalog: CollectionConfig = {
  slug: 'catalog',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
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
      hasMany: false,
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
          required: true,
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
