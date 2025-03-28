import { CollectionConfig } from 'payload'

const Modifications: CollectionConfig = {
  slug: 'modifications',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'model', 'updatedAt'],
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
      name: 'model',
      type: 'relationship',
      relationTo: 'models',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'yearStart',
      type: 'number',
      label: 'Production Start Year',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'yearEnd',
      type: 'number',
      label: 'Production End Year',
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Modification image',
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

export default Modifications
