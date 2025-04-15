import payload from 'payload';

type EmailType = 'contact_form' | 'vin_request';

export async function incrementEmailCount(type: EmailType): Promise<void> {
  try {
    // Find existing metric for this type
    const existingMetrics = await payload.find({
      collection: 'email-metrics',
      where: {
        type: {
          equals: type
        }
      }
    });

    if (existingMetrics.docs.length > 0) {
      // Update existing metric
      const metric = existingMetrics.docs[0];
      await payload.update({
        collection: 'email-metrics',
        id: metric.id,
        data: {
          count: (metric.count || 0) + 1,
          lastSentAt: new Date().toISOString()
        }
      });
    } else {
      // Create new metric
      await payload.create({
        collection: 'email-metrics',
        data: {
          type,
          count: 1,
          lastSentAt: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error updating email metrics:', error);
  }
} 