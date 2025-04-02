import Stripe from 'stripe';

if (!process.env.NEXT_STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY, {
    apiVersion: '2025-03-31.basil'
})