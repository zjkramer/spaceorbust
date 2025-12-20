#!/usr/bin/env node
/**
 * Generate Sitemap for spaceorbust.com
 *
 * Creates sitemap.xml and robots.txt for SEO.
 * Includes all fire department pages for the Ghost Army Protocol.
 *
 * Created by Zachary Joseph Kramer + Claude
 * December 2025 | Flatland Expeditions LLC
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/fire-departments');
const WEB_DIR = path.join(__dirname, '../src/web');
const SITE_URL = 'https://spaceorbust.com';

/**
 * Create URL-safe slug from text
 */
function slugify(text) {
  return (text || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

/**
 * Generate sitemap XML
 */
function generateSitemap(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const footer = `</urlset>`;

  const entries = urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${url.changefreq || 'monthly'}</changefreq>
    <priority>${url.priority || '0.5'}</priority>
  </url>`).join('\n');

  return `${header}\n${entries}\n${footer}`;
}

/**
 * Generate sitemap index for large sitemaps
 */
function generateSitemapIndex(sitemaps) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const footer = `</sitemapindex>`;

  const entries = sitemaps.map(sm => `  <sitemap>
    <loc>${sm.loc}</loc>
    <lastmod>${sm.lastmod}</lastmod>
  </sitemap>`).join('\n');

  return `${header}\n${entries}\n${footer}`;
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt() {
  return `# robots.txt for spaceorbust.com
# Ghost Army SEO Protocol

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/sitemap-fire-departments.xml

# Crawl-delay (be nice to the server)
Crawl-delay: 1
`;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Sitemap Generator - Ghost Army SEO Protocol             ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const today = new Date().toISOString().split('T')[0];

  // Main site pages
  const mainPages = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/dispatch.html`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${SITE_URL}/store.html`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${SITE_URL}/fire-departments/`, priority: '0.9', changefreq: 'weekly' }
  ];

  // Load fire department data
  const dataPath = path.join(DATA_DIR, 'fire-stations.json');
  let fireUrls = [];

  if (fs.existsSync(dataPath)) {
    console.log('📂 Loading fire station data...');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const stations = data.stations;
    console.log(`   Found ${stations.length.toLocaleString()} stations\n`);

    // Group by state
    const byState = {};
    stations.forEach(s => {
      const state = (s.state || 'XX').toUpperCase();
      if (!byState[state]) byState[state] = [];
      byState[state].push(s);
    });

    // Add state index pages
    Object.keys(byState).forEach(state => {
      fireUrls.push({
        loc: `${SITE_URL}/fire-departments/${state.toLowerCase()}/`,
        priority: '0.7',
        changefreq: 'weekly'
      });

      // Add individual station pages
      byState[state].forEach(station => {
        fireUrls.push({
          loc: `${SITE_URL}/fire-departments/${state.toLowerCase()}/${slugify(station.name)}.html`,
          priority: '0.6',
          changefreq: 'monthly'
        });
      });
    });

    console.log(`   Generated ${fireUrls.length.toLocaleString()} fire department URLs\n`);
  } else {
    console.log('⚠ Fire station data not found, skipping fire department URLs\n');
  }

  // Generate main sitemap (core pages only)
  console.log('📄 Generating main sitemap...');
  const mainSitemap = generateSitemap(mainPages.map(p => ({ ...p, lastmod: today })));
  fs.writeFileSync(path.join(WEB_DIR, 'sitemap.xml'), mainSitemap);
  console.log(`   ✓ sitemap.xml (${mainPages.length} URLs)\n`);

  // Generate fire department sitemap
  if (fireUrls.length > 0) {
    console.log('📄 Generating fire department sitemap...');

    // Split into multiple sitemaps if > 50k URLs
    const CHUNK_SIZE = 45000;

    if (fireUrls.length > CHUNK_SIZE) {
      const sitemapFiles = [];

      for (let i = 0; i < fireUrls.length; i += CHUNK_SIZE) {
        const chunk = fireUrls.slice(i, i + CHUNK_SIZE);
        const fileNum = Math.floor(i / CHUNK_SIZE) + 1;
        const filename = `sitemap-fire-departments-${fileNum}.xml`;

        const sitemap = generateSitemap(chunk.map(p => ({ ...p, lastmod: today })));
        fs.writeFileSync(path.join(WEB_DIR, filename), sitemap);

        sitemapFiles.push({
          loc: `${SITE_URL}/${filename}`,
          lastmod: today
        });

        console.log(`   ✓ ${filename} (${chunk.length.toLocaleString()} URLs)`);
      }

      // Generate index
      const indexContent = generateSitemapIndex(sitemapFiles);
      fs.writeFileSync(path.join(WEB_DIR, 'sitemap-fire-departments.xml'), indexContent);
      console.log(`   ✓ sitemap-fire-departments.xml (index of ${sitemapFiles.length} sitemaps)`);

    } else {
      const sitemap = generateSitemap(fireUrls.map(p => ({ ...p, lastmod: today })));
      fs.writeFileSync(path.join(WEB_DIR, 'sitemap-fire-departments.xml'), sitemap);
      console.log(`   ✓ sitemap-fire-departments.xml (${fireUrls.length.toLocaleString()} URLs)`);
    }
  }

  // Generate robots.txt
  console.log('\n📄 Generating robots.txt...');
  fs.writeFileSync(path.join(WEB_DIR, 'robots.txt'), generateRobotsTxt());
  console.log('   ✓ robots.txt');

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Sitemap Generation Complete!                            ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Main Pages: ${mainPages.length.toString().padEnd(44)}║`);
  console.log(`║  Fire Department Pages: ${fireUrls.length.toLocaleString().padEnd(33)}║`);
  console.log(`║  Total URLs: ${(mainPages.length + fireUrls.length).toLocaleString().padEnd(44)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
