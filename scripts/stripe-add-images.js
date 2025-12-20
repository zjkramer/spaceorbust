#!/usr/bin/env node
/**
 * Add images to existing Stripe products
 */

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

// Map product names to their image URLs on spaceorbust.com
const PRODUCT_IMAGES = {
  'spaceorbust Tee - Square Logo': 'https://spaceorbust.com/logos/logo-square.png',
  'spaceorbust Tee - Split Logo': 'https://spaceorbust.com/logos/logo-square-split.png',
  'spaceorbust Tee - Circle Logo': 'https://spaceorbust.com/logos/logo-circle.png',
  'spaceorbust Hoodie - Square Logo': 'https://spaceorbust.com/logos/logo-square.png',
  'spaceorbust Hoodie - Split Logo': 'https://spaceorbust.com/logos/logo-square-split.png',
  'spaceorbust Hoodie - Circle Logo': 'https://spaceorbust.com/logos/logo-circle.png',
  'spaceorbust Cap - Square Logo': 'https://spaceorbust.com/logos/logo-square.png',
  'spaceorbust Cap - Split Logo': 'https://spaceorbust.com/logos/logo-square-split.png',
  'spaceorbust Cap - Circle Logo': 'https://spaceorbust.com/logos/logo-circle.png',
  'spaceorbust Sticker - Square Logo': 'https://spaceorbust.com/logos/logo-square.png',
  'spaceorbust Sticker - Split Logo': 'https://spaceorbust.com/logos/logo-square-split.png',
  'spaceorbust Sticker - Circle Logo': 'https://spaceorbust.com/logos/logo-circle.png',
};

async function stripeRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  if (data) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      params.append(key, value);
    }
    options.body = params.toString();
  }

  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, options);
  return response.json();
}

async function main() {
  console.log('Fetching existing products...\n');

  // Get all products
  const products = await stripeRequest('/products?limit=100');

  if (products.error) {
    console.error('Error fetching products:', products.error.message);
    return;
  }

  console.log(`Found ${products.data.length} products\n`);

  for (const product of products.data) {
    const imageUrl = PRODUCT_IMAGES[product.name];

    if (imageUrl) {
      console.log(`Updating: ${product.name}`);
      console.log(`  Image: ${imageUrl}`);

      const result = await stripeRequest(`/products/${product.id}`, 'POST', {
        'images[0]': imageUrl
      });

      if (result.error) {
        console.log(`  Error: ${result.error.message}`);
      } else {
        console.log(`  ✓ Updated`);
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 300));
    } else {
      console.log(`Skipping: ${product.name} (no image mapping)`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
