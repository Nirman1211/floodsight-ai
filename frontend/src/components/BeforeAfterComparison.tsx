import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Info } from 'lucide-react';

export const BeforeAfterComparison: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [sensorBand, setSensorBand] = useState<'sar' | 'rgb' | 'mndwi' | 'cir'>('sar');
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');

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
    if (!isDragging) return;
    handleMove(e.clientX);
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

  // Visual representations for each sensor band
  const bandDescriptions = {
    sar: {
      title: 'Sentinel-1 C-SAR Microwave Radar (VV Polarization)',
      desc: 'All-weather cloud penetration. Inundated floodwater acts as a specular reflector (dark channel), while rough rocky debris deposits on riverbanks appear bright.',
      preBadge: 'Pre-Event SAR: 2026-08-18 (Track 019)',
      postBadge: 'Post-Event SAR: 2026-08-30 (Track 019)',
      preStyle: 'linear-gradient(135deg, #1e293b 0%, #334155 40%, #475569 65%, #1e293b 100%)',
      postStyle: 'linear-gradient(135deg, #090d16 0%, #1e293b 30%, #0369a1 45%, #0284c7 50%, #1e293b 65%, #0f172a 100%)',
      overlayClass: 'sar-view',
    },
    rgb: {
      title: 'Sentinel-2 Optical True Color (RGB)',
      desc: 'High-resolution multispectral reflectance showing vegetation loss, river swelling, and sediment plume discharge along the Trishuli corridor.',
      preBadge: 'Pre-Event Optical: 2026-08-14 (S2B)',
      postBadge: 'Post-Event Optical: 2026-08-31 (S2A)',
      preStyle: 'linear-gradient(135deg, #064e3b 0%, #047857 40%, #10b981 60%, #064e3b 100%)',
      postStyle: 'linear-gradient(135deg, #064e3b 0%, #78350f 35%, #92400e 45%, #0284c7 52%, #78350f 65%, #064e3b 100%)',
      overlayClass: 'rgb-view',
    },
    mndwi: {
      title: 'Modified Normalized Difference Water Index (MNDWI)',
      desc: 'MNDWI = (Green - SWIR) / (Green + SWIR). Suppresses mountain terrain shadows while delineating turbulent sediment-laden glacial slurry in high contrast.',
      preBadge: 'Pre-Event MNDWI Baseline',
      postBadge: 'Post-Event MNDWI Inundation',
      preStyle: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 65%, #0f172a 100%)',
      postStyle: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 35%, #06b6d4 48%, #38bdf8 52%, #1e1b4b 65%, #0f172a 100%)',
      overlayClass: 'mndwi-view',
    },
    cir: {
      title: 'Color Infrared False Color (CIR: NIR, Red, Green)',
      desc: 'Healthy alpine pine & rhododendron forests reflect strongly in NIR (bright red), while swept-away riverbanks and mud deposits appear as dull cyan/grey.',
      preBadge: 'Pre-Event CIR Vegetation',
      postBadge: 'Post-Event Scour & Erosion',
      preStyle: 'linear-gradient(135deg, #881337 0%, #be123c 40%, #e11d48 65%, #881337 100%)',
      postStyle: 'linear-gradient(135deg, #881337 0%, #475569 38%, #64748b 48%, #0284c7 52%, #475569 65%, #881337 100%)',
      overlayClass: 'cir-view',
    },
  };

  const current = bandDescriptions[sensorBand];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Pre vs Post-Flood Satellite Image Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare satellite observations before and after the August 2026 glacial flood event.
          </p>
        </div>

        {/* View Mode & Band Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Spectral Mode Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSensorBand('sar')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                sensorBand === 'sar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📡 SAR Radar
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

          {/* Slider vs Side-by-Side */}
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
        </div>
      </div>

      {/* Sensor Description Bar */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">{current.title}: </span>
          <span className="text-slate-400">{current.desc}</span>
        </div>
      </div>

      {/* Main Interactive Comparison Screen */}
      {viewMode === 'slider' ? (
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchMove={handleTouchMove}
          className="relative w-full h-[460px] rounded-2xl overflow-hidden border border-slate-800 select-none cursor-ew-resize shadow-2xl bg-slate-950"
        >
          {/* Background Layer: POST-DISASTER (Full size) */}
          <div
            className="absolute inset-0 flex items-center justify-center p-6 text-white"
            style={{ background: current.postStyle }}
          >
            {/* Visual satellite river corridor illustration */}
            <div className="w-full h-full flex flex-col justify-between relative overflow-hidden pointer-events-none">
              <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-rose-400 flex items-center gap-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{current.postBadge} (DISASTER EXTENT)</span>
              </div>

              {/* Center River Channel Representation */}
              <div className="absolute inset-0 flex items-center justify-center opacity-70">
                <svg className="w-full h-full" viewBox="0 0 800 460" preserveAspectRatio="none">
                  {/* Surrounding Mountain Topography */}
                  <path d="M 0,0 L 250,150 L 500,80 L 800,200 L 800,0 Z" fill="#ffffff" fillOpacity="0.03" />
                  <path d="M 0,460 L 300,320 L 600,390 L 800,300 L 800,460 Z" fill="#ffffff" fillOpacity="0.03" />
                  
                  {/* Swollen Post-Flood Inundated Channel & Debris Slurry */}
                  <path
                    d="M 650,0 Q 550,180 400,230 T 150,460"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="58"
                    strokeLinecap="round"
                    strokeOpacity="0.85"
                  />
                  {/* Gravel Debris Deposits on Banks */}
                  <path
                    d="M 665,0 Q 565,180 415,230 T 165,460"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray="8,6"
                    strokeOpacity="0.9"
                  />
                  <path
                    d="M 635,0 Q 535,180 385,230 T 135,460"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="14"
                    strokeDasharray="8,6"
                    strokeOpacity="0.9"
                  />
                </svg>
              </div>

              <div className="absolute bottom-4 right-4 bg-slate-950/80 px-2.5 py-1 rounded text-[11px] text-slate-300">
                Trishuli Canyon Floor: 1.36 km² Inundation & Debris Deposit
              </div>
            </div>
          </div>

          {/* Foreground Layer: PRE-DISASTER (Clipped by slider position) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center text-white"
              style={{
                width: containerRef.current?.offsetWidth || '100%',
                background: current.preStyle,
              }}
            >
              <div className="w-full h-full flex flex-col justify-between relative overflow-hidden pointer-events-none p-6">
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{current.preBadge} (BASELINE)</span>
                </div>

                {/* Normal Pre-Flood River Flow */}
                <div className="absolute inset-0 flex items-center justify-center opacity-70">
                  <svg className="w-full h-full" viewBox="0 0 800 460" preserveAspectRatio="none">
                    <path
                      d="M 650,0 Q 550,180 400,230 T 150,460"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeOpacity="0.8"
                    />
                  </svg>
                </div>

                <div className="absolute bottom-4 left-4 bg-slate-950/80 px-2.5 py-1 rounded text-[11px] text-slate-300">
                  Normal Stable Himalayan Riverbed
                </div>
              </div>
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border-2 border-slate-900 flex items-center justify-center text-xs font-black">
              ⇄
            </div>
          </div>
        </div>
      ) : (
        /* Side by Side Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="h-[380px] rounded-2xl p-5 flex flex-col justify-between border border-slate-800 relative overflow-hidden shadow-md"
            style={{ background: current.preStyle }}
          >
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-emerald-400 inline-flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{current.preBadge}</span>
            </div>
            <div className="text-center font-bold text-sm text-slate-200">
              Pre-Disaster Baseline State (Stable Channel)
            </div>
          </div>

          <div
            className="h-[380px] rounded-2xl p-5 flex flex-col justify-between border border-slate-800 relative overflow-hidden shadow-md"
            style={{ background: current.postStyle }}
          >
            <div className="bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-rose-400 inline-flex items-center gap-1.5 self-start">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>{current.postBadge}</span>
            </div>
            <div className="text-center font-bold text-sm text-slate-200">
              Post-Disaster Inundation & Sediment Slurry
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
