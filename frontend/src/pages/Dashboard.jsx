import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import firestore from "../firebase/firestore";
import DashboardCards from "../components/DashboardCards";
import MedicineChart from "../components/MedicineChart";
import StockTrendsChart from "../components/StockTrendsChart";
import BedChart from "../components/BedChart";
import FootfallChart from "../components/FootfallChart";
import DoctorAttendance from "../components/DoctorAttendance";
import AlertPanel from "../components/AlertPanel";
import { predictMedicineDemand } from "../ai/prediction";
import { 
  Sparkles, 
  TrendingUp, 
  ArrowRightLeft, 
  RefreshCcw, 
  Check, 
  FileText,
  BadgeAlert,
  MapPin,
  Bot
} from "lucide-react";
import confetti from "canvas-confetti";

export const Dashboard = () => {
  const { 
    currentUser, 
    centers, 
    stock, 
    redistributionRecommendations, 
    isSimulating, 
    setIsSimulating,
    t 
  } = useApp();

  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictions, setPredictions] = useState(null);
  
  // Tab selector for medicine charts (consumption | trends)
  const [medChartTab, setMedChartTab] = useState("consumption");
  
  // States for executed transfers to show immediate UI response
  const [executingId, setExecutingId] = useState(null);

  const handlePredictDemand = async () => {
    setLoadingPrediction(true);
    // Gather mock usage to feed prediction engine
    const mockUsage = {
      "Paracetamol": [120, 135, 150, 140, 165, 130, 110],
      "Ibuprofen": [45, 50, 38, 48, 55, 40, 34],
      "ORS": [80, 95, 110, 70, 120, 140, 155]
    };
    try {
      const result = await predictMedicineDemand(mockUsage);
      setPredictions(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleExecuteTransfer = async (rec) => {
    setExecutingId(rec.id);
    await new Promise(resolve => setTimeout(resolve, 800)); // Network delay

    try {
      if (rec.type === "stock") {
        // Find from stock and to stock in Firestore
        const fromStock = stock.find(s => s.centerId === rec.fromCenterId && s.medicineName === rec.medicineName);
        const toStock = stock.find(s => s.centerId === rec.toCenterId && s.medicineName === rec.medicineName);

        if (fromStock && toStock) {
          // Adjust quantities
          const newFromQty = Math.max(0, fromStock.quantity - rec.amount);
          const newToQty = toStock.quantity + rec.amount;

          await firestore.updateDoc("stock", fromStock.id, { quantity: newFromQty });
          await firestore.updateDoc("stock", toStock.id, { quantity: newToQty });

          // Add a resolution logs alert
          await firestore.addDoc("alerts", {
            title: "Resource Redistribution Executed",
            message: `Successfully transferred ${rec.amount} Units of ${rec.medicineName} from ${rec.fromCenterName} to ${rec.toCenterName}.`,
            severity: "success",
            centerId: rec.toCenterId,
            resolved: true
          });

          // Trigger confetti!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else if (rec.type === "beds") {
        // Redirect patients
        const fromCenter = centers.find(c => c.id === rec.fromCenterId);
        const toCenter = centers.find(c => c.id === rec.toCenterId);

        if (fromCenter && toCenter) {
          await firestore.updateDoc("centers", fromCenter.id, {
            bedsOccupied: Math.max(0, fromCenter.bedsOccupied - rec.amount),
            bedsAvailable: fromCenter.bedsAvailable + rec.amount
          });
          await firestore.updateDoc("centers", toCenter.id, {
            bedsOccupied: toCenter.bedsOccupied + rec.amount,
            bedsAvailable: Math.max(0, toCenter.bedsAvailable - rec.amount)
          });

          await firestore.addDoc("alerts", {
            title: "Patient Redirection Complete",
            message: `Redirected ${rec.amount} patients from overcrowded ${rec.fromCenterName} to ${rec.toCenterName}.`,
            severity: "success",
            centerId: rec.toCenterId,
            resolved: true
          });

          confetti({
            particleCount: 80,
            spread: 60,
            colors: ["#2563eb", "#10b981"]
          });
        }
      }
    } catch (e) {
      console.error("Transfer execution failed", e);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Simulation Banner Alert */}
      <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg border border-slate-800">
        <div className="flex items-center space-x-3 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? "bg-emerald-400" : "bg-red-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? "bg-emerald-500" : "bg-red-500"}`}></span>
          </span>
          <span>
            {isSimulating 
              ? "TELEMETRY SIMULATION ONLINE: Stocks depleting and patients arriving in real-time."
              : "TELEMETRY SIMULATION OFFLINE: Data values are static."
            }
          </span>
        </div>
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-3 py-1 text-2xs font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
            isSimulating 
              ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" 
              : "bg-teal-700 border-teal-600 hover:bg-teal-600 text-white"
          }`}
        >
          {isSimulating ? "Pause Simulator" : "Resume Simulator"}
        </button>
      </div>

      {/* Cards Row */}
      <DashboardCards />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative">
          {/* Switch tab buttons aligned with headers */}
          <div className="absolute right-36 top-5 z-10 flex items-center space-x-1 bg-slate-105 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setMedChartTab("consumption")}
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                medChartTab === "consumption" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Consumption
            </button>
            <button
              onClick={() => setMedChartTab("trends")}
              className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                medChartTab === "trends" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Stock Trends
            </button>
          </div>
          {medChartTab === "consumption" ? <MedicineChart /> : <StockTrendsChart />}
        </div>
        <FootfallChart />
        <BedChart />
        <DoctorAttendance />
      </div>

      {/* AI Insights & Alerts panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts panel (Span 1) */}
        <div className="lg:col-span-1">
          <AlertPanel />
        </div>

        {/* AI Recommendations panel (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("aiInsights")}</h3>
              </div>
              <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2 py-0.5 rounded-full uppercase">
                Optimization Engine
              </span>
            </div>

            {/* AI Demand Prediction */}
            <div className="mb-6 border-b border-slate-100 pb-5">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>{t("predictionDemand")}</span>
                </h4>
                <button
                  onClick={handlePredictDemand}
                  disabled={loadingPrediction}
                  className="flex items-center space-x-1 text-2xs font-extrabold uppercase text-teal-700 hover:text-teal-800 cursor-pointer"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${loadingPrediction ? "animate-spin" : ""}`} />
                  <span>{loadingPrediction ? "Forecasting..." : "Run AI Forecast"}</span>
                </button>
              </div>

              {predictions ? (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {Object.keys(predictions.predictions).map(med => {
                      const val = predictions.predictions[med];
                      return (
                        <div key={med} className="bg-white border border-slate-100 p-2.5 rounded-lg">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{med}</p>
                          <p className="text-sm font-extrabold text-slate-800 mt-1">{val.needed} Units</p>
                          <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Conf: {Math.round(val.confidence * 100)}%</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-3xs text-slate-500 font-semibold leading-relaxed mt-3">{predictions.explanation}</p>
                </div>
              ) : (
                <p className="text-2xs text-slate-400 italic">Click Run AI Forecast to compile next week's medicine inventory requirements.</p>
              )}
            </div>

            {/* Resource Redistribution suggestions */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1 mb-3">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" />
                <span>{t("redistributionRecs")}</span>
              </h4>

              <div className="space-y-3">
                {redistributionRecommendations.length === 0 ? (
                  <p className="text-2xs text-slate-400 italic">No inventory logistics or patient redirection necessary currently.</p>
                ) : (
                  redistributionRecommendations.map(rec => {
                    const isExecuting = executingId === rec.id;
                    return (
                      <div key={rec.id} className="p-3 bg-teal-50/20 border border-teal-100/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${rec.urgency === "critical" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`}></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                              {rec.type === "stock" ? "Logistics Transfer" : "Bed Load Balancing"}
                            </span>
                          </div>
                          <p className="text-2xs text-slate-600 font-semibold mt-1 leading-relaxed">{rec.description}</p>
                        </div>

                        <button
                          onClick={() => handleExecuteTransfer(rec)}
                          disabled={isExecuting}
                          className="shrink-0 flex items-center space-x-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-2xs font-extrabold uppercase shadow transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isExecuting ? "Executing..." : "Execute AI recommendation"}</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
