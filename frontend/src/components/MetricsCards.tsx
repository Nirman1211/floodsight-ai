import React from 'react';
import { Waves, Route, Landmark, Users } from 'lucide-react';
import type { AnalysisResult } from '../types/analysis';

interface MetricsProps {
  result: AnalysisResult;
}

export const MetricsCards: React.FC<MetricsProps> = ({ result }) => {
  const { total_flood_area_km2, total_flood_area_hectares, infrastructure, cut_off_settlements_count } = result;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Flood Extent */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Inundation Area</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{total_flood_area_km2}</span>
            <span className="text-xs font-semibold text-slate-400">km²</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {total_flood_area_hectares} hectares (SAR + NDWI)
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Waves className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Exposed Roads */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Exposed Road Network</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {infrastructure.exposed_road_length_km}
            </span>
            <span className="text-xs font-semibold text-slate-400">km</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {infrastructure.percentage_road_disrupted}% of valley highway
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Route className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Exposed Bridges & Buildings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Critical Bridges Hit</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">
              {infrastructure.exposed_bridges_count} / {infrastructure.total_bridges}
            </span>
            <span className="text-xs font-semibold text-slate-400">bridges</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {infrastructure.exposed_buildings_count} buildings in flood zone
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <Landmark className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Newly Cut-Off Settlements */}
      <div className="bg-slate-900/90 border border-rose-950/60 rounded-xl p-4 shadow-sm flex items-start justify-between bg-gradient-to-br from-slate-900 to-rose-950/20">
        <div>
          <p className="text-xs font-medium text-rose-300">Newly Cut-Off Settlements</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-500">
              {cut_off_settlements_count}
            </span>
            <span className="text-xs font-semibold text-slate-400">villages</span>
          </div>
          <p className="text-xs text-rose-400/80 mt-1">
            Zero road access to nearest hospital
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400">
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
