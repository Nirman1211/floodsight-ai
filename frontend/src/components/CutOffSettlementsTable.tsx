import React from 'react';
import type { SettlementImpact } from '../types/analysis';
import { AlertTriangle, CheckCircle, Navigation } from 'lucide-react';

interface SettlementsTableProps {
  settlements: SettlementImpact[];
}

export const CutOffSettlementsTable: React.FC<SettlementsTableProps> = ({ settlements }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Settlement Isolation & Road Network Status</h3>
          <p className="text-xs text-slate-400">
            Computed via Dijkstra shortest path routing on topological road network graph
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {settlements.filter((s) => s.status === 'newly_cut_off').length} Isolated
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/60 uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-2.5">Settlement Name</th>
              <th className="px-4 py-2.5">Population</th>
              <th className="px-4 py-2.5">Pre-Disaster Distance</th>
              <th className="px-4 py-2.5">Post-Disaster Access</th>
              <th className="px-4 py-2.5">Alternative Bypass</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {settlements.map((s) => {
              const isCutOff = s.status === 'newly_cut_off';
              return (
                <tr key={s.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-2.5 font-medium text-slate-200 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isCutOff ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                    {s.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{s.population_est.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-slate-400">{s.baseline_distance_km} km to hosp</td>
                  <td className="px-4 py-2.5">
                    {isCutOff ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        CUT OFF (Zero Road)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        Intact Access
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {s.alternative_route_available ? (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                        <Navigation className="w-3 h-3" />
                        High Ridge Track Active
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
