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

function extractColorFromStyleId(styleId) {
  if (!styleId) return null;
  const hexMatch = styleId.match(/([0-9A-Fa-f]{6})/);
  if (hexMatch) {
    return `#${hexMatch[1]}`;
  }
  return null;
}

const folderStats = {};
const allFeatures = [];
let featCounter = 0;

const folders = kmlDoc.getElementsByTagName('Folder');
for (let fIdx = 0; fIdx < folders.length; fIdx++) {
  const folder = folders[fIdx];
  const folderName = folder.getElementsByTagName('name')[0]?.textContent?.trim() || 'Основна Карта';
  const placemarks = folder.getElementsByTagName('Placemark');
  
  folderStats[folderName] = placemarks.length;

  for (let pIdx = 0; pIdx < placemarks.length; pIdx++) {
    featCounter++;
    const placemark = placemarks[pIdx];
    
    const pmDoc = parser.parseFromString(
      `<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemark.toString()}</Document></kml>`,
      'text/xml'
    );
    const pmGeoJson = kml(pmDoc);
    
    if (!pmGeoJson.features || pmGeoJson.features.length === 0) continue;
    const feat = pmGeoJson.features[0];
    
    let name = placemark.getElementsByTagName('name')[0]?.textContent?.trim() || `Об'єкт ${featCounter}`;
    const desc = placemark.getElementsByTagName('description')[0]?.textContent?.trim() || '';
    const styleUrl = placemark.getElementsByTagName('styleUrl')[0]?.textContent?.trim() || '';
    
    let colorHex = extractColorFromStyleId(styleUrl);
    let opacity = 0.50;
    
    const lowerName = name.toLowerCase();
    const lowerDesc = desc.toLowerCase();
    const isGreyZone = lowerName.includes('сір') || lowerName.includes('сер') || 
                       lowerDesc.includes('сіра зона') || lowerDesc.includes('серая зона') ||
                       styleUrl.includes('FFFFFF') || styleUrl.includes('gray') || styleUrl.includes('grey');

    if (isGreyZone) {
      // Grey Zone (Contested / Неуточнено) -> Pure Brilliant White (#ffffff)
      colorHex = '#ffffff';
      opacity = 0.78;
      if (!name || name === `Об'єкт ${featCounter}`) {
        name = 'Сіра зона';
      }
    } else if (folderName.includes('Території, які контролювали ЗСУ в Росії')) {
      // Ukrainian control in Kursk/Russia -> Blue
      colorHex = '#2563eb';
      opacity = 0.55;
    } else if (folderName.includes('Звільнені території')) {
      // Liberated Ukrainian territories -> Green
      colorHex = '#10b981';
      opacity = 0.45;
    } else if (folderName.includes('Основна Карта') || folderName.includes('Денере')) {
      // Russian occupied areas -> Red
      colorHex = '#dc2626';
      opacity = 0.55;
    } else if (folderName.includes('Позиції')) {
      if (!colorHex) {
        colorHex = name.toLowerCase().includes('зсу') ? '#3b82f6' : '#ef4444';
      }
      opacity = 0.90;
    } else if (folderName.includes('Шар далеких ударів')) {
      colorHex = '#f59e0b';
      opacity = 0.85;
    } else if (folderName === 'Україна') {
      colorHex = '#1e40af';
      opacity = 0.15;
    } else if (folderName.includes('Міста') || folderName.includes('Райони')) {
      if (!colorHex) colorHex = '#eab308';
      opacity = 0.20;
    }

    if (!colorHex) {
      colorHex = '#3b82f6';
    }

    allFeatures.push({
      ...feat,
      properties: {
        id: `pwm-feat-${featCounter}`,
        name,
        description: desc,
        folder: isGreyZone ? 'Сіра зона' : folderName,
        color_hex: colorHex,
        fill_opacity: opacity,
        stroke_color: isGreyZone ? '#94a3b8' : colorHex,
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

console.log(`Parsed ${allFeatures.length} features with accurate Grey Zone, ZSU & Russian colors!`);
