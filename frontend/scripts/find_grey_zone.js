import fs from 'fs';
import { DOMParser } from '@xmldom/xmldom';

const text = fs.readFileSync('public/data/Perfect_War_Map_live.kml', 'utf8');
const doc = new DOMParser().parseFromString(text, 'text/xml');
const marks = doc.getElementsByTagName('Placemark');

let greyCount = 0;
const matched = [];

for (let i = 0; i < marks.length; i++) {
  const name = marks[i].getElementsByTagName('name')[0]?.textContent?.trim() || '';
  const desc = marks[i].getElementsByTagName('description')[0]?.textContent?.trim() || '';
  const style = marks[i].getElementsByTagName('styleUrl')[0]?.textContent?.trim() || '';
  
  if (
    name.toLowerCase().includes('сір') || 
    name.toLowerCase().includes('сер') || 
    name.toLowerCase().includes('неуточн') || 
    name.toLowerCase().includes('спірн') || 
    desc.toLowerCase().includes('сір') || 
    style.toLowerCase().includes('grey') || 
    style.toLowerCase().includes('gray') || 
    style.toLowerCase().includes('616161') || 
    style.toLowerCase().includes('9e9e9e') ||
    style.toLowerCase().includes('ffd600') ||
    style.toLowerCase().includes('fbc02d')
  ) {
    matched.push({ name, desc, style });
    greyCount++;
  }
}

console.log('Total matched potential grey zone items:', greyCount);
console.log('Sample matches (first 15):', matched.slice(0, 15));
