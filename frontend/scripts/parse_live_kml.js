import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';
import { kml } from '@tmcw/togeojson';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kmlPath = path.join(__dirname, '../public/data/Perfect_War_Map_live.kml');
const outGeoJsonPath = path.join(__dirname, '../public/data/pwm_kml_parsed.geojson');
const outStatsPath = path.join(__dirname, '../public/data/pwm_folder_stats.json');

console.log('Reading KML from:', kmlPath);
const kmlText = fs.readFileSync(kmlPath, 'utf8');

const parser = new DOMParser();
const kmlDoc = parser.parseFromString(kmlText, 'text/xml');

// Helper to extract hex color from Style or Style ID
function extractColorFromStyleId(styleId) {
  if (!styleId) return '#3b82f6';
  // Check for 6-character hex code in styleId (e.g. poly-A52714, icon-1564-0288D1, poly-0F9D58)
  const hexMatch = styleId.match(/([0-9A-Fa-f]{6})/);
  if (hexMatch) {
    return `#${hexMatch[1]}`;
  }
  return '#3b82f6';
}

const folderStats = {};
const allFeatures = [];
let featCounter = 0;

// Iterate through each Folder individually
const folders = kmlDoc.getElementsByTagName('Folder');
for (let fIdx = 0; fIdx < folders.length; fIdx++) {
  const folder = folders[fIdx];
  const folderName = folder.getElementsByTagName('name')[0]?.textContent?.trim() || 'Основна Карта';
  const placemarks = folder.getElementsByTagName('Placemark');
  
  folderStats[folderName] = placemarks.length;

  for (let pIdx = 0; pIdx < placemarks.length; pIdx++) {
    featCounter++;
    const placemark = placemarks[pIdx];
    
    // Parse single placemark to geojson
    const pmDoc = parser.parseFromString(
      `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemark.toString()}</Document></kml>`,
      'text/xml'
    );
    const pmGeoJson = kml(pmDoc);
    
    if (!pmGeoJson.features || pmGeoJson.features.length === 0) continue;
    const feat = pmGeoJson.features[0];
    
    const name = placemark.getElementsByTagName('name')[0]?.textContent?.trim() || `Об'єкт ${featCounter}`;
    const desc = placemark.getElementsByTagName('description')[0]?.textContent?.trim() || '';
    const styleUrl = placemark.getElementsByTagName('styleUrl')[0]?.textContent?.trim() || '';
    
    let colorHex = extractColorFromStyleId(styleUrl);
    
    // Specific folder color heuristics if style is generic
    if (folderName.includes('Основна Карта') || folderName.includes('Денере')) {
      if (colorHex === '#3b82f6' || colorHex === '#0288d1') colorHex = '#a52714'; // Red for Russian occupation
    } else if (folderName.includes('Звільнені')) {
      if (colorHex === '#3b82f6') colorHex = '#0f9d58'; // Green for liberated
    }

    let opacity = 0.45;
    if (folderName === 'Україна') {
      opacity = 0.05; // Don't block map
    } else if (folderName.includes('Міста') || folderName.includes('Райони')) {
      opacity = 0.20;
    }

    allFeatures.push({
      ...feat,
      properties: {
        id: `pwm-feat-${featCounter}`,
        name,
        description: desc,
        folder: folderName,
        color_hex: colorHex,
        fill_opacity: opacity,
        stroke_color: colorHex,
      }
    });
  }
}

const finalGeoJson = {
  type: 'FeatureCollection',
  features: allFeatures,
};

fs.writeFileSync(outGeoJsonPath, JSON.stringify(finalGeoJson, null, 2), 'utf8');
fs.writeFileSync(outStatsPath, JSON.stringify(folderStats, null, 2), 'utf8');

console.log(`Successfully generated ${allFeatures.length} features across ${Object.keys(folderStats).length} folders!`);
