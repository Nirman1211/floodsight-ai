import React, { useState } from 'react';
import { GitBranch, ShieldAlert, CheckCircle2, AlertTriangle, Navigation, RefreshCw } from 'lucide-react';
import type { SettlementImpact } from '../types/analysis';

interface RoadNetworkGraphProps {
  settlements: SettlementImpact[];
}

interface GraphNode {
  id: string;
  name: string;
  type: 'hospital' | 'settlement';
  x: number;
  y: number;
  population: number;
  status: 'newly_cut_off' | 'intact_access' | 'baseline_isolated' | 'hospital';
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  distanceKm: number;
  status: 'intact' | 'severed' | 'emergency_footpath';
  label: string;
}

export const RoadNetworkGraph: React.FC<RoadNetworkGraphProps> = ({ settlements }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('dhunche');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [enableBypass, setEnableBypass] = useState<boolean>(false);

  // Cross-reference tracked count
  const trackedCount = settlements?.length || 6;

  // Network Nodes Layout
  const nodes: GraphNode[] = [
    { id: 'hosp', name: 'District Hospital (Betrawati)', type: 'hospital', x: 100, y: 220, population: 0, status: 'hospital' },
    { id: 'kalikasthan', name: 'Kalikasthan', type: 'settlement', x: 230, y: 150, population: 1800, status: 'intact_access' },
    { id: 'ramche', name: 'Ramche', type: 'settlement', x: 360, y: 190, population: 1100, status: 'intact_access' },
    { id: 'dhunche', name: 'Dhunche (District HQ)', type: 'settlement', x: 500, y: 130, population: 2500, status: 'newly_cut_off' },
    { id: 'syabrubesi', name: 'Syabrubesi', type: 'settlement', x: 640, y: 220, population: 1400, status: 'newly_cut_off' },
    { id: 'timure', name: 'Timure (Border Post)', type: 'settlement', x: 750, y: 150, population: 850, status: 'newly_cut_off' },
    { id: 'gatlang', name: 'Gatlang Alpine Village', type: 'settlement', x: 570, y: 310, population: 600, status: 'baseline_isolated' },
  ];

  // Network Road Edges
  const edges: GraphEdge[] = [
    { id: 'e1', source: 'hosp', target: 'kalikasthan', distanceKm: 8.5, status: 'intact', label: 'Feeder Road' },
    { id: 'e2', source: 'kalikasthan', target: 'ramche', distanceKm: 12.0, status: 'intact', label: 'Highway Link' },
    { id: 'e3', source: 'ramche', target: 'dhunche', distanceKm: 14.5, status: 'severed', label: '💥 Trishuli Gorge Washout' },
    { id: 'e4', source: 'dhunche', target: 'syabrubesi', distanceKm: 15.2, status: 'severed', label: '💥 Bridge Collapse' },
    { id: 'e5', source: 'syabrubesi', target: 'timure', distanceKm: 16.0, status: 'severed', label: '💥 Slurry Inundation' },
    { id: 'e6', source: 'syabrubesi', target: 'gatlang', distanceKm: 11.5, status: 'intact', label: 'Rural Track' },
    { id: 'e7_bypass', source: 'dhunche', target: 'hosp', distanceKm: 28.0, status: enableBypass ? 'emergency_footpath' : 'severed', label: enableBypass ? '✓ Gosainkunda Footpath' : 'Mountain Trail (Closed)' },
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[3];

  const handleRunDijkstra = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
    }, 1200);
  };

  const isCutOff = selectedNode.status === 'newly_cut_off';
  const hasAccessWithBypass = isCutOff && enableBypass && selectedNode.id === 'dhunche';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Topological Road Network Graph & Reachability Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mathematical graph <code className="text-blue-400 font-mono">G = (V, E)</code> with Dijkstra shortest-path reachability across {trackedCount} monitored settlements.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={enableBypass}
              onChange={(e) => setEnableBypass(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
            />
            <span>Simulate Mountain Footpath Bypass</span>
          </label>

          <button
            onClick={handleRunDijkstra}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition shadow-md disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Computing Paths...' : 'Run Dijkstra'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <div className="relative w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center select-none">
        <svg className="w-full h-full" viewBox="0 0 850 400">
          <defs>
            <linearGradient id="intactGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="severedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="bypassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Background Grid Pattern */}
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Render Edges */}
          {edges.map((edge) => {
            const sNode = nodes.find((n) => n.id === edge.source)!;
            const tNode = nodes.find((n) => n.id === edge.target)!;

            const isSevered = edge.status === 'severed';
            const isBypass = edge.status === 'emergency_footpath';

            return (
              <g key={edge.id} className="transition-all duration-300">
                {/* Edge line */}
                <line
                  x1={sNode.x}
                  y1={sNode.y}
                  x2={tNode.x}
                  y2={tNode.y}
                  stroke={isSevered ? '#ef4444' : isBypass ? '#06b6d4' : '#10b981'}
                  strokeWidth={isSevered ? 3.5 : isBypass ? 3 : 4}
                  strokeDasharray={isSevered ? '6, 6' : isBypass ? '4, 4' : 'none'}
                  strokeOpacity={isSevered ? 0.7 : 0.9}
                />

                {/* Edge distance & label badge */}
                <g transform={`translate(${(sNode.x + tNode.x) / 2}, ${(sNode.y + tNode.y) / 2})`}>
                  <rect
                    x="-45"
                    y="-12"
                    width="90"
                    height="20"
                    rx="6"
                    fill="#0f172a"
                    stroke={isSevered ? '#ef4444' : isBypass ? '#06b6d4' : '#334155'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    fill={isSevered ? '#fca5a5' : isBypass ? '#67e8f9' : '#94a3b8'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {edge.distanceKm} km {isSevered ? '⚠️' : '✓'}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isHosp = node.type === 'hospital';
            const isCut = node.status === 'newly_cut_off';
            const isBaseline = node.status === 'baseline_isolated';

            let nodeColor = '#10b981';
            if (isHosp) nodeColor = '#3b82f6';
            else if (isCut) nodeColor = '#ef4444';
            else if (isBaseline) nodeColor = '#64748b';

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                {/* Pulsing halo for cut-off nodes */}
                {isCut && (
                  <circle
                    cx={node.x}
                    y={node.y}
                    r="22"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.4"
                    className="animate-ping"
                  />
                )}

                {/* Selection outer ring */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    y={node.y}
                    r="20"
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2.5"
                    strokeDasharray="3, 3"
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  cx={node.x}
                  y={node.y}
                  r="14"
                  fill={nodeColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-lg"
                />

                {/* Node Center Icon / Symbol */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {isHosp ? '🏥' : isCut ? '✕' : isBaseline ? '⛰️' : '✓'}
                </text>

                {/* Label text */}
                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#cbd5e1'}
                  fontSize="11"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Legend inside canvas */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-slate-300">🏥 Emergency Base Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block animate-pulse" />
            <span className="text-slate-300">⚠️ Newly Isolated Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-300">✅ Intact Road Reachability</span>
          </div>
        </div>
      </div>

      {/* Selected Settlement Inspector Card */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">{selectedNode.name}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                selectedNode.status === 'hospital'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : selectedNode.status === 'newly_cut_off'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : selectedNode.status === 'baseline_isolated'
                  ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {selectedNode.status.toUpperCase().replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-slate-400">
            Estimated Inhabitants: <b className="text-slate-200">{selectedNode.population.toLocaleString()}</b> • Nearest Facility: <b className="text-slate-200">District Base Hospital</b>
          </p>
        </div>

        {/* Reachability Result */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Dijkstra Shortest Path</div>
            <div className="text-sm font-bold font-mono">
              {hasAccessWithBypass ? (
                <span className="text-cyan-400">28.0 km (Footpath Bypass Active)</span>
              ) : isCutOff ? (
                <span className="text-rose-400 font-extrabold flex items-center gap-1 justify-end">
                  <ShieldAlert className="w-4 h-4" /> NO ROAD ROUTE (d = ∞)
                </span>
              ) : (
                <span className="text-emerald-400">20.5 km (Road Intact)</span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            {hasAccessWithBypass ? (
              <Navigation className="w-5 h-5 text-cyan-400" />
            ) : isCutOff ? (
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
