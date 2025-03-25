import type { CollectionConfig } from 'payload'

export const Banners: CollectionConfig = {
  slug: 'banners',
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
      label: 'Banner Title',
    },
    {
      name: 'slides',
      type: 'array',
      label: 'Banner Slides',
      minRows: 1,
      required: true,
      fields: [
        {
          name: 'number',
          type: 'text',
          required: true,
          label: 'Slide Number (e.g. 01, 02)',
        },
        {
          name: 'subtitle',
          type: 'text',
          required: true,
          label: 'Slide Subtitle',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Slide Title',
        },
        {
          name: 'link',
          type: 'text',
          label: 'Slide Link URL',
          defaultValue: '#',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Slide Background Image',
        },
      ],
    },
  ],
} 