import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sliders, Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const CustomImageUpload: React.FC = () => {
  const [preFile, setPreFile] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [prePreview, setPrePreview] = useState<string | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const handlePreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreFile(file);
      setPrePreview(URL.createObjectURL(file));
    }
  };

  const handlePostFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostFile(file);
      setPostPreview(URL.createObjectURL(file));
    }
  };

  // Helper to generate quick synthetic test satellite images if user doesn't have files on hand
  const loadSampleSatelliteImages = async () => {
    setError(null);
    setLoading(true);
    try {
      const createSyntheticCanvas = (isPost: boolean): Promise<Blob> => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d')!;

        // Background terrain
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 400, 400);

        // Valley vegetation texture
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `rgba(16, 185, 129, ${Math.random() * 0.15})`;
          ctx.beginPath();
          ctx.arc(Math.random() * 400, Math.random() * 400, Math.random() * 60, 0, Math.PI * 2);
          ctx.fill();
        }

        // River stream
        ctx.beginPath();
        ctx.moveTo(350, 0);
        ctx.quadraticCurveTo(280, 200, 80, 400);
        ctx.strokeStyle = isPost ? '#0284c7' : '#38bdf8';
        ctx.lineWidth = isPost ? 55 : 15; // Flooded width vs normal width
        ctx.stroke();

        if (isPost) {
          // Debris sandbars
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 12;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
        }

        return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg'));
      };

      const preBlob = await createSyntheticCanvas(false);
      const postBlob = await createSyntheticCanvas(true);

      const samplePreFile = new File([preBlob], 'sample_pre_sentinel.jpg', { type: 'image/jpeg' });
      const samplePostFile = new File([postBlob], 'sample_post_sentinel.jpg', { type: 'image/jpeg' });

      setPreFile(samplePreFile);
      setPostFile(samplePostFile);
      setPrePreview(URL.createObjectURL(preBlob));
      setPostPreview(URL.createObjectURL(postBlob));
    } catch (e: any) {
      setError('Could not generate sample imagery');
    } finally {
      setLoading(false);
    }
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
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Image processing failed');
      }

      const data = await resp.json();
      setResult(data.analysis);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error processing uploaded images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Custom Satellite / Aerial Imagery Flood Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload your own pairs of pre- and post-flood satellite or drone imagery to perform automated change segmentation.
          </p>
        </div>

        <button
          onClick={loadSampleSatelliteImages}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 rounded-lg transition self-start"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Load Sample Flood Pair</span>
        </button>
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
                className="max-h-40 rounded-lg object-contain shadow-md mb-2 border border-slate-700"
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
                className="max-h-40 rounded-lg object-contain shadow-md mb-2 border border-slate-700"
              />
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                ✅ Post-Event Imagery Loaded ({postFile?.name})
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

      {/* Settings & Execution Button */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Sliders className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
              <span>Change Sensitivity</span>
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
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-900/30 transition"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Segmenting Water & Debris...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Run Automated Flood Segmentation</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="border border-slate-800 rounded-2xl p-5 bg-slate-950/90 space-y-5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Segmentation Results for Custom Upload</h3>
            </div>
            <span className="text-xs text-slate-400">
              {result.dimensions.width} × {result.dimensions.height} px
            </span>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Inundated Pixel Share</p>
              <p className="text-lg font-bold text-rose-400 mt-0.5">{result.inundated_percentage}%</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Flooded Pixels Detected</p>
              <p className="text-lg font-bold text-blue-400 mt-0.5">{result.inundated_pixels.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Estimated Area</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{result.estimated_area_km2} km²</p>
            </div>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 text-[11px]">Hectares Submerged</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{result.estimated_hectares} ha</p>
            </div>
          </div>

          {/* Rendered Visual Overlays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-300">Flood Inundation & Debris Overlay</p>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center p-2">
                <img
                  src={result.overlay_image_uri}
                  alt="Flood Overlay"
                  className="max-h-72 rounded-lg object-contain"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-300">Binary Water/Debris Segmentation Mask</p>
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center p-2">
                <img
                  src={result.binary_mask_uri}
                  alt="Binary Mask"
                  className="max-h-72 rounded-lg object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
