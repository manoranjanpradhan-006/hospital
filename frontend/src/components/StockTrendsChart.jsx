import React from "react";
import { useApp } from "../context/AppContext";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export const StockTrendsChart = () => {
  const { stock, stockTransactions, consumptionLog, currentUser, centers } = useApp();

  // Active branch selector logic
  const isDistrictScoped = true;
  const activeCenterId = isDistrictScoped ? (centers[0]?.id || "") : (currentUser?.centerId || centers[0]?.id || "");

  const dates = [
    { key: "2026-06-29", label: "Mon" },
    { key: "2026-06-30", label: "Tue" },
    { key: "2026-07-01", label: "Wed" },
    { key: "2026-07-02", label: "Thu" },
    { key: "2026-07-03", label: "Fri" },
    { key: "2026-07-04", label: "Sat" },
    { key: "2026-07-05", label: "Sun" }
  ];

  // Mathematically project stock levels back in time based on ledger history
  const data = dates.map((d, index) => {
    const dayResult = { name: d.label };
    const postDates = dates.slice(index + 1).map(x => x.key);

    ["Paracetamol", "Ibuprofen", "ORS"].forEach(med => {
      const stockItem = stock.find(s => s.centerId === activeCenterId && s.medicineName === med);
      if (!stockItem) {
        dayResult[med] = 0;
        return;
      }

      const currentQty = stockItem.quantity;

      // Sum consumption and supply additions that happened AFTER this date
      const postConsumption = consumptionLog
        .filter(c => c.hospital_id === activeCenterId && c.name === med && postDates.includes(c.date))
        .reduce((sum, c) => sum + c.quantity_deducted, 0);

      const postSupplies = stockTransactions
        .filter(t => t.hospital_id === activeCenterId && t.name === med && postDates.includes(t.date_of_supply))
        .reduce((sum, t) => sum + t.quantity_added, 0);

      dayResult[med] = Math.max(0, currentQty + postConsumption - postSupplies);
    });

    return dayResult;
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Medicine Stock Trends</h3>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Daily safety inventory levels (past 7 days)</p>
        </div>
        <div className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2.5 py-0.5 rounded-full uppercase">
          Dynamic Line
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
            <Line type="monotone" dataKey="Paracetamol" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="Ibuprofen" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="ORS" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockTrendsChart;
