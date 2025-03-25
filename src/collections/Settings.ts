import type { CollectionConfig } from 'payload'

export const Settings: CollectionConfig = {
  slug: 'settings',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Settings Name',
      admin: {
        description: 'Identifier for these settings (e.g., "Global Settings")'
      },
    },
    // Header Section
    {
      name: 'header',
      type: 'group',
      label: 'Header Settings',
      fields: [
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
          admin: {
            description: 'Main phone number displayed in the header (e.g., "+7 (495) 260 20 60")'
          },
        },
        {
          name: 'socialLinks',
          type: 'array',
          label: 'Social Media Links',
          admin: {
            description: 'Social media links to display in the header'
          },
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: [
                { label: 'Telegram', value: 'telegram' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'VK', value: 'vk' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'Twitter', value: 'twitter' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              label: 'URL',
              admin: {
                description: 'Full URL including https://'
              },
            },
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              label: 'Custom Icon (Optional)',
              admin: {
                description: 'Custom icon for this social platform (defaults to built-in icon if not provided)'
              },
            },
            {
              name: 'title',
              type: 'text',
              label: 'Title/Alt Text',
              admin: {
                condition: (data, siblingData) => siblingData?.platform === 'other',
                description: 'Descriptive text for the icon (only needed for "Other")'
              },
            }
          ],
        },
      ],
    },
    // Footer Section
    {
      name: 'footer',
      type: 'group',
      label: 'Footer Settings',
      fields: [
        {
          name: 'phone',
          type: 'text',
          label: 'Phone Number',
          admin: {
            description: 'Primary contact phone displayed in the footer'
          },
        },
        {
          name: 'phoneLabel',
          type: 'text',
          label: 'Phone Label',
          admin: {
            description: 'Descriptive text for the phone number (e.g., "Телефон для связи")'
          },
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email Address',
          admin: {
            description: 'Contact email address'
          },
        },
        {
          name: 'emailLabel',
          type: 'text',
          label: 'Email Label',
          admin: {
            description: 'Descriptive text for the email (e.g., "Email для связи")'
          },
        },
        {
          name: 'address',
          type: 'text',
          label: 'Company Address',
          admin: {
            description: 'Physical address of the company'
          },
        },
        {
          name: 'addressLabel',
          type: 'text',
          label: 'Address Label',
          admin: {
            description: 'Descriptive text for the address (e.g., "Наш адрес")'
          },
        },
        {
          name: 'socialLinks',
          type: 'array',
          label: 'Social Media Links',
          admin: {
            description: 'Social media links to display in the footer (can be different from header)'
          },
          fields: [
            {
              name: 'platform',
              type: 'select',
              required: true,
              options: [
                { label: 'Telegram', value: 'telegram' },
                { label: 'WhatsApp', value: 'whatsapp' },
                { label: 'VK', value: 'vk' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'Facebook', value: 'facebook' },
                { label: 'Twitter', value: 'twitter' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              label: 'URL',
              admin: {
                description: 'Full URL including https://'
              },
            },
            {
              name: 'icon',
              type: 'upload',
              relationTo: 'media',
              label: 'Custom Icon (Optional)',
              admin: {
                description: 'Custom icon for this social platform (defaults to built-in icon if not provided)'
              },
            },
            {
              name: 'title',
              type: 'text',
              label: 'Title/Alt Text',
              admin: {
                condition: (data, siblingData) => siblingData?.platform === 'other',
                description: 'Descriptive text for the icon (only needed for "Other")'
              },
            }
          ],
        },
        {
          name: 'legalDocuments',
          type: 'group',
          label: 'Legal Documents',
          fields: [
            {
              name: 'copyright',
              type: 'text',
              label: 'Copyright Text',
              admin: {
                description: 'Copyright statement (e.g., "© 2024 Hett Automotive. Все права защищены")'
              },
            },
            {
              name: 'termsOfUse',
              type: 'group',
              label: 'Terms of Use',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: 'Link Text',
                  admin: {
                    description: 'Display text for Terms of Use link'
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'URL or Path',
                  admin: {
                    description: 'URL or path to the Terms of Use page (e.g., "/terms")'
                  },
                },
              ],
            },
            {
              name: 'privacyPolicy',
              type: 'group',
              label: 'Privacy Policy',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  label: 'Link Text',
                  admin: {
                    description: 'Display text for Privacy Policy link'
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'URL or Path',
                  admin: {
                    description: 'URL or path to the Privacy Policy page (e.g., "/privacy")'
                  },
                },
              ],
            },
            {
              name: 'additionalLinks',
              type: 'array',
              label: 'Additional Legal Links',
              admin: {
                description: 'Any additional legal links to display in the footer'
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  label: 'Link Text',
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'URL or Path',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
} 