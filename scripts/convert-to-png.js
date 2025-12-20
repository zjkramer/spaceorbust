#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'merch-designs', 'v2');
const outputDir = path.join(process.env.HOME, 'Desktop', 'spaceorbustPRJ', 'logos-spaceorbust-v1', 'logos-png');

const svgFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.svg'));

async function convertAll() {
  for (const svgFile of svgFiles) {
    const inputPath = path.join(inputDir, svgFile);
    const outputPath = path.join(outputDir, svgFile.replace('.svg', '.png'));

    try {
      const svgBuffer = fs.readFileSync(inputPath);
      await sharp(svgBuffer, { density: 300 })
        .png()
        .toFile(outputPath);
      console.log(`✓ ${svgFile} → ${path.basename(outputPath)}`);
    } catch (err) {
      console.error(`✗ ${svgFile}: ${err.message}`);
    }
  }
}

convertAll();
