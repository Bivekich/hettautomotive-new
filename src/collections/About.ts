import type { CollectionConfig } from 'payload'

export const About: CollectionConfig = {
  slug: 'about',
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
      label: 'Page Title',
    },
    {
      name: 'mainContent',
      type: 'richText',
      required: true,
      label: 'Main Content',
    },
    {
      name: 'mainImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Main Image',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      required: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Feature Title',
        },
        {
          name: 'description',
          type: 'text',
          required: true,
          label: 'Feature Description',
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Feature Icon',
        },
      ],
    },
    {
      name: 'productionSection',
      type: 'group',
      label: 'Production Section',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Section Title',
        },
        {
          name: 'description',
          type: 'richText',
          required: true,
          label: 'Section Description',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Section Image',
        },
      ],
    },
    {
      name: 'buySection',
      type: 'group',
      label: 'Buy Section',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Section Title',
        },
        {
          name: 'description',
          type: 'richText',
          required: true,
          label: 'Section Description',
        },
        {
          name: 'onlineTitle',
          type: 'text',
          label: 'Online Partners Title',
          defaultValue: 'Онлайн',
        },
        {
          name: 'distributor',
          type: 'group',
          label: 'Official Distributor',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Distributor Title',
              defaultValue: 'Официальный дистрибьютор HettAutomotive в России',
            },
            {
              name: 'website',
              type: 'text',
              label: 'Website Display Name',
              defaultValue: 'protekauto.ru',
            },
            {
              name: 'websiteUrl',
              type: 'text',
              label: 'Website URL',
              defaultValue: 'https://protekauto.ru',
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Distributor Logo',
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Distributor Website Image',
            },
            {
              name: 'buttonText',
              type: 'text',
              label: 'Button Text',
              defaultValue: 'Перейти на сайт',
            },
            {
              name: 'buttonUrl',
              type: 'text',
              label: 'Button URL',
              defaultValue: 'https://protekauto.ru',
            },
            {
              name: 'features',
              type: 'array',
              label: 'Distributor Features',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  required: true,
                  label: 'Feature Text',
                },
                {
                  name: 'iconType',
                  type: 'select',
                  label: 'Icon Type',
                  defaultValue: 'wallet',
                  options: [
                    { label: 'Wallet (Price)', value: 'wallet' },
                    { label: 'Widgets (Assortment)', value: 'widgets' },
                    { label: 'Time (24/7)', value: 'time' },
                    { label: 'Truck (Delivery)', value: 'truck' },
                    { label: 'Custom', value: 'custom' },
                  ],
                },
                {
                  name: 'customIcon',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Custom Icon',
                  admin: {
                    condition: (data, siblingData) => siblingData?.iconType === 'custom',
                  },
                }
              ],
            },
          ],
        },
        {
          name: 'partners',
          type: 'array',
          label: 'Partners',
          required: true,
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              label: 'Partner Name',
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              required: true,
              label: 'Partner Logo',
            },
            {
              name: 'url',
              type: 'text',
              label: 'Partner Website URL',
            },
          ],
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