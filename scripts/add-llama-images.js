/**
 * Add Llama Mascot Images to Stripe Products
 *
 * Maps each product to its corresponding llama mascot SVG
 *
 * MIT License - Free forever. frack predatory private equity.
 */

const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Llama mascot image URLs (deployed on spaceorbust.com)
// Note: Stripe requires PNG/JPEG, not SVG
const LLAMA_IMAGES = {
  tshirt: 'https://spaceorbust.com/mascots/llama-tshirt.png',
  hoodie: 'https://spaceorbust.com/mascots/llama-hoodie.png',
  cap: 'https://spaceorbust.com/mascots/llama-cap.png'
};

// Product name to llama type mapping
function getLlamaType(productName) {
  const name = productName.toLowerCase();
  if (name.includes('hoodie') || name.includes('sweatshirt')) return 'hoodie';
  if (name.includes('cap') || name.includes('hat')) return 'cap';
  if (name.includes('shirt') || name.includes('tee') || name.includes('t-shirt')) return 'tshirt';
  return 'tshirt'; // Default to t-shirt llama
}

async function addLlamaImages() {
  console.log('Adding llama mascot images to Stripe products...\n');

  try {
    // Get all products
    const products = await stripe.products.list({ limit: 100, active: true });
    console.log(`Found ${products.data.length} active products\n`);

    let updated = 0;
    let skipped = 0;

    for (const product of products.data) {
      const llamaType = getLlamaType(product.name);
      const llamaUrl = LLAMA_IMAGES[llamaType];

      // Check if product already has this image
      if (product.images && product.images.includes(llamaUrl)) {
        console.log(`✓ ${product.name} - Already has llama image`);
        skipped++;
        continue;
      }

      // Add llama image (prepend so it shows first)
      const newImages = [llamaUrl, ...(product.images || [])];

      try {
        await stripe.products.update(product.id, {
          images: newImages.slice(0, 8) // Stripe max 8 images
        });
        console.log(`✓ ${product.name} - Added ${llamaType} llama`);
        updated++;
      } catch (err) {
        console.error(`✗ ${product.name} - Error: ${err.message}`);
      }
    }

    console.log(`\n========================================`);
    console.log(`Updated: ${updated} products`);
    console.log(`Skipped: ${skipped} products (already had images)`);
    console.log(`========================================`);
    console.log('\nLlama mascots now appear in Stripe checkout!');

  } catch (error) {
    console.error('Failed to update products:', error.message);
    process.exit(1);
  }
}

addLlamaImages();
