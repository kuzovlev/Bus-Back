const { getSetting } = require('../lib/settings');
let stripeInstance = null;

async function getStripeInstance() {
  try {
    if (stripeInstance) {
      return stripeInstance;
    }

    const stripeSecretKey = await getSetting('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not found in settings');
    }

    stripeInstance = require('stripe')(stripeSecretKey);
    return stripeInstance;
  } catch (error) {
    console.error('Error initializing Stripe:', error);
    throw error;
  }
}

module.exports = getStripeInstance; 