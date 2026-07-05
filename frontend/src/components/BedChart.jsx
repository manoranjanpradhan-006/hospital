import React from "react";
import { useApp } from "../context/AppContext";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export const BedChart = () => {
  const { currentUser, centers, t } = useApp();

  const isDistrictScoped = true;
  const activeCenterId = isDistrictScoped ? (centers[0]?.id || "") : (currentUser?.centerId || centers[0]?.id || "");
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
  const currentCenter = centers.find(c => c.id === activeCenterId) || centers[0] || defaultCenterPlaceholder;

  const data = [
    { name: t("available"), value: currentCenter?.bedsAvailable || 0 },
    { name: t("occupied"), value: currentCenter?.bedsOccupied || 0 }
  ];

  const COLORS = ["#22c55e", "#2563eb"];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t("bedsOccupied")}</h3>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Operational Capacity Allocation</p>
        </div>
      </div>

      <div className="h-64 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BedChart;
