 // @ts-ignore // Ignore PayloadHandler type error
import { Endpoint } from 'payload/config';
import { Request, Response } from 'express';
import { sendContactFormEmail, sendVinRequestEmail } from '../services/email';

export const contactFormEndpoint: Endpoint = {
  path: '/contact-form',
  method: 'post',
  handler: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, message } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !message) {
        res.status(400).json({ 
          message: 'Missing required fields',
          success: false 
        });
        return;
      }

      const success = await sendContactFormEmail({ name, email, phone, message });
      
      if (success) {
        res.status(200).json({ 
          message: 'Email sent successfully',
          success: true 
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send email',
          success: false 
        });
      }
    } catch (error) {
      console.error('Error in contact form endpoint:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        success: false 
      });
    }
  },
};

export const vinRequestEndpoint: Endpoint = {
  path: '/vin-request',
  method: 'post',
  handler: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, vin, details } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !vin) {
        res.status(400).json({ 
          message: 'Missing required fields',
          success: false 
        });
        return;
      }

      const success = await sendVinRequestEmail({ name, email, phone, vin, details });
      
      if (success) {
        res.status(200).json({ 
          message: 'Email sent successfully',
          success: true 
        });
      } else {
        res.status(500).json({ 
          message: 'Failed to send email',
          success: false 
        });
      }
    } catch (error) {
      console.error('Error in VIN request endpoint:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        success: false 
      });
    }
  },
}; 