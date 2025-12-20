#!/usr/bin/env node
/**
 * Create Stripe products, prices, and payment links for spaceorbust store
 */

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

const PRODUCTS = [
  // T-Shirts
  { name: 'spaceorbust Tee - Square Logo', price: 2999, type: 'tshirt', logo: 'square', desc: 'Bella+Canvas 3001 Unisex. S-2XL. Black/Navy/Dark Grey' },
  { name: 'spaceorbust Tee - Split Logo', price: 2999, type: 'tshirt', logo: 'square-split', desc: 'Bella+Canvas 3001 Unisex. S-2XL. Black/Navy/Dark Grey' },
  { name: 'spaceorbust Tee - Circle Logo', price: 2999, type: 'tshirt', logo: 'circle', desc: 'Bella+Canvas 3001 Unisex. S-2XL. Black/Navy/Dark Grey' },
  // Hoodies
  { name: 'spaceorbust Hoodie - Square Logo', price: 4999, type: 'hoodie', logo: 'square', desc: 'Gildan 18500 Heavy Blend. S-2XL. Black/Navy' },
  { name: 'spaceorbust Hoodie - Split Logo', price: 4999, type: 'hoodie', logo: 'square-split', desc: 'Gildan 18500 Heavy Blend. S-2XL. Black/Navy' },
  { name: 'spaceorbust Hoodie - Circle Logo', price: 4999, type: 'hoodie', logo: 'circle', desc: 'Gildan 18500 Heavy Blend. S-2XL. Black/Navy' },
  // Caps
  { name: 'spaceorbust Cap - Square Logo', price: 2499, type: 'hat', logo: 'square', desc: 'Dad Hat - Adjustable. Black/Navy' },
  { name: 'spaceorbust Cap - Split Logo', price: 2499, type: 'hat', logo: 'square-split', desc: 'Dad Hat - Adjustable. Black/Navy' },
  { name: 'spaceorbust Cap - Circle Logo', price: 2499, type: 'hat', logo: 'circle', desc: 'Dad Hat - Adjustable. Black/Navy' },
  // Stickers
  { name: 'spaceorbust Sticker - Square Logo', price: 499, type: 'sticker', logo: 'square', desc: '3x3" Kiss-Cut Vinyl. Weather resistant' },
  { name: 'spaceorbust Sticker - Split Logo', price: 499, type: 'sticker', logo: 'square-split', desc: '3x3" Kiss-Cut Vinyl. Weather resistant' },
  { name: 'spaceorbust Sticker - Circle Logo', price: 499, type: 'sticker', logo: 'circle', desc: '3x3" Kiss-Cut Vinyl. Weather resistant' },
];

async function stripeRequest(endpoint, data) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    params.append(key, value);
  }

  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  return response.json();
}

async function createProductWithPaymentLink(product) {
  console.log(`Creating: ${product.name}...`);

  // 1. Create product
  const prod = await stripeRequest('/products', {
    name: product.name,
    description: product.desc,
  });

  if (prod.error) {
    console.log(`  Error creating product: ${prod.error.message}`);
    return null;
  }

  // 2. Create price
  const price = await stripeRequest('/prices', {
    product: prod.id,
    unit_amount: product.price,
    currency: 'usd',
  });

  if (price.error) {
    console.log(`  Error creating price: ${price.error.message}`);
    return null;
  }

  // 3. Create payment link with shipping collection
  const link = await stripeRequest('/payment_links', {
    'line_items[0][price]': price.id,
    'line_items[0][quantity]': '1',
    'line_items[0][adjustable_quantity][enabled]': 'true',
    'line_items[0][adjustable_quantity][minimum]': '1',
    'line_items[0][adjustable_quantity][maximum]': '10',
    'shipping_address_collection[allowed_countries][0]': 'US',
    'shipping_address_collection[allowed_countries][1]': 'CA',
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': 'https://spaceorbust.com/thanks.html',
  });

  if (link.error) {
    console.log(`  Error creating payment link: ${link.error.message}`);
    return null;
  }

  console.log(`  ✓ ${link.url}`);

  return {
    ...product,
    productId: prod.id,
    priceId: price.id,
    paymentLink: link.url,
  };
}

async function main() {
  console.log('========================================');
  console.log('Creating Stripe Payment Links');
  console.log('========================================\n');

  const results = [];

  for (const product of PRODUCTS) {
    const result = await createProductWithPaymentLink(product);
    if (result) {
      results.push(result);
    }
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  console.log('\n========================================');
  console.log('Payment Links Created:');
  console.log('========================================\n');

  // Output as JSON for easy use
  console.log(JSON.stringify(results, null, 2));

  // Also output as a simple map for the store page
  console.log('\n// For store.html:\n');
  console.log('const PAYMENT_LINKS = {');
  for (const r of results) {
    const key = `${r.type}_${r.logo}`;
    console.log(`  '${key}': '${r.paymentLink}',`);
  }
  console.log('};');
}

main().catch(console.error);
