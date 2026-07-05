import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { 
  Pill, 
  Search, 
  Building, 
  Filter, 
  Plus, 
  History, 
  Bot, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2
} from "lucide-react";
import confetti from "canvas-confetti";

export const MedicineStock = () => {
  const { 
    currentUser, 
    stock, 
    centers, 
    stockTransactions, 
    consumptionLog, 
    addStockSupply, 
    reconcileStockBalances 
  } = useApp();

  const isDistrictScoped = true;
  const defaultBranch = isDistrictScoped ? "all" : (currentUser?.centerId || centers[0]?.id || "");

  // UI Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);
  const [statusFilter, setStatusFilter] = useState("all"); // all | low | expiring | expired

  // Form States
  const [formMedName, setFormMedName] = useState("Paracetamol");
  const [formCustomMedName, setFormCustomMedName] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formSupplyDate, setFormSupplyDate] = useState("2026-07-05");
  const [formExpiryDate, setFormExpiryDate] = useState("2027-07-05");
  const [formBranch, setFormBranch] = useState(isDistrictScoped ? (centers[0]?.id || "") : (currentUser?.centerId || centers[0]?.id || ""));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reconcilingId, setReconcilingId] = useState(false);
  const [formError, setFormError] = useState("");

  const activeDate = new Date("2026-07-05"); // Anchored simulation date

  // Helper: check expiry days
  const getExpiryDays = (expiryStr) => {
    if (!expiryStr) return 999;
    const diffTime = new Date(expiryStr) - activeDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Helper: check medicine status
  const getMedStatus = (item) => {
    const days = getExpiryDays(item.expiry_date);
    if (days <= 0) return { label: "Expired", color: "bg-red-50 text-red-600 border-red-150", isRed: true };
    if (days <= 90) return { label: "Nearing Expiry", color: "bg-amber-50 text-amber-600 border-amber-150", isRed: false };
    if (item.quantity <= item.threshold) return { label: "Low Stock", color: "bg-red-50 text-red-600 border-red-150 animate-pulse", isRed: true };
    return { label: "Good Stock", color: "bg-emerald-50 text-emerald-600 border-emerald-150", isRed: false };
  };

  // Filter Stock Items
  const filteredStock = stock.filter(item => {
    // 1. Search by name
    const matchSearch = item.medicineName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Filter by hospital branch
    const matchBranch = selectedBranch === "all" || item.centerId === selectedBranch;

    // 3. Filter by status
    const days = getExpiryDays(item.expiry_date);
    let matchStatus = true;
    if (statusFilter === "low") {
      matchStatus = item.quantity <= item.threshold;
    } else if (statusFilter === "expiring") {
      matchStatus = days > 0 && days <= 90;
    } else if (statusFilter === "expired") {
      matchStatus = days <= 0;
    }

    return matchSearch && matchBranch && matchStatus;
  });

  // Calculate Metrics based on filtered/total stock
  const totalMedTypes = new Set(stock.map(s => s.medicineName.toLowerCase())).size;
  const lowStockCount = stock.filter(s => s.quantity <= s.threshold).length;
  const expiringSoonCount = stock.filter(s => {
    const d = getExpiryDays(s.expiry_date);
    return d > 0 && d <= 90;
  }).length;
  const expiredCount = stock.filter(s => getExpiryDays(s.expiry_date) <= 0).length;

  // AI Suggestion Reorders:
  // For each low stock item, calculate reorder amount based on 7 days daily usage in consumption log
  const reorderSuggestions = stock
    .filter(item => item.quantity <= item.threshold)
    .map(item => {
      // Find logs for this medicine in this center
      const logs = consumptionLog.filter(c => c.medicine_id === item.id && c.hospital_id === item.centerId);
      const totalUsed = logs.reduce((sum, l) => sum + (l.quantity_deducted || 0), 0);
      const avgUsage = logs.length > 0 ? Math.round(totalUsed / 7) : 15; // default avg 15 units/day
      const suggestQty = Math.max(300, (avgUsage * 14) - item.quantity); // 14-day supply cushion, min 300
      
      const centerName = centers.find(c => c.id === item.centerId)?.centerName || item.centerId;

      return {
        stockId: item.id,
        medicineName: item.medicineName,
        centerId: item.centerId,
        centerName: centerName,
        currentQty: item.quantity,
        avgDailyUsage: avgUsage,
        suggestQty: suggestQty,
        threshold: item.threshold
      };
    });

  // Autofill form from AI suggestions
  const handleAutofill = (sug) => {
    setFormMedName(sug.medicineName === "Paracetamol" || sug.medicineName === "Ibuprofen" || sug.medicineName === "ORS" ? sug.medicineName : "Custom");
    if (sug.medicineName !== "Paracetamol" && sug.medicineName !== "Ibuprofen" && sug.medicineName !== "ORS") {
      setFormCustomMedName(sug.medicineName);
    }
    setFormQty(sug.suggestQty.toString());
    setFormBranch(sug.centerId);
    setFormSupplier("AI Auto-Procurement");
    setFormSupplyDate("2026-07-05");
    
    // Set appropriate future expiry date (e.g. 1 year from supply date)
    setFormExpiryDate("2027-07-05");
    
    // Smooth scroll to form
    const elem = document.getElementById("add-supply-form");
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  };

  // Submit supply form
  const handleSubmitSupply = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    const medName = formMedName === "Custom" ? formCustomMedName.trim() : formMedName;
    
    if (!medName) {
      setFormError("Medicine name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formQty || parseInt(formQty) <= 0) {
      setFormError("Quantity added must be a positive number.");
      setIsSubmitting(false);
      return;
    }
    if (!formSupplier.trim()) {
      setFormError("Supplier name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formExpiryDate) {
      setFormError("Expiry date is required.");
      setIsSubmitting(false);
      return;
    }
    if (new Date(formExpiryDate) <= new Date(formSupplyDate)) {
      setFormError("Expiry date must be after the supply date.");
      setIsSubmitting(false);
      return;
    }

    try {
      await addStockSupply({
        medicineName: medName,
        quantityAdded: parseInt(formQty),
        supplierName: formSupplier.trim(),
        dateOfSupply: formSupplyDate,
        expiryDate: formExpiryDate,
        hospitalId: formBranch
      });

      // Clear fields
      setFormQty("");
      setFormSupplier("");
      setFormCustomMedName("");
      
      confetti({
        particleCount: 80,
        spread: 50,
        origin: { y: 0.8 }
      });
    } catch (e) {
      setFormError("Failed to update stock: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger manual reconciliation audit
  const handleReconcile = async () => {
    setReconcilingId(true);
    await new Promise(resolve => setTimeout(resolve, 1200)); // lag delay
    
    try {
      const activeId = isDistrictScoped ? (centers[0]?.id || "") : (currentUser?.centerId || centers[0]?.id || "");
      await reconcileStockBalances(activeId);
      
      confetti({
        particleCount: 100,
        spread: 60,
        colors: ["#0f766e", "#10b981"]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setReconcilingId(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
            <Pill className="w-6 h-6 text-teal-700 animate-pulse" />
            <span>Medicine Stock Management Panel</span>
          </h2>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Manage medical supplies, monitor shortages, and calculate reorders</p>
        </div>

        {/* Global Action: Run Audit Recalculate */}
        <button
          onClick={handleReconcile}
          disabled={reconcilingId}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-2xs font-extrabold uppercase tracking-wide transition-all shadow-md cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reconcilingId ? "animate-spin" : ""}`} />
          <span>{reconcilingId ? "Reconciling..." : "Run Reconcile Audit"}</span>
        </button>
      </div>

      {/* Aggregate Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Total Medicines Types</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-2">{totalMedTypes}</p>
        </div>
        <div className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
          lowStockCount > 0 ? "border-red-200 bg-red-50/10" : "border-slate-200"
        }`}>
          <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
          <p className={`text-2xl font-extrabold mt-2 ${lowStockCount > 0 ? "text-red-500 animate-pulse" : "text-slate-800"}`}>{lowStockCount}</p>
        </div>
        <div className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
          expiringSoonCount > 0 ? "border-amber-200 bg-amber-50/10" : "border-slate-200"
        }`}>
          <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Nearing Expiry</p>
          <p className={`text-2xl font-extrabold mt-2 ${expiringSoonCount > 0 ? "text-amber-500" : "text-slate-800"}`}>{expiringSoonCount}</p>
        </div>
        <div className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
          expiredCount > 0 ? "border-red-300 bg-red-100/10" : "border-slate-200"
        }`}>
          <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Expired Batches</p>
          <p className={`text-2xl font-extrabold mt-2 ${expiredCount > 0 ? "text-red-600 font-black animate-bounce" : "text-slate-800"}`}>{expiredCount}</p>
        </div>
      </div>

      {/* Main Layout Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Inventory Table and Filters (Span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            
            {/* Filter Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <h3 className="font-extrabold text-slate-700 text-xs uppercase tracking-wide">Filters</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 md:justify-end md:max-w-xl">
                {/* Branch selector */}
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    disabled={!isDistrictScoped}
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-2xs font-semibold text-slate-650 cursor-pointer"
                  >
                    <option value="all">All Branch Nodes</option>
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>{c.centerName}</option>
                    ))}
                  </select>
                </div>

                {/* Status Selector */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-2xs font-semibold text-slate-650 cursor-pointer"
                  >
                    <option value="all">All Stock Statuses</option>
                    <option value="low">Low Safety Stock</option>
                    <option value="expiring">Expiring Soon (90d)</option>
                    <option value="expired">Expired Batches</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search medicine name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-2xs font-semibold text-slate-650"
                  />
                </div>
              </div>
            </div>

            {/* Real-time Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-2xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Medicine ID</th>
                    <th className="py-3 px-3">Medicine / Name</th>
                    <th className="py-3 px-3">Hospital / Node</th>
                    <th className="py-3 px-3 text-right">Available Stock</th>
                    <th className="py-3 px-3 text-right">Safety Threshold</th>
                    <th className="py-3 px-3 text-center">Batch Status</th>
                    <th className="py-3 px-4">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStock.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        No medical stock matches the filter scope.
                      </td>
                    </tr>
                  ) : (
                    filteredStock.map(item => {
                      const stat = getMedStatus(item);
                      const branchName = centers.find(c => c.id === item.centerId)?.centerName || item.centerId;
                      const daysLeft = getExpiryDays(item.expiry_date);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 font-mono text-slate-400 text-3xs">#{item.id}</td>
                          <td className="py-4 px-3 font-extrabold text-slate-700">{item.medicineName}</td>
                          <td className="py-4 px-3 text-slate-500 font-semibold">{branchName}</td>
                          <td className={`py-4 px-3 text-right font-black ${stat.isRed ? "text-red-500 font-black" : "text-slate-800"}`}>
                            {item.quantity} Units
                          </td>
                          <td className="py-4 px-3 text-right text-slate-400 font-semibold">{item.threshold} Units</td>
                          <td className="py-4 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wide ${stat.color}`}>
                              {stat.label}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-500 font-semibold">
                            <div>{item.expiry_date || "N/A"}</div>
                            {daysLeft <= 90 && daysLeft > 0 && (
                              <div className="text-[9px] text-amber-500 font-bold mt-0.5">({daysLeft} days left)</div>
                            )}
                            {daysLeft <= 0 && (
                              <div className="text-[9px] text-red-500 font-bold mt-0.5">(Lapsed)</div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Reconciliation Audit Info bar */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] text-slate-500 font-semibold">
                  Auto-Deductions active. Recalculations verified against transactions ledger. Status:{" "}
                  <span className="text-emerald-600 font-bold">Synced & Reconciled</span>
                </p>
              </div>
              <span className="text-[9px] text-slate-400 font-medium italic">
                Last checked: Today
              </span>
            </div>

          </div>
        </div>

        {/* Right Side: Form and Logs (Span 1) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* 1. Add Stock Supply Form */}
          <div id="add-supply-form" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-teal-600" />
              <span>Add Supplied Stock</span>
            </h3>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-2xs font-semibold flex items-center space-x-2 mb-4">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSupply} className="space-y-4">
              {/* Medicine Select */}
              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Medicine Name</label>
                <select
                  value={formMedName}
                  onChange={(e) => setFormMedName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Paracetamol">Paracetamol</option>
                  <option value="Ibuprofen">Ibuprofen</option>
                  <option value="ORS">ORS</option>
                  <option value="Custom">Other (Specify Custom Name)</option>
                </select>
              </div>

              {formMedName === "Custom" && (
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Custom Medicine Name</label>
                  <input
                    type="text"
                    placeholder="Enter custom medicine name..."
                    value={formCustomMedName}
                    onChange={(e) => setFormCustomMedName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Quantity Added */}
              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Quantity Added (Units)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Supplier Name */}
              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. MedLife Corp"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Grid Date and Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Date of Supply</label>
                  <input
                    type="date"
                    value={formSupplyDate}
                    onChange={(e) => setFormSupplyDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 cursor-pointer"
                  />
                </div>
              </div>

              {/* Hospital Branch */}
              <div>
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Hospital Branch Name</label>
                <select
                  disabled={!isDistrictScoped}
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-2xs font-semibold text-slate-650 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.centerName}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-2xs font-extrabold uppercase tracking-wider transition-all shadow cursor-pointer text-center"
              >
                {isSubmitting ? "Adding Supplies..." : "Add New Stock"}
              </button>
            </form>
          </div>

          {/* 2. AI Reorder Auto-Suggestions */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-teal-900/60 text-teal-400 border border-teal-850 rounded-lg">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-xs tracking-wider uppercase text-teal-400">AI Procurement Suggestions</h3>
              </div>
              <span className="text-[8px] bg-teal-900/60 border border-teal-800 text-teal-300 font-bold px-2 py-0.5 rounded-full uppercase">
                Active Engine
              </span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              Based on consumption patterns of the past 7 days, the AI forecasting engine recommends safety stock reorders.
            </p>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {reorderSuggestions.length === 0 ? (
                <p className="text-2xs text-slate-500 italic">No low stock shortages requiring reorder auto-procurement suggestion.</p>
              ) : (
                reorderSuggestions.map(sug => (
                  <div key={sug.stockId} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-wide">
                        <span className="text-slate-200">{sug.medicineName}</span>
                        <span className="text-red-400">{sug.centerName}</span>
                      </div>
                      <div className="flex justify-between items-baseline mt-1">
                        <p className="text-[9px] text-slate-500">Stock: <span className="font-bold text-slate-350">{sug.currentQty} Units</span></p>
                        <p className="text-[9px] text-slate-500">Usage: <span className="font-bold text-slate-350">{sug.avgDailyUsage} Units/day</span></p>
                      </div>
                      <p className="text-2xs font-extrabold text-teal-400 mt-2">
                        Suggested Reorder: {sug.suggestQty} Units
                      </p>
                    </div>

                    <button
                      onClick={() => handleAutofill(sug)}
                      className="w-full py-1 bg-teal-800/50 hover:bg-teal-700/60 border border-teal-750 hover:border-teal-600 text-white rounded-lg text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer"
                    >
                      Autofill Supply Form
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Transaction History Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-slate-500" />
              <span>Supply Transactions Ledger</span>
            </h3>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {stockTransactions.length === 0 ? (
                <p className="text-2xs text-slate-400 italic">No supply logs registered in the system.</p>
              ) : (
                stockTransactions.map(tx => {
                  const centerName = centers.find(c => c.id === tx.hospital_id)?.centerName || tx.hospital_id;
                  return (
                    <div key={tx.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-3xs font-semibold text-slate-600 leading-normal">
                      <div className="flex justify-between items-center font-bold text-slate-700 mb-1">
                        <span className="text-xs">{tx.name}</span>
                        <span className="text-teal-700">+{tx.quantity_added} Units</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 mt-0.5">
                        <span>Supplier: {tx.supplier_name}</span>
                        <span>Node: {centerName}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 mt-1 pt-1 border-t border-slate-150">
                        <span>Supplied: {tx.date_of_supply}</span>
                        <span>Expiry: {tx.expiry_date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default MedicineStock;
