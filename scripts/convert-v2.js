#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'merch-designs', 'v2');
const outputDir = path.join(inputDir, 'jpg');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const svgFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.svg'));

async function convertAll() {
  for (const svgFile of svgFiles) {
    const inputPath = path.join(inputDir, svgFile);
    const outputPath = path.join(outputDir, svgFile.replace('.svg', '.jpg'));

    try {
      const svgBuffer = fs.readFileSync(inputPath);
      await sharp(svgBuffer, { density: 300 })
        .flatten({ background: { r: 10, g: 10, b: 10 } })
        .jpeg({ quality: 95 })
        .toFile(outputPath);
      console.log(`✓ ${svgFile} → ${path.basename(outputPath)}`);
    } catch (err) {
      console.error(`✗ ${svgFile}: ${err.message}`);
    }
  }
}

convertAll();
