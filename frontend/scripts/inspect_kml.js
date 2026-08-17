import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const kmlText = fs.readFileSync('public/data/Perfect_War_Map_live.kml', 'utf8');
const doc = new DOMParser().parseFromString(kmlText, 'text/xml');

const folders = doc.getElementsByTagName('Folder');
for (let i = 0; i < folders.length; i++) {
  const f = folders[i];
  const name = f.getElementsByTagName('name')[0]?.textContent?.trim();
  const marks = f.getElementsByTagName('Placemark');
  console.log(`Folder [${i}]: "${name}" -> ${marks.length} placemarks`);
  
  if (marks.length > 0) {
    const sample = marks[0];
    const sName = sample.getElementsByTagName('name')[0]?.textContent?.trim();
    const styleUrl = sample.getElementsByTagName('styleUrl')[0]?.textContent?.trim();
    const hasPoly = sample.getElementsByTagName('Polygon').length > 0;
    const hasLine = sample.getElementsByTagName('LineString').length > 0;
    const hasPoint = sample.getElementsByTagName('Point').length > 0;
    console.log(`   Sample: "${sName}" | styleUrl: ${styleUrl} | Poly: ${hasPoly}, Line: ${hasLine}, Point: ${hasPoint}`);
  }
}
