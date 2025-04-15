import { CollectionConfig } from 'payload'

const ThirdSubcategories: CollectionConfig = {
  slug: 'thirdsubcategories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'subcategory', 'updatedAt'],
    group: 'Catalog',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'subcategory',
      type: 'relationship',
      relationTo: 'subcategories',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Third subcategory image',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Third subcategory icon',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this third subcategory in featured sections',
      },
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

export default ThirdSubcategories 