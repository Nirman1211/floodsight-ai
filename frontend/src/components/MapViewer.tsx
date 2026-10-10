import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Layers } from 'lucide-react';
import type { AnalysisResult } from '../types/analysis';

interface MapViewerProps {
  result: AnalysisResult;
}

export const MapViewer: React.FC<MapViewerProps> = ({ result }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [layersState, setLayersState] = useState({
    flood: true,
    roads: true,
    buildings: true,
    flowPath: true,
    settlements: true,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Center map around Trishuli Valley [85.25, 28.05]
    const initialMap = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [85.27, 28.08],
      zoom: 10.8,
    });

    initialMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    initialMap.on('load', () => {
      // 1. Flood Inundation & Sediment Layer
      if (result.flood_geojson) {
        initialMap.addSource('flood-data', {
          type: 'geojson',
          data: result.flood_geojson,
        });

        initialMap.addLayer({
          id: 'flood-fill',
          type: 'fill',
          source: 'flood-data',
          paint: {
            'fill-color': '#2563eb',
            'fill-opacity': 0.65,
          },
        });

        initialMap.addLayer({
          id: 'flood-outline',
          type: 'line',
          source: 'flood-data',
          paint: {
            'line-color': '#1d4ed8',
            'line-width': 2,
          },
        });
      }

      // 2. Downstream Flood Flow Path (Bonus Hydrology)
      if (result.flood_flow_path_geojson) {
        initialMap.addSource('flow-path-data', {
          type: 'geojson',
          data: result.flood_flow_path_geojson,
        });

        initialMap.addLayer({
          id: 'flow-path-line',
          type: 'line',
          source: 'flow-path-data',
          paint: {
            'line-color': '#06b6d4',
            'line-width': 4,
            'line-dasharray': [2, 1],
          },
        });
      }

      // 3. Exposed Roads Layer
      if (result.exposed_roads_geojson) {
        initialMap.addSource('roads-data', {
          type: 'geojson',
          data: result.exposed_roads_geojson,
        });

        initialMap.addLayer({
          id: 'roads-line',
          type: 'line',
          source: 'roads-data',
          paint: {
            'line-color': '#ef4444',
            'line-width': 3.5,
          },
        });
      }

      // 4. Exposed Buildings Layer
      if (result.exposed_buildings_geojson) {
        initialMap.addSource('buildings-data', {
          type: 'geojson',
          data: result.exposed_buildings_geojson,
        });

        initialMap.addLayer({
          id: 'buildings-fill',
          type: 'fill',
          source: 'buildings-data',
          paint: {
            'fill-color': '#f97316',
            'fill-opacity': 0.8,
          },
        });
      }

      // 5. Settlement Markers & Popups
      result.settlements.forEach((s) => {
        const isCutOff = s.status === 'newly_cut_off';
        const el = document.createElement('div');
        el.className = `w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 ${
          isCutOff ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
        }`;

        const popupContent = `
          <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 13px;">${s.name}</h4>
            <p style="margin: 0; font-size: 11px;"><b>Est. Population:</b> ${s.population_est}</p>
            <p style="margin: 2px 0; font-size: 11px;"><b>Baseline Hosp Dist:</b> ${s.baseline_distance_km} km</p>
            <p style="margin: 2px 0; font-size: 11px; font-weight: bold; color: ${isCutOff ? '#dc2626' : '#16a34a'};">
              ${isCutOff ? '⚠️ CUT OFF FROM HOSPITAL' : '✅ Road Access Intact'}
            </p>
            ${s.alternative_route_available ? '<p style="margin: 2px 0; font-size: 10px; color: #475569;">Emergency mountain bypass active</p>' : ''}
          </div>
        `;

        new maplibregl.Marker({ element: el })
          .setLngLat(s.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupContent))
          .addTo(initialMap);
      });
    });

    map.current = initialMap;

    return () => {
      initialMap.remove();
    };
  }, [result]);

  // Toggle layer visibility
  const toggleLayer = (layerKey: keyof typeof layersState, layerIds: string[]) => {
    if (!map.current) return;
    const newState = !layersState[layerKey];
    setLayersState((prev) => ({ ...prev, [layerKey]: newState }));

    layerIds.forEach((id) => {
      if (map.current?.getLayer(id)) {
        map.current.setLayoutProperty(id, 'visibility', newState ? 'visible' : 'none');
      }
    });
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden border border-slate-800 shadow-md">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Layer Control Box */}
      <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-lg z-10 w-64 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-slate-800 pb-2 mb-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Interactive Disaster Layers</span>
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block opacity-80" />
              Flood & Debris Inundation
            </span>
            <input
              type="checkbox"
              checked={layersState.flood}
              onChange={() => toggleLayer('flood', ['flood-fill', 'flood-outline'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-1 rounded bg-rose-600 inline-block" />
              Severed Road Segments
            </span>
            <input
              type="checkbox"
              checked={layersState.roads}
              onChange={() => toggleLayer('roads', ['roads-line'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
              Submerged Buildings
            </span>
            <input
              type="checkbox"
              checked={layersState.buildings}
              onChange={() => toggleLayer('buildings', ['buildings-fill'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-1 rounded bg-cyan-400 inline-block" />
              Downstream Flood Path
            </span>
            <input
              type="checkbox"
              checked={layersState.flowPath}
              onChange={() => toggleLayer('flowPath', ['flow-path-line'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
            />
          </label>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            Cut-Off Village
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Connected Village
          </span>
        </div>
      </div>
    </div>
  );
};
