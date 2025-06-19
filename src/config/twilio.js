const twilio = require('twilio');
const { getSetting } = require('../lib/settings');

let twilioInstance = null;
let twilioPhone = null;

async function getTwilioInstance() {
  try {
    if (twilioInstance) {
      return { client: twilioInstance, twilioPhoneNumber: twilioPhone };
    }

    const accountSid = await getSetting('TWILIO_ACCOUNT_SID');
    const authToken = await getSetting('TWILIO_AUTH_TOKEN');
    const phoneNumber = await getSetting('TWILIO_PHONE_NUMBER');
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not found in settings');
    }

    twilioInstance = twilio(accountSid, authToken);
    twilioPhone = phoneNumber;

    return {
      client: twilioInstance,
      twilioPhoneNumber: twilioPhone
    };
  } catch (error) {
    console.error('Error initializing Twilio:', error);
    throw error;
  }
}

module.exports = getTwilioInstance; 