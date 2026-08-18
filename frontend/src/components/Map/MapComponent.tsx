import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { GeoJSONFeatureCollection, TerritoryHistory } from '../../types';
import { ukraineBorderGeoJSON, neighborBordersGeoJSON } from '../../data/authenticBorders';
import { tacticalCityLabels } from '../../data/bordersAndCities';

interface MapComponentProps {
  features: GeoJSONFeatureCollection;
  diffs: TerritoryHistory[];
  selectedFeatureId?: string | null;
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
  selectedFeatureId,
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
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
            'https://d.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          maxzoom: 19,
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
      minZoom: 4.5,
      maxZoom: 17.0,
      maxBounds: [
        [12.0, 39.0], // Southwest bounds (Europe)
        [48.0, 58.0], // Northeast bounds (Europe)
      ],
      renderWorldCopies: false,
      pitch: 0,
      bearing: 0,
      fadeDuration: 0,
      maxTileCacheSize: 200,
      trackResize: true,
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
          'fill-color': '#244577',
          'fill-opacity': 0.38,
        },
      });

      map.addLayer({
        id: 'ukraine-oblast-borders-line',
        type: 'line',
        source: 'ukraine-border-source',
        paint: {
          'line-color': '#3b6bb8',
          'line-width': 1.0,
          'line-opacity': 0.55,
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
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'folder'], 'Сіра зона'], '#e2e8f0',
            ['has', 'color_hex'], ['get', 'color_hex'],
            '#8b3a2b'
          ],
          'fill-opacity': [
            'case',
            ['==', ['get', 'folder'], 'Сіра зона'], 0.38,
            ['has', 'fill_opacity'], ['get', 'fill_opacity'],
            0.38
          ],
          'fill-antialias': true,
        },
      });

      map.addLayer({
        id: 'kml-polygons-line',
        type: 'line',
        source: 'kml-features-source',
        filter: ['all', ['==', ['geometry-type'], 'LineString'], ['!=', ['get', 'id'], 'ua-sovereign-1991']],
        paint: {
          'line-color': [
            'case',
            ['has', 'color_hex'], ['get', 'color_hex'],
            '#ef4444'
          ],
          'line-width': 1.6,
          'line-opacity': [
            'case',
            ['has', 'stroke_opacity'], ['get', 'stroke_opacity'],
            0.85
          ],
        },
      });

      const pointsGeoJSON = {
        type: 'FeatureCollection',
        features: (features?.features || []).filter((f) => f.geometry?.type === 'Point'),
      };

      map.addSource('kml-points-source', {
        type: 'geojson',
        data: pointsGeoJSON as any,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 35,
      });

      // 1. Cluster badges with soft glowing border
      map.addLayer({
        id: 'kml-clusters-circle',
        type: 'circle',
        source: 'kml-points-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#1e293b', // < 10 points
            10, '#0f172a', // 10-25 points
            25, '#020617'  // 25+ points
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            12,
            10, 15,
            25, 19
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#38bdf8',
          'circle-opacity': 0.90,
        },
      });

      // 2. Cluster count text (+5, +12)
      map.addLayer({
        id: 'kml-cluster-count',
        type: 'symbol',
        source: 'kml-points-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '+{point_count_abbreviated}',
          'text-size': 11,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // 3. Refined individual tactical points (-30% smaller, 1px sleek border)
      map.addLayer({
        id: 'kml-unclustered-points',
        type: 'circle',
        source: 'kml-points-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2.5,
            8, 4.0,
            12, 5.5,
            16, 7.5,
          ],
          'circle-color': [
            'case',
            ['has', 'color_hex'], ['get', 'color_hex'],
            '#3b82f6'
          ],
          'circle-stroke-width': 1.0,
          'circle-stroke-color': '#0f172a',
          'circle-opacity': 0.95,
        },
      });

      map.addLayer({
        id: 'carto-labels-layer',
        type: 'raster',
        source: 'carto-labels',
        minzoom: 3,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.70,
        },
      });

      const ukrainianLabelsGeoJSON = {
        type: 'FeatureCollection',
        features: tacticalCityLabels.map((lbl, idx) => ({
          type: 'Feature',
          properties: {
            id: `uk-city-${idx}`,
            name: lbl.name,
            type: lbl.type,
            minZoom: lbl.minZoom || 0,
          },
          geometry: {
            type: 'Point',
            coordinates: lbl.coordinates,
          },
        })),
      };

      map.addSource('ukrainian-labels-source', {
        type: 'geojson',
        data: ukrainianLabelsGeoJSON as any,
      });

      map.addLayer({
        id: 'ukrainian-labels-layer',
        type: 'symbol',
        source: 'ukrainian-labels-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 11,
            7, 13,
            10, 15,
            14, 17,
          ],
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#0a0d14',
          'text-halo-width': 2.2,
          'text-halo-blur': 0.5,
        },
      });

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 10,
        className: 'pwm-map-popup',
      });

      const showFeaturePopup = (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const props = feat.properties || {};
        const name = props.name || 'Об\'єкт карти';
        const folder = props.folder || '';
        const desc = props.description || '';
        const featureId = props.id;

        if (featureId) {
          onSelectFeature(featureId);
        }

        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 4px 6px; min-width: 160px; max-width: 280px;">
              <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 3px;">${name}</div>
              ${folder ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📁 ${folder}</div>` : ''}
              ${desc ? `<div style="font-size: 11px; color: #334155; line-height: 1.4; max-height: 160px; overflow-y: auto; padding-top: 2px;">${desc}</div>` : ''}
            </div>
          `)
          .addTo(map);
      };

      map.on('click', 'kml-polygons-fill', showFeaturePopup);
      map.on('click', 'kml-unclustered-points', showFeaturePopup);

      // Cluster click -> zoom in to expand
      map.on('click', 'kml-clusters-circle', (e) => {
        const feats = map.queryRenderedFeatures(e.point, { layers: ['kml-clusters-circle'] });
        const clusterId = feats[0]?.properties?.cluster_id;
        const source: any = map.getSource('kml-points-source');
        if (source && clusterId !== undefined) {
          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            map.easeTo({
              center: (feats[0].geometry as any).coordinates,
              zoom: Math.min(zoom, 15),
            });
          });
        }
      });

      map.on('mouseenter', 'kml-polygons-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'kml-polygons-fill', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'kml-clusters-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'kml-clusters-circle', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'kml-unclustered-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'kml-unclustered-points', () => {
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
    const pointsSource = map.getSource('kml-points-source') as maplibregl.GeoJSONSource;
    if (pointsSource) {
      pointsSource.setData({
        type: 'FeatureCollection',
        features: (features?.features || []).filter((f) => f.geometry?.type === 'Point'),
      } as any);
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
      } else {
        map.setLayoutProperty('kml-polygons-fill', 'visibility', 'visible');
        map.setLayoutProperty('kml-polygons-line', 'visibility', 'visible');

        const filterExp: any = ['match', ['get', 'folder'], activeFolders, true, false];
        map.setFilter('kml-polygons-fill', ['all', ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]], filterExp]);
        map.setFilter('kml-polygons-line', ['all', ['==', ['geometry-type'], 'LineString'], filterExp]);
      }
    }

    if (map.getLayer('kml-unclustered-points')) {
      if (activeFolders.length === 0) {
        map.setLayoutProperty('kml-clusters-circle', 'visibility', 'none');
        map.setLayoutProperty('kml-cluster-count', 'visibility', 'none');
        map.setLayoutProperty('kml-unclustered-points', 'visibility', 'none');
      } else {
        map.setLayoutProperty('kml-clusters-circle', 'visibility', 'visible');
        map.setLayoutProperty('kml-cluster-count', 'visibility', 'visible');
        map.setLayoutProperty('kml-unclustered-points', 'visibility', 'visible');

        const filterExp: any = ['match', ['get', 'folder'], activeFolders, true, false];
        map.setFilter('kml-unclustered-points', ['all', ['!', ['has', 'point_count']], filterExp]);
      }
    }

    if (map.getLayer('places-labels-layer')) {
      const labelsVisible = visibleBaseLayers.cities !== false;
      map.setLayoutProperty('places-labels-layer', 'visibility', labelsVisible ? 'visible' : 'none');
      map.setLayoutProperty('carto-labels-layer', 'visibility', labelsVisible ? 'visible' : 'none');
    }

    if (map.getLayer('ukraine-state-border-line')) {
      const bordersVisible = visibleBaseLayers.borders !== false;
      map.setLayoutProperty('ukraine-state-border-line', 'visibility', bordersVisible ? 'visible' : 'none');
      map.setLayoutProperty('neighbors-line', 'visibility', bordersVisible ? 'visible' : 'none');
    }
  }, [visibleFolders, visibleBaseLayers, mapLoaded]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded || !selectedFeatureId) return;

    const feat = features?.features?.find((f) => f.properties?.id === selectedFeatureId);
    if (!feat || !feat.geometry) return;

    let centerLngLat: [number, number] | null = null;
    const geom = feat.geometry;

    if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
      centerLngLat = [geom.coordinates[0], geom.coordinates[1]];
    } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates) && geom.coordinates[0]?.length > 0) {
      const ring = geom.coordinates[0];
      let sumLng = 0;
      let sumLat = 0;
      ring.forEach((pt: any) => {
        sumLng += pt[0];
        sumLat += pt[1];
      });
      centerLngLat = [sumLng / ring.length, sumLat / ring.length];
    } else if (geom.type === 'LineString' && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
      const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)];
      centerLngLat = [mid[0], mid[1]];
    }

    if (centerLngLat) {
      map.flyTo({
        center: centerLngLat,
        zoom: Math.max(map.getZoom(), 11),
        duration: 1000,
      });

      const props = feat.properties || {};
      const name = props.name || 'Об\'єкт карти';
      const folder = props.folder || '';
      const desc = props.description || '';

      new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 10,
        className: 'pwm-map-popup',
      })
        .setLngLat(centerLngLat)
        .setHTML(`
          <div style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 4px 6px; min-width: 160px; max-width: 280px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; line-height: 1.3; margin-bottom: 3px;">${name}</div>
            ${folder ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">📁 ${folder}</div>` : ''}
            ${desc ? `<div style="font-size: 11px; color: #334155; line-height: 1.4; max-height: 160px; overflow-y: auto; padding-top: 2px;">${desc}</div>` : ''}
          </div>
        `)
        .addTo(map);
    }
  }, [selectedFeatureId, features, mapLoaded]);

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
