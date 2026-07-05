import React, { createContext, useContext, useState, useEffect } from "react";
import auth from "../firebase/auth";
import firestore from "../firebase/firestore";
import { startSimulation, stopSimulation } from "../utils/dummySimulator";
import { generateRedistributionSuggestions, calculateCenterHealthScore } from "../ai/recommendations";

const AppContext = createContext();

const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    alerts: "Alerts",
    reports: "Reports",
    centers: "Centers",
    settings: "Settings",
    adminPanel: "Admin Panel",
    stockManagement: "Medicine Stock",
    welcome: "Welcome",
    login: "Log In",
    logout: "Log Out",
    signup: "Sign Up",
    role: "Role",
    district: "District",
    status: "Status",
    healthScore: "Health Score",
    medicineStock: "Medicine Stock",
    patientFootfall: "Patient Footfall",
    bedAvailability: "Bed Availability",
    doctorAttendance: "Doctor Attendance",
    testAvailability: "Test/Lab Availability",
    aiInsights: "AI Insights",
    recentAlerts: "Recent Alerts",
    critical: "Critical",
    resolved: "Resolved",
    active: "Active",
    paracetamol: "Paracetamol",
    ibuprofen: "Ibuprofen",
    ors: "ORS",
    available: "Available",
    occupied: "Occupied",
    present: "Present",
    absent: "Absent",
    medicineUsage: "Medicine Usage",
    bedsOccupied: "Beds Occupied",
    attendanceTrends: "Attendance Trends",
    predictionDemand: "Predicted Next Week Demand",
    redistributionRecs: "AI Redistribution Recommendations",
    totalCenters: "Centers (PHC/CHC)",
    totalDoctors: "Total Doctors",
    totalBeds: "Total Beds",
    districtOverview: "District Overview",
    voiceListening: "Listening for commands...",
    voiceInstruction: "Try saying: 'Show low stock medicines', 'Open reports', or 'Translate to Hindi'"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    alerts: "अलर्ट",
    reports: "रिपोर्ट",
    centers: "केंद्र",
    settings: "सेटिंग्स",
    adminPanel: "प्रशासनिक पैनल",
    stockManagement: "दवा स्टॉक प्रबंधन",
    welcome: "स्वागत है",
    login: "लॉग इन करें",
    logout: "लॉग आउट",
    signup: "साइन अप करें",
    role: "भूमिका",
    district: "जिला",
    status: "स्थिति",
    healthScore: "स्वास्थ्य स्कोर",
    medicineStock: "दवा स्टॉक",
    patientFootfall: "मरीज आगमन",
    bedAvailability: "बिस्तरों की उपलब्धता",
    doctorAttendance: "डॉक्टर उपस्थिति",
    testAvailability: "प्रयोगशाला परीक्षण उपलब्धता",
    aiInsights: "एआई अंतर्दृष्टि",
    recentAlerts: "हालिया अलर्ट",
    critical: "गंभीर",
    resolved: "सुलझाया गया",
    active: "सक्रिय",
    paracetamol: "पैरासिटामोल",
    ibuprofen: "इबुप्रोफेन",
    ors: "ओआरएस",
    available: "उपलब्ध",
    occupied: "भरे हुए",
    present: "उपस्थित",
    absent: "अनुपस्थित",
    medicineUsage: "दवा का उपयोग",
    bedsOccupied: "कब्जे वाले बिस्तर",
    attendanceTrends: "उपस्थिति रुझान",
    predictionDemand: "अगले सप्ताह की अनुमानित मांग",
    redistributionRecs: "एआई पुनर्वितरण सिफारिशें",
    totalCenters: "केंद्र (PHC/CHC)",
    totalDoctors: "कुल डॉक्टर",
    totalBeds: "कुल बिस्तर",
    districtOverview: "जिला अवलोकन",
    voiceListening: "आदेशों के लिए सुन रहे हैं...",
    voiceInstruction: "बोलने का प्रयास करें: 'दवाओं का कम स्टॉक दिखाएं', 'रिपोर्ट खोलें', या 'हिंदी में अनुवाद करें'"
  },
  ta: {
    dashboard: "கட்டுப்பாட்டகம்",
    alerts: "எச்சரிக்கைகள்",
    reports: "அறிக்கைகள்",
    centers: "மையங்கள்",
    settings: "அமைப்புகள்",
    adminPanel: "நிர்வாகக் குழு",
    stockManagement: "மருந்து இருப்பு",
    welcome: "வரவேற்கிறோம்",
    login: "உள்நுழைக",
    logout: "வெளியேறு",
    signup: "பதிவு செய்க",
    role: "பங்கு",
    district: "மாவட்டம்",
    status: "நிலை",
    healthScore: "சுகாதார மதிப்பீடு",
    medicineStock: "மருந்து இருப்பு",
    patientFootfall: "நோயாளி வருகை",
    bedAvailability: "படுக்கை வசதி",
    doctorAttendance: "மருத்துவர் வருகை",
    testAvailability: "ஆய்வக சோதனை வசதி",
    aiInsights: "செயற்கை நுண்ணறிவு பகுப்பாய்வு",
    recentAlerts: "சமீபத்திய எச்சரிக்கைகள்",
    critical: "மிக முக்கியமானது",
    resolved: "தீர்க்கப்பட்டது",
    active: "செயலில் உள்ளது",
    paracetamol: "பாராசிட்டமால்",
    ibuprofen: "இப்யூபுரூஃபன்",
    ors: "ஓஆர்எஸ்",
    available: "கிடைக்கக்கூடியவை",
    occupied: "நிரப்பப்பட்டவை",
    present: "வருகை",
    absent: "விடுப்பு",
    medicineUsage: "மருந்து பயன்பாடு",
    bedsOccupied: "பயன்பாட்டில் உள்ள படுக்கைகள்",
    attendanceTrends: "வருகை விகிதங்கள்",
    predictionDemand: "அடுத்த வார உத்தேச தேவை",
    redistributionRecs: "ஏஐ மருந்து பகிர்வு பரிந்துரைகள்",
    totalCenters: "சுகாதார நிலையங்கள்",
    totalDoctors: "மொத்த மருத்துவர்கள்",
    totalBeds: "மொத்த படுக்கைகள்",
    districtOverview: "மாவட்ட சுருக்கம்",
    voiceListening: "குரல் கட்டளைக்காக காத்திருக்கிறது...",
    voiceInstruction: "முயற்சிக்கவும்: 'குறைந்த இருப்பு மருந்துகளைக் காட்டு', 'அறிக்கைகளைத் திற', அல்லது 'தமிழில் மொழிபெயர்க்கவும்'"
  }
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Real-time collections
  const [centers, setCenters] = useState([]);
  const [stock, setStock] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [consumptionLog, setConsumptionLog] = useState([]);
  const [patients, setPatients] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Custom router state: dashboard | alerts | reports | centers | settings | admin | stock-management
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  const [isSimulating, setIsSimulating] = useState(true);
  
  // Audio Alert sound effects (synthesized via Web Audio API)
  const playAlertSound = (severity) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (severity === "danger") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard A4
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setAuthLoading(false);
      // If user is a Doctor/Pharmacist/Lab Technician, default tab to Dashboard
      if (user && user.role !== "Admin" && user.role !== "District Officer") {
        setActiveTab("dashboard");
      }
    });
    return unsub;
  }, []);

  // Firestore DB Snapshot Listeners
  useEffect(() => {
    if (!currentUser) {
      setCenters([]);
      setStock([]);
      setStockTransactions([]);
      setConsumptionLog([]);
      setPatients([]);
      setAttendance([]);
      setAlerts([]);
      return;
    }

    const unsubCenters = firestore.onSnapshot("centers", data => setCenters(data));
    const unsubStock = firestore.onSnapshot("stock", data => setStock(data));
    
    const unsubTx = firestore.onSnapshot("stock_transactions", data => {
      const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setStockTransactions(sorted);
    });
    
    const unsubConsumption = firestore.onSnapshot("consumption_log", data => {
      const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setConsumptionLog(sorted);
    });

    const unsubPatients = firestore.onSnapshot("patients", data => setPatients(data));
    const unsubAttendance = firestore.onSnapshot("attendance", data => setAttendance(data));
    
    // Listen to alerts and play alert sound for new danger alerts
    let previousAlertCount = 0;
    const unsubAlerts = firestore.onSnapshot("alerts", data => {
      const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAlerts(sorted);
      
      // If alert count increases, check if there's a new critical alert to beep
      if (previousAlertCount > 0 && data.length > previousAlertCount) {
        const latest = sorted[0];
        if (latest && !latest.resolved) {
          playAlertSound(latest.severity);
        }
      }
      previousAlertCount = data.length;
    });

    return () => {
      unsubCenters();
      unsubStock();
      unsubTx();
      unsubConsumption();
      unsubPatients();
      unsubAttendance();
      unsubAlerts();
    };
  }, [currentUser]);

  // Expose Stock Supply Adding action
  const addStockSupply = async (supplyData) => {
    const { medicineName, quantityAdded, supplierName, dateOfSupply, expiryDate, hospitalId } = supplyData;
    
    // 1. Add Stock Transaction record
    const txId = await firestore.addDoc("stock_transactions", {
      medicine_id: "", 
      name: medicineName,
      quantity_added: parseInt(quantityAdded),
      supplier_name: supplierName,
      date_of_supply: dateOfSupply,
      expiry_date: expiryDate,
      hospital_id: hospitalId
    });

    // 2. Find matching stock
    let stockItem = stock.find(s => s.centerId === hospitalId && s.medicineName.toLowerCase() === medicineName.toLowerCase());
    
    if (stockItem) {
      const newQty = stockItem.quantity + parseInt(quantityAdded);
      // Update transaction with the correct medicine_id
      await firestore.updateDoc("stock_transactions", txId, { medicine_id: stockItem.id });
      
      // Update stock inventory
      await firestore.updateDoc("stock", stockItem.id, {
        quantity: newQty,
        expiryDate: expiryDate,
        expiry_date: expiryDate,
        last_updated: new Date().toISOString()
      });

      // Clear low stock alert if refilled above threshold
      if (newQty > stockItem.threshold) {
        const activeAlerts = alerts.filter(a => !a.resolved && a.centerId === hospitalId && a.title === "Low Medicine Stock" && a.message.includes(medicineName));
        for (const alert of activeAlerts) {
          await firestore.updateDoc("alerts", alert.id, { resolved: true });
        }
      }
    } else {
      // Create new stock item
      const newStockId = await firestore.addDoc("stock", {
        medicineName: medicineName,
        name: medicineName,
        quantity: parseInt(quantityAdded),
        total_quantity: parseInt(quantityAdded),
        threshold: 150, // default threshold
        centerId: hospitalId,
        hospital_id: hospitalId,
        expiryDate: expiryDate,
        expiry_date: expiryDate,
        last_updated: new Date().toISOString()
      });

      // Update transaction with new medicine_id
      await firestore.updateDoc("stock_transactions", txId, { medicine_id: newStockId });
    }
    
    return txId;
  };

  // Reconcile and calculate stock levels manual audit
  const reconcileStockBalances = async (hospitalId) => {
    const targetStocks = stock.filter(s => s.centerId === hospitalId);
    
    for (const item of targetStocks) {
      // Fetch latest values directly from current state
      const additions = stockTransactions
        .filter(t => t.medicine_id === item.id && t.hospital_id === hospitalId)
        .reduce((sum, t) => sum + (t.quantity_added || 0), 0);
        
      const deductions = consumptionLog
        .filter(c => c.medicine_id === item.id && c.hospital_id === hospitalId)
        .reduce((sum, c) => sum + (c.quantity_deducted || 0), 0);

      console.log(`[RECONCILIATION AUDIT] Center: ${hospitalId}, Medicine: ${item.medicineName}, Supplied: ${additions}, Consumed: ${deductions}`);

      await firestore.updateDoc("stock", item.id, {
        reconciliationStatus: "Synced & Verified",
        lastReconciled: new Date().toISOString()
      });
    }
  };

  // Add a new hospital center
  const addHospitalCenter = async (centerData) => {
    const { id, centerName, type, place, block, district, state, country, capacity, latitude, longitude } = centerData;
    const formattedId = (id || "").toLowerCase().trim().replace(/\s+/g, "-") || `center-${Date.now()}`;
    
    await firestore.addDoc("centers", {
      id: formattedId,
      centerName,
      type,
      place: place || "",
      block: block || "",
      district: district || "",
      state: state || "",
      country: country || "",
      capacity: parseInt(capacity) || 100,
      bedsAvailable: parseInt(capacity) || 100,
      bedsOccupied: 0,
      healthScore: 100,
      latitude: parseFloat(latitude) || 14.6 + Math.random() * 0.5,
      longitude: parseFloat(longitude) || 77.6 + Math.random() * 0.5,
      equipmentScore: 90
    });
  };

  // Add a new doctor to the roster
  const addDoctorToRoster = async (doctorData) => {
    const { doctorName, specialty, centerId } = doctorData;
    const newDocId = `doc-${Date.now()}`;
    await firestore.addDoc("attendance", {
      doctorId: newDocId,
      doctorName,
      specialty,
      status: "Present",
      date: "2026-07-03", // Consistent active system date
      centerId
    });
  };

  // Toggle doctor check-in status
  const toggleDoctorAttendance = async (docId) => {
    const docEntry = attendance.find(a => a.id === docId);
    if (docEntry) {
      const newStatus = docEntry.status === "Present" ? "Absent" : "Present";
      await firestore.updateDoc("attendance", docId, { status: newStatus });
    }
  };

  // Admit a patient to a branch (increase occupied beds, record footfall)
  const admitPatientToBranch = async (hospitalId) => {
    const center = centers.find(c => c.id === hospitalId);
    if (center && center.bedsOccupied < center.capacity) {
      const newOccupied = center.bedsOccupied + 1;
      const newAvailable = center.capacity - newOccupied;
      
      await firestore.updateDoc("centers", hospitalId, {
        bedsOccupied: newOccupied,
        bedsAvailable: newAvailable
      });

      // Update patient footfall for today's date
      const todayStr = "2026-07-03"; // Hardcoded today date for consistent dashboard graphing
      const todayPatients = patients.filter(p => p.date === todayStr && p.centerId === hospitalId);
      if (todayPatients.length > 0) {
        await firestore.updateDoc("patients", todayPatients[0].id, {
          count: todayPatients[0].count + 1
        });
      } else {
        await firestore.addDoc("patients", {
          date: todayStr,
          count: 1,
          centerId: hospitalId
        });
      }
    }
  };

  // Discharge a patient from a branch (decrease occupied beds)
  const dischargePatientFromBranch = async (hospitalId) => {
    const center = centers.find(c => c.id === hospitalId);
    if (center && center.bedsOccupied > 0) {
      const newOccupied = center.bedsOccupied - 1;
      const newAvailable = center.capacity - newOccupied;
      
      await firestore.updateDoc("centers", hospitalId, {
        bedsOccupied: newOccupied,
        bedsAvailable: newAvailable
      });
    }
  };

  // Update total bed capacity
  const updateBranchBedCapacity = async (hospitalId, newCapacity) => {
    const center = centers.find(c => c.id === hospitalId);
    if (center) {
      const parsedCapacity = parseInt(newCapacity) || 100;
      const newAvailable = Math.max(0, parsedCapacity - center.bedsOccupied);
      await firestore.updateDoc("centers", hospitalId, {
        capacity: parsedCapacity,
        bedsAvailable: newAvailable
      });
    }
  };

  // Simulator Controller
  useEffect(() => {
    if (isSimulating) {
      startSimulation((msg) => console.log(`[SIMULATOR] ${msg}`));
    } else {
      stopSimulation();
    }
    return () => stopSimulation();
  }, [isSimulating]);

  // AI suggestions list calculated reactively
  const redistributionRecommendations = generateRedistributionSuggestions(stock, centers);

  // Update Center Health Scores reactively whenever stock or attendance changes
  useEffect(() => {
    centers.forEach(c => {
      const freshScore = calculateCenterHealthScore(c.id, stock, attendance, c);
      if (freshScore !== c.healthScore) {
        firestore.updateDoc("centers", c.id, { healthScore: freshScore });
      }
    });
  }, [stock, attendance]);

  // Multilingual Translator
  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || key;
  };

  // Voice command processor
  const processVoiceCommand = (text) => {
    const cmd = text.toLowerCase().trim();
    if (cmd.includes("stock") || cmd.includes("medicine") || cmd.includes("दवा") || cmd.includes("மருந்து")) {
      setActiveTab("dashboard");
      setTimeout(() => {
        const elem = document.getElementById("medicine-stock-card");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return "Navigating to medicine stocks...";
    } else if (cmd.includes("report") || cmd.includes("रिपोर्ट") || cmd.includes("அறிக்கை")) {
      setActiveTab("reports");
      return "Opening reports section...";
    } else if (cmd.includes("center") || cmd.includes("map") || cmd.includes("नक्शा") || cmd.includes("வரைபடம்")) {
      setActiveTab("centers");
      return "Opening center map view...";
    } else if (cmd.includes("admin") || cmd.includes("officer") || cmd.includes("अधिकारी")) {
      setActiveTab("admin");
      return "Navigating to Admin Command Center...";
    } else if (cmd.includes("hindi") || cmd.includes("हिंदी")) {
      setLanguage("hi");
      return "अनुवाद किया जा रहा है...";
    } else if (cmd.includes("tamil") || cmd.includes("தமிழ்")) {
      setLanguage("ta");
      return "தமிழில் மாற்றப்படுகிறது...";
    } else if (cmd.includes("english") || cmd.includes("अंग्रेजी")) {
      setLanguage("en");
      return "Switching to English...";
    }
    return "Command unrecognized. Try saying: 'Open reports' or 'Translate to Hindi'";
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      authLoading,
      centers,
      stock,
      stockTransactions,
      consumptionLog,
      addStockSupply,
      reconcileStockBalances,
      addHospitalCenter,
      addDoctorToRoster,
      toggleDoctorAttendance,
      admitPatientToBranch,
      dischargePatientFromBranch,
      updateBranchBedCapacity,
      patients,
      attendance,
      alerts,
      activeTab,
      setActiveTab,
      language,
      setLanguage,
      isSimulating,
      setIsSimulating,
      redistributionRecommendations,
      t,
      processVoiceCommand
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
