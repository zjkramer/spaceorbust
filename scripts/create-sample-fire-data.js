#!/usr/bin/env node
/**
 * Sample Fire Department Data Generator
 *
 * Creates sample data for testing. Replace with production data.
 *
 * Created by Zachary Joseph Kramer + Claude
 * December 2025 | Flatland Expeditions LLC
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../data/fire-departments');

// Sample cities by state - representative sample for testing
const SAMPLE_DATA = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
  CA: ['Los Angeles', 'San Diego', 'San Francisco', 'San Jose', 'Sacramento', 'Oakland', 'Fresno', 'Long Beach'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder'],
  CT: ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Waterbury'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna'],
  FL: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Tallahassee'],
  GA: ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens'],
  HI: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Rockford', 'Joliet', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn'],
  MD: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg', 'Bowie'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington'],
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Independence', 'Columbia', 'Lee\'s Summit'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Dover'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell'],
  NY: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Lawton'],
  OR: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Bend'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Erie', 'Scranton'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence'],
  SC: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Plano'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem'],
  VT: ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent'],
  WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs'],
  DC: ['Washington']
};

// Fire department naming patterns
const DEPT_PATTERNS = [
  '{city} Fire Department',
  '{city} Fire-Rescue',
  '{city} Fire District',
  '{city} Volunteer Fire Department',
  '{city} Fire Protection District'
];

// Station types
const STATION_TYPES = ['Career', 'Volunteer', 'Combination', 'Paid'];

/**
 * Generate random coordinates within US bounds
 */
function randomCoords(state) {
  // Approximate bounding boxes for states (simplified)
  const stateBounds = {
    AL: { lat: [30.2, 35.0], lon: [-88.5, -84.9] },
    AK: { lat: [54.0, 71.4], lon: [-179.1, -129.9] },
    AZ: { lat: [31.3, 37.0], lon: [-114.8, -109.0] },
    AR: { lat: [33.0, 36.5], lon: [-94.6, -89.6] },
    CA: { lat: [32.5, 42.0], lon: [-124.4, -114.1] },
    CO: { lat: [37.0, 41.0], lon: [-109.0, -102.0] },
    CT: { lat: [41.0, 42.1], lon: [-73.7, -71.8] },
    DE: { lat: [38.4, 39.8], lon: [-75.8, -75.0] },
    FL: { lat: [24.5, 31.0], lon: [-87.6, -80.0] },
    GA: { lat: [30.4, 35.0], lon: [-85.6, -80.8] },
    HI: { lat: [18.9, 22.2], lon: [-160.2, -154.8] },
    ID: { lat: [42.0, 49.0], lon: [-117.2, -111.0] },
    IL: { lat: [36.9, 42.5], lon: [-91.5, -87.0] },
    IN: { lat: [37.8, 41.8], lon: [-88.1, -84.8] },
    IA: { lat: [40.4, 43.5], lon: [-96.6, -90.1] },
    KS: { lat: [37.0, 40.0], lon: [-102.1, -94.6] },
    KY: { lat: [36.5, 39.1], lon: [-89.6, -82.0] },
    LA: { lat: [29.0, 33.0], lon: [-94.0, -89.0] },
    ME: { lat: [43.0, 47.5], lon: [-71.1, -66.9] },
    MD: { lat: [37.9, 39.7], lon: [-79.5, -75.0] },
    MA: { lat: [41.2, 42.9], lon: [-73.5, -69.9] },
    MI: { lat: [41.7, 48.3], lon: [-90.4, -82.1] },
    MN: { lat: [43.5, 49.4], lon: [-97.2, -89.5] },
    MS: { lat: [30.2, 35.0], lon: [-91.7, -88.1] },
    MO: { lat: [36.0, 40.6], lon: [-95.8, -89.1] },
    MT: { lat: [44.4, 49.0], lon: [-116.0, -104.0] },
    NE: { lat: [40.0, 43.0], lon: [-104.1, -95.3] },
    NV: { lat: [35.0, 42.0], lon: [-120.0, -114.0] },
    NH: { lat: [42.7, 45.3], lon: [-72.6, -70.7] },
    NJ: { lat: [38.9, 41.4], lon: [-75.6, -73.9] },
    NM: { lat: [31.3, 37.0], lon: [-109.0, -103.0] },
    NY: { lat: [40.5, 45.0], lon: [-79.8, -71.9] },
    NC: { lat: [33.8, 36.6], lon: [-84.3, -75.5] },
    ND: { lat: [45.9, 49.0], lon: [-104.0, -96.6] },
    OH: { lat: [38.4, 42.0], lon: [-84.8, -80.5] },
    OK: { lat: [33.6, 37.0], lon: [-103.0, -94.4] },
    OR: { lat: [42.0, 46.3], lon: [-124.6, -116.5] },
    PA: { lat: [39.7, 42.3], lon: [-80.5, -74.7] },
    RI: { lat: [41.1, 42.0], lon: [-71.9, -71.1] },
    SC: { lat: [32.0, 35.2], lon: [-83.4, -78.5] },
    SD: { lat: [42.5, 45.9], lon: [-104.1, -96.4] },
    TN: { lat: [35.0, 36.7], lon: [-90.3, -81.6] },
    TX: { lat: [25.8, 36.5], lon: [-106.6, -93.5] },
    UT: { lat: [37.0, 42.0], lon: [-114.1, -109.0] },
    VT: { lat: [42.7, 45.0], lon: [-73.4, -71.5] },
    VA: { lat: [36.5, 39.5], lon: [-83.7, -75.2] },
    WA: { lat: [45.5, 49.0], lon: [-124.8, -116.9] },
    WV: { lat: [37.2, 40.6], lon: [-82.6, -77.7] },
    WI: { lat: [42.5, 47.1], lon: [-92.9, -86.8] },
    WY: { lat: [41.0, 45.0], lon: [-111.1, -104.1] },
    DC: { lat: [38.8, 39.0], lon: [-77.1, -76.9] }
  };

  const bounds = stateBounds[state] || { lat: [30, 45], lon: [-120, -75] };
  const lat = bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0]);
  const lon = bounds.lon[0] + Math.random() * (bounds.lon[1] - bounds.lon[0]);

  return { lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) };
}

/**
 * Generate sample stations for a city
 */
function generateCityStations(city, state, startId) {
  const stations = [];
  const numStations = Math.ceil(Math.random() * 3); // 1-3 stations per city

  for (let i = 0; i < numStations; i++) {
    const pattern = DEPT_PATTERNS[Math.floor(Math.random() * DEPT_PATTERNS.length)];
    const name = pattern.replace('{city}', city);
    const coords = randomCoords(state);
    const stationType = STATION_TYPES[Math.floor(Math.random() * STATION_TYPES.length)];

    stations.push({
      id: startId + i,
      name: i === 0 ? name : `${name} - Station ${i + 1}`,
      address: `${100 + Math.floor(Math.random() * 9900)} Main Street`,
      city,
      state,
      zip: String(10000 + Math.floor(Math.random() * 89999)),
      county: `${city} County`,
      type: stationType,
      phone: '',
      latitude: coords.lat,
      longitude: coords.lon,
      status: 'OPEN'
    });
  }

  return stations;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Sample Fire Department Data Generator                   ║');
  console.log('║  For testing - replace with HIFLD data in production     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate stations
  console.log('🔨 Generating sample fire stations...\n');

  const allStations = [];
  let currentId = 1;
  const byState = {};

  for (const [state, cities] of Object.entries(SAMPLE_DATA)) {
    byState[state] = 0;

    for (const city of cities) {
      const stations = generateCityStations(city, state, currentId);
      allStations.push(...stations);
      currentId += stations.length;
      byState[state] += stations.length;
    }

    console.log(`   ${state}: ${byState[state]} stations`);
  }

  console.log(`\n   Total: ${allStations.length} sample stations\n`);

  // Save data
  console.log('💾 Saving data files...');

  // Full JSON
  const jsonPath = path.join(OUTPUT_DIR, 'fire-stations.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    metadata: {
      source: 'SAMPLE DATA - Replace with HIFLD for production',
      note: 'This is sample data for testing the SEO page generator',
      downloadedAt: new Date().toISOString(),
      totalRecords: allStations.length
    },
    stations: allStations
  }, null, 2));
  console.log(`   ✓ ${jsonPath}`);

  // CSV format
  const csvPath = path.join(OUTPUT_DIR, 'fire-stations.csv');
  const csvHeader = 'id,name,address,city,state,zip,county,type,phone,latitude,longitude,status';
  const csvRows = allStations.map(s =>
    [s.id, s.name, s.address, s.city, s.state, s.zip, s.county, s.type, s.phone, s.latitude, s.longitude, s.status]
      .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'));
  console.log(`   ✓ ${csvPath}`);

  // State summary
  const stateStats = Object.entries(byState)
    .sort((a, b) => b[1] - a[1])
    .map(([state, count]) => ({ state, count }));

  const statesPath = path.join(OUTPUT_DIR, 'states-summary.json');
  fs.writeFileSync(statesPath, JSON.stringify({ states: stateStats }, null, 2));
  console.log(`   ✓ ${statesPath}`);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Sample Data Generated!                                  ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log(`║  Total Stations: ${allStations.length.toString().padEnd(40)}║`);
  console.log(`║  States: ${Object.keys(byState).length.toString().padEnd(48)}║`);
  console.log('║                                                          ║');
  console.log('║  NOTE: Replace with real HIFLD data for production!      ║');
  console.log('║  Visit: https://hifld-geoplatform.opendata.arcgis.com    ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
