import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import firestore from "../firebase/firestore";
import { 
  Pill, 
  Users, 
  BedDouble, 
  UserCheck, 
  FlaskConical, 
  Plus, 
  Minus,
  Edit2,
  Check,
  Building
} from "lucide-react";

export const DashboardCards = () => {
  const { currentUser, stock, stockTransactions, centers, attendance, t } = useApp();

  // Filter metrics based on scope
  const isDistrictScoped = true;
  const activeCenterId = isDistrictScoped ? (centers[0]?.id || "") : (currentUser?.centerId || centers[0]?.id || "");

  // Local state for branch filtering on dashboard
  const [selectedCenterId, setSelectedCenterId] = useState("");

  React.useEffect(() => {
    if (activeCenterId && !selectedCenterId) {
      setSelectedCenterId(activeCenterId);
    }
  }, [activeCenterId, selectedCenterId]);

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

  const currentCenter = centers.find(c => c.id === selectedCenterId) || centers[0] || defaultCenterPlaceholder;
  const centerStocks = stock.filter(s => s.centerId === selectedCenterId);
  const centerDocs = attendance.filter(a => a.centerId === selectedCenterId);

  // States for stock editing (Pharmacist / Staff authorization)
  const [editingStockId, setEditingStockId] = useState(null);
  const [editVal, setEditVal] = useState(0);

  const canEditStock = currentUser?.role === "Admin" || currentUser?.role === "Pharmacist" || currentUser?.role === "Staff";

  const handleSaveStock = async (id) => {
    await firestore.updateDoc("stock", id, { quantity: parseInt(editVal) || 0 });
    setEditingStockId(null);
  };

  const startEdit = (item) => {
    setEditingStockId(item.id);
    setEditVal(item.quantity);
  };

  // Medicine details
  const getMedPercentage = (qty) => Math.min(100, Math.round((qty / 1000) * 100));
  const getMedColor = (pct) => {
    if (pct <= 20) return { bg: "bg-red-500", text: "text-red-500", light: "bg-red-50 border-red-100", label: "Low" };
    if (pct <= 50) return { bg: "bg-amber-500", text: "text-amber-550", light: "bg-amber-50 border-amber-100", label: "Medium" };
    return { bg: "bg-emerald-500", text: "text-emerald-500", light: "bg-emerald-50 border-emerald-100", label: "High" };
  };

  // Aggregates for widgets
  const totalMedTypes = new Set(centerStocks.map(s => s.medicineName.toLowerCase())).size;
  const lowStockCount = centerStocks.filter(s => s.quantity <= s.threshold).length;
  const recentSupplies = stockTransactions.filter(t => t.hospital_id === selectedCenterId);

  // Lab Tests Status (CBC, Blood Sugar, Malaria, X-Ray)
  const [labTests, setLabTests] = useState([
    { name: "CBC", available: true },
    { name: "Blood Sugar", available: true },
    { name: "Malaria", available: false },
    { name: "X-Ray", available: true }
  ]);

  const toggleTest = async (index) => {
    if (currentUser?.role === "Admin" || currentUser?.role === "Lab Technician") {
      const updated = [...labTests];
      updated[index].available = !updated[index].available;
      setLabTests(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Branch/Hospital filter dropdown for multi-hospital systems */}
      {isDistrictScoped && (
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
          <Building className="w-4 h-4 text-teal-650" />
          <span className="text-2xs font-extrabold text-slate-400 uppercase tracking-wide">Filter Branch:</span>
          <select
            value={selectedCenterId}
            onChange={(e) => setSelectedCenterId(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            {centers.map(c => (
              <option key={c.id} value={c.id}>{c.centerName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Medicine Stock Card */}
        <div id="medicine-stock-card" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("medicineStock")}</h3>
              </div>
              {canEditStock && (
                <span className="text-[10px] text-teal-600 bg-teal-50 font-bold px-2 py-0.5 rounded-full border border-teal-100">
                  Auth: Write
                </span>
              )}
            </div>

            {/* Widget stats: Total medicines and Low Stock */}
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-center border-r border-slate-200">
                <p className="text-[9px] text-slate-455 font-extrabold uppercase">Total Types</p>
                <p className="text-base font-extrabold text-slate-750">{totalMedTypes}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-slate-455 font-extrabold uppercase">Low Stock</p>
                <p className={`text-base font-extrabold ${lowStockCount > 0 ? "text-red-500 animate-pulse font-black" : "text-slate-750"}`}>{lowStockCount}</p>
              </div>
            </div>

            <div className="space-y-4">
              {centerStocks.map(item => {
                const isLow = item.quantity <= item.threshold;
                const pct = getMedPercentage(item.quantity);
                const colorInfo = isLow 
                  ? { bg: "bg-red-550", text: "text-red-500", light: "bg-red-50 border-red-100", label: "Low Stock Warn" } 
                  : getMedColor(pct);
                const isEditing = editingStockId === item.id;

                return (
                  <div key={item.id} className="border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span>{item.medicineName === "Paracetamol" ? t("paracetamol") : item.medicineName === "Ibuprofen" ? t("ibuprofen") : item.medicineName === "ORS" ? t("ors") : item.medicineName}</span>
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input 
                              type="number" 
                              value={editVal} 
                              onChange={(e) => setEditVal(e.target.value)}
                              className="w-16 border border-slate-300 rounded px-1 text-center font-bold text-slate-800"
                            />
                            <button onClick={() => handleSaveStock(item.id)} className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className={`${colorInfo.text} font-extrabold`}>{item.quantity} Units ({pct}%)</span>
                        )}
                        
                        {canEditStock && !isEditing && (
                          <button onClick={() => startEdit(item)} className="p-0.5 text-slate-400 hover:text-teal-600">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${colorInfo.bg}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Capacity: 1000</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${colorInfo.light} ${colorInfo.text}`}>
                        {colorInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recently Added Stock Sub-widget */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mb-2">Recently Added Stock</p>
              {recentSupplies.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No recent supply transactions for this branch.</p>
              ) : (
                <div className="space-y-2">
                  {recentSupplies.slice(0, 3).map(tx => (
                    <div key={tx.id} className="flex justify-between items-center text-[10px] text-slate-500 font-medium border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                      <span className="truncate max-w-[120px]">{tx.name} ({tx.supplier_name})</span>
                      <span className="text-teal-700 font-bold shrink-0">+{tx.quantity_added} Units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* 2. Patient Footfall Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("patientFootfall")}</h3>
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold px-2 py-0.5 rounded-full">
              +12% vs LW
            </span>
          </div>

          <div className="flex items-baseline space-x-2 mb-4">
            <span className="text-4xl font-extrabold text-slate-800 tracking-tight">256</span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patients Today</span>
          </div>

          <div className="space-y-2 text-xs font-medium text-slate-500">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span>Avg Daily Influx:</span>
              <span className="font-bold text-slate-700">214 patients</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span>Peak Hours:</span>
              <span className="font-bold text-slate-700">10:00 AM - 01:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly Total:</span>
              <span className="font-bold text-slate-700">1,516 patients</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bed Availability Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <BedDouble className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("bedAvailability")}</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              (currentCenter?.bedsOccupied / currentCenter?.capacity) >= 0.85 
                ? "text-red-600 bg-red-50 border-red-100 animate-pulse"
                : "text-indigo-600 bg-indigo-50 border-indigo-100"
            }`}>
              {Math.round((currentCenter?.bedsOccupied / currentCenter?.capacity) * 100)}% Full
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">{t("available")}</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{currentCenter?.bedsAvailable || 45}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">{t("occupied")}</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{currentCenter?.bedsOccupied || 55}</p>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.round((currentCenter?.bedsOccupied / currentCenter?.capacity) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Capacity: {currentCenter?.capacity || 100}</span>
          </div>
        </div>
      </div>

      {/* 4. Doctor Attendance Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("doctorAttendance")}</h3>
            </div>
            <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2 py-0.5 rounded-full">
              Live Status
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">{t("present")}</p>
              <p className="text-2xl font-extrabold text-teal-600 mt-1">
                {centerDocs.filter(d => d.status === "Present").length}
              </p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-red-700 font-bold uppercase tracking-wider">{t("absent")}</p>
              <p className="text-2xl font-extrabold text-red-600 mt-1">
                {centerDocs.filter(d => d.status === "Absent").length}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {centerDocs.map(doc => (
              <div key={doc.id} className="flex justify-between items-center text-2xs font-semibold text-slate-600 border-b border-slate-50 py-1 last:border-0">
                <span>{doc.doctorName}</span>
                <span className={`px-1.5 py-0.2 rounded border font-bold uppercase ${
                  doc.status === "Present" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                    : "bg-red-50 text-red-600 border-red-100 animate-pulse"
                }`}>
                  {doc.status === "Present" ? t("present") : t("absent")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Test/Lab Availability Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <FlaskConical className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("testAvailability")}</h3>
            </div>
            {(currentUser?.role === "Admin" || currentUser?.role === "Lab Technician") && (
              <span className="text-[9px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-1.5 py-0.5 rounded-full">
                Tech Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {labTests.map((test, index) => (
              <button
                key={test.name}
                onClick={() => toggleTest(index)}
                disabled={currentUser?.role !== "Admin" && currentUser?.role !== "Lab Technician"}
                className={`p-2.5 rounded-xl border text-center transition-all duration-200 font-bold ${
                  test.available 
                    ? "bg-emerald-50/50 text-emerald-700 border-emerald-100 hover:bg-emerald-50" 
                    : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                } ${
                  (currentUser?.role === "Admin" || currentUser?.role === "Lab Technician")
                    ? "cursor-pointer"
                    : "cursor-default"
                }`}
              >
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">{test.name}</p>
                <p className="text-xs mt-1 uppercase font-extrabold">
                  {test.available ? t("available") : t("absent")}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-[9px] text-slate-400 font-medium italic">
              {(currentUser?.role === "Admin" || currentUser?.role === "Lab Technician")
                ? "Click on any tile to toggle its real-time operational status"
                : "Lab technician controls status from node console"
              }
            </span>
          </div>
        </div>
      </div>

    </div>
    </div>
  );
};

export default DashboardCards;
