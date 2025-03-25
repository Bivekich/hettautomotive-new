import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const News: CollectionConfig = {
  slug: 'news-items',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'News Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      label: 'URL Slug',
      unique: true,
      admin: {
        description: 'Unique URL identifier for the news article (e.g., "new-product-launch")',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Publication Date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
          displayFormat: 'd MMM yyyy',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      label: 'Short Description',
      admin: {
        description: 'Brief summary shown in news listings (max 150 characters)',
      },
    },
    {
      name: 'previewImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Preview Image',
      admin: {
        description: 'Main image used for news listings and the first section of the article',
      },
    },
    {
      name: 'firstSection',
      type: 'group',
      label: 'First Article Section',
      admin: {
        description: 'The first section of the article with image on the right and text on the left',
      },
      fields: [
        {
          name: 'content',
          type: 'richText',
          required: true,
          label: 'Introduction Content',
          editor: lexicalEditor(),
        }
      ],
    },
    {
      name: 'contentSections',
      type: 'array',
      label: 'Additional Content Sections',
      required: false,
      minRows: 0,
      admin: {
        description: 'Add additional sections with text and optional images',
      },
      fields: [
        {
          name: 'content',
          type: 'richText',
          required: true,
          label: 'Section Content',
          editor: lexicalEditor(),
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: 'Section Image (Optional)',
          admin: {
            description: 'Optional image to display alongside this content section',
          },
        },
        {
          name: 'imagePosition',
          type: 'select',
          required: false,
          label: 'Image Position',
          defaultValue: 'right',
          options: [
            {
              label: 'Right',
              value: 'right',
            },
            {
              label: 'Left',
              value: 'left',
            },
          ],
          admin: {
            condition: (data, siblingData) => Boolean(siblingData?.image),
            description: 'Choose whether the image appears on the right or left of the text',
          },
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