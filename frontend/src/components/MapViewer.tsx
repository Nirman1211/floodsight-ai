import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Info, Key, Globe, RotateCcw, X, Check, ExternalLink } from 'lucide-react';
import type { AnalysisResult } from '../types/analysis';

interface MapViewerProps {
  result: AnalysisResult;
}

type BasemapType = 'satellite' | 'streets' | 'dark';

export const MapViewer: React.FC<MapViewerProps> = ({ result }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('satellite');
  const [showApiInfoModal, setShowApiInfoModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('floodsight_maptiler_key') || '';
  });
  const [savedKeySuccess, setSavedKeySuccess] = useState<boolean>(false);

  const [layersState, setLayersState] = useState({
    flood: true,
    roads: true,
    buildings: true,
    flowPath: true,
    settlements: true,
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    // Center map around Trishuli Valley [85.27, 28.08]
    const initialMap = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© Esri, Maxar, Earthstar Geographics',
          },
          'osm-streets': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap contributors',
          },
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© OpenStreetMap, © CARTO',
          },
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            layout: { visibility: 'visible' },
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'osm-streets-layer',
            type: 'raster',
            source: 'osm-streets',
            layout: { visibility: 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            layout: { visibility: 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [85.27, 28.08],
      zoom: 10.8,
    });

    initialMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    initialMap.on('load', () => {
      // Trigger canvas resize to guarantee full container rendering
      initialMap.resize();

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
            'line-color': '#60a5fa',
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

    // Resize observer to ensure map adjusts automatically when container dimensions change
    const resizeObserver = new ResizeObserver(() => {
      if (initialMap) {
        initialMap.resize();
      }
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      initialMap.remove();
    };
  }, [result]);

  // Handle basemap switching
  const handleBasemapChange = (type: BasemapType) => {
    setActiveBasemap(type);
    if (!map.current) return;

    const layers: Record<BasemapType, string> = {
      satellite: 'esri-satellite-layer',
      streets: 'osm-streets-layer',
      dark: 'carto-dark-layer',
    };

    Object.entries(layers).forEach(([bType, layerId]) => {
      if (map.current?.getLayer(layerId)) {
        map.current.setLayoutProperty(
          layerId,
          'visibility',
          bType === type ? 'visible' : 'none'
        );
      }
    });
  };

  // Reset View to Nepal valley
  const resetCamera = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: [85.27, 28.08],
      zoom: 10.8,
      essential: true,
    });
  };

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

  // Save custom API key
  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('floodsight_maptiler_key', customApiKey.trim());
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 2500);
    } else {
      localStorage.removeItem('floodsight_maptiler_key');
      setSavedKeySuccess(false);
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden border border-slate-800 shadow-md">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Controls Bar: Basemap Switcher + Reset + API Info */}
      <div className="absolute top-3 right-14 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-1 shadow-lg z-10">
        <div className="flex items-center text-xs space-x-1">
          <button
            onClick={() => handleBasemapChange('satellite')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeBasemap === 'satellite'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="High-resolution Earth observation satellite basemap"
          >
            <span>🛰️</span>
            <span>Satellite</span>
          </button>
          <button
            onClick={() => handleBasemapChange('streets')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeBasemap === 'streets'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="OpenStreetMap standard roads & topography"
          >
            <span>🗺️</span>
            <span>Streets</span>
          </button>
          <button
            onClick={() => handleBasemapChange('dark')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeBasemap === 'dark'
                ? 'bg-blue-600 text-white font-medium shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Dark Matter contrast basemap"
          >
            <span>🌙</span>
            <span>Dark</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-700 mx-0.5" />

        <button
          onClick={resetCamera}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title="Reset View to Valley Focus"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowApiInfoModal(true)}
          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded transition-colors flex items-center gap-1 text-xs font-medium"
          title="Map API details & Key settings"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Map API Info</span>
        </button>
      </div>

      {/* Floating Disaster Layers Panel */}
      <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-lg p-3 shadow-lg z-10 w-64 text-xs">
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

      {/* Map API Information & Key Configuration Modal */}
      {showApiInfoModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl relative space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Map Architecture & API Details</h3>
              </div>
              <button
                onClick={() => setShowApiInfoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700/60 space-y-1.5">
                <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <span>⚡</span> Map Engine: MapLibre GL JS (WebGL 2D/3D)
                </p>
                <p className="text-slate-400 leading-relaxed">
                  The application uses <b>MapLibre GL JS</b>, an open-source, high-performance GPU-accelerated WebGL mapping library (open fork of Mapbox GL). It renders multi-layer vector/raster satellite tiles natively in the browser.
                </p>
              </div>

              <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700/60 space-y-1.5">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span>✅</span> Basemap API (100% Free & Open Access — No API Key Required)
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Currently, the platform uses <b>Esri World Imagery (Satellite)</b> and <b>OpenStreetMap Standard</b> raster tile servers. These are open, free, and require <b>zero API keys or credit card registration</b>.
                </p>
              </div>

              <div className="p-3 bg-slate-800/70 rounded-lg border border-slate-700/60 space-y-2">
                <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Where to get a Custom Map API Key?</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  If you want ultra-high-resolution 3D vector terrain or custom map styles, you can obtain a free API key from:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>
                    <a
                      href="https://cloud.maptiler.com/account/keys/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      MapTiler Cloud <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    — Free tier allows 100,000 tile requests/month forever.
                  </li>
                  <li>
                    <a
                      href="https://account.mapbox.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      Mapbox <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    — Free tier allows 50,000 vector tile requests/month.
                  </li>
                </ul>

                {/* Optional Key Input */}
                <div className="pt-2 border-t border-slate-700/60">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Enter Optional MapTiler API Key (Optional):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. your_maptiler_api_key"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSaveApiKey}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors flex items-center gap-1"
                    >
                      {savedKeySuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : 'Save'}
                    </button>
                  </div>
                  {savedKeySuccess && (
                    <p className="text-emerald-400 text-[11px] mt-1">
                      Key saved to browser localStorage!
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowApiInfoModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
