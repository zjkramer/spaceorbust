/**
 * Convert Llama Mascot SVGs to PNGs for Stripe
 *
 * Stripe requires JPEG/PNG images, not SVG.
 * This script converts the llama mascots to high-quality PNGs.
 *
 * Usage: node scripts/convert-llamas-to-png.js
 * Requires: npm install sharp
 *
 * MIT License - Free forever. frack predatory private equity.
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Installing sharp for SVG to PNG conversion...');
  require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

const MASCOTS_DIR = path.join(__dirname, '../src/web/mascots');
const OUTPUT_DIR = MASCOTS_DIR; // Output to same directory

const LLAMAS = [
  'llama-tshirt',
  'llama-hoodie',
  'llama-cap'
];

async function convertToPng() {
  console.log('Converting llama mascot SVGs to PNGs for Stripe...\n');

  for (const llama of LLAMAS) {
    const svgPath = path.join(MASCOTS_DIR, `${llama}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `${llama}.png`);

    if (!fs.existsSync(svgPath)) {
      console.log(`✗ ${llama}.svg not found, skipping`);
      continue;
    }

    try {
      // Read SVG and convert to PNG at 800px width (good for Stripe)
      const svgContent = fs.readFileSync(svgPath);

      await sharp(svgContent)
        .resize(800, 800, {
          fit: 'contain',
          background: { r: 10, g: 10, b: 10, alpha: 1 } // Dark background matching site
        })
        .png({ quality: 90 })
        .toFile(pngPath);

      console.log(`✓ ${llama}.svg → ${llama}.png (800x800)`);
    } catch (err) {
      console.error(`✗ ${llama}: ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log('Done! PNG files created.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy to Vercel: cd ~/spaceorbust && vercel --prod');
  console.log('2. Verify PNGs at: https://spaceorbust.com/mascots/llama-tshirt.png');
  console.log('3. Run: node scripts/add-llama-images.js (with PNG URLs)');
  console.log('========================================');
}

convertToPng().catch(console.error);
