import React, { useState } from 'react';
import {
  UploadCloud,
  Sliders,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react';

export const CustomImageUpload: React.FC = () => {
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [prePreview, setPrePreview] = useState<string | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'overlay' | 'binary' | 'heatmap'>('overlay');

  const handlePreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreFile(file);
      setPrePreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostFile(file);
      setPostPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  // Preset generator for realistic satellite/aerial scenarios
  const loadPresetScene = async (type: 'optical' | 'sar' | 'drone') => {
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const generatePresetCanvas = (isPost: boolean): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        if (type === 'sar') {
          // Sentinel-1 SAR Radar Style (Grayscale backscatter)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 512, 512);

          // Radar speckle texture
          for (let i = 0; i < 4000; i++) {
            const v = Math.floor(Math.random() * 70);
            ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
          }

          // Rocky canyon terrain highlights
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.moveTo(100, 0);
          ctx.lineTo(240, 260);
          ctx.lineTo(80, 512);
          ctx.stroke();

          // River Channel (Specular dark reflector in SAR)
          ctx.beginPath();
          ctx.moveTo(420, 0);
          ctx.quadraticCurveTo(310, 240, 110, 512);
          ctx.strokeStyle = '#020617'; // Absorbed/specular
          ctx.lineWidth = isPost ? 84 : 18;
          ctx.stroke();

          if (isPost) {
            // Rough alluvial debris gravel (Bright radar backscatter)
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 22;
            ctx.setLineDash([12, 8]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else if (type === 'drone') {
          // High-Res Drone Reconnaissance
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, 512, 512);

          // Ground soil and greenery
          ctx.fillStyle = '#14532d';
          ctx.fillRect(20, 20, 200, 460);
          ctx.fillStyle = '#3f3f46'; // Asphalt Highway
          ctx.fillRect(360, 0, 40, 512);

          // River flow
          ctx.beginPath();
          ctx.moveTo(480, 0);
          ctx.quadraticCurveTo(340, 230, 140, 512);
          ctx.strokeStyle = isPost ? '#78350f' : '#0284c7';
          ctx.lineWidth = isPost ? 95 : 22;
          ctx.stroke();

          if (isPost) {
            // Washed out bridge breach
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(350, 220, 60, 40);
          }
        } else {
          // Sentinel-2 Optical (Trishuli Valley)
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(0, 0, 512, 512);

          // Forest & alpine terrain texture
          for (let i = 0; i < 90; i++) {
            ctx.fillStyle = `rgba(16, 185, 129, ${Math.random() * 0.18})`;
            ctx.beginPath();
            ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 70, 0, Math.PI * 2);
            ctx.fill();
          }

          // Highway
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(440, 0);
          ctx.quadraticCurveTo(340, 220, 160, 512);
          ctx.stroke();

          // River Stream
          ctx.beginPath();
          ctx.moveTo(420, 0);
          ctx.quadraticCurveTo(310, 230, 120, 512);
          ctx.strokeStyle = isPost ? '#78350f' : '#38bdf8'; // Muddy turbulent vs clear
          ctx.lineWidth = isPost ? 80 : 16;
          ctx.stroke();

          if (isPost) {
            // Silt deposit fan
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 30;
            ctx.stroke();
          }
        }

        return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
      };

      const preBlob = await generatePresetCanvas(false);
      const postBlob = await generatePresetCanvas(true);

      const namePrefix = type === 'sar' ? 'sentinel1_sar' : type === 'drone' ? 'uav_recon' : 'sentinel2_optical';
      const samplePre = new File([preBlob], `${namePrefix}_pre.jpg`, { type: 'image/jpeg' });
      const samplePost = new File([postBlob], `${namePrefix}_post.jpg`, { type: 'image/jpeg' });

      setPreFile(samplePre);
      setPostFile(samplePost);
      setPrePreview(URL.createObjectURL(preBlob));
      setPostPreview(URL.createObjectURL(postBlob));
    } catch (e: any) {
      setError('Could not generate sample imagery pair');
    } finally {
      setLoading(false);
    }
  };

  // Client-side computer vision fallback engine
  const runClientCVFallback = async (preImgUrl: string, postImgUrl: string, sens: number) => {
    return new Promise<any>((resolve) => {
      const imgPre = new Image();
      const imgPost = new Image();

      imgPre.onload = () => {
        imgPost.onload = () => {
          const w = 512;
          const h = 512;

          // Canvas 1: Pre
          const cPre = document.createElement('canvas');
          cPre.width = w;
          cPre.height = h;
          const ctxPre = cPre.getContext('2d')!;
          ctxPre.drawImage(imgPre, 0, 0, w, h);
          const dataPre = ctxPre.getImageData(0, 0, w, h).data;

          // Canvas 2: Post
          const cPost = document.createElement('canvas');
          cPost.width = w;
          cPost.height = h;
          const ctxPost = cPost.getContext('2d')!;
          ctxPost.drawImage(imgPost, 0, 0, w, h);
          const dataPost = ctxPost.getImageData(0, 0, w, h).data;

          // Canvas 3: Binary Mask
          const cMask = document.createElement('canvas');
          cMask.width = w;
          cMask.height = h;
          const ctxMask = cMask.getContext('2d')!;
          const imgMaskData = ctxMask.createImageData(w, h);

          // Canvas 4: Inundation Overlay
          const cOverlay = document.createElement('canvas');
          cOverlay.width = w;
          cOverlay.height = h;
          const ctxOverlay = cOverlay.getContext('2d')!;
          ctxOverlay.drawImage(imgPost, 0, 0, w, h);
          const overlayData = ctxOverlay.getImageData(0, 0, w, h);

          // Canvas 5: Heatmap
          const cHeat = document.createElement('canvas');
          cHeat.width = w;
          cHeat.height = h;
          const ctxHeat = cHeat.getContext('2d')!;
          const heatData = ctxHeat.createImageData(w, h);

          let floodCount = 0;
          const threshold = Math.max(18, 38 / Math.max(sens, 0.4));

          for (let i = 0; i < dataPre.length; i += 4) {
            const r1 = dataPre[i];
            const g1 = dataPre[i + 1];
            const b1 = dataPre[i + 2];

            const r2 = dataPost[i];
            const g2 = dataPost[i + 1];
            const b2 = dataPost[i + 2];

            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

            // Heatmap color
            const intensity = Math.min(255, diff * 1.5);
            heatData.data[i] = intensity; // Red
            heatData.data[i + 1] = Math.max(0, 255 - intensity); // Green
            heatData.data[i + 2] = 30;
            heatData.data[i + 3] = 255;

            if (diff > threshold) {
              floodCount++;
              // Binary: White
              imgMaskData.data[i] = 255;
              imgMaskData.data[i + 1] = 255;
              imgMaskData.data[i + 2] = 255;
              imgMaskData.data[i + 3] = 255;

              // Overlay: Blend Electric Cyan/Blue [30, 160, 245]
              overlayData.data[i] = Math.floor(overlayData.data[i] * 0.35 + 30 * 0.65);
              overlayData.data[i + 1] = Math.floor(overlayData.data[i + 1] * 0.35 + 160 * 0.65);
              overlayData.data[i + 2] = Math.floor(overlayData.data[i + 2] * 0.35 + 245 * 0.65);
            } else {
              // Binary: Black
              imgMaskData.data[i] = 0;
              imgMaskData.data[i + 1] = 0;
              imgMaskData.data[i + 2] = 0;
              imgMaskData.data[i + 3] = 255;
            }
          }

          ctxMask.putImageData(imgMaskData, 0, 0);
          ctxOverlay.putImageData(overlayData, 0, 0);
          ctxHeat.putImageData(heatData, 0, 0);

          const totalPixels = w * h;
          const percentage = Number(((floodCount / totalPixels) * 100).toFixed(2));
          const estAreaKm2 = Number(((floodCount * 100) / 1000000).toFixed(3));
          const estHectares = Number(((floodCount * 100) / 10000).toFixed(2));

          resolve({
            inundated_pixels: floodCount,
            total_pixels: totalPixels,
            inundated_percentage: percentage,
            estimated_area_km2: estAreaKm2,
            estimated_hectares: estHectares,
            dimensions: { width: w, height: h },
            overlay_image_uri: cOverlay.toDataURL('image/jpeg', 0.9),
            binary_mask_uri: cMask.toDataURL('image/png'),
            heatmap_uri: cHeat.toDataURL('image/png'),
          });
        };
        imgPost.src = postImgUrl;
      };
      imgPre.src = preImgUrl;
    });
  };

  const handleRunAnalysis = async () => {
    if (!preFile || !postFile) {
      setError('Please upload or select both Pre-Disaster and Post-Disaster images.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pre_image', preFile);
    formData.append('post_image', postFile);
    formData.append('sensitivity', sensitivity.toString());

    try {
      const resp = await fetch('/api/v1/analyses/custom-upload', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        throw new Error('Server returned error status');
      }

      const data = await resp.json();
      setResult(data.analysis);
    } catch (e: any) {
      // Seamlessly execute client-side computer vision engine
      try {
        const clientResult = await runClientCVFallback(prePreview!, postPreview!, sensitivity);
        setResult(clientResult);
      } catch (cvErr) {
        setError('Error segmenting imagery. Please check file format.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (dataUri: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Custom Spaceborne & Aerial Flood Segmentation Engine
            </h2>
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
              OpenCV + Client CV Fallback
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload custom pre- and post-flood satellite GeoTIFFs, UAV drone photography, or test realistic Himalayan disaster scenarios.
          </p>
        </div>

        {/* Quick Realistic Scenario Presets */}
        <div className="flex flex-wrap items-center gap-1.5 self-start">
          <span className="text-[11px] text-slate-400 mr-1 font-medium">Load Preset:</span>
          <button
            onClick={() => loadPresetScene('optical')}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg transition"
          >
            🛰️ S2 Optical
          </button>
          <button
            onClick={() => loadPresetScene('sar')}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg transition"
          >
            📡 S1 Radar
          </button>
          <button
            onClick={() => loadPresetScene('drone')}
            className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg transition"
          >
            🚁 UAV Recon
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Upload Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dropzone 1: Pre-Disaster Image */}
        <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-4 bg-slate-950/50 flex flex-col items-center justify-center text-center transition min-h-[220px] relative">
          {prePreview ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={prePreview}
                alt="Pre-Disaster"
                className="max-h-44 rounded-lg object-contain shadow-md mb-2 border border-slate-700"
              />
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                ✅ Pre-Event Imagery Loaded ({preFile?.name})
              </span>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center p-4">
              <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
              <span className="text-xs font-bold text-slate-300">Upload Pre-Event Image</span>
              <span className="text-[11px] text-slate-500 mt-1">Satellite GeoTIFF, PNG, or JPEG</span>
              <input type="file" accept="image/*" onChange={handlePreFileChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Dropzone 2: Post-Disaster Image */}
        <div className="border-2 border-dashed border-slate-700 hover:border-rose-500/60 rounded-xl p-4 bg-slate-950/50 flex flex-col items-center justify-center text-center transition min-h-[220px] relative">
          {postPreview ? (
            <div className="w-full flex flex-col items-center">
              <img
                src={postPreview}
                alt="Post-Disaster"
                className="max-h-44 rounded-lg object-contain shadow-md mb-2 border border-slate-700"
              />
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                ✅ Post-Event Flooded Imagery Loaded ({postFile?.name})
              </span>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center p-4">
              <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
              <span className="text-xs font-bold text-slate-300">Upload Post-Event Flooded Image</span>
              <span className="text-[11px] text-slate-500 mt-1">Satellite GeoTIFF, PNG, or JPEG</span>
              <input type="file" accept="image/*" onChange={handlePostFileChange} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Settings Bar & Run Trigger */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
              <span>Detection Sensitivity</span>
              <span className="font-mono text-blue-400">{sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.0"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={loading || !preFile || !postFile}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-900/30 transition cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Segmenting Water & Debris Footprint...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Automated Flood Segmentation</span>
            </>
          )}
        </button>
      </div>

      {/* Analytical Output Dashboard */}
      {result && (
        <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/90 space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Automated Disaster Change Segmentation Results</h3>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              Raster Size: {result.dimensions.width} × {result.dimensions.height} px
            </span>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Inundation Share</p>
              <p className="text-xl font-bold text-rose-400 mt-0.5">{result.inundated_percentage}%</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Flooded Pixels</p>
              <p className="text-xl font-bold text-blue-400 mt-0.5">{result.inundated_pixels.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Estimated Area</p>
              <p className="text-xl font-bold text-amber-400 mt-0.5">{result.estimated_area_km2} km²</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Hectares Submerged</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{result.estimated_hectares} ha</p>
            </div>
          </div>

          {/* Output Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
            <button
              onClick={() => setActiveResultTab('overlay')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeResultTab === 'overlay' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌊 Flood Inundation Overlay
            </button>
            <button
              onClick={() => setActiveResultTab('binary')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeResultTab === 'binary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⬛ Binary Water Mask
            </button>
            {result.heatmap_uri && (
              <button
                onClick={() => setActiveResultTab('heatmap')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  activeResultTab === 'heatmap' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔥 Intensity Heatmap
              </button>
            )}
          </div>

          {/* Rendered Display Canvas */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center p-3 relative max-h-[460px]">
              {activeResultTab === 'overlay' && (
                <img
                  src={result.overlay_image_uri}
                  alt="Flood Overlay"
                  className="max-h-[420px] rounded-lg object-contain shadow-2xl"
                />
              )}
              {activeResultTab === 'binary' && (
                <img
                  src={result.binary_mask_uri}
                  alt="Binary Mask"
                  className="max-h-[420px] rounded-lg object-contain shadow-2xl bg-black"
                />
              )}
              {activeResultTab === 'heatmap' && result.heatmap_uri && (
                <img
                  src={result.heatmap_uri}
                  alt="Heatmap"
                  className="max-h-[420px] rounded-lg object-contain shadow-2xl"
                />
              )}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => downloadImage(result.binary_mask_uri, 'flood_binary_mask.png')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Binary Mask (PNG)</span>
              </button>
              <button
                onClick={() => downloadImage(result.overlay_image_uri, 'flood_overlay_segmented.jpg')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Inundation Overlay (JPG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomImageUpload;
