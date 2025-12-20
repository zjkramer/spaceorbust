#!/usr/bin/env node
/**
 * Download Fire Department Data from HIFLD (Homeland Infrastructure Foundation-Level Data)
 *
 * This script downloads fire station data from multiple sources:
 * 1. HIFLD ArcGIS Feature Service (primary)
 * 2. Backup: NASA NCCS mirror of HIFLD
 *
 * Data includes: station names, addresses, coordinates, department types, etc.
 * Used for programmatic SEO and fire weather integration.
 *
 * Created by Zachary Joseph Kramer + Claude
 * December 2025 | Flatland Expeditions LLC
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../data/fire-departments');
const BATCH_SIZE = 2000; // ArcGIS limit per request

// HIFLD Fire Stations Feature Service URL
// This is the authoritative source from DHS/FEMA
const ARCGIS_SERVICE = {
  base: 'https://services1.arcgis.com/Hp6G80Pky0om7QvQ/ArcGIS/rest/services',
  // Try multiple known service names
  serviceNames: [
    'Fire_Stations',
    'Fire_Station',
    'FireStations',
    'Fire_Stations_1',
    'HIFLD_Fire_Stations'
  ]
};

// Backup: NASA NCCS mirror
const NASA_MIRROR = 'https://maps.nccs.nasa.gov/mapping/rest/services/hifld_open/emergency_services/MapServer/0';

// Fields we want to retrieve
const FIELDS = [
  'OBJECTID',
  'NAME',        // Station name
  'ADDRESS',     // Street address
  'CITY',        // City
  'STATE',       // State abbreviation
  'ZIP',         // ZIP code
  'COUNTY',      // County name
  'FTYPE',       // Facility type
  'TELEPHONE',   // Phone number
  'NAESSION',    // NAICS code
  'LATITUDE',    // Lat
  'LONGITUDE',   // Lon
  'STATUS'       // Status
].join(',');

/**
 * Make an HTTPS request and return JSON
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    console.log(`  Fetching: ${url.substring(0, 100)}...`);

    const req = client.get(url, {
      headers: {
        'User-Agent': 'SpaceOrBust/1.0 (Fire Department SEO Tool)',
        'Accept': 'application/json'
      },
      timeout: 60000
    }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Try to find a working service endpoint
 */
async function findWorkingService() {
  console.log('\n🔍 Searching for HIFLD Fire Stations service...\n');

  // Try HIFLD services
  for (const serviceName of ARCGIS_SERVICE.serviceNames) {
    const url = `${ARCGIS_SERVICE.base}/${serviceName}/FeatureServer/0?f=json`;
    try {
      const info = await fetchJSON(url);
      if (info && info.name && !info.error) {
        console.log(`  ✓ Found service: ${serviceName}`);
        console.log(`    Name: ${info.name}`);
        console.log(`    Fields: ${info.fields?.length || 0}`);
        return {
          type: 'arcgis',
          name: serviceName,
          url: `${ARCGIS_SERVICE.base}/${serviceName}/FeatureServer/0`,
          info
        };
      }
    } catch (e) {
      console.log(`  ✗ ${serviceName}: ${e.message}`);
    }
  }

  // Try NASA mirror
  console.log('\n  Trying NASA NCCS mirror...');
  try {
    const info = await fetchJSON(`${NASA_MIRROR}?f=json`);
    if (info && info.name && !info.error) {
      console.log(`  ✓ Found NASA mirror: ${info.name}`);
      return {
        type: 'nasa',
        name: info.name,
        url: NASA_MIRROR,
        info
      };
    }
  } catch (e) {
    console.log(`  ✗ NASA mirror: ${e.message}`);
  }

  return null;
}

/**
 * Get total record count from service
 */
async function getRecordCount(serviceUrl) {
  const url = `${serviceUrl}/query?where=1=1&returnCountOnly=true&f=json`;
  const result = await fetchJSON(url);
  return result.count || 0;
}

/**
 * Query features in batches
 */
async function queryFeatures(serviceUrl, offset = 0, batchSize = BATCH_SIZE) {
  const url = `${serviceUrl}/query?` + [
    'where=1=1',
    `outFields=*`,
    'returnGeometry=true',
    'outSR=4326',
    `resultOffset=${offset}`,
    `resultRecordCount=${batchSize}`,
    'f=json'
  ].join('&');

  return fetchJSON(url);
}

/**
 * Download all fire station data
 */
async function downloadFireStations() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  HIFLD Fire Stations Data Downloader                     ║');
  console.log('║  Space or Bust - Ghost Army SEO Protocol                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  // Find working service
  const service = await findWorkingService();

  if (!service) {
    console.error('\n❌ Could not find a working fire stations service.');
    console.error('   The HIFLD services may be temporarily unavailable.');
    console.error('   Try again later or check https://hifld-geoplatform.opendata.arcgis.com/');
    process.exit(1);
  }

  // Get total count
  console.log('\n📊 Getting record count...');
  const totalCount = await getRecordCount(service.url);
  console.log(`   Total fire stations: ${totalCount.toLocaleString()}`);

  if (totalCount === 0) {
    console.error('❌ No records found. Service may be experiencing issues.');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Download in batches
  console.log('\n📥 Downloading fire station data...\n');

  const allFeatures = [];
  let offset = 0;
  let batchNum = 1;
  const totalBatches = Math.ceil(totalCount / BATCH_SIZE);

  while (offset < totalCount) {
    console.log(`   Batch ${batchNum}/${totalBatches} (records ${offset + 1} - ${Math.min(offset + BATCH_SIZE, totalCount)})`);

    try {
      const result = await queryFeatures(service.url, offset);

      if (result.error) {
        console.error(`   ❌ Error: ${result.error.message}`);
        break;
      }

      if (result.features && result.features.length > 0) {
        allFeatures.push(...result.features);
        console.log(`   ✓ Retrieved ${result.features.length} records`);
      } else {
        console.log('   ⚠ No features in response, stopping');
        break;
      }

      offset += BATCH_SIZE;
      batchNum++;

      // Small delay to be nice to the server
      await new Promise(r => setTimeout(r, 500));

    } catch (e) {
      console.error(`   ❌ Error fetching batch: ${e.message}`);
      break;
    }
  }

  console.log(`\n   Total downloaded: ${allFeatures.length.toLocaleString()} fire stations`);

  // Transform to simpler format
  console.log('\n🔄 Processing data...');

  const stations = allFeatures.map(f => {
    const props = f.attributes || {};
    const geo = f.geometry || {};

    return {
      id: props.OBJECTID,
      name: props.NAME || props.STATION_NAME || 'Unknown',
      address: props.ADDRESS || '',
      city: props.CITY || '',
      state: props.STATE || '',
      zip: props.ZIP || props.ZIP5 || '',
      county: props.COUNTY || '',
      type: props.FTYPE || props.STATION_TYPE || '',
      phone: props.TELEPHONE || '',
      latitude: geo.y || props.LATITUDE,
      longitude: geo.x || props.LONGITUDE,
      status: props.STATUS || 'OPEN'
    };
  });

  // Group by state for stats
  const byState = {};
  stations.forEach(s => {
    const state = s.state || 'UNKNOWN';
    byState[state] = (byState[state] || 0) + 1;
  });

  // Save files
  console.log('\n💾 Saving data files...');

  // Full JSON
  const jsonPath = path.join(OUTPUT_DIR, 'fire-stations.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    metadata: {
      source: 'HIFLD (Homeland Infrastructure Foundation-Level Data)',
      serviceUrl: service.url,
      downloadedAt: new Date().toISOString(),
      totalRecords: stations.length
    },
    stations
  }, null, 2));
  console.log(`   ✓ ${jsonPath}`);

  // CSV format
  const csvPath = path.join(OUTPUT_DIR, 'fire-stations.csv');
  const csvHeader = 'id,name,address,city,state,zip,county,type,phone,latitude,longitude,status';
  const csvRows = stations.map(s =>
    [s.id, s.name, s.address, s.city, s.state, s.zip, s.county, s.type, s.phone, s.latitude, s.longitude, s.status]
      .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'));
  console.log(`   ✓ ${csvPath}`);

  // State summary
  const statesPath = path.join(OUTPUT_DIR, 'states-summary.json');
  fs.writeFileSync(statesPath, JSON.stringify({
    states: Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .map(([state, count]) => ({ state, count }))
  }, null, 2));
  console.log(`   ✓ ${statesPath}`);

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Download Complete!                                      ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total Fire Stations: ${stations.length.toLocaleString().padEnd(35)}║`);
  console.log(`║  States Covered: ${Object.keys(byState).length.toString().padEnd(40)}║`);
  console.log('║                                                          ║');
  console.log('║  Top 5 States:                                           ║');
  Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([state, count]) => {
      console.log(`║    ${state}: ${count.toLocaleString().padEnd(48)}║`);
    });
  console.log('╚══════════════════════════════════════════════════════════╝');
}

// Run
downloadFireStations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
