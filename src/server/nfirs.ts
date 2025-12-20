/**
 * NFIRS (National Fire Incident Reporting System) Export
 * Generates NFIRS-compliant data for federal fire reporting
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 *
 * Reference: https://www.usfa.fema.gov/nfirs/
 */

import { DispatchDatabase } from './database';

// NFIRS Incident Type Codes (Module 1 - Basic)
export const NFIRS_INCIDENT_TYPES: Record<string, string> = {
  // 100 Series - Fire
  '111': 'Building fire',
  '112': 'Fires in structure other than in a building',
  '113': 'Cooking fire, confined to container',
  '114': 'Chimney or flue fire, confined to chimney or flue',
  '115': 'Incinerator overload or malfunction, fire confined',
  '116': 'Fuel burner/boiler malfunction, fire confined',
  '117': 'Commercial compactor fire, confined to rubbish',
  '118': 'Trash or rubbish fire, contained',
  '120': 'Fire in mobile property used as a fixed structure',
  '121': 'Fire in mobile home used as fixed residence',
  '122': 'Fire in motor home, camper, recreational vehicle',
  '123': 'Fire in portable building, fixed location',
  '130': 'Mobile property (vehicle) fire',
  '131': 'Passenger vehicle fire',
  '132': 'Road freight or transport vehicle fire',
  '140': 'Natural vegetation fire',
  '141': 'Forest, woods or wildland fire',
  '142': 'Brush or brush-and-grass mixture fire',
  '143': 'Grass fire',
  '150': 'Outside rubbish fire',
  '151': 'Outside rubbish, trash or waste fire',
  '152': 'Garbage dump or sanitary landfill fire',
  '154': 'Dumpster or other outside trash receptacle fire',
  '160': 'Special outside fire',
  '161': 'Outside storage fire',
  '162': 'Outside equipment fire',
  '164': 'Outside mailbox fire',

  // 300 Series - Rescue & EMS
  '311': 'Medical assist, assist EMS crew',
  '320': 'Emergency medical service (EMS) incident',
  '321': 'EMS call, excluding vehicle accident with injury',
  '322': 'Motor vehicle accident with injuries',
  '323': 'Motor vehicle/pedestrian accident',
  '324': 'Motor vehicle accident with no injuries',
  '331': 'Lock-in',
  '340': 'Search',
  '341': 'Search for person on land',
  '342': 'Search for person in water',
  '350': 'Extrication, rescue',
  '351': 'Extrication of victim(s) from building/structure',
  '352': 'Extrication of victim(s) from vehicle',
  '353': 'Removal of victim(s) from stalled elevator',
  '360': 'Water rescue',
  '361': 'Swimming/recreational water areas rescue',
  '363': 'Swift water rescue',
  '365': 'Watercraft rescue',
  '370': 'Electrical rescue',
  '371': 'Electrocution or potential electrocution',
  '372': 'Trapped by power lines',
  '381': 'Rescue or EMS standby',

  // 400 Series - Hazardous Condition
  '400': 'Hazardous condition, other',
  '410': 'Combustible/flammable gas/liquid spill/leak',
  '411': 'Gasoline or other flammable liquid spill',
  '412': 'Gas leak (natural gas or LPG)',
  '413': 'Oil or other combustible liquid spill',
  '420': 'Toxic condition',
  '421': 'Chemical hazard (no spill or leak)',
  '422': 'Chemical spill or leak',
  '424': 'Carbon monoxide incident',
  '440': 'Electrical wiring/equipment problem',
  '441': 'Heat from short circuit (wiring)',
  '442': 'Overheated motor',
  '443': 'Breakdown of light ballast',
  '444': 'Power line down',
  '445': 'Arcing, shorted electrical equipment',
  '460': 'Accident, potential accident',
  '461': 'Building or structure weakened or collapsed',
  '462': 'Aircraft standby',
  '463': 'Vehicle accident, general cleanup',

  // 500 Series - Service Call
  '500': 'Service call, other',
  '510': 'Person in distress',
  '511': 'Lock-out',
  '512': 'Ring or jewelry removal',
  '520': 'Water problem',
  '521': 'Water evacuation',
  '522': 'Water or steam leak',
  '531': 'Smoke or odor removal',
  '540': 'Animal problem',
  '541': 'Animal problem',
  '542': 'Animal rescue',
  '550': 'Public service assistance',
  '551': 'Assist police or other governmental agency',
  '552': 'Police matter',
  '553': 'Public service',
  '554': 'Assist invalid',
  '555': 'Defective elevator, no occupants',
  '561': 'Unauthorized burning',
  '571': 'Cover assignment, standby, move-up',

  // 600 Series - Good Intent Call
  '600': 'Good intent call, other',
  '611': 'Dispatched & canceled en route',
  '621': 'Wrong location',
  '622': 'No incident found on arrival at dispatch address',
  '631': 'Authorized controlled burning',
  '632': 'Prescribed fire',
  '641': 'Vicinity alarm',
  '650': 'Steam, other gas mistaken for smoke',
  '651': 'Smoke scare, odor of smoke',
  '652': 'Steam, vapor, fog or dust thought to be smoke',
  '653': 'Smoke from barbecue, tar kettle',
  '661': 'EMS call, party transported by non-fire agency',
  '671': 'Hazmat release investigation w/no hazmat',
  '672': 'Biological hazard investigation, none found',

  // 700 Series - False Alarm
  '700': 'False alarm or false call, other',
  '710': 'Malicious, mischievous false call',
  '711': 'Municipal alarm system, malicious false alarm',
  '712': 'Direct tie to FD, malicious false alarm',
  '713': 'Telephone, malicious false alarm',
  '714': 'Central station, malicious false alarm',
  '715': 'Local alarm system, malicious false alarm',
  '721': 'Bomb scare - no bomb',
  '730': 'System malfunction',
  '731': 'Sprinkler activation due to malfunction',
  '732': 'Extinguishing system activation due to malfunction',
  '733': 'Smoke detector activation due to malfunction',
  '734': 'Heat detector activation due to malfunction',
  '735': 'Alarm system sounded due to malfunction',
  '736': 'CO detector activation due to malfunction',
  '740': 'Unintentional transmission of alarm',
  '741': 'Sprinkler activation, no fire - unintentional',
  '742': 'Extinguishing system activation',
  '743': 'Smoke detector activation, no fire - unintentional',
  '744': 'Detector activation, no fire - unintentional',
  '745': 'Alarm system activation, no fire - unintentional',
  '746': 'Carbon monoxide detector activation, no CO'
};

// NFIRS Action Taken Codes
export const NFIRS_ACTIONS: Record<string, string> = {
  '10': 'Fire control or extinguishment',
  '11': 'Extinguishment by fire service personnel',
  '12': 'Salvage & overhaul',
  '13': 'Contain fire (wildland)',
  '14': 'Identify, control, contain hazmat',
  '20': 'Search & rescue',
  '21': 'Rescue, remove from harm',
  '22': 'Extricate, disentangle',
  '23': 'Search',
  '30': 'EMS & transport',
  '31': 'Provide basic life support (BLS)',
  '32': 'Provide advanced life support (ALS)',
  '33': 'Provide transport service',
  '40': 'Hazardous condition',
  '50': 'Fire, hazard reduction',
  '51': 'Ventilate',
  '52': 'Forcible entry',
  '53': 'Evacuate area',
  '54': 'Establish safe area',
  '60': 'Systems & services',
  '61': 'Restore fire protection system',
  '62': 'Restore sprinkler or fire suppression system',
  '70': 'Assistance',
  '71': 'Assist physically disabled',
  '72': 'Assist animal',
  '73': 'Provide manpower',
  '74': 'Provide apparatus',
  '75': 'Provide equipment',
  '76': 'Operate apparatus',
  '80': 'Information, investigation',
  '81': 'Incident command',
  '82': 'Notify other agencies',
  '83': 'Provide information to public',
  '84': 'Investigate',
  '85': 'Investigate fire out on arrival',
  '86': 'Arson investigation',
  '90': 'Fill-in, standby',
  '91': 'Standby',
  '92': 'Fill-in or relocation'
};

export interface NFIRSIncident {
  // Basic Module (Module 1)
  fdid: string;                    // Fire Department ID
  incidentNumber: string;          // Incident Number
  exposureNumber: string;          // Exposure Number (000 for main incident)
  incidentDate: string;            // MMDDYYYY
  stationNumber: string;           // Station responding
  incidentType: string;            // 3-digit code

  // Location
  streetNumber: string;
  streetPrefix: string;
  streetName: string;
  streetType: string;
  streetSuffix: string;
  aptNumber: string;
  city: string;
  state: string;
  zipCode: string;

  // Times
  alarmTime: string;               // HHMM
  arrivalTime: string;             // HHMM
  controlledTime: string;          // HHMM
  lastUnitCleared: string;         // HHMM

  // Actions
  actionsTaken: string[];          // Up to 3 action codes

  // Resources
  suppressionApparatus: number;
  suppressionPersonnel: number;
  emsApparatus: number;
  emsPersonnel: number;
  otherApparatus: number;
  otherPersonnel: number;

  // Property
  propertyLoss: number;
  contentsLoss: number;

  // Casualties
  civilianDeaths: number;
  civilianInjuries: number;
  firefighterDeaths: number;
  firefighterInjuries: number;

  // Detector/Sprinkler
  detectorPresent: string;         // 1=Yes, 2=No, U=Undetermined
  detectorOperated: string;        // 1=Yes, 2=No, U=Undetermined
  sprinklerPresent: string;        // 1=Yes, 2=No, U=Undetermined

  // Aid
  aidGiven: string;               // 1=Mutual aid received, 2=Automatic aid received, etc.
  aidReceived: string;

  // Narrative
  narrative: string;
}

export class NFIRSExporter {
  private db: DispatchDatabase;

  constructor(db: DispatchDatabase) {
    this.db = db;
  }

  // Convert internal incident type to NFIRS code
  mapIncidentType(type: string): string {
    const typeMap: Record<string, string> = {
      'structure_fire': '111',
      'vehicle_fire': '131',
      'brush_fire': '142',
      'grass_fire': '143',
      'dumpster_fire': '154',
      'medical': '321',
      'mva': '322',
      'mva_injuries': '322',
      'mva_no_injuries': '324',
      'rescue': '350',
      'water_rescue': '360',
      'hazmat': '422',
      'gas_leak': '412',
      'co_alarm': '424',
      'electrical': '440',
      'power_lines': '444',
      'lockout': '511',
      'water_problem': '522',
      'smoke_investigation': '651',
      'alarm_residential': '745',
      'alarm_commercial': '745',
      'cancelled': '611'
    };
    return typeMap[type.toLowerCase()] || '600'; // Default to good intent
  }

  // Generate NFIRS fixed-width format record
  generateBasicModule(incident: NFIRSIncident): string {
    const pad = (str: string, len: number, char = ' ') => str.slice(0, len).padEnd(len, char);
    const padNum = (num: number, len: number) => String(num).slice(0, len).padStart(len, '0');

    // NFIRS Basic Module format (simplified - full spec is 200+ fields)
    let record = '';
    record += pad(incident.fdid, 5);                          // 1-5: FDID
    record += pad(incident.incidentNumber, 7);                // 6-12: Incident Number
    record += pad(incident.exposureNumber, 3);                // 13-15: Exposure
    record += pad(incident.incidentDate, 8);                  // 16-23: Date MMDDYYYY
    record += pad(incident.stationNumber, 3);                 // 24-26: Station
    record += pad(incident.incidentType, 3);                  // 27-29: Incident Type
    record += pad(incident.alarmTime, 4);                     // 30-33: Alarm Time
    record += pad(incident.arrivalTime, 4);                   // 34-37: Arrival Time
    record += pad(incident.controlledTime, 4);                // 38-41: Controlled Time
    record += pad(incident.lastUnitCleared, 4);               // 42-45: Last Unit Cleared
    record += pad(incident.streetNumber, 8);                  // 46-53: Street Number
    record += pad(incident.streetPrefix, 2);                  // 54-55: Street Prefix
    record += pad(incident.streetName, 30);                   // 56-85: Street Name
    record += pad(incident.streetType, 4);                    // 86-89: Street Type
    record += pad(incident.streetSuffix, 2);                  // 90-91: Street Suffix
    record += pad(incident.aptNumber, 6);                     // 92-97: Apt Number
    record += pad(incident.city, 20);                         // 98-117: City
    record += pad(incident.state, 2);                         // 118-119: State
    record += pad(incident.zipCode, 5);                       // 120-124: ZIP
    record += padNum(incident.suppressionApparatus, 2);       // 125-126: Suppression Apparatus
    record += padNum(incident.suppressionPersonnel, 3);       // 127-129: Suppression Personnel
    record += padNum(incident.emsApparatus, 2);               // 130-131: EMS Apparatus
    record += padNum(incident.emsPersonnel, 3);               // 132-134: EMS Personnel
    record += padNum(incident.propertyLoss, 9);               // 135-143: Property Loss
    record += padNum(incident.contentsLoss, 9);               // 144-152: Contents Loss
    record += padNum(incident.civilianDeaths, 2);             // 153-154: Civilian Deaths
    record += padNum(incident.civilianInjuries, 2);           // 155-156: Civilian Injuries
    record += padNum(incident.firefighterDeaths, 2);          // 157-158: FF Deaths
    record += padNum(incident.firefighterInjuries, 2);        // 159-160: FF Injuries
    record += pad(incident.detectorPresent, 1);               // 161: Detector Present
    record += pad(incident.detectorOperated, 1);              // 162: Detector Operated
    record += pad(incident.sprinklerPresent, 1);              // 163: Sprinkler Present
    record += (incident.actionsTaken[0] || '').padEnd(2);     // 164-165: Action 1
    record += (incident.actionsTaken[1] || '').padEnd(2);     // 166-167: Action 2
    record += (incident.actionsTaken[2] || '').padEnd(2);     // 168-169: Action 3

    return record;
  }

  // Export incident from database to NFIRS format
  async exportIncident(incidentId: string): Promise<NFIRSIncident | null> {
    const incident = this.db.getIncidentById(incidentId);
    if (!incident) return null;

    const department = this.db.getDepartmentById(incident.department_id);
    const units = this.db.getIncidentUnits(incidentId);
    const logs = this.db.getIncidentLogs(incidentId);

    // Parse address (simplified)
    const addressParts = (incident.location_address || '').split(' ');
    const streetNumber = addressParts[0] || '';
    const streetName = addressParts.slice(1).join(' ') || '';

    // Count apparatus by type
    let suppressionApparatus = 0;
    let emsApparatus = 0;
    let otherApparatus = 0;

    for (const unit of units) {
      const type = unit.unit_type || '';
      if (['engine', 'ladder', 'truck', 'quint', 'tanker', 'brush'].some(t => type.includes(t))) {
        suppressionApparatus++;
      } else if (['ambulance', 'medic', 'rescue'].some(t => type.includes(t))) {
        emsApparatus++;
      } else {
        otherApparatus++;
      }
    }

    // Build narrative from logs
    const narrative = logs
      .filter(l => l.entry_type === 'note' || l.entry_type === 'narrative')
      .map(l => `${l.timestamp}: ${l.content}`)
      .join('\n');

    // Parse dates/times
    const created = new Date(incident.created_at);
    const arrived = incident.first_arrival_at ? new Date(incident.first_arrival_at) : null;
    const controlled = incident.controlled_at ? new Date(incident.controlled_at) : null;
    const closed = incident.closed_at ? new Date(incident.closed_at) : null;

    const formatDate = (d: Date) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${d.getFullYear()}`;
    const formatTime = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

    return {
      fdid: department?.fdid || '00000',
      incidentNumber: incident.incident_number,
      exposureNumber: '000',
      incidentDate: formatDate(created),
      stationNumber: '001',
      incidentType: this.mapIncidentType(incident.type),

      streetNumber,
      streetPrefix: '',
      streetName,
      streetType: '',
      streetSuffix: '',
      aptNumber: '',
      city: '',
      state: department?.state || 'XX',
      zipCode: '',

      alarmTime: formatTime(created),
      arrivalTime: arrived ? formatTime(arrived) : '',
      controlledTime: controlled ? formatTime(controlled) : '',
      lastUnitCleared: closed ? formatTime(closed) : '',

      actionsTaken: ['11'], // Default to extinguishment

      suppressionApparatus,
      suppressionPersonnel: suppressionApparatus * 3, // Estimate
      emsApparatus,
      emsPersonnel: emsApparatus * 2,
      otherApparatus,
      otherPersonnel: otherApparatus * 2,

      propertyLoss: 0,
      contentsLoss: 0,

      civilianDeaths: 0,
      civilianInjuries: 0,
      firefighterDeaths: 0,
      firefighterInjuries: 0,

      detectorPresent: 'U',
      detectorOperated: 'U',
      sprinklerPresent: 'U',

      aidGiven: 'N',
      aidReceived: 'N',

      narrative
    };
  }

  // Export multiple incidents to NFIRS file
  async exportToFile(departmentId: string, startDate: Date, endDate: Date): Promise<string> {
    const incidents = this.db.getIncidentHistory(departmentId, 10000)
      .filter(i => {
        const date = new Date(i.created_at);
        return date >= startDate && date <= endDate && i.status === 'closed';
      });

    let output = '';
    output += '// NFIRS Export - Dispatch Protocol\n';
    output += `// Department: ${departmentId}\n`;
    output += `// Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`;
    output += `// Total Incidents: ${incidents.length}\n`;
    output += '//\n';

    for (const incident of incidents) {
      const nfirs = await this.exportIncident(incident.id);
      if (nfirs) {
        output += this.generateBasicModule(nfirs) + '\n';
      }
    }

    return output;
  }

  // Export to JSON format (easier for modern systems)
  async exportToJSON(departmentId: string, startDate: Date, endDate: Date): Promise<object> {
    const incidents = this.db.getIncidentHistory(departmentId, 10000)
      .filter(i => {
        const date = new Date(i.created_at);
        return date >= startDate && date <= endDate && i.status === 'closed';
      });

    const department = this.db.getDepartmentById(departmentId);
    const exports: NFIRSIncident[] = [];

    for (const incident of incidents) {
      const nfirs = await this.exportIncident(incident.id);
      if (nfirs) {
        exports.push(nfirs);
      }
    }

    return {
      header: {
        version: '5.0',
        exportDate: new Date().toISOString(),
        department: {
          fdid: department?.fdid,
          name: department?.name,
          state: department?.state
        },
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        totalIncidents: exports.length
      },
      incidents: exports
    };
  }
}

export default NFIRSExporter;
