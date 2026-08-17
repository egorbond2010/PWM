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
const geojson = kml(kmlDoc);

const folderStats = {};
const features = [];

// Style color mapping
const styleMap = {};
const styleElements = kmlDoc.getElementsByTagName('Style');
for (let i = 0; i < styleElements.length; i++) {
  const style = styleElements[i];
  const id = style.getAttribute('id');
  if (!id) continue;
  
  let color = null;
  const polyColor = style.getElementsByTagName('PolyStyle')[0]?.getElementsByTagName('color')[0]?.textContent;
  const lineColor = style.getElementsByTagName('LineStyle')[0]?.getElementsByTagName('color')[0]?.textContent;
  const iconColor = style.getElementsByTagName('IconStyle')[0]?.getElementsByTagName('color')[0]?.textContent;
  
  const rawColor = polyColor || lineColor || iconColor;
  if (rawColor && rawColor.length === 8) {
    // KML color is aabbggrr -> convert to #rrggbb
    const a = rawColor.substring(0, 2);
    const b = rawColor.substring(2, 4);
    const g = rawColor.substring(4, 6);
    const r = rawColor.substring(6, 8);
    color = `#${r}${g}${b}`;
  }
  if (color) {
    styleMap[`#${id}`] = color;
    styleMap[id] = color;
  }
}

// Process folders
const folders = kmlDoc.getElementsByTagName('Folder');
for (let i = 0; i < folders.length; i++) {
  const folder = folders[i];
  const folderName = folder.getElementsByTagName('name')[0]?.textContent?.trim() || 'Основна Карта';
  const placemarks = folder.getElementsByTagName('Placemark');
  
  folderStats[folderName] = placemarks.length;
}

for (let i = 0; i < geojson.features.length; i++) {
  const feat = geojson.features[i];
  const props = feat.properties || {};
  const styleUrl = props.styleUrl;
  
  let colorHex = styleMap[styleUrl] || '#3b82f6';
  
  // Assign stable folder & ID
  const folder = props.folder || 'Основна Карта';
  const name = props.name || `Об'єкт ${i + 1}`;
  
  features.push({
    ...feat,
    properties: {
      ...props,
      id: props.id || `kml-feat-${i + 1}`,
      name,
      folder,
      color_hex: colorHex,
    }
  });
}

const finalGeoJson = {
  type: 'FeatureCollection',
  features,
};

fs.writeFileSync(outGeoJsonPath, JSON.stringify(finalGeoJson, null, 2), 'utf8');
fs.writeFileSync(outStatsPath, JSON.stringify(folderStats, null, 2), 'utf8');

console.log(`Parsed ${features.length} features across ${Object.keys(folderStats).length} folders successfully!`);
