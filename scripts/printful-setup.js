#!/usr/bin/env node
/**
 * Automated Printful product setup for spaceorbust
 * Creates t-shirts, hoodies, hats, mugs, and stickers with all logo variants
 */

const API_KEY = 'USlyvWBwc85dzL9aC9gaIhj2JNmarweu7OI6e0gC';
const STORE_ID = '17415257';
const BASE_URL = 'https://api.printful.com';

// Logo files uploaded to Printful
const LOGOS = {
  'logo-square': { id: 919573108, url: 'https://spaceorbust.com/logos/logo-square.png' },
  'logo-square-split': { id: 919573231, url: 'https://spaceorbust.com/logos/logo-square-split.png' },
  'logo-circle': { id: 919573234, url: 'https://spaceorbust.com/logos/logo-circle.png' },
  'logo-circle-split': { id: 919573235, url: 'https://spaceorbust.com/logos/logo-circle-split.png' },
  'logo-rectangle': { id: 919573238, url: 'https://spaceorbust.com/logos/logo-rectangle.png' },
  'logo-diamond': { id: 919573241, url: 'https://spaceorbust.com/logos/logo-diamond.png' },
  'logo-diamond-split': { id: 919573257, url: 'https://spaceorbust.com/logos/logo-diamond-split.png' }
};

// Product configurations
const PRODUCTS = {
  tshirt: {
    product_id: 71, // Bella+Canvas 3001
    name_prefix: 'spaceorbust',
    retail_price: '29.99',
    colors: ['Black', 'Navy', 'Dark Grey Heather'],
    sizes: ['S', 'M', 'L', 'XL', '2XL']
  },
  hoodie: {
    product_id: 146, // Gildan 18500
    name_prefix: 'spaceorbust Hoodie',
    retail_price: '49.99',
    colors: ['Black', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', '2XL']
  },
  hat: {
    product_id: 506, // Dad hat (Otto Cap 18-1248)
    name_prefix: 'spaceorbust Cap',
    retail_price: '24.99',
    colors: ['Black', 'Navy'],
    sizes: null // One size
  },
  mug: {
    product_id: 19, // 11oz mug
    name_prefix: 'spaceorbust Mug',
    retail_price: '16.99',
    colors: ['White'],
    sizes: ['11oz']
  },
  sticker: {
    product_id: 358, // Kiss-cut stickers
    name_prefix: 'spaceorbust Sticker',
    retail_price: '4.99',
    colors: null,
    sizes: ['3×3']
  }
};

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'X-PF-Store-Id': STORE_ID,
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`API Error: ${data.error?.message || data.result}`);
  }
  return data.result;
}

async function getVariants(productId, colors, sizes) {
  console.log(`  Fetching variants for product ${productId}...`);
  const product = await apiCall(`/products/${productId}`);

  let variants = product.variants.filter(v => v.in_stock);

  if (colors) {
    variants = variants.filter(v => colors.includes(v.color));
  }
  if (sizes) {
    variants = variants.filter(v => sizes.includes(v.size));
  }

  return variants;
}

async function createProduct(productType, logoKey, logo) {
  const config = PRODUCTS[productType];
  const productName = `${config.name_prefix} - ${logoKey.replace('logo-', '').replace('-', ' ')}`;

  console.log(`Creating: ${productName}`);

  try {
    const variants = await getVariants(config.product_id, config.colors, config.sizes);

    if (variants.length === 0) {
      console.log(`  ⚠ No matching variants found, skipping`);
      return null;
    }

    // Build sync variants
    const syncVariants = variants.map(v => ({
      variant_id: v.id,
      retail_price: config.retail_price,
      files: [{
        type: 'default', // front print for apparel
        url: logo.url
      }]
    }));

    // Create the product
    const result = await apiCall('/store/products', 'POST', {
      sync_product: {
        name: productName,
        thumbnail: logo.url
      },
      sync_variants: syncVariants
    });

    console.log(`  ✓ Created: ${productName} (ID: ${result.id})`);
    return result;
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('========================================');
  console.log('spaceorbust Printful Product Setup');
  console.log('========================================\n');

  // Use just the main logos for products (not all 7 variants to avoid too many products)
  const mainLogos = ['logo-square', 'logo-square-split', 'logo-circle'];

  let created = 0;
  let failed = 0;

  // T-Shirts
  console.log('\n📦 Creating T-Shirts...');
  for (const logoKey of mainLogos) {
    const result = await createProduct('tshirt', logoKey, LOGOS[logoKey]);
    if (result) created++; else failed++;
    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }

  // Hoodies
  console.log('\n📦 Creating Hoodies...');
  for (const logoKey of mainLogos) {
    const result = await createProduct('hoodie', logoKey, LOGOS[logoKey]);
    if (result) created++; else failed++;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Hats
  console.log('\n📦 Creating Hats...');
  for (const logoKey of mainLogos) {
    const result = await createProduct('hat', logoKey, LOGOS[logoKey]);
    if (result) created++; else failed++;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Mugs
  console.log('\n📦 Creating Mugs...');
  for (const logoKey of mainLogos) {
    const result = await createProduct('mug', logoKey, LOGOS[logoKey]);
    if (result) created++; else failed++;
    await new Promise(r => setTimeout(r, 1000));
  }

  // Stickers
  console.log('\n📦 Creating Stickers...');
  for (const logoKey of mainLogos) {
    const result = await createProduct('sticker', logoKey, LOGOS[logoKey]);
    if (result) created++; else failed++;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n========================================');
  console.log(`Done! Created: ${created}, Failed: ${failed}`);
  console.log('View products at: https://space-or-bust.printful.me/');
  console.log('========================================');
}

main().catch(console.error);
