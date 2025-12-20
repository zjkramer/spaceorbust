#!/usr/bin/env node
/**
 * Convert SVG files to high-quality JPG for Printful
 * Adds black background since JPG doesn't support transparency
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'merch-designs');
const outputDir = path.join(inputDir, 'jpg');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all SVG files
const svgFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.svg'));

console.log(`Converting ${svgFiles.length} SVG files to JPG...`);

async function convertAll() {
  for (const svgFile of svgFiles) {
    const inputPath = path.join(inputDir, svgFile);
    const outputPath = path.join(outputDir, svgFile.replace('.svg', '.jpg'));

    try {
      const svgBuffer = fs.readFileSync(inputPath);

      await sharp(svgBuffer, { density: 300 })
        .flatten({ background: { r: 10, g: 10, b: 10 } }) // #0a0a0a black background
        .jpeg({ quality: 95 })
        .toFile(outputPath);

      console.log(`✓ ${svgFile} → ${path.basename(outputPath)}`);
    } catch (err) {
      console.error(`✗ ${svgFile}: ${err.message}`);
    }
  }

  console.log(`\nDone! JPGs saved to: ${outputDir}`);
}

convertAll();
