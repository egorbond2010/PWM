import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJSONFeatureCollection, TerritoryHistory } from '../../types';
import { ukraineBorderGeoJSON, neighborBordersGeoJSON } from '../../data/authenticBorders';

interface MapComponentProps {
  features: GeoJSONFeatureCollection;
  diffs: TerritoryHistory[];
  onSelectFeature: (featureId: string) => void;
  visibleFolders: Record<string, boolean>;
  visibleBaseLayers: Record<string, boolean>;
  isDiffHighlightActive: boolean;
  selectedDiff: TerritoryHistory | null;
  basemapType: 'satellite' | 'dark' | 'streets';
}

const DEFAULT_CENTER: [number, number] = [34.00, 48.60];
const DEFAULT_ZOOM = 6.4;

export const MapComponent: React.FC<MapComponentProps> = ({
  features,
  diffs,
  onSelectFeature,
  visibleFolders,
  visibleBaseLayers,
  isDiffHighlightActive,
  selectedDiff,
  basemapType,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [coords, setCoords] = useState<{ lng: number; lat: number; zoom: number }>({
    lng: DEFAULT_CENTER[0],
    lat: DEFAULT_CENTER[1],
    zoom: DEFAULT_ZOOM,
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        'satellite-base': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Tiles &copy; Esri',
        },
        'dark-base': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; CARTO',
        },
        'streets-base': {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors',
        },
        'esri-places-labels': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'esri-transportation': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
        },
        'carto-labels': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'satellite-base-layer',
          type: 'raster',
          source: 'satellite-base',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: basemapType === 'satellite' ? 'visible' : 'none',
          },
        },
        {
          id: 'dark-base-layer',
          type: 'raster',
          source: 'dark-base',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: basemapType === 'dark' ? 'visible' : 'none',
          },
        },
        {
          id: 'streets-base-layer',
          type: 'raster',
          source: 'streets-base',
          minzoom: 0,
          maxzoom: 19,
          layout: {
            visibility: basemapType === 'streets' ? 'visible' : 'none',
          },
        },
      ],
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
    });

    mapInstance.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('mousemove', (e) => {
      setCoords({
        lng: Number(e.lngLat.lng.toFixed(4)),
        lat: Number(e.lngLat.lat.toFixed(4)),
        zoom: Number(map.getZoom().toFixed(1)),
      });
    });

    map.on('load', () => {
      map.addSource('neighbors-source', {
        type: 'geojson',
        data: neighborBordersGeoJSON as any,
      });

      map.addLayer({
        id: 'neighbors-line',
        type: 'line',
        source: 'neighbors-source',
        paint: {
          'line-color': '#94a3b8',
          'line-width': 1.2,
          'line-dasharray': [3, 3],
          'line-opacity': 0.60,
        },
      });

      map.addSource('ukraine-border-source', {
        type: 'geojson',
        data: ukraineBorderGeoJSON as any,
      });

      map.addLayer({
        id: 'ukraine-sovereign-fill',
        type: 'fill',
        source: 'ukraine-border-source',
        paint: {
          'fill-color': '#2b4b77',
          'fill-opacity': 0.38,
        },
      });

      map.addLayer({
        id: 'ukraine-state-border-line',
        type: 'line',
        source: 'ukraine-border-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.4,
          'line-dasharray': [4, 2],
          'line-opacity': 0.95,
        },
      });

      map.addSource('kml-features-source', {
        type: 'geojson',
        data: features as any,
      });

      map.addLayer({
        id: 'kml-polygons-fill',
        type: 'fill',
        source: 'kml-features-source',
        filter: ['all', ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]], ['!=', ['get', 'id'], 'ua-sovereign-1991']],
        paint: {
          'fill-color': [
            'case',
            ['has', 'color_hex'], ['get', 'color_hex'],
            '#8b3a2b'
          ],
          'fill-opacity': [
            'case',
            ['has', 'fill_opacity'], ['get', 'fill_opacity'],
            0.55
          ],
        },
      });

      map.addLayer({
        id: 'kml-polygons-line',
        type: 'line',
        source: 'kml-features-source',
        filter: ['all', ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon', 'LineString']]], ['!=', ['get', 'id'], 'ua-sovereign-1991']],
        paint: {
          'line-color': [
            'case',
            ['has', 'color_hex'], ['get', 'color_hex'],
            '#ef4444'
          ],
          'line-width': 1.8,
          'line-opacity': [
            'case',
            ['has', 'stroke_opacity'], ['get', 'stroke_opacity'],
            0.90
          ],
        },
      });

      map.addLayer({
        id: 'kml-points-circle',
        type: 'circle',
        source: 'kml-features-source',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 3.5,
            12, 6.5,
          ],
          'circle-color': [
            'case',
            ['has', 'color_hex'], ['get', 'color_hex'],
            '#3b82f6'
          ],
          'circle-stroke-width': 1.2,
          'circle-stroke-color': '#000000',
          'circle-opacity': 0.90,
        },
      });

      map.addLayer({
        id: 'transportation-layer',
        type: 'raster',
        source: 'esri-transportation',
        minzoom: 6,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.65,
        },
      });

      map.addLayer({
        id: 'places-labels-layer',
        type: 'raster',
        source: 'esri-places-labels',
        minzoom: 4,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.95,
        },
      });

      map.addLayer({
        id: 'carto-labels-layer',
        type: 'raster',
        source: 'carto-labels',
        minzoom: 3,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.90,
        },
      });

      map.on('click', 'kml-polygons-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const featureId = e.features[0].properties?.id;
          if (featureId) {
            onSelectFeature(featureId);
          }
        }
      });

      map.on('click', 'kml-points-circle', (e) => {
        if (e.features && e.features.length > 0) {
          const featureId = e.features[0].properties?.id;
          if (featureId) {
            onSelectFeature(featureId);
          }
        }
      });

      map.on('mouseenter', 'kml-polygons-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'kml-polygons-fill', () => {
        map.getCanvas().style.cursor = '';
      });
      
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('satellite-base-layer')) {
      map.setLayoutProperty('satellite-base-layer', 'visibility', basemapType === 'satellite' ? 'visible' : 'none');
    }
    if (map.getLayer('dark-base-layer')) {
      map.setLayoutProperty('dark-base-layer', 'visibility', basemapType === 'dark' ? 'visible' : 'none');
    }
    if (map.getLayer('streets-base-layer')) {
      map.setLayoutProperty('streets-base-layer', 'visibility', basemapType === 'streets' ? 'visible' : 'none');
    }
  }, [basemapType, mapLoaded]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('kml-features-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(features as any);
    }
  }, [features, mapLoaded]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    const activeFolders = Object.entries(visibleFolders)
      .filter(([_, isVis]) => isVis)
      .map(([folder]) => folder);

    if (map.getLayer('kml-polygons-fill')) {
      if (activeFolders.length === 0) {
        map.setLayoutProperty('kml-polygons-fill', 'visibility', 'none');
        map.setLayoutProperty('kml-polygons-line', 'visibility', 'none');
        map.setLayoutProperty('kml-points-circle', 'visibility', 'none');
      } else {
        map.setLayoutProperty('kml-polygons-fill', 'visibility', 'visible');
        map.setLayoutProperty('kml-polygons-line', 'visibility', 'visible');
        map.setLayoutProperty('kml-points-circle', 'visibility', 'visible');

        const filterExp: any = ['match', ['get', 'folder'], activeFolders, true, false];
        map.setFilter('kml-polygons-fill', ['all', ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]], ['!=', ['get', 'id'], 'ua-sovereign-1991'], filterExp]);
        map.setFilter('kml-polygons-line', ['all', ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon', 'LineString']]], ['!=', ['get', 'id'], 'ua-sovereign-1991'], filterExp]);
        map.setFilter('kml-points-circle', ['all', ['==', ['geometry-type'], 'Point'], filterExp]);
      }
    }

    if (map.getLayer('places-labels-layer')) {
      const labelsVisible = visibleBaseLayers.cities !== false;
      map.setLayoutProperty('places-labels-layer', 'visibility', labelsVisible ? 'visible' : 'none');
      map.setLayoutProperty('carto-labels-layer', 'visibility', labelsVisible ? 'visible' : 'none');
    }

    if (map.getLayer('transportation-layer')) {
      const roadsVisible = visibleBaseLayers.roads !== false;
      map.setLayoutProperty('transportation-layer', 'visibility', roadsVisible ? 'visible' : 'none');
    }

    if (map.getLayer('ukraine-state-border-line')) {
      const bordersVisible = visibleBaseLayers.borders !== false;
      map.setLayoutProperty('ukraine-state-border-line', 'visibility', bordersVisible ? 'visible' : 'none');
      map.setLayoutProperty('ukraine-sovereign-fill', 'visibility', bordersVisible ? 'visible' : 'none');
      map.setLayoutProperty('neighbors-line', 'visibility', bordersVisible ? 'visible' : 'none');
    }
  }, [visibleFolders, visibleBaseLayers, mapLoaded]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedDiff) return;

    map.flyTo({
      center: [37.25, 48.30],
      zoom: 9.5,
      duration: 1500,
    });
  }, [selectedDiff]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute bottom-20 right-4 z-10 glass-panel px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center space-x-3 select-none pointer-events-none">
        <span>LAT: <strong className="text-slate-200">{coords.lat}°N</strong></span>
        <span>LNG: <strong className="text-slate-200">{coords.lng}°E</strong></span>
        <span>ZOOM: <strong className="text-cyan-400">{coords.zoom}x</strong></span>
      </div>
    </div>
  );
};
