const fs = require('fs');
const path = require('path');

const geojsonPath = path.resolve(__dirname, '../nashik-all.geojson');
console.log('Reading:', geojsonPath);
const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

function getCentroid(geom) {
  if (!geom) return null;
  if (geom.type === 'Point') {
    return [Number(geom.coordinates[1].toFixed(6)), Number(geom.coordinates[0].toFixed(6))];
  }
  if (geom.type === 'Polygon') {
    const ring = geom.coordinates[0];
    let latSum = 0, lonSum = 0;
    ring.forEach(pt => { lonSum += pt[0]; latSum += pt[1]; });
    return [Number((latSum / ring.length).toFixed(6)), Number((lonSum / ring.length).toFixed(6))];
  }
  if (geom.type === 'MultiPolygon') {
    const ring = geom.coordinates[0][0];
    let latSum = 0, lonSum = 0;
    ring.forEach(pt => { lonSum += pt[0]; latSum += pt[1]; });
    return [Number((latSum / ring.length).toFixed(6)), Number((lonSum / ring.length).toFixed(6))];
  }
  return null;
}

function getPolygonCoords(geom) {
  if (!geom) return null;
  if (geom.type === 'Polygon') {
    return geom.coordinates[0].map(pt => [Number(pt[1].toFixed(6)), Number(pt[0].toFixed(6))]);
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates[0][0].map(pt => [Number(pt[1].toFixed(6)), Number(pt[0].toFixed(6))]);
  }
  return null;
}

const pois = [];
const polygons = [];
const seenPoi = new Set();

data.features.forEach((f, idx) => {
  const p = f.properties || {};
  let cat = p.category;
  const name = p.name || p.title;

  // Filter medical / hospitals from Private
  if (!cat && p.layer === 'Hospital') cat = 'medical';
  if (!cat && name && (name.includes('Hospital') || name.includes('NURSING HOME') || name.includes('CLINIC') || name.includes('MATERNITY HOME'))) {
    cat = 'medical';
  }

  const validCats = ['ghat', 'riverside-holding', 'parking', 'congestion', 'landmark', 'medical'];
  if (!cat || !validCats.includes(cat)) {
    return;
  }

  const centroid = getCentroid(f.geometry);
  if (!centroid) return;

  const key = (name || 'poi') + '|' + cat;
  if (!seenPoi.has(key)) {
    seenPoi.add(key);
    pois.push({
      id: 'poi-' + (p.id || idx),
      name: name || 'Location ' + idx,
      category: cat,
      lat: centroid[0],
      lng: centroid[1],
      area: p.area || p['Area in sq.m.'] || p['Area (sq.m.)'] || null,
      capacity: p.capacity || p['Vehicle Capacity'] || p['Pilgrim Capacity'] || null,
      zone: p.zone || null,
      source: p.source || 'Nashik KMZ NTKMA'
    });
  }

  // If geometry is polygon, extract boundary
  const polyCoords = getPolygonCoords(f.geometry);
  if (polyCoords && polyCoords.length >= 3 && ['ghat', 'riverside-holding', 'parking'].includes(cat)) {
    polygons.push({
      name: name || 'Zone',
      category: cat,
      coordinates: polyCoords
    });
  }
});

console.log('POIs extracted:', pois.length);
console.log('Polygons extracted:', polygons.length);

const outContent = `// Auto-generated from nashik-all.geojson
export type NashikPoiCategory = 'ghat' | 'riverside-holding' | 'parking' | 'congestion' | 'landmark' | 'medical';

export interface NashikPOI {
  id: string;
  name: string;
  category: NashikPoiCategory;
  lat: number;
  lng: number;
  area?: string | null;
  capacity?: string | null;
  zone?: string | null;
  source?: string;
}

export interface NashikPolygon {
  name: string;
  category: 'ghat' | 'riverside-holding' | 'parking';
  coordinates: [number, number][];
}

export const NASHIK_POIS: NashikPOI[] = ${JSON.stringify(pois, null, 2)};

export const NASHIK_POLYGONS: NashikPolygon[] = ${JSON.stringify(polygons, null, 2)};
`;

const outputPath = path.resolve(__dirname, '../src/services/nashikGisData.ts');
fs.writeFileSync(outputPath, outContent, 'utf8');
console.log('Saved to:', outputPath);
