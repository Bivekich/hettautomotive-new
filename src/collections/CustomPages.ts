import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const CustomPages: CollectionConfig = {
  slug: 'custom-pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Page Title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      label: 'URL Slug',
      unique: true,
      admin: {
        description: 'Unique URL identifier for the page (e.g., "about-us" or "terms-of-service")',
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
      name: 'showInMenu',
      type: 'checkbox',
      label: 'Show in Top Menu',
      defaultValue: false,
      admin: {
        description: 'Display this page in the top navigation menu',
        position: 'sidebar',
      },
    },
    {
      name: 'heroSection',
      type: 'group',
      label: 'Hero Section',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Hero Section',
          defaultValue: true,
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: false,
          label: 'Hero Background Image',
          admin: {
            condition: (data, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'description',
          type: 'richText',
          label: 'Description Content',
          admin: {
            condition: (data, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle (Optional)',
          admin: {
            condition: (data, siblingData) => siblingData?.enabled,
          },
        },
      ],
    },
    {
      name: 'contentSections',
      type: 'array',
      label: 'Content Sections',
      required: true,
      minRows: 1,
      admin: {
        description: 'Add content sections to build your page',
      },
      fields: [
        {
          name: 'sectionType',
          type: 'select',
          required: true,
          label: 'Section Type',
          defaultValue: 'content',
          options: [
            {
              label: 'Text Content',
              value: 'content',
            },
            {
              label: 'Text with Image',
              value: 'text-image',
            },
          ],
        },
        {
          name: 'title',
          type: 'text',
          label: 'Section Title (Optional)',
        },
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
          label: 'Section Image',
          admin: {
            condition: (data, siblingData) => siblingData?.sectionType === 'text-image',
            description: 'Image to display alongside the content',
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
            condition: (data, siblingData) => siblingData?.sectionType === 'text-image' && siblingData?.image,
            description: 'Choose whether the image appears on the right or left of the text',
          },
        },
        {
          name: 'backgroundColor',
          type: 'select',
          label: 'Background Color',
          defaultValue: 'transparent',
          options: [
            {
              label: 'Transparent',
              value: 'transparent',
            },
            {
              label: 'White',
              value: 'white',
            },
            {
              label: 'Light Gray',
              value: 'light-gray',
            },
            {
              label: 'Dark',
              value: 'dark',
            },
            {
              label: 'Primary (Green)',
              value: 'primary',
            },
          ],
        },
        {
          name: 'padding',
          type: 'select',
          label: 'Section Padding',
          defaultValue: 'medium',
          options: [
            {
              label: 'Small',
              value: 'small',
            },
            {
              label: 'Medium',
              value: 'medium',
            },
            {
              label: 'Large',
              value: 'large',
            },
          ],
        },
      ],
    },
    {
      name: 'metaTitle',
      type: 'text',
      label: 'Meta Title (for SEO)',
      admin: {
        description: 'Override the default page title for SEO purposes',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta Description (for SEO)',
    },
  ],
} 