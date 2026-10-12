import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  Info,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Activity,
} from 'lucide-react';

export const BeforeAfterComparison: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [sensorBand, setSensorBand] = useState<'sar' | 'rgb' | 'mndwi' | 'cir'>('sar');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showHazardLabels, setShowHazardLabels] = useState<boolean>(true);

  // Live cursor telemetry state
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    lat: string;
    lng: string;
    elev: string;
    pixelVal: string;
    classLabel: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    // Approximate geographic coordinates in Trishuli gorge
    const latDeg = 28.12 - relY * 0.16;
    const lngDeg = 85.18 + relX * 0.14;
    const elev = Math.round(1450 + Math.sin(relX * 3.14) * 820 + (1 - relY) * 600);

    // Determine surface classification based on river channel geometry
    const riverDist = Math.abs(relX - (0.75 - relY * 0.55));
    let classLabel = 'Alpine Forest & Bedrock';
    let pixelVal = '-12.4 dB (Moderate Backscatter)';

    if (sensorBand === 'sar') {
      if (riverDist < 0.04) {
        classLabel = 'Pre-Event Stable Waterbed (Specular Reflection)';
        pixelVal = 'σ°: -21.8 dB (Low Specular)';
      } else if (riverDist < 0.14) {
        classLabel = 'Active Flood Inundation & Debris Slurry';
        pixelVal = 'σ°: -18.2 dB (Attenuated / Inundated)';
      } else if (riverDist < 0.18) {
        classLabel = 'Gravel Debris Fan / Landslide Deposit';
        pixelVal = 'σ°: -4.1 dB (High Surface Roughness)';
      }
    } else if (sensorBand === 'rgb') {
      if (riverDist < 0.04) {
        classLabel = 'Clear Glacial Riverflow';
        pixelVal = 'RGB: [56, 189, 248]';
      } else if (riverDist < 0.14) {
        classLabel = 'Turbid Silt & Torrential Flood Surge';
        pixelVal = 'RGB: [146, 64, 14]';
      } else {
        classLabel = 'Coniferous Forest Canopy';
        pixelVal = 'RGB: [16, 185, 129]';
      }
    } else if (sensorBand === 'mndwi') {
      if (riverDist < 0.14) {
        classLabel = 'Water Saturated Inundation Zone';
        pixelVal = 'MNDWI: +0.68 (High Water Index)';
      } else {
        classLabel = 'Dry Mountain Terrain';
        pixelVal = 'MNDWI: -0.42 (Non-Water Shadow)';
      }
    } else if (sensorBand === 'cir') {
      if (riverDist < 0.14) {
        classLabel = 'Scoured Riparian Zone & Slurry';
        pixelVal = 'NIR Loss: -62% Reflectance';
      } else {
        classLabel = 'Dense Alpine Foliage';
        pixelVal = 'NIR Peak: +88% Crimson Reflectance';
      }
    }

    setHoverData({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      lat: `${latDeg.toFixed(4)}° N`,
      lng: `${lngDeg.toFixed(4)}° E`,
      elev: `${elev} m MSL`,
      pixelVal,
      classLabel,
    });

    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  useEffect(() => {
    const stopDrag = () => setIsDragging(false);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, []);

  // Sensor definitions with technical parameters
  const bandDescriptions = {
    sar: {
      title: 'Sentinel-1 C-SAR Microwave Radar (VV Polarization)',
      desc: 'All-weather cloud penetration at 5.405 GHz. Smooth floodwater specularly reflects radar energy away (dark signal), while rough boulder debris deposits appear bright.',
      preBadge: 'Pre-Event SAR: 2026-08-18 (Track 019 Ascending)',
      postBadge: 'Post-Event SAR: 2026-08-30 (Track 019 Ascending)',
      sensorSpec: 'C-Band 5.405 GHz • 10m Pixel • σ° Calibrated dB',
    },
    rgb: {
      title: 'Sentinel-2 Multispectral True Color (RGB: B4-B3-B2)',
      desc: 'High-resolution optical reflectance revealing glacial sediment plume, swept vegetation cover, and swollen river channel through Trishuli Canyon.',
      preBadge: 'Pre-Event Optical: 2026-08-14 (S2B Tile 45RVP)',
      postBadge: 'Post-Event Optical: 2026-08-31 (S2A Tile 45RVP)',
      sensorSpec: 'Bands B04/B03/B02 • 10m GSD • Atmospheric BOA',
    },
    mndwi: {
      title: 'Modified Normalized Difference Water Index (MNDWI)',
      desc: 'MNDWI = (Green - SWIR) / (Green + SWIR). Suppresses steep Himalayan topographic shadow while extracting water and mud slurry in vivid electric cyan.',
      preBadge: 'Pre-Event Baseline MNDWI (Stable Threshold)',
      postBadge: 'Post-Event Inundation MNDWI (+1.36 km² Water)',
      sensorSpec: 'Green (B03) - SWIR (B11) • Threshold > 0.12',
    },
    cir: {
      title: 'Color Infrared False Color (CIR: B8-NIR, B4-Red, B3-Green)',
      desc: 'High near-infrared reflectance of healthy pine & rhododendron canopies appears bright crimson. Mudflow zones and torn vegetation appear dull grey/cyan.',
      preBadge: 'Pre-Event CIR Healthy Vegetation Canopy',
      postBadge: 'Post-Event CIR Scoured Mud & Bank Erosion',
      sensorSpec: 'NIR (B08) / Red (B04) / Green (B03) Composite',
    },
  };

  const current = bandDescriptions[sensorBand];

  // Helper to render high-detail procedural satellite graphic
  const renderSatelliteScene = (isPost: boolean) => {
    return (
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 560"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        <defs>
          {/* Speckle Noise for SAR radar */}
          <filter id="sarNoise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
            <feColorMatrix
              type="matrix"
              values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0.35 0"
            />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>

          {/* Topographic slope shading */}
          <linearGradient id="slopeGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#0f172a" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="slopeGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#1e293b" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.9" />
          </linearGradient>

          {/* Optical River Colors */}
          <linearGradient id="preRiverOpt" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <linearGradient id="postRiverOpt" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="35%" stopColor="#92400e" />
            <stop offset="65%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Water Index Inundation Gradient */}
          <linearGradient id="mndwiFlood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* 1. Base Mountain Slope Topography */}
        {sensorBand === 'sar' && (
          <rect
            width="1000"
            height="560"
            fill={isPost ? '#090d16' : '#111827'}
            filter="url(#sarNoise)"
          />
        )}
        {sensorBand === 'rgb' && (
          <rect
            width="1000"
            height="560"
            fill={isPost ? '#1c1917' : '#064e3b'}
          />
        )}
        {sensorBand === 'mndwi' && (
          <rect
            width="1000"
            height="560"
            fill="#090d16"
          />
        )}
        {sensorBand === 'cir' && (
          <rect
            width="1000"
            height="560"
            fill={isPost ? '#4c0519' : '#881337'}
          />
        )}

        {/* Mountain Ridge Facets & Terrain Shading */}
        <polygon points="0,0 350,140 220,380 0,560" fill="url(#slopeGradLeft)" opacity="0.6" />
        <polygon points="1000,0 680,180 820,440 1000,560" fill="url(#slopeGradRight)" opacity="0.6" />

        {/* Topographic Contour Lines */}
        {showContours && (
          <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" fill="none">
            <path d="M 0,80 Q 250,180 450,120 T 1000,160" />
            <path d="M 0,160 Q 300,260 520,200 T 1000,240" />
            <path d="M 0,260 Q 350,340 580,310 T 1000,340" />
            <path d="M 0,380 Q 400,430 650,420 T 1000,450" />
            <path d="M 0,480 Q 450,510 720,490 T 1000,530" />
          </g>
        )}

        {/* Pasang Lhamu Highway (NH09) Corridor */}
        <path
          d="M 800,0 Q 640,160 500,260 T 250,560"
          fill="none"
          stroke={isPost ? '#ef4444' : '#fbbf24'}
          strokeWidth={isPost ? '3' : '3.5'}
          strokeDasharray={isPost ? '10,7' : 'none'}
          opacity="0.85"
        />

        {/* Pre-Disaster Stable River Stream */}
        {!isPost && (
          <g>
            <path
              d="M 760,0 Q 610,170 470,270 T 220,560"
              fill="none"
              stroke={
                sensorBand === 'sar'
                  ? '#020617'
                  : sensorBand === 'mndwi'
                  ? '#06b6d4'
                  : sensorBand === 'cir'
                  ? '#1e1b4b'
                  : 'url(#preRiverOpt)'
              }
              strokeWidth="22"
              strokeLinecap="round"
              opacity="0.95"
            />
            {/* White-water rapids highlights */}
            <path
              d="M 760,0 Q 610,170 470,270 T 220,560"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="3"
              strokeDasharray="14,18"
              opacity="0.7"
            />
          </g>
        )}

        {/* Post-Disaster Swollen Flood Inundation & Debris Fan */}
        {isPost && (
          <g>
            {/* Wide Mud & Debris Deposit Alluvial Fan */}
            <path
              d="M 770,-10 Q 620,165 480,265 T 230,570"
              fill="none"
              stroke={
                sensorBand === 'sar'
                  ? '#94a3b8' // High roughness radar return
                  : sensorBand === 'cir'
                  ? '#64748b'
                  : '#78350f' // Silt/mud
              }
              strokeWidth="110"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Inundated Swollen Floodwater Channel */}
            <path
              d="M 760,-10 Q 610,170 470,270 T 220,570"
              fill="none"
              stroke={
                sensorBand === 'sar'
                  ? '#020617' // Specular radar absorption
                  : sensorBand === 'mndwi'
                  ? 'url(#mndwiFlood)'
                  : sensorBand === 'cir'
                  ? '#0f172a'
                  : 'url(#postRiverOpt)'
              }
              strokeWidth="78"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Glowing Red Boundary Contours of Detected Flood Polygon */}
            <path
              d="M 760,-10 Q 610,170 470,270 T 220,570"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              opacity="0.95"
            />

            {/* Severed Bridge Indicators */}
            {showHazardLabels && (
              <g>
                {/* Bridge 1: Syabrubesi Crossing */}
                <circle cx="560" cy="210" r="9" fill="#ef4444" fillOpacity="0.4" />
                <circle cx="560" cy="210" r="4.5" fill="#ef4444" />
                <text x="575" y="214" fill="#fecaca" fontSize="11" fontWeight="bold">
                  ⚠️ SYABRUBESI BRIDGE SEVERED
                </text>

                {/* Bridge 2: Timure Gorge Link */}
                <circle cx="340" cy="400" r="9" fill="#ef4444" fillOpacity="0.4" />
                <circle cx="340" cy="400" r="4.5" fill="#ef4444" />
                <text x="355" y="404" fill="#fecaca" fontSize="11" fontWeight="bold">
                  ⚠️ TIMURE ACCESS WASHED OUT
                </text>
              </g>
            )}
          </g>
        )}

        {/* Settlement Location Markers */}
        <g>
          {/* Dhunche District HQ */}
          <rect x="710" y="80" width="8" height="8" fill="#38bdf8" rx="2" />
          <text x="725" y="88" fill="#e2e8f0" fontSize="11" fontWeight="bold">
            Dhunche (HQ)
          </text>

          {/* Syabrubesi */}
          <rect x="530" y="170" width="8" height="8" fill={isPost ? '#f43f5e' : '#38bdf8'} rx="2" />
          <text x="440" y="178" fill={isPost ? '#fda4af' : '#e2e8f0'} fontSize="11" fontWeight="bold">
            Syabrubesi
          </text>

          {/* Timure */}
          <rect x="310" y="360" width="8" height="8" fill={isPost ? '#f43f5e' : '#38bdf8'} rx="2" />
          <text x="250" y="368" fill={isPost ? '#fda4af' : '#e2e8f0'} fontSize="11" fontWeight="bold">
            Timure
          </text>
        </g>

        {/* Geographic Crosshairs */}
        <g stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.8">
          <line x1="100" y1="20" x2="100" y2="40" />
          <line x1="90" y1="30" x2="110" y2="30" />
          <line x1="900" y1="520" x2="900" y2="540" />
          <line x1="890" y1="530" x2="910" y2="530" />
        </g>

        {/* HUD 500m Scale Bar */}
        <g transform="translate(40, 520)">
          <rect x="0" y="0" width="120" height="4" fill="#ffffff" fillOpacity="0.8" />
          <rect x="0" y="0" width="60" height="4" fill="#38bdf8" />
          <text x="0" y="-5" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            0
          </text>
          <text x="50" y="-5" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            250m
          </text>
          <text x="105" y="-5" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            500m
          </text>
        </g>
      </svg>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Pre vs Post-Flood Spaceborne Satellite Comparison
            </h2>
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
              10m Multi-Sensor Resolution
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare radar backscatter attenuation and optical water indices across the August 2026 Trishuli flood corridor.
          </p>
        </div>

        {/* Mode & Band Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Spectral Bands */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSensorBand('sar')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                sensorBand === 'sar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📡 SAR C-Band
            </button>
            <button
              onClick={() => setSensorBand('rgb')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                sensorBand === 'rgb' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌈 True Color
            </button>
            <button
              onClick={() => setSensorBand('mndwi')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                sensorBand === 'mndwi' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              💧 MNDWI Water
            </button>
            <button
              onClick={() => setSensorBand('cir')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                sensorBand === 'cir' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌿 CIR Infrared
            </button>
          </div>

          {/* Swipe vs Side-by-Side */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('slider')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                viewMode === 'slider' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Swipe Slider
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                viewMode === 'side-by-side' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-blue-400 px-1">{zoomLevel.toFixed(1)}x</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Info HUD Banner */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">{current.title}: </span>
            <span className="text-slate-400">{current.desc}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/50">
          <Activity className="w-3.5 h-3.5" />
          <span>{current.sensorSpec}</span>
        </div>
      </div>

      {/* Main Interactive Screen */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchMove={handleTouchMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-slate-800 select-none cursor-ew-resize shadow-2xl bg-slate-950"
        >
          {/* Post-Disaster Layer (Background) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {renderSatelliteScene(true)}

            {/* Post-Disaster Badge */}
            <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-rose-800/80 text-xs font-semibold text-rose-300 flex items-center gap-1.5 shadow-lg pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{current.postBadge} (DISASTER INUNDATION)</span>
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 pointer-events-none font-mono">
              Flood Inundation Footprint: 1.36 km² • 2 Severed Bridges
            </div>
          </div>

          {/* Pre-Disaster Layer (Clipped Foreground) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                width: containerRef.current?.offsetWidth || '100%',
              }}
            >
              {renderSatelliteScene(false)}

              {/* Pre-Disaster Badge */}
              <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-800/80 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 shadow-lg pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{current.preBadge} (STABLE BASELINE)</span>
              </div>

              <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 pointer-events-none font-mono">
                Normal River Channel • Pasang Lhamu Highway Intact
              </div>
            </div>
          </div>

          {/* Draggable Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.7)] flex items-center justify-center pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-slate-950 shadow-2xl border-2 border-slate-900 flex items-center justify-center text-xs font-black">
              ⇄
            </div>
          </div>

          {/* Live Mouse Hover Inspector HUD Tooltip */}
          {hoverData && (
            <div
              className="absolute z-20 pointer-events-none bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-[11px] space-y-1 font-mono text-slate-200"
              style={{
                left: Math.min(hoverData.x + 15, (containerRef.current?.offsetWidth || 600) - 240),
                top: Math.min(hoverData.y + 15, 400),
              }}
            >
              <div className="flex items-center gap-1.5 text-blue-400 font-bold border-b border-slate-800 pb-1">
                <Crosshair className="w-3.5 h-3.5" />
                <span>Telemetry Inspector</span>
              </div>
              <div><b>Coords:</b> {hoverData.lat}, {hoverData.lng}</div>
              <div><b>Elevation:</b> {hoverData.elev}</div>
              <div><b>Class:</b> <span className="text-amber-300">{hoverData.classLabel}</span></div>
              <div><b>Value:</b> <span className="text-emerald-400">{hoverData.pixelVal}</span></div>
            </div>
          )}
        </div>
      ) : (
        /* Side by Side Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pre-Disaster Card */}
          <div className="h-[440px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-xl bg-slate-950 flex flex-col justify-between">
            <div className="absolute inset-0 flex items-center justify-center">
              {renderSatelliteScene(false)}
            </div>
            <div className="p-4 z-10 flex justify-between items-start pointer-events-none">
              <div className="bg-slate-950/85 backdrop-blur px-3 py-1 rounded-lg border border-emerald-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{current.preBadge}</span>
              </div>
            </div>
            <div className="p-3 z-10 bg-slate-950/80 backdrop-blur border-t border-slate-800 text-[11px] font-mono text-slate-300">
              Stable Himalayan Riverbed Baseline • Highway Open
            </div>
          </div>

          {/* Post-Disaster Card */}
          <div className="h-[440px] rounded-2xl overflow-hidden border border-slate-800 relative shadow-xl bg-slate-950 flex flex-col justify-between">
            <div className="absolute inset-0 flex items-center justify-center">
              {renderSatelliteScene(true)}
            </div>
            <div className="p-4 z-10 flex justify-between items-start pointer-events-none">
              <div className="bg-slate-950/85 backdrop-blur px-3 py-1 rounded-lg border border-rose-800 text-xs font-semibold text-rose-400 flex items-center gap-1.5 shadow">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{current.postBadge}</span>
              </div>
            </div>
            <div className="p-3 z-10 bg-slate-950/80 backdrop-blur border-t border-slate-800 text-[11px] font-mono text-rose-300">
              1.36 km² Flood Surface • Mud Slurry & Bridge Washouts
            </div>
          </div>
        </div>
      )}

      {/* Auxiliary Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showContours}
              onChange={(e) => setShowContours(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Show 50m Elevation Contours</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showHazardLabels}
              onChange={(e) => setShowHazardLabels(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Show Severed Bridge Callouts</span>
          </label>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Pasang Lhamu Highway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Inundation Flood Perimeter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>Active River Channel</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterComparison;
