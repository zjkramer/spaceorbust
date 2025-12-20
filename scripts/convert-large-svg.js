#!/usr/bin/env node
/**
 * Convert large SVG files with reduced density
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'merch-designs');
const outputDir = path.join(inputDir, 'jpg');

const largeFiles = ['printful-logo-hoodie.svg', 'printful-logo-tshirt.svg'];

async function convertLarge() {
  for (const svgFile of largeFiles) {
    const inputPath = path.join(inputDir, svgFile);
    const outputPath = path.join(outputDir, svgFile.replace('.svg', '.jpg'));

    try {
      const svgBuffer = fs.readFileSync(inputPath);

      await sharp(svgBuffer, { density: 150 }) // Lower density for large files
        .flatten({ background: { r: 10, g: 10, b: 10 } })
        .jpeg({ quality: 95 })
        .toFile(outputPath);

      console.log(`✓ ${svgFile} → ${path.basename(outputPath)}`);
    } catch (err) {
      console.error(`✗ ${svgFile}: ${err.message}`);
    }
  }
}

convertLarge();
