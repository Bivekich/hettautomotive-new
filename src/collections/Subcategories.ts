import { CollectionConfig } from 'payload/types'

const Subcategories: CollectionConfig = {
  slug: 'subcategories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'updatedAt'],
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
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
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
        description: 'Subcategory image',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Subcategory icon',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this subcategory in featured sections',
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

export default Subcategories 