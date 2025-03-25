import type { CollectionConfig } from 'payload'

export const Geography: CollectionConfig = {
  slug: 'geography',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Geography Section Title',
    },
    {
      name: 'slides',
      type: 'array',
      label: 'Geography Slides',
      minRows: 1,
      required: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Slide Title',
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          label: 'Slide Description',
        },
        {
          name: 'map',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Map Image',
        },
        {
          name: 'buttonText',
          type: 'text',
          label: 'Button Text (Optional)',
        },
        {
          name: 'buttonLink',
          type: 'text',
          label: 'Button Link URL (Optional)',
        },
      ],
    },
    {
      name: 'metaTitle',
      type: 'text',
      label: 'Meta Title (for SEO)',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta Description (for SEO)',
    },
  ],
} 