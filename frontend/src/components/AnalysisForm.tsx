import React, { useState } from 'react';
import { X, Play, Satellite, Calendar, MapPin, Mountain } from 'lucide-react';

interface AnalysisFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [name, setName] = useState('Trishuli River Valley GLOF');
  const [eventDate, setEventDate] = useState('2026-08-26');
  const [minLon, setMinLon] = useState(85.15);
  const [minLat, setMinLat] = useState(27.90);
  const [maxLon, setMaxLon] = useState(85.35);
  const [maxLat, setMaxLat] = useState(28.18);
  const [slopeThreshold, setSlopeThreshold] = useState(15.0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      event_date: eventDate,
      bbox: [Number(minLon), Number(minLat), Number(maxLon), Number(maxLat)],
      slope_threshold_deg: Number(slopeThreshold),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Satellite className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white">Configure New Disaster Analysis</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Scenario / Location Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Event Date (Flood Inundation)
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Bounding Box Coordinates [min_lon, min_lat, max_lon, max_lat]
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Min Lon"
                value={minLon}
                onChange={(e) => setMinLon(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Min Lat"
                value={minLat}
                onChange={(e) => setMinLat(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Max Lon"
                value={maxLon}
                onChange={(e) => setMaxLon(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Max Lat"
                value={maxLat}
                onChange={(e) => setMaxLat(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Mountain className="w-3.5 h-3.5 text-blue-400" />
              DEM Slope Gating Threshold (Degrees)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={slopeThreshold}
                onChange={(e) => setSlopeThreshold(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-slate-200">{slopeThreshold}°</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Pixels with mountain slope steeper than this are masked out to eliminate radar shadows.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              {loading ? 'Processing Satellites...' : 'Launch Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
