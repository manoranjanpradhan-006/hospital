import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import MedicineStock from "./MedicineStock";
import { 
  ShieldCheck, 
  Users, 
  BedDouble, 
  ShieldAlert, 
  Award, 
  TrendingUp, 
  Building, 
  UserCheck, 
  Plus, 
  UserPlus, 
  UserMinus,
  Settings,
  AlertCircle
} from "lucide-react";
import confetti from "canvas-confetti";

export const AdminPanel = () => {
  const { 
    centers, 
    alerts, 
    attendance, 
    addHospitalCenter,
    addDoctorToRoster,
    toggleDoctorAttendance,
    admitPatientToBranch,
    dischargePatientFromBranch,
    updateBranchBedCapacity
  } = useApp();

  // Sub-tabs: overview | stock | roster | beds
  const [activeSubTab, setActiveSubTab] = useState("overview");

  // Local state for active hospital branch filters
  const [selectedBranchId, setSelectedBranchId] = useState("");

  useEffect(() => {
    const defaultId = centers[0]?.id || "";
    if (defaultId && !selectedBranchId) {
      setSelectedBranchId(defaultId);
    }
  }, [centers, selectedBranchId]);

  // Form states: Doctors addition
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("General Medicine");
  const [addingDoc, setAddingDoc] = useState(false);

  // Form states: Beds capacity update
  const [bedCapacityVal, setBedCapacityVal] = useState("");
  const [updatingCapacity, setUpdatingCapacity] = useState(false);

  // Form states: Hospital center registration
  const [newCenterId, setNewCenterId] = useState("");
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterType, setNewCenterType] = useState("PHC");
  const [newCenterPlace, setNewCenterPlace] = useState("");
  const [newCenterBlock, setNewCenterBlock] = useState("");
  const [newCenterDistrict, setNewCenterDistrict] = useState("");
  const [newCenterState, setNewCenterState] = useState("");
  const [newCenterCountry, setNewCenterCountry] = useState("");
  const [newCenterCapacity, setNewCenterCapacity] = useState("");
  const [newCenterLat, setNewCenterLat] = useState("");
  const [newCenterLng, setNewCenterLng] = useState("");
  const [addingCenter, setAddingCenter] = useState(false);
  const [centerFormError, setCenterFormError] = useState("");

  // Aggregate numbers
  const totalPHCs = 45; 
  const totalCHCs = 12;
  const activeAlertsCount = alerts.filter(a => !a.resolved).length;
  
  // Calculate average district metrics
  const bedsFilled = centers.reduce((sum, c) => sum + c.bedsOccupied, 0);
  const totalBedsCount = centers.reduce((sum, c) => sum + c.capacity, 0);
  const avgOccupancy = totalBedsCount > 0 ? Math.round((bedsFilled / totalBedsCount) * 100) : 0;

  const stats = [
    { label: "Primary Health Centers (PHC)", count: totalPHCs, icon: Building, color: "text-teal-600 bg-teal-50 border-teal-100" },
    { label: "Community Health Centers (CHC)", count: totalCHCs, icon: Building, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Active Doctors", count: attendance.length, icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "District Beds Capacity", count: totalBedsCount, icon: BedDouble, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { label: "Active Incidents", count: activeAlertsCount, icon: ShieldAlert, color: "text-red-600 bg-red-50 border-red-100 animate-pulse" }
  ];

  const sortedCenters = [...centers].sort((a, b) => b.healthScore - a.healthScore);
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
  const activeCenter = centers.find(c => c.id === selectedBranchId) || centers[0] || defaultCenterPlaceholder;
  const activeDocs = attendance.filter(doc => doc.centerId === selectedBranchId);

  // Add a doctor to database roster
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    setAddingDoc(true);
    try {
      await addDoctorToRoster({
        doctorName: newDocName.trim(),
        specialty: newDocSpecialty,
        centerId: selectedBranchId
      });
      setNewDocName("");
      confetti({
        particleCount: 50,
        spread: 40,
        colors: ["#6366f1", "#10b981"]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAddingDoc(false);
    }
  };

  // Add a new hospital node
  const handleAddCenter = async (e) => {
    e.preventDefault();
    setCenterFormError("");
    
    if (!newCenterId.trim()) {
      setCenterFormError("Center Code is required.");
      return;
    }
    if (!newCenterName.trim()) {
      setCenterFormError("Center Name is required.");
      return;
    }
    if (!newCenterCapacity || parseInt(newCenterCapacity) <= 0) {
      setCenterFormError("Bed capacity must be a positive number.");
      return;
    }

    setAddingCenter(true);
    try {
      await addHospitalCenter({
        id: newCenterId.trim(),
        centerName: newCenterName.trim(),
        type: newCenterType,
        place: newCenterPlace.trim(),
        block: newCenterBlock.trim(),
        district: newCenterDistrict.trim(),
        state: newCenterState.trim(),
        country: newCenterCountry.trim(),
        capacity: newCenterCapacity,
        latitude: newCenterLat,
        longitude: newCenterLng
      });

      // Reset form fields
      setNewCenterId("");
      setNewCenterName("");
      setNewCenterPlace("");
      setNewCenterBlock("");
      setNewCenterDistrict("");
      setNewCenterState("");
      setNewCenterCountry("");
      setNewCenterCapacity("");
      setNewCenterLat("");
      setNewCenterLng("");
      
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ["#0f766e", "#10b981"]
      });
    } catch (err) {
      setCenterFormError("Failed to add center: " + err.message);
    } finally {
      setAddingCenter(false);
    }
  };

  // Toggle doctor attendance status
  const handleToggleDoc = async (docId) => {
    await toggleDoctorAttendance(docId);
    confetti({
      particleCount: 20,
      angle: 90,
      spread: 30,
      origin: { y: 0.8 }
    });
  };

  // Admit a patient
  const handleAdmit = async () => {
    if (activeCenter.bedsOccupied >= activeCenter.capacity) return;
    await admitPatientToBranch(selectedBranchId);
    confetti({
      particleCount: 40,
      colors: ["#10b981"]
    });
  };

  // Discharge a patient
  const handleDischarge = async () => {
    if (activeCenter.bedsOccupied <= 0) return;
    await dischargePatientFromBranch(selectedBranchId);
    confetti({
      particleCount: 30,
      colors: ["#ef4444"]
    });
  };

  // Update Bed Capacity
  const handleUpdateCapacity = async (e) => {
    e.preventDefault();
    if (!bedCapacityVal || parseInt(bedCapacityVal) <= 0) return;

    setUpdatingCapacity(true);
    try {
      await updateBranchBedCapacity(selectedBranchId, parseInt(bedCapacityVal));
      setBedCapacityVal("");
      confetti({
        particleCount: 60,
        spread: 45,
        colors: ["#8b5cf6"]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingCapacity(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-teal-700 animate-pulse" />
            <span>District Commander Command Center</span>
          </h2>
          <p className="text-2xs text-slate-400 font-semibold uppercase">District regional command for healthcare resource monitoring & updates</p>
        </div>

        {/* Operational Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-sm w-fit">
          <button
            onClick={() => setActiveSubTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              activeSubTab === "overview" ? "bg-white text-slate-850 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab("stock")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              activeSubTab === "stock" ? "bg-white text-slate-850 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Medicine Inventory
          </button>
          <button
            onClick={() => setActiveSubTab("roster")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              activeSubTab === "roster" ? "bg-white text-slate-850 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Doctor Roster
          </button>
          <button
            onClick={() => setActiveSubTab("beds")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              activeSubTab === "beds" ? "bg-white text-slate-850 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Admissions & Beds
          </button>
          <button
            onClick={() => setActiveSubTab("centers")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              activeSubTab === "centers" ? "bg-white text-slate-850 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Manage Centers
          </button>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className={`p-2 w-fit rounded-lg border ${stat.color} mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{stat.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Leaderboard panel (Span 2) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Center Nodes Performance Rankings</span>
              </h3>
              <span className="text-[9px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2 py-0.5 rounded-full uppercase">
                District Rankings
              </span>
            </div>

            <div className="space-y-4">
              {sortedCenters.map((center, index) => {
                const rankColor = index === 0 ? "bg-amber-100 border-amber-200 text-amber-700" :
                                  index === 1 ? "bg-slate-105 border-slate-200 text-slate-600" :
                                  index === sortedCenters.length - 1 ? "bg-red-100 border-red-200 text-red-700" :
                                  "bg-slate-50 border-slate-100 text-slate-500";

                return (
                  <div key={center.id} className="p-3.5 border border-slate-150 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center space-x-3.5">
                      <span className={`w-6 h-6 rounded-full text-center leading-6 font-bold border text-2xs ${rankColor}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{center.centerName}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                          Capacity: {center.capacity} beds • Beds Filled: {center.bedsOccupied}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-bold text-xs ${
                        center.healthScore >= 80 ? "text-emerald-600" :
                        center.healthScore >= 60 ? "text-amber-600" :
                        "text-red-500 animate-pulse font-extrabold"
                      }`}>
                        Score: {center.healthScore} / 100
                      </span>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1">
                        <div 
                          className={`h-1.5 rounded-full ${
                            center.healthScore >= 80 ? "bg-emerald-500" :
                            center.healthScore >= 60 ? "bg-amber-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${center.healthScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregate overview summaries (Span 1) */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-teal-400 flex items-center space-x-1.5 mb-4">
                <TrendingUp className="w-4 h-4 animate-pulse" />
                <span>District Statistics Overview</span>
              </h3>

              <div className="space-y-4 text-2xs font-semibold">
                <div className="border-b border-slate-805 pb-3">
                  <p className="text-slate-400 uppercase tracking-wide">Average Bed Occupancy</p>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-extrabold text-teal-400">{avgOccupancy}%</span>
                    <span className="text-slate-500 font-medium">(Optimized load is 60%)</span>
                  </div>
                </div>

                <div className="border-b border-slate-805 pb-3">
                  <p className="text-slate-400 uppercase tracking-wide">Pending Logistics Shortages</p>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-extrabold text-red-400">
                      {centers.filter(c => c.healthScore < 80).length} PHC Nodes
                    </span>
                    <span className="text-slate-500 font-medium">below safety limits</span>
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 uppercase tracking-wide">Total Logged Incidents Today</p>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-xl font-extrabold text-amber-400">
                      {alerts.length} Incidents
                    </span>
                    <span className="text-slate-500 font-medium">registered in ledger</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-805 pt-4 text-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">
                District Health Office System
              </span>
            </div>
          </div>

        </div>
      )}

      {activeSubTab === "stock" && (
        <MedicineStock />
      )}

      {activeSubTab === "roster" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Doctor Attendance Roster list (Span 2) */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            {/* Header / Branch select */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-650" />
                <span>Branch Doctor Attendance Registry</span>
              </h3>

              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-2xs font-bold text-slate-650 focus:outline-none cursor-pointer"
                >
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.centerName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Doctors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-2xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Physician ID</th>
                    <th className="py-3 px-3">Doctor Name</th>
                    <th className="py-3 px-3">Clinical Specialty</th>
                    <th className="py-3 px-3 text-center">Duty Status</th>
                    <th className="py-3 px-4 text-right">Roster Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {activeDocs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                        No medical staff assigned to this node center.
                      </td>
                    </tr>
                  ) : (
                    activeDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-mono text-slate-400 text-3xs">#{doc.id}</td>
                        <td className="py-4 px-3 font-extrabold text-slate-700">{doc.doctorName}</td>
                        <td className="py-4 px-3 text-slate-500 font-semibold">{doc.specialty}</td>
                        <td className="py-4 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide ${
                            doc.status === "Present" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-150" 
                              : "bg-red-50 text-red-600 border-red-150 animate-pulse"
                          }`}>
                            {doc.status === "Present" ? "Checked In" : "Absent"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleToggleDoc(doc.id)}
                            className="inline-flex items-center text-[10px] font-extrabold uppercase text-indigo-700 hover:text-white border border-indigo-650 hover:bg-indigo-650 px-2.5 py-1 rounded-lg transition-all shadow-sm cursor-pointer"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Add Doctor form (Span 1) */}
          <div className="xl:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit">
            <h3 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Assign New Doctor</span>
            </h3>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Doctor Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Priya Patel"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Specialty Department</label>
                <select
                  value={newDocSpecialty}
                  onChange={(e) => setNewDocSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Gynecology">Gynecology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Cardiology">Cardiology</option>
                </select>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-semibold block leading-normal italic mb-3">
                  Assigning will instantly place the physician on duty at {activeCenter?.centerName || "the selected branch"}.
                </span>
                
                <button
                  type="submit"
                  disabled={addingDoc}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all shadow cursor-pointer text-center"
                >
                  {addingDoc ? "Assigning..." : "Assign Doctor"}
                </button>
              </div>
            </form>
          </div>

        </div>
      )}

      {activeSubTab === "beds" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Bed Admissions Dashboard controls (Span 2) */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            {/* Header & selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center space-x-2">
                <BedDouble className="w-5 h-5 text-purple-650" />
                <span>Center Patient Load Balancing</span>
              </h3>

              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-2xs font-bold text-slate-650 focus:outline-none cursor-pointer"
                >
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.centerName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bed capacity state display */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
              <div className="flex justify-between items-baseline mb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">{activeCenter.centerName}</h4>
                  <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">District Branch Ring Node</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase border ${
                  (activeCenter.bedsOccupied / activeCenter.capacity) >= 0.85 
                    ? "bg-red-50 border-red-100 text-red-650 animate-pulse"
                    : "bg-purple-50 border-purple-100 text-purple-650"
                }`}>
                  {Math.round((activeCenter.bedsOccupied / activeCenter.capacity) * 100)}% Bed Load Occupancy
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    (activeCenter.bedsOccupied / activeCenter.capacity) >= 0.85 ? "bg-red-500" : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.round((activeCenter.bedsOccupied / activeCenter.capacity) * 100)}%` }}
                ></div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Beds Filled</p>
                  <p className="text-xl font-extrabold text-purple-600 mt-1">{activeCenter.bedsOccupied}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Available Beds</p>
                  <p className="text-xl font-extrabold text-emerald-600 mt-1">{activeCenter.bedsAvailable}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Total Capacity</p>
                  <p className="text-xl font-extrabold text-slate-700 mt-1">{activeCenter.capacity}</p>
                </div>
              </div>
            </div>

            {/* Admission control buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleAdmit}
                disabled={activeCenter.bedsOccupied >= activeCenter.capacity}
                className={`py-3 rounded-xl text-xs font-extrabold uppercase transition-all shadow border cursor-pointer text-center flex items-center justify-center space-x-2 ${
                  activeCenter.bedsOccupied >= activeCenter.capacity
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Admit / Log Inflow</span>
              </button>
              <button
                onClick={handleDischarge}
                disabled={activeCenter.bedsOccupied <= 0}
                className={`py-3 rounded-xl text-xs font-extrabold uppercase transition-all shadow border cursor-pointer text-center flex items-center justify-center space-x-2 ${
                  activeCenter.bedsOccupied <= 0
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                }`}
              >
                <UserMinus className="w-4 h-4" />
                <span>Discharge Patient</span>
              </button>
            </div>

          </div>

          {/* Edit Capacity form (Span 1) */}
          <div className="xl:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit space-y-6">
            
            {/* Edit capacity */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
                <Settings className="w-4 h-4 text-purple-600" />
                <span>Modify Branch Capacity</span>
              </h3>

              <form onSubmit={handleUpdateCapacity} className="space-y-4">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">New Bed Capacity</label>
                  <input
                    type="number"
                    placeholder={`Currently ${activeCenter.capacity}`}
                    value={bedCapacityVal}
                    onChange={(e) => setBedCapacityVal(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updatingCapacity}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all shadow cursor-pointer text-center"
                >
                  {updatingCapacity ? "Updating..." : "Update Capacity"}
                </button>
              </form>
            </div>

            {/* Load Balancing info box */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-3xs text-slate-400 font-semibold leading-normal">
              <div className="flex items-center space-x-1.5 text-slate-600 font-bold mb-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                <span className="uppercase tracking-wider">Dynamic Load Alerts</span>
              </div>
              When occupancy exceeds 85% safety limits, the AI Optimization engine automatically displays patient redirection recommendations on the dashboard, proposing transfers to adjacent clinics with vacancy.
            </div>

          </div>

        </div>
      )}

      {/* Register New Hospital Center Sub-Tab */}
      {activeSubTab === "centers" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* List of registered hospital centers (Span 2) */}
          <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-bold text-slate-805 text-xs uppercase tracking-wider flex items-center space-x-2">
                <Building className="w-5 h-5 text-teal-700" />
                <span>Registered Healthcare Center Nodes</span>
              </h3>
              <span className="text-[9px] bg-teal-50 border border-teal-100 text-teal-600 font-bold px-2 py-0.5 rounded-full uppercase">
                Active Nodes: {centers.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-2xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Center Code</th>
                    <th className="py-3 px-3">Center Details & Address</th>
                    <th className="py-3 px-3">Center Type</th>
                    <th className="py-3 px-3 text-center">Bed Capacity</th>
                    <th className="py-3 px-3 text-center">Location Coords</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {centers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-450 italic">
                        No hospital center nodes registered. Please use the form on the right to register your first center!
                      </td>
                    </tr>
                  ) : (
                    centers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-slate-500 text-3xs">#{c.id}</td>
                        <td className="py-4 px-3">
                          <p className="font-extrabold text-slate-800 uppercase tracking-wide">{c.centerName}</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                            {[c.place, c.block, c.district, c.state, c.country].filter(Boolean).join(", ")}
                          </p>
                        </td>
                        <td className="py-4 px-3 font-bold">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-extrabold ${
                            c.type === "PHC" 
                              ? "bg-teal-50 border-teal-100 text-teal-700" 
                              : "bg-blue-50 border-blue-100 text-blue-700"
                          }`}>
                            {c.type}
                          </span>
                        </td>
                        <td className="py-4 px-3 text-center font-bold text-slate-800">{c.capacity} Beds</td>
                        <td className="py-4 px-3 text-center font-mono text-[9px] text-slate-400">
                          {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form to Register Center (Span 1) */}
          <div className="xl:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-teal-650" />
              <span>Register New Hospital Center</span>
            </h3>

            {centerFormError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-650 text-2xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{centerFormError}</span>
              </div>
            )}

            <form onSubmit={handleAddCenter} className="space-y-4">
              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Center Code / ID</label>
                <input
                  type="text"
                  placeholder="e.g. phc-a"
                  value={newCenterId}
                  onChange={(e) => setNewCenterId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Center Name</label>
                <input
                  type="text"
                  placeholder="e.g. PHC Anantapur"
                  value={newCenterName}
                  onChange={(e) => setNewCenterName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Center Type</label>
                  <select
                    value={newCenterType}
                    onChange={(e) => setNewCenterType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="PHC">PHC (Primary)</option>
                    <option value="CHC">CHC (Community)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Place / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Gooty"
                    value={newCenterPlace}
                    onChange={(e) => setNewCenterPlace(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Block / Mandal</label>
                  <input
                    type="text"
                    placeholder="e.g. Gooty Block"
                    value={newCenterBlock}
                    onChange={(e) => setNewCenterBlock(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">District Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Anantapur"
                    value={newCenterDistrict}
                    onChange={(e) => setNewCenterDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Andhra Pradesh"
                    value={newCenterState}
                    onChange={(e) => setNewCenterState(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. India"
                    value={newCenterCountry}
                    onChange={(e) => setNewCenterCountry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Initial Bed Capacity</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={newCenterCapacity}
                  onChange={(e) => setNewCenterCapacity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Latitude (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 14.6819"
                    value={newCenterLat}
                    onChange={(e) => setNewCenterLat(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Longitude (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 77.6006"
                    value={newCenterLng}
                    onChange={(e) => setNewCenterLng(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addingCenter}
                className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all shadow cursor-pointer text-center"
              >
                {addingCenter ? "Registering..." : "Register Hospital"}
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminPanel;
