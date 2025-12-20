#!/usr/bin/env node
/**
 * Generate Fire Department SEO Pages
 *
 * Creates individual HTML pages for each fire department in the registry.
 * Pages include:
 * - Department info (name, address, type)
 * - NWS fire weather zone data
 * - JSON-LD structured data for Google
 * - Links to dispatch protocol
 *
 * Ghost Army SEO Protocol - spaceorbust.com
 * Created by Zachary Joseph Kramer + Claude
 * December 2025 | Flatland Expeditions LLC
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '../data/fire-departments');
const OUTPUT_DIR = path.join(__dirname, '../src/web/fire-departments');
const TEMPLATE_VARS = {
  siteName: 'Space or Bust',
  siteUrl: 'https://spaceorbust.com',
  dispatchUrl: '/dispatch.html',
  year: new Date().getFullYear()
};

// State name mapping
const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia', 'PR': 'Puerto Rico', 'VI': 'Virgin Islands', 'GU': 'Guam'
};

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
 * Escape HTML entities
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate JSON-LD structured data for a fire station
 */
function generateJsonLd(station) {
  const stateName = STATE_NAMES[station.state] || station.state;

  return {
    '@context': 'https://schema.org',
    '@type': 'FireStation',
    name: station.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: station.address,
      addressLocality: station.city,
      addressRegion: station.state,
      postalCode: station.zip,
      addressCountry: 'US'
    },
    telephone: station.phone || undefined,
    geo: (station.latitude && station.longitude) ? {
      '@type': 'GeoCoordinates',
      latitude: station.latitude,
      longitude: station.longitude
    } : undefined,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: station.county ? `${station.county} County, ${stateName}` : `${station.city}, ${stateName}`
    },
    parentOrganization: {
      '@type': 'GovernmentOrganization',
      name: station.county ? `${station.county} County` : station.city
    }
  };
}

/**
 * Generate HTML page for a fire station
 */
function generateStationPage(station) {
  const stateName = STATE_NAMES[station.state] || station.state;
  const pageTitle = `${escapeHtml(station.name)} - ${escapeHtml(station.city)}, ${station.state}`;
  const jsonLd = generateJsonLd(station);

  // Clean up JSON-LD (remove undefined)
  Object.keys(jsonLd).forEach(key => jsonLd[key] === undefined && delete jsonLd[key]);
  if (jsonLd.address) Object.keys(jsonLd.address).forEach(key => jsonLd.address[key] === undefined && delete jsonLd.address[key]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle} | Free Dispatch Software | Space or Bust</title>
  <meta name="description" content="${escapeHtml(station.name)} in ${escapeHtml(station.city)}, ${stateName}. Free, open-source dispatch and CAD software for fire departments. No vendor lock-in.">
  <meta name="keywords" content="${escapeHtml(station.name)}, ${escapeHtml(station.city)} fire department, ${stateName} fire department, dispatch software, CAD software, free fire department software">

  <!-- Open Graph -->
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="Free dispatch and CAD software for ${escapeHtml(station.name)}. Open-source, forever free.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${TEMPLATE_VARS.siteUrl}/fire-departments/${station.state.toLowerCase()}/${slugify(station.name)}.html">

  <!-- Favicon -->
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚒</text></svg>">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>

  <style>
    :root {
      --bg: #0a0a0a;
      --bg-card: #111111;
      --border: #222222;
      --text: #e0e0e0;
      --text-dim: #888888;
      --accent: #00ff88;
      --fire: #ff6600;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }
    .header {
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .logo {
      font-size: 1.2rem;
      color: var(--accent);
      text-decoration: none;
      font-weight: bold;
    }
    .nav a {
      color: var(--text-dim);
      text-decoration: none;
      margin-left: 1.5rem;
    }
    .nav a:hover { color: var(--accent); }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
    .breadcrumb {
      color: var(--text-dim);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .breadcrumb a { color: var(--text-dim); text-decoration: none; }
    .breadcrumb a:hover { color: var(--accent); }
    h1 {
      font-size: 2rem;
      color: var(--text);
      margin-bottom: 0.5rem;
    }
    .location {
      color: var(--fire);
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      padding: 1.5rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
    }
    .card h2 {
      color: var(--accent);
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    .info-row {
      display: flex;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label {
      color: var(--text-dim);
      width: 120px;
      flex-shrink: 0;
    }
    .info-value { color: var(--text); }
    .cta {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(0,255,136,0.1), rgba(255,102,0,0.1));
      border: 1px solid var(--border);
      border-radius: 4px;
    }
    .cta h2 {
      color: var(--text);
      margin-bottom: 1rem;
    }
    .cta p {
      color: var(--text-dim);
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: var(--accent);
      color: var(--bg);
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 0.25rem;
    }
    .btn:hover { opacity: 0.9; }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
    }
    .footer {
      text-align: center;
      padding: 2rem;
      color: var(--text-dim);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
      margin-top: 3rem;
    }
    .footer a { color: var(--accent); text-decoration: none; }
    .weather-zone {
      padding: 1rem;
      background: rgba(255,102,0,0.1);
      border-left: 3px solid var(--fire);
      margin-top: 1rem;
    }
    @media (max-width: 600px) {
      .info-row { flex-direction: column; }
      .info-label { width: auto; margin-bottom: 0.25rem; }
    }
  </style>
</head>
<body>
  <header class="header">
    <a href="/" class="logo">🚀 Space or Bust</a>
    <nav class="nav">
      <a href="/">Home</a>
      <a href="/dispatch.html">Dispatch Protocol</a>
      <a href="/store.html">Store</a>
    </nav>
  </header>

  <main class="container">
    <div class="breadcrumb">
      <a href="/">Home</a> &gt;
      <a href="/fire-departments/">Fire Departments</a> &gt;
      <a href="/fire-departments/${station.state.toLowerCase()}/">${stateName}</a> &gt;
      ${escapeHtml(station.name)}
    </div>

    <h1>${escapeHtml(station.name)}</h1>
    <p class="location">📍 ${escapeHtml(station.city)}, ${stateName}${station.county ? ` (${escapeHtml(station.county)} County)` : ''}</p>

    <div class="card">
      <h2>Station Information</h2>
      <div class="info-row">
        <span class="info-label">Address</span>
        <span class="info-value">${escapeHtml(station.address) || 'Not available'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">City</span>
        <span class="info-value">${escapeHtml(station.city)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">State</span>
        <span class="info-value">${stateName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">ZIP Code</span>
        <span class="info-value">${station.zip || 'Not available'}</span>
      </div>
      ${station.county ? `<div class="info-row">
        <span class="info-label">County</span>
        <span class="info-value">${escapeHtml(station.county)}</span>
      </div>` : ''}
      ${station.phone ? `<div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value"><a href="tel:${station.phone}" style="color:var(--accent)">${station.phone}</a></span>
      </div>` : ''}
      ${station.type ? `<div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">${escapeHtml(station.type)}</span>
      </div>` : ''}
    </div>

    <div class="card">
      <h2>Fire Weather Integration</h2>
      <p style="color:var(--text-dim);margin-bottom:1rem;">
        Our dispatch software integrates with the National Weather Service to provide
        real-time fire weather alerts for your area.
      </p>
      <div class="weather-zone">
        <strong style="color:var(--fire);">🔥 Fire Weather Zone</strong><br>
        <span style="color:var(--text-dim);">
          Coordinates: ${station.latitude?.toFixed(4) || 'N/A'}, ${station.longitude?.toFixed(4) || 'N/A'}<br>
          Red Flag Warnings and Fire Weather Watches are automatically displayed.
        </span>
      </div>
    </div>

    <div class="cta">
      <h2>Free Dispatch Software for ${escapeHtml(station.name)}</h2>
      <p>
        Open-source, forever free. No vendor lock-in, no predatory pricing.
        Built by firefighters, for firefighters.
      </p>
      <a href="/dispatch.html" class="btn">Try Dispatch Protocol</a>
      <a href="https://github.com/zjkramer/spaceorbust" class="btn btn-outline">View on GitHub</a>
    </div>
  </main>

  <footer class="footer">
    <p>
      Data source: <a href="https://hifld-geoplatform.opendata.arcgis.com/">HIFLD Open Data</a> |
      <a href="https://www.usfa.fema.gov/">U.S. Fire Administration</a>
    </p>
    <p style="margin-top:0.5rem;">
      © ${TEMPLATE_VARS.year} <a href="/">Space or Bust</a> |
      <a href="https://flatlandexpeditions.com">Flatland Expeditions LLC</a>
    </p>
  </footer>
</body>
</html>`;
}

/**
 * Generate state index page
 */
function generateStateIndex(state, stations) {
  const stateName = STATE_NAMES[state] || state;
  const sortedStations = stations.sort((a, b) => (a.city || '').localeCompare(b.city || ''));

  // Group by city
  const byCity = {};
  sortedStations.forEach(s => {
    const city = s.city || 'Unknown';
    if (!byCity[city]) byCity[city] = [];
    byCity[city].push(s);
  });

  const cityList = Object.entries(byCity)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([city, stns]) => {
      const stationLinks = stns.map(s =>
        `<li><a href="${slugify(s.name)}.html">${escapeHtml(s.name)}</a></li>`
      ).join('\n            ');
      return `
        <div class="city-section">
          <h3>${escapeHtml(city)}</h3>
          <ul>
            ${stationLinks}
          </ul>
        </div>`;
    }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${stateName} Fire Departments | Free Dispatch Software | Space or Bust</title>
  <meta name="description" content="Free dispatch and CAD software for ${stations.length} fire departments in ${stateName}. Open-source, no vendor lock-in.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚒</text></svg>">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --bg-card: #111111;
      --border: #222222;
      --text: #e0e0e0;
      --text-dim: #888888;
      --accent: #00ff88;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .header {
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-size: 1.2rem; color: var(--accent); text-decoration: none; font-weight: bold; }
    .nav a { color: var(--text-dim); text-decoration: none; margin-left: 1.5rem; }
    .nav a:hover { color: var(--accent); }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    .breadcrumb { color: var(--text-dim); font-size: 0.85rem; margin-bottom: 1.5rem; }
    .breadcrumb a { color: var(--text-dim); text-decoration: none; }
    .breadcrumb a:hover { color: var(--accent); }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .count { color: var(--accent); margin-bottom: 2rem; }
    .city-section { margin-bottom: 2rem; }
    .city-section h3 { color: var(--accent); margin-bottom: 0.5rem; font-size: 1.1rem; }
    .city-section ul { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.5rem; }
    .city-section li { padding: 0.25rem 0; }
    .city-section a { color: var(--text); text-decoration: none; }
    .city-section a:hover { color: var(--accent); }
    .footer { text-align: center; padding: 2rem; color: var(--text-dim); border-top: 1px solid var(--border); margin-top: 3rem; }
    .footer a { color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>
  <header class="header">
    <a href="/" class="logo">🚀 Space or Bust</a>
    <nav class="nav">
      <a href="/">Home</a>
      <a href="/dispatch.html">Dispatch Protocol</a>
      <a href="/store.html">Store</a>
    </nav>
  </header>
  <main class="container">
    <div class="breadcrumb">
      <a href="/">Home</a> &gt;
      <a href="/fire-departments/">Fire Departments</a> &gt;
      ${stateName}
    </div>
    <h1>🚒 ${stateName} Fire Departments</h1>
    <p class="count">${stations.length.toLocaleString()} departments registered</p>
    ${cityList}
  </main>
  <footer class="footer">
    <p>© ${TEMPLATE_VARS.year} <a href="/">Space or Bust</a> | <a href="https://flatlandexpeditions.com">Flatland Expeditions LLC</a></p>
  </footer>
</body>
</html>`;
}

/**
 * Main index page for all fire departments
 */
function generateMainIndex(stateStats) {
  const stateLinks = stateStats
    .sort((a, b) => a.state.localeCompare(b.state))
    .map(s => {
      const stateName = STATE_NAMES[s.state] || s.state;
      return `<a href="${s.state.toLowerCase()}/" class="state-link">
        <span class="state-name">${stateName}</span>
        <span class="state-count">${s.count.toLocaleString()}</span>
      </a>`;
    }).join('\n      ');

  const totalDepts = stateStats.reduce((sum, s) => sum + s.count, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fire Departments Directory | Free Dispatch Software | Space or Bust</title>
  <meta name="description" content="Free dispatch and CAD software for ${totalDepts.toLocaleString()} fire departments across all 50 states. Open-source, forever free.">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚒</text></svg>">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --bg-card: #111111;
      --border: #222222;
      --text: #e0e0e0;
      --text-dim: #888888;
      --accent: #00ff88;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .header {
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { font-size: 1.2rem; color: var(--accent); text-decoration: none; font-weight: bold; }
    .nav a { color: var(--text-dim); text-decoration: none; margin-left: 1.5rem; }
    .nav a:hover { color: var(--accent); }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .subtitle { color: var(--accent); font-size: 1.2rem; margin-bottom: 2rem; }
    .states-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .state-link {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      text-decoration: none;
      color: var(--text);
      transition: border-color 0.2s;
    }
    .state-link:hover { border-color: var(--accent); }
    .state-count { color: var(--accent); }
    .footer { text-align: center; padding: 2rem; color: var(--text-dim); border-top: 1px solid var(--border); margin-top: 3rem; }
    .footer a { color: var(--accent); text-decoration: none; }
  </style>
</head>
<body>
  <header class="header">
    <a href="/" class="logo">🚀 Space or Bust</a>
    <nav class="nav">
      <a href="/">Home</a>
      <a href="/dispatch.html">Dispatch Protocol</a>
      <a href="/store.html">Store</a>
    </nav>
  </header>
  <main class="container">
    <h1>🚒 Fire Departments Directory</h1>
    <p class="subtitle">${totalDepts.toLocaleString()} departments across ${stateStats.length} states</p>
    <div class="states-grid">
      ${stateLinks}
    </div>
  </main>
  <footer class="footer">
    <p>Data source: <a href="https://hifld-geoplatform.opendata.arcgis.com/">HIFLD Open Data</a></p>
    <p>© ${TEMPLATE_VARS.year} <a href="/">Space or Bust</a> | <a href="https://flatlandexpeditions.com">Flatland Expeditions LLC</a></p>
  </footer>
</body>
</html>`;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Fire Department SEO Page Generator                      ║');
  console.log('║  Ghost Army Protocol - spaceorbust.com                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Load data
  const dataPath = path.join(DATA_DIR, 'fire-stations.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ Fire station data not found!');
    console.error('   Run download-fire-data.js first.');
    process.exit(1);
  }

  console.log('📂 Loading fire station data...');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const stations = data.stations;
  console.log(`   Loaded ${stations.length.toLocaleString()} stations\n`);

  // Group by state
  const byState = {};
  stations.forEach(s => {
    const state = (s.state || 'XX').toUpperCase();
    if (!byState[state]) byState[state] = [];
    byState[state].push(s);
  });

  const stateStats = Object.entries(byState).map(([state, stns]) => ({
    state,
    count: stns.length
  }));

  console.log(`📊 States: ${stateStats.length}`);
  console.log(`   Top 5: ${stateStats.sort((a,b) => b.count - a.count).slice(0,5).map(s => `${s.state}(${s.count})`).join(', ')}\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate main index
  console.log('📄 Generating main index...');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.html'),
    generateMainIndex(stateStats)
  );

  // Generate state pages
  let totalPages = 1; // main index
  const states = Object.keys(byState).sort();

  for (const state of states) {
    const stateDir = path.join(OUTPUT_DIR, state.toLowerCase());
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    const stateStations = byState[state];
    console.log(`📄 ${state}: ${stateStations.length} departments...`);

    // State index
    fs.writeFileSync(
      path.join(stateDir, 'index.html'),
      generateStateIndex(state, stateStations)
    );
    totalPages++;

    // Individual station pages
    for (const station of stateStations) {
      const filename = `${slugify(station.name)}.html`;
      fs.writeFileSync(
        path.join(stateDir, filename),
        generateStationPage(station)
      );
      totalPages++;
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Generation Complete!                                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total Pages Generated: ${totalPages.toLocaleString().padEnd(33)}║`);
  console.log(`║  States: ${states.length.toString().padEnd(48)}║`);
  console.log(`║  Output: ${OUTPUT_DIR.substring(0, 46).padEnd(48)}║`);
  console.log('╚══════════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
