import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Map, Trophy, Compass, ArrowUpRight, BedDouble, Pill, Users } from "lucide-react";

export const Centers = () => {
  const { centers, stock, attendance, t } = useApp();
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const activeCenterId = selectedCenterId || centers[0]?.id || "";

  // Sorted rankings list (Trophy list)
  const rankedCenters = [...centers].sort((a, b) => b.healthScore - a.healthScore);

  const defaultCenterPlaceholder = { 
    id: "none", 
    centerName: "No Hospital Center Registered", 
    type: "PHC", 
    district: "N/A", 
    capacity: 0, 
    bedsAvailable: 0, 
    bedsOccupied: 0, 
    healthScore: 0 
  };

  const selectedCenter = centers.find(c => c.id === activeCenterId) || centers[0] || defaultCenterPlaceholder;
  const centerStocks = stock.filter(s => s.centerId === selectedCenter.id);
  const centerDocs = attendance.filter(a => a.centerId === selectedCenter.id);

  // SVG dimensions for map
  const mapWidth = 450;
  const mapHeight = 300;

  // Dynamically scale Latitude & Longitude to map layout dimensions
  const getProjectedCoords = (center) => {
    const latMin = 13.5;
    const latMax = 15.5;
    const lngMin = 76.5;
    const lngMax = 78.5;

    const lat = center.latitude || 14.5;
    const lng = center.longitude || 77.5;

    const x = 50 + ((lng - lngMin) / (lngMax - lngMin)) * (mapWidth - 100);
    const y = 50 + (1 - (lat - latMin) / (latMax - latMin)) * (mapHeight - 100);

    return { 
      x: Math.max(20, Math.min(mapWidth - 20, x)), 
      y: Math.max(20, Math.min(mapHeight - 20, y)) 
    };
  };

  const getPinColor = (score) => {
    if (score >= 80) return { fill: "#22c55e", ring: "rgba(34, 197, 94, 0.4)", text: "text-emerald-500" };
    if (score >= 60) return { fill: "#f59e0b", ring: "rgba(245, 158, 11, 0.4)", text: "text-amber-500" };
    return { fill: "#ef4444", ring: "rgba(239, 68, 68, 0.4)", text: "text-red-500" };
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <Map className="w-6 h-6 text-teal-700" />
          <span>Interactive District Heatmap</span>
        </h2>
        <p className="text-2xs text-slate-400 font-semibold uppercase">Tactical coordinate map monitoring health score metrics</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG Map Section (Col Span 7) */}
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 animate-spin" />
                <span>Geospatial Node Tracker</span>
              </span>
              <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full uppercase border border-slate-800">
                District: Anantapur
              </span>
            </div>

            {/* SVG Canvas Map */}
            <div className="relative border border-slate-850 rounded-xl overflow-hidden bg-slate-900/60 p-4 flex items-center justify-center">
              <svg width="100%" height={320} viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="max-w-full">
                
                {/* Stylized background paths representing district borders */}
                <path 
                  d="M50,150 Q100,30 220,50 T380,80 T400,240 T280,280 T80,220 Z" 
                  fill="none" 
                  stroke="#1e293b" 
                  strokeWidth={2}
                  strokeDasharray="4 4" 
                />
                
                <path 
                  d="M100,100 L200,60 L300,120 L350,220 L250,250 L120,200 Z" 
                  fill="none" 
                  stroke="#334155" 
                  strokeWidth={1} 
                />

                {/* Radar Grid Rings */}
                <circle cx={225} cy={150} r={60} fill="none" stroke="rgba(15, 118, 110, 0.1)" strokeWidth={1} />
                <circle cx={225} cy={150} r={120} fill="none" stroke="rgba(15, 118, 110, 0.05)" strokeWidth={1} />

                {/* Pulse coordinate pins */}
                {centers.map(center => {
                  const coord = getProjectedCoords(center);
                  const color = getPinColor(center.healthScore);
                  const isSelected = activeCenterId === center.id;

                  return (
                    <g 
                      key={center.id} 
                      className="cursor-pointer"
                      onClick={() => setSelectedCenterId(center.id)}
                    >
                      {/* Pulse ring */}
                      <circle 
                        cx={coord.x} 
                        cy={coord.y} 
                        r={isSelected ? 16 : 10} 
                        fill="none" 
                        stroke={color.fill} 
                        strokeWidth={2} 
                        className="animate-ping opacity-60" 
                      />
                      
                      {/* Inner Pin */}
                      <circle 
                        cx={coord.x} 
                        cy={coord.y} 
                        r={isSelected ? 8 : 6} 
                        fill={color.fill} 
                        className="transition-all duration-300 hover:scale-125"
                      />

                      {/* Text Label */}
                      <text 
                        x={coord.x + 10} 
                        y={coord.y + 4} 
                        fill="#fff" 
                        fontSize={8} 
                        fontWeight="bold"
                        className="select-none fill-slate-300 hover:fill-white uppercase tracking-wider"
                      >
                        {center.centerName.replace("PHC ", "").replace("CHC ", "")}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Selected Center Summary Details Panel (Col Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                  {selectedCenter.centerName}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Type: {selectedCenter.type} • Dist: {selectedCenter.district}
                </p>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  selectedCenter.healthScore >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  selectedCenter.healthScore >= 60 ? "bg-amber-50 border-amber-100 text-amber-600" :
                  "bg-red-50 border-red-100 text-red-600"
                }`}>
                  Health: {selectedCenter.healthScore}%
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <div className="text-slate-400 flex justify-center mb-1">
                  <BedDouble className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Beds</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {selectedCenter.bedsAvailable} / {selectedCenter.capacity}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <div className="text-slate-400 flex justify-center mb-1">
                  <Pill className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Low Stock</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {centerStocks.filter(s => s.quantity <= s.threshold).length} items
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <div className="text-slate-400 flex justify-center mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Docs Present</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {centerDocs.filter(d => d.status === "Present").length} / {centerDocs.length}
                </p>
              </div>
            </div>

            {/* Medicine details */}
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Medicine Stock details</h4>
            <div className="space-y-2 border-b border-slate-100 pb-4 mb-4">
              {centerStocks.map(stockItem => (
                <div key={stockItem.id} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">{stockItem.medicineName}</span>
                  <span className={`font-bold ${
                    stockItem.quantity <= stockItem.threshold ? "text-red-500" : "text-slate-700"
                  }`}>
                    {stockItem.quantity} Units (Threshold: {stockItem.threshold})
                  </span>
                </div>
              ))}
            </div>

            {/* Doctor roster */}
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Physicians Roster</h4>
            <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
              {centerDocs.map(doc => (
                <div key={doc.id} className="flex justify-between items-center text-2xs font-semibold text-slate-500">
                  <span>{doc.doctorName} ({doc.specialty})</span>
                  <span className={`font-bold ${doc.status === "Present" ? "text-emerald-500" : "text-red-500"}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Leaderboard Table Rankings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">PHC Performance Rankings</h3>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              <th className="py-2.5 px-4 text-center">Rank</th>
              <th className="py-2.5 px-4">Center Node</th>
              <th className="py-2.5 px-4 text-center">Beds Occupancy</th>
              <th className="py-2.5 px-4 text-center">Medicine Stocks</th>
              <th className="py-2.5 px-4 text-center">Doctor Presence</th>
              <th className="py-2.5 px-4 text-right">Health Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {rankedCenters.map((center, index) => {
              const cStocks = stock.filter(s => s.centerId === center.id);
              const cDocs = attendance.filter(a => a.centerId === center.id);
              const lowStocks = cStocks.filter(s => s.quantity <= s.threshold).length;
              const absentDocs = cDocs.filter(d => d.status === "Absent").length;

              return (
                <tr key={center.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block w-5 h-5 rounded-full text-center leading-5 font-bold ${
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-slate-200 text-slate-700" :
                      index === rankedCenters.length - 1 ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wide">{center.centerName}</td>
                  <td className="py-3 px-4 text-center">
                    {center.bedsOccupied} / {center.capacity} ({Math.round((center.bedsOccupied / center.capacity) * 100)}%)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={lowStocks > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                      {lowStocks > 0 ? `${lowStocks} items low` : "Nominal"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={absentDocs > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                      {cDocs.length - absentDocs} / {cDocs.length} Present
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-bold ${
                      center.healthScore >= 80 ? "text-emerald-600" :
                      center.healthScore >= 60 ? "text-amber-600" :
                      "text-red-600 animate-pulse font-extrabold"
                    }`}>
                      {center.healthScore} / 100
                    </span>
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

export default Centers;
