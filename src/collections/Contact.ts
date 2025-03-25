import type { CollectionConfig } from 'payload'

export const Contact: CollectionConfig = {
  slug: 'contact',
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
      defaultValue: 'Контакты Hett Automotive',
    },
    // Contact Info Section
    {
      name: 'contactInfoSection',
      type: 'group',
      label: 'Contact Information Section',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Contact Info Section',
          defaultValue: true,
        },
        {
          name: 'backgroundColor',
          type: 'text',
          label: 'Background Color',
          defaultValue: '#F5F5F5',
        },
        {
          name: 'padding',
          type: 'text',
          label: 'Padding (in pixels or tailwind classes)',
          defaultValue: 'py-12',
        },
        {
          name: 'contactItems',
          type: 'array',
          label: 'Contact Information Items',
          admin: {
            description: 'Add contact information elements (with optional titles)',
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Title',
              admin: {
                description: 'Optional title for this contact item (can be left empty)',
              },
              required: false,
            },
            {
              name: 'text1',
              type: 'text',
              label: 'Text 1',
              admin: {
                description: 'First text field (e.g. phone number, email, etc.)',
              },
              required: true,
            },
            {
              name: 'text2',
              type: 'text',
              label: 'Text 2',
              admin: {
                description: 'Second text field (e.g. description, label, etc.)',
              },
              required: false,
            },
            {
              name: 'href',
              type: 'text',
              label: 'Link URL',
              admin: {
                description: 'URL for text1 if clickable (e.g. tel:, mailto:, https://)',
              },
              required: false,
            },
            {
              name: 'columnWidth',
              type: 'select',
              label: 'Column Width',
              admin: {
                description: 'How wide this item should be in the grid',
              },
              options: [
                {
                  label: 'Quarter Width (25%)',
                  value: '25',
                },
                {
                  label: 'Half Width (50%)',
                  value: '50',
                },
                {
                  label: 'Three Quarter Width (75%)',
                  value: '75',
                },
                {
                  label: 'Full Width (100%)',
                  value: '100',
                },
              ],
              defaultValue: '25',
            },
            {
              name: 'order',
              type: 'number',
              label: 'Display Order',
              admin: {
                description: 'Order in which to display this item (lower numbers appear first)',
              },
              defaultValue: 0,
            },
          ],
          defaultValue: [
            {
              title: 'Контакты',
              text1: '',
              text2: '',
              columnWidth: '100',
              order: 0,
            },
            {
              title: '',
              text1: '8-936-003-80-43',
              text2: 'Номер телефона',
              href: 'tel:+79360038043',
              columnWidth: '25',
              order: 1,
            },
            {
              title: '',
              text1: 'info@protek-auto.ru',
              text2: 'Почта',
              href: 'mailto:info@protek-auto.ru',
              columnWidth: '25',
              order: 2,
            },
            {
              title: 'Месенджеры',
              text1: '',
              text2: '',
              columnWidth: '100',
              order: 3,
            },
          ],
        },
      ],
    },
    // Map Section
    {
      name: 'mapSection',
      type: 'group',
      label: 'Map Section',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Map Section',
          defaultValue: true,
        },
        {
          name: 'embedUrl',
          type: 'text',
          label: 'Map Embed URL',
          required: true,
          defaultValue: 'https://yandex.ru/map-widget/v1/?um=constructor%3A6d38c6c66e895056c2d30cee5b28604470ed7b83e2df1c1c96b722edff797552&amp;source=constructor',
        },
        {
          name: 'height',
          type: 'number',
          label: 'Map Height (px)',
          defaultValue: 540,
        },
        {
          name: 'title',
          type: 'text',
          label: 'Map Title (for accessibility)',
          defaultValue: 'Hett Automotive Map',
        },
      ],
    },
    // Contact Form Section
    {
      name: 'formSection',
      type: 'group',
      label: 'Contact Form Section',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enable Contact Form Section',
          defaultValue: true,
        },
        {
          name: 'title',
          type: 'text',
          label: 'Form Section Title',
          defaultValue: 'Обратная связь',
        },
        {
          name: 'introText',
          type: 'text',
          label: 'Introduction Text',
          defaultValue: 'По вопросам использования и распространения нашей продукции, сотрудничества',
        },
        {
          name: 'emailContact',
          type: 'text',
          label: 'Email Contact',
          defaultValue: 'parthers@hettautomotive.ru',
        },
        {
          name: 'formFields',
          type: 'array',
          label: 'Form Fields',
          fields: [
            {
              name: 'fieldName',
              type: 'text',
              required: true,
              label: 'Field Name (ID)',
            },
            {
              name: 'fieldType',
              type: 'select',
              required: true,
              options: [
                {
                  label: 'Text Input',
                  value: 'text',
                },
                {
                  label: 'Email Input',
                  value: 'email',
                },
                {
                  label: 'Telephone Input',
                  value: 'tel',
                },
                {
                  label: 'Textarea',
                  value: 'textarea',
                },
              ],
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              label: 'Field Label',
            },
            {
              name: 'placeholder',
              type: 'text',
              label: 'Placeholder Text',
            },
            {
              name: 'required',
              type: 'checkbox',
              label: 'Is Required',
              defaultValue: true,
            },
            {
              name: 'colSpan',
              type: 'number',
              label: 'Column Span',
              min: 1,
              max: 3,
              defaultValue: 1,
            },
            {
              name: 'height',
              type: 'number',
              label: 'Field Height (px)',
              defaultValue: 42,
              admin: {
                condition: (data) => data.fieldType === 'textarea',
              },
            },
          ],
          defaultValue: [
            {
              fieldName: 'name',
              fieldType: 'text',
              label: 'Имя',
              placeholder: 'Имя',
              required: true,
              colSpan: 1
            },
            {
              fieldName: 'phone',
              fieldType: 'tel',
              label: 'Номер телефона',
              placeholder: 'Номер телефона',
              required: true,
              colSpan: 1
            },
            {
              fieldName: 'email',
              fieldType: 'email',
              label: 'E-mail',
              placeholder: 'E-mail',
              required: true,
              colSpan: 1
            },
            {
              fieldName: 'message',
              fieldType: 'textarea',
              label: 'Ваш вопрос',
              placeholder: 'Ваш вопрос',
              required: true,
              colSpan: 3,
              height: 150
            }
          ]
        },
        {
          name: 'submitButtonText',
          type: 'text',
          label: 'Submit Button Text',
          defaultValue: 'Отправить',
        },
        {
          name: 'successMessage',
          type: 'text',
          label: 'Success Message',
          defaultValue: 'Ваше сообщение отправлено!',
        },
        {
          name: 'receiverEmail',
          type: 'email',
          label: 'Receiver Email',
          admin: {
            description: 'Email address where form submissions will be sent',
          },
        },
      ],
    },
    // SEO Fields
    {
      name: 'metaTitle',
      type: 'text',
      label: 'Meta Title (for SEO)',
      defaultValue: 'Контакты Hett Automotive - Связаться с нами',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'Meta Description (for SEO)',
      defaultValue: 'Свяжитесь с Hett Automotive по телефону, электронной почте или через форму обратной связи. Наша команда готова ответить на ваши вопросы.',
    },
  ],
} 