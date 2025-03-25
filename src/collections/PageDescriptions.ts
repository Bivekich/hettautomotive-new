import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const PageDescriptions: CollectionConfig = {
  slug: 'page-descriptions',
  admin: {
    useAsTitle: 'pageType',
    defaultColumns: ['pageType', 'title', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'pageType',
      type: 'select',
      required: true,
      options: [
        { label: 'Catalog', value: 'catalog' },
        { label: 'News', value: 'news' },
      ],
      label: 'Page Type',
      admin: {
        description: 'The type of page this description is for',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Section Title',
      admin: {
        description: 'The title displayed at the top of the description section',
      },
    },
    {
      name: 'content',
      type: 'array',
      label: 'Content Paragraphs',
      required: true,
      minRows: 1,
      admin: {
        description: 'Paragraphs of text for the description section',
      },
      fields: [
        {
          name: 'paragraph',
          type: 'richText',
          required: true,
          label: 'Paragraph Content',
          editor: lexicalEditor(),
        }
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Active',
      defaultValue: true,
      admin: {
        description: 'Whether this description is currently displayed on the page',
        position: 'sidebar',
      },
    },
  ],
} 