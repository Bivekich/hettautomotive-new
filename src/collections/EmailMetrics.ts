import { CollectionConfig } from 'payload';

const EmailMetrics: CollectionConfig = {
  slug: 'email-metrics',
  admin: {
    useAsTitle: 'type',
    description: 'Track metrics for different types of emails sent',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Contact Form',
          value: 'contact_form',
        },
        {
          label: 'VIN Request',
          value: 'vin_request',
        },
      ],
    },
    {
      name: 'count',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Number of emails sent for this type',
      },
    },
    {
      name: 'lastSentAt',
      type: 'date',
      admin: {
        description: 'Last time an email of this type was sent',
      },
    },
  ],
};

export default EmailMetrics; 