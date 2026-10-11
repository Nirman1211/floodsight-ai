import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Info, Key, Globe, RotateCcw, X, Check, ExternalLink, Box, Play, Pause } from 'lucide-react';
import type { AnalysisResult } from '../types/analysis';

interface MapViewerProps {
  result: AnalysisResult;
}

type BasemapType = 'google-hybrid' | 'google-roadmap' | 'google-terrain' | 'esri-satellite' | 'dark';

export const MapViewer: React.FC<MapViewerProps> = ({ result }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('google-hybrid');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [showApiInfoModal, setShowApiInfoModal] = useState<boolean>(false);

  const [googleApiKey, setGoogleApiKey] = useState<string>(() => {
    return localStorage.getItem('floodsight_gmaps_key') || '';
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

    // Center map around Trishuli Valley [85.27, 28.08] with 3D Himalayan gorge pitch
    const initialMap = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'google-hybrid': {
            type: 'raster',
            tiles: [
              'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            maxzoom: 20,
            attribution: '© Google Maps Platform Imagery',
          },
          'google-roadmap': {
            type: 'raster',
            tiles: [
              'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            maxzoom: 20,
            attribution: '© Google Maps Platform Roadmap',
          },
          'google-terrain': {
            type: 'raster',
            tiles: [
              'https://mt0.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            maxzoom: 20,
            attribution: '© Google Maps Platform Terrain Relief',
          },
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: '© Esri, Maxar, Earthstar Geographics',
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
            id: 'google-hybrid-layer',
            type: 'raster',
            source: 'google-hybrid',
            layout: { visibility: 'visible' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'google-roadmap-layer',
            type: 'raster',
            source: 'google-roadmap',
            layout: { visibility: 'none' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'google-terrain-layer',
            type: 'raster',
            source: 'google-terrain',
            layout: { visibility: 'none' },
            minzoom: 0,
            maxzoom: 20,
          },
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
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
      zoom: 11.2,
      pitch: 58, // Realistic 3D mountain gorge perspective
      bearing: -22,
    });

    initialMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    initialMap.on('load', () => {
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
            'fill-color': '#1d4ed8',
            'fill-opacity': 0.72,
          },
        });

        initialMap.addLayer({
          id: 'flood-outline',
          type: 'line',
          source: 'flood-data',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 2.5,
          },
        });
      }

      // 2. Downstream Flood Flow Path with Animated Pulsing Hydro Dash
      if (result.flood_flow_path_geojson) {
        initialMap.addSource('flow-path-data', {
          type: 'geojson',
          data: result.flood_flow_path_geojson,
        });

        initialMap.addLayer({
          id: 'flow-path-glow',
          type: 'line',
          source: 'flow-path-data',
          paint: {
            'line-color': '#06b6d4',
            'line-width': 6,
            'line-opacity': 0.45,
            'line-blur': 3,
          },
        });

        initialMap.addLayer({
          id: 'flow-path-line',
          type: 'line',
          source: 'flow-path-data',
          paint: {
            'line-color': '#22d3ee',
            'line-width': 3.5,
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
            'line-width': 4,
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
            'fill-opacity': 0.85,
          },
        });
      }

      // 5. Settlement Markers with 3D Pulsing Ring
      result.settlements.forEach((s) => {
        const isCutOff = s.status === 'newly_cut_off';
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center cursor-pointer';

        if (isCutOff) {
          el.innerHTML = `
            <div class="absolute w-7 h-7 rounded-full bg-rose-500/40 animate-ping"></div>
            <div class="relative w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          `;
        } else {
          el.innerHTML = `
            <div class="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
          `;
        }

        const popupContent = `
          <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 6px; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <h4 style="margin: 0; font-weight: 700; font-size: 13px;">${s.name}</h4>
              <span style="font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 600; background: ${isCutOff ? '#fee2e2; color: #dc2626' : '#dcfce7; color: #16a34a'}">
                ${isCutOff ? 'CUT OFF' : 'CONNECTED'}
              </span>
            </div>
            <p style="margin: 2px 0; font-size: 11px;"><b>Est. Population:</b> ${s.population_est.toLocaleString()}</p>
            <p style="margin: 2px 0; font-size: 11px;"><b>Hospital Distance:</b> ${s.baseline_distance_km} km</p>
            ${s.alternative_route_available ? '<p style="margin: 4px 0 0 0; font-size: 10px; color: #0284c7; font-weight: 500;">✓ Mountain Footpath Route Active</p>' : ''}
          </div>
        `;

        new maplibregl.Marker({ element: el })
          .setLngLat(s.coordinates)
          .setPopup(new maplibregl.Popup({ offset: 15 }).setHTML(popupContent))
          .addTo(initialMap);
      });
    });

    map.current = initialMap;

    const resizeObserver = new ResizeObserver(() => {
      if (initialMap) initialMap.resize();
    });

    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      initialMap.remove();
    };
  }, [result]);

  // Handle basemap switching
  const handleBasemapChange = (type: BasemapType) => {
    setActiveBasemap(type);
    if (!map.current) return;

    const layers: Record<BasemapType, string> = {
      'google-hybrid': 'google-hybrid-layer',
      'google-roadmap': 'google-roadmap-layer',
      'google-terrain': 'google-terrain-layer',
      'esri-satellite': 'esri-satellite-layer',
      'dark': 'carto-dark-layer',
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

  // Toggle 3D Perspective Mode
  const toggle3DMode = () => {
    if (!map.current) return;
    const nextMode = !is3DMode;
    setIs3DMode(nextMode);

    if (nextMode) {
      map.current.easeTo({
        pitch: 60,
        bearing: -25,
        duration: 1200,
      });
    } else {
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1200,
      });
    }
  };

  // Cinematic 3D Fly-Through Orbit along Himalayan Valley
  const toggleFlyThrough = () => {
    if (!map.current) return;

    if (isFlying) {
      setIsFlying(false);
      map.current.stop();
      return;
    }

    setIsFlying(true);
    const waypoints = [
      { center: [85.32, 28.18] as [number, number], zoom: 12.2, pitch: 65, bearing: -40, duration: 6000 },
      { center: [85.28, 28.12] as [number, number], zoom: 12.8, pitch: 60, bearing: 15, duration: 6000 },
      { center: [85.25, 28.05] as [number, number], zoom: 12.0, pitch: 55, bearing: -15, duration: 6000 },
      { center: [85.27, 28.08] as [number, number], zoom: 11.2, pitch: 58, bearing: -22, duration: 4000 },
    ];

    let step = 0;
    const flyNext = () => {
      if (!map.current) return;
      const wp = waypoints[step % waypoints.length];
      step++;
      map.current.flyTo({
        ...wp,
        essential: true,
      });
    };

    flyNext();
    const interval = setInterval(flyNext, 6200);

    const onUserInteraction = () => {
      clearInterval(interval);
      setIsFlying(false);
      map.current?.off('mousedown', onUserInteraction);
      map.current?.off('wheel', onUserInteraction);
    };

    map.current.on('mousedown', onUserInteraction);
    map.current.on('wheel', onUserInteraction);
  };

  // Reset View to Nepal valley
  const resetCamera = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: [85.27, 28.08],
      zoom: 11.2,
      pitch: is3DMode ? 58 : 0,
      bearing: is3DMode ? -22 : 0,
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

  // Save custom Google Maps Key
  const handleSaveGoogleKey = () => {
    if (googleApiKey.trim()) {
      localStorage.setItem('floodsight_gmaps_key', googleApiKey.trim());
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 2500);
    } else {
      localStorage.removeItem('floodsight_gmaps_key');
      setSavedKeySuccess(false);
    }
  };

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 right-14 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl z-10 text-xs">
        {/* Basemap Switcher */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleBasemapChange('google-hybrid')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
              activeBasemap === 'google-hybrid'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Real Google Maps Satellite with Roads & Place Labels"
          >
            <span>🛰️</span>
            <span>Google Hybrid</span>
          </button>

          <button
            onClick={() => handleBasemapChange('google-roadmap')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
              activeBasemap === 'google-roadmap'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Real Google Maps Street & Highway Network"
          >
            <span>🗺️</span>
            <span>Google Maps</span>
          </button>

          <button
            onClick={() => handleBasemapChange('google-terrain')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
              activeBasemap === 'google-terrain'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Google Topographic Mountain Relief & Contours"
          >
            <span>🏔️</span>
            <span>Terrain</span>
          </button>

          <button
            onClick={() => handleBasemapChange('esri-satellite')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
              activeBasemap === 'esri-satellite'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Esri Earth Observation Satellite Imagery"
          >
            <span>🌍</span>
            <span>Esri Space</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-slate-700 mx-1" />

        {/* 3D Realistic Perspective Toggle */}
        <button
          onClick={toggle3DMode}
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
            is3DMode
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Toggle 3D Himalayan Gorge Perspective (60° Pitch)"
        >
          <Box className="w-3.5 h-3.5" />
          <span>{is3DMode ? '3D Active' : '2D Nadir'}</span>
        </button>

        {/* Cinematic 3D Fly-Through Orbit */}
        <button
          onClick={toggleFlyThrough}
          className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-[11px] font-medium ${
            isFlying ? 'bg-amber-600 text-white animate-pulse' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Start Cinematic 3D Valley Flight along Trishuli Corridor"
        >
          {isFlying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          <span>{isFlying ? 'Pause Flight' : '3D Flight'}</span>
        </button>

        <button
          onClick={resetCamera}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Reset Camera to Focus"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowApiInfoModal(true)}
          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-[11px] font-medium"
          title="Google Maps API details & Configuration"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API Config</span>
        </button>
      </div>

      {/* Floating Disaster Layers Panel */}
      <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-xl z-10 w-64 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-200 border-b border-slate-800 pb-2 mb-2.5">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Tactical Geospatial Layers</span>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600 inline-block shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
              Flood Inundation & Debris
            </span>
            <input
              type="checkbox"
              checked={layersState.flood}
              onChange={() => toggleLayer('flood', ['flood-fill', 'flood-outline'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-1 rounded bg-rose-600 inline-block shadow-[0_0_6px_rgba(225,29,72,0.8)]" />
              Severed Road Segments
            </span>
            <input
              type="checkbox"
              checked={layersState.roads}
              onChange={() => toggleLayer('roads', ['roads-line'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
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
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="w-3 h-1 rounded bg-cyan-400 inline-block shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              Active Flow Path (Hydro)
            </span>
            <input
              type="checkbox"
              checked={layersState.flowPath}
              onChange={() => toggleLayer('flowPath', ['flow-path-line', 'flow-path-glow'])}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse" />
            Cut-Off Village
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Connected
          </span>
        </div>
      </div>

      {/* Google Maps Platform & API Configuration Modal */}
      {showApiInfoModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-100">Google Maps Platform & Basemap Architecture</h3>
              </div>
              <button
                onClick={() => setShowApiInfoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-1.5">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span>🗺️</span> Real Google Maps Active Out-of-the-Box
                </p>
                <p className="text-slate-400 leading-relaxed">
                  The application is configured with <b>Google Maps Hybrid, Roadmap, and Terrain Relief</b> tile layers. You can switch between satellite imagery, street topography, and dark mode in 1 click without requiring manual configuration.
                </p>
              </div>

              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 space-y-1.5">
                <p className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>Custom Google Maps API Key (Optional)</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  If you want to bind your dedicated Google Cloud project key:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>
                    Visit the{' '}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/credentials?utm_campaign=gmp_git_agentskills_v1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      Google Cloud Console Credentials <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    page to generate a production key.
                  </li>
                  <li>
                    Or explore the{' '}
                    <a
                      href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_git_agentskills_v1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      Maps Demo Key <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    for zero-cost prototyping.
                  </li>
                </ul>

                <div className="pt-2 border-t border-slate-700/60">
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Enter Google Maps API Key:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="AIzaSy..."
                      value={googleApiKey}
                      onChange={(e) => setGoogleApiKey(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleSaveGoogleKey}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition flex items-center gap-1"
                    >
                      {savedKeySuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : 'Save'}
                    </button>
                  </div>
                  {savedKeySuccess && (
                    <p className="text-emerald-400 text-[11px] mt-1">
                      Key securely stored in browser localStorage!
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowApiInfoModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition"
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
