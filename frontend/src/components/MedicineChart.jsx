import React from "react";
import { useApp } from "../context/AppContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export const MedicineChart = () => {
  const { consumptionLog, t } = useApp();

  const dates = [
    { key: "2026-06-29", label: "Mon" },
    { key: "2026-06-30", label: "Tue" },
    { key: "2026-07-01", label: "Wed" },
    { key: "2026-07-02", label: "Thu" },
    { key: "2026-07-03", label: "Fri" },
    { key: "2026-07-04", label: "Sat" },
    { key: "2026-07-05", label: "Sun" }
  ];

  // Dynamically group and sum usage from consumptionLog
  const data = dates.map(d => {
    const dayLogs = consumptionLog.filter(c => c.date === d.key);
    const paracetamol = dayLogs.filter(l => l.name === "Paracetamol").reduce((sum, l) => sum + l.quantity_deducted, 0);
    const ibuprofen = dayLogs.filter(l => l.name === "Ibuprofen").reduce((sum, l) => sum + l.quantity_deducted, 0);
    const ors = dayLogs.filter(l => l.name === "ORS").reduce((sum, l) => sum + l.quantity_deducted, 0);

    return {
      name: d.label,
      Paracetamol: paracetamol,
      Ibuprofen: ibuprofen,
      ORS: ors
    };
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t("medicineUsage")}</h3>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Daily Consumption trends (past 7 days)</p>
        </div>
        <div className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2.5 py-0.5 rounded-full uppercase">
          Recharts Engine
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
            <Bar dataKey="Paracetamol" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ibuprofen" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ORS" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MedicineChart;
