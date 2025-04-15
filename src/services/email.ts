import nodemailer from 'nodemailer';
import payload from 'payload';
import { incrementEmailCount } from '../utils/emailMetrics';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.NEXT_PUBLIC_EMAIL_HOST,
  port: Number(process.env.NEXT_PUBLIC_EMAIL_PORT),
  secure: true,
  auth: {
    user: process.env.NEXT_PUBLIC_EMAIL_USER,
    pass: process.env.NEXT_PUBLIC_EMAIL_PASS,
  },
});

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface VinRequestData {
  name: string;
  email: string;
  phone: string;
  vin: string;
  details?: string;
}

// Helper function to get current count for a specific email type
async function getCurrentCount(type: 'contact_form' | 'vin_request'): Promise<number> {
  try {
    const result = await payload.find({
      collection: 'email-metrics',
      where: {
        type: {
          equals: type
        }
      }
    });

    if (result.docs.length > 0) {
      return result.docs[0].count || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting current count:', error);
    return 0;
  }
}

export async function sendContactFormEmail(data: ContactFormData): Promise<boolean> {
  try {
    // Get current count before incrementing
    const currentCount = await getCurrentCount('contact_form');
    const newCount = currentCount + 1;

    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_EMAIL_FROM,
      to: process.env.NEXT_PUBLIC_EMAIL_TO,
      subject: `Новое сообщение с формы контактов #${newCount}`,
      html: `
        <h2>Новое сообщение с формы контактов #${newCount}</h2>
        <p><strong>Номер обращения:</strong> ${newCount}</p>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>Сообщение:</strong></p>
        <p>${data.message}</p>
        <p><em>Отправлено: ${new Date().toLocaleString('ru-RU')}</em></p>
      `,
    });

    // Increment the contact form email count
    await incrementEmailCount('contact_form');
    
    return true;
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return false;
  }
}

export async function sendVinRequestEmail(data: VinRequestData): Promise<boolean> {
  try {
    // Get current count before incrementing
    const currentCount = await getCurrentCount('vin_request');
    const newCount = currentCount + 1;

    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_EMAIL_FROM,
      to: process.env.NEXT_PUBLIC_EMAIL_TO,
      subject: `Новый запрос по VIN #${newCount}`,
      html: `
        <h2>Новый запрос по VIN #${newCount}</h2>
        <p><strong>Номер запроса:</strong> ${newCount}</p>
        <p><strong>Имя:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Телефон:</strong> ${data.phone}</p>
        <p><strong>VIN:</strong> ${data.vin}</p>
        ${data.details ? `<p><strong>Дополнительная информация:</strong></p><p>${data.details}</p>` : ''}
        <p><em>Отправлено: ${new Date().toLocaleString('ru-RU')}</em></p>
      `,
    });

    // Increment the VIN request email count
    await incrementEmailCount('vin_request');
    
    return true;
  } catch (error) {
    console.error('Error sending VIN request email:', error);
    return false;
  }
} 