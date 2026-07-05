// Real-Time Demo Data Simulator
// Randomly updates Firestore stocks, patient counts, doctor attendance, and bed availability every 5 seconds.
// Triggers threshold checks to automatically generate low stock, doctor shortage, and overcrowding alerts.

import firestore from "../firebase/firestore";

let simulationInterval = null;

export const startSimulation = (onUpdateNotification) => {
  if (simulationInterval) clearInterval(simulationInterval);

  // Initialize tick counter on window if not present
  if (typeof window !== "undefined" && !window.simTickCount) {
    window.simTickCount = 0;
  }

  simulationInterval = setInterval(async () => {
    try {
      // 1. Medicine Decreases (Auto-deduction based on daily usage)
      const stocks = await firestore.getDocs("stock");
      const chosenStock = stocks[Math.floor(Math.random() * stocks.length)];
      if (chosenStock) {
        const decreaseAmount = Math.floor(Math.random() * 8) + 3; // Decrease by 3-10 units
        const newQuantity = Math.max(0, chosenStock.quantity - decreaseAmount);
        
        await firestore.updateDoc("stock", chosenStock.id, { quantity: newQuantity });

        // Record usage log in consumption_log
        await firestore.addDoc("consumption_log", {
          medicine_id: chosenStock.id,
          name: chosenStock.medicineName,
          quantity_deducted: decreaseAmount,
          date: "2026-07-05", // Fixed mock active date for charting
          hospital_id: chosenStock.centerId
        });

        // Trigger Alert if it crosses threshold and doesn't already have an active alert
        if (newQuantity <= chosenStock.threshold) {
          const activeAlerts = await firestore.getDocs("alerts");
          const hasAlert = activeAlerts.some(
            a => a.centerId === chosenStock.centerId && 
                 a.title === "Low Medicine Stock" && 
                 a.message.includes(chosenStock.medicineName) &&
                 !a.resolved
          );

          if (!hasAlert) {
            const centerList = await firestore.getDocs("centers");
            const cName = centerList.find(c => c.id === chosenStock.centerId)?.centerName || chosenStock.centerId;
            await firestore.addDoc("alerts", {
              title: "Low Medicine Stock",
              message: `${chosenStock.medicineName} stock is critical (${newQuantity} Units left) at ${cName}`,
              severity: "danger",
              centerId: chosenStock.centerId,
              resolved: false
            });

            // Simulated SMS & Email Notifications
            console.log(`%c[SMS ALERT] Sent to +91-XXXX-XXXXXX: Low stock warning! ${chosenStock.medicineName} is at ${newQuantity} units at ${cName}.`, "color: #ef4444; font-weight: bold;");
            console.log(`%c[EMAIL ALERT] Sent to admin@healthsync.gov.in: Alert! Medicine ${chosenStock.medicineName} has fallen below threshold of ${chosenStock.threshold} units. Current stock is ${newQuantity} units.`, "color: #ef4444; font-weight: bold;");

            if (onUpdateNotification) onUpdateNotification(`Low Medicine Stock warning triggered for ${chosenStock.medicineName}!`);
          }
        }
      }

      // 1.5. Simulated Daily Recalculation Cron (Runs every 30 seconds / 6 ticks)
      if (typeof window !== "undefined") {
        window.simTickCount++;
        if (window.simTickCount % 6 === 0) {
          const allStock = await firestore.getDocs("stock");
          
          for (const item of allStock) {
            // Re-calculate reconciliation status
            await firestore.updateDoc("stock", item.id, {
              lastReconciled: new Date().toISOString(),
              reconciliationStatus: "Synced & Verified"
            });
          }

          // Trigger a resolved system event log
          await firestore.addDoc("alerts", {
            title: "Daily Stock Recalculation Run",
            message: "Automated daily cron recalculation and data-integrity sync successfully verified stock levels across all branches.",
            severity: "success",
            centerId: "all",
            resolved: true
          });

          if (onUpdateNotification) onUpdateNotification("Automated daily stock recalculation run completed.");
        }
      }

      // 2. Patient Footfall Increases / Fluctuates
      const patients = await firestore.getDocs("patients");
      const todayStr = "2026-07-03"; // Hardcoded today date for consistent dashboard graphing
      const todayPatients = patients.filter(p => p.date === todayStr);
      
      if (todayPatients.length > 0) {
        const chosenPatientEntry = todayPatients[Math.floor(Math.random() * todayPatients.length)];
        const increaseAmount = Math.floor(Math.random() * 4) + 1; // Increase by 1-4 patients
        const newCount = chosenPatientEntry.count + increaseAmount;
        await firestore.updateDoc("patients", chosenPatientEntry.id, { count: newCount });

        // Check if overcrowding alert is needed
        const center = (await firestore.getDocs("centers")).find(c => c.id === chosenPatientEntry.centerId);
        if (center) {
          const occupancyRate = center.bedsOccupied / center.capacity;
          if (occupancyRate >= 0.90) {
            const activeAlerts = await firestore.getDocs("alerts");
            const hasAlert = activeAlerts.some(a => a.centerId === center.id && a.title === "Overcrowding Alert" && !a.resolved);
            
            if (!hasAlert) {
              await firestore.addDoc("alerts", {
                title: "Overcrowding Alert",
                message: `Patient count has exceeded 90% capacity at ${center.centerName}`,
                severity: "danger",
                centerId: center.id,
                resolved: false
              });
              if (onUpdateNotification) onUpdateNotification("Overcrowding Alert triggered!");
            }
          }
        }
      }

      // 3. Bed Occupancy Fluctuation
      const centers = await firestore.getDocs("centers");
      const chosenCenter = centers[Math.floor(Math.random() * centers.length)];
      if (chosenCenter) {
        const delta = Math.random() > 0.4 ? 1 : -1; // 60% chance of bed occupancy increasing
        const newOccupied = Math.min(chosenCenter.capacity, Math.max(0, chosenCenter.bedsOccupied + delta));
        const newAvailable = chosenCenter.capacity - newOccupied;
        
        await firestore.updateDoc("centers", chosenCenter.id, {
          bedsOccupied: newOccupied,
          bedsAvailable: newAvailable
        });
      }

      // 4. Doctor Absent / Present Fluctuation
      const doctors = await firestore.getDocs("attendance");
      const chosenDoc = doctors[Math.floor(Math.random() * doctors.length)];
      if (chosenDoc) {
        const newStatus = chosenDoc.status === "Present" ? "Absent" : "Present";
        await firestore.updateDoc("attendance", chosenDoc.id, { status: newStatus });

        // Check attendance rate for the center to trigger warnings
        const centerDocs = doctors.filter(d => d.centerId === chosenDoc.centerId);
        // Recalculate present rate based on local mock change
        const presentCount = centerDocs.reduce((sum, d) => sum + (d.id === chosenDoc.id ? (newStatus === "Present" ? 1 : 0) : (d.status === "Present" ? 1 : 0)), 0);
        const presentRate = presentCount / centerDocs.length;

        if (presentRate < 0.70) {
          const activeAlerts = await firestore.getDocs("alerts");
          const hasAlert = activeAlerts.some(a => a.centerId === chosenDoc.centerId && a.title === "Doctor Shortage" && !a.resolved);
          
          if (!hasAlert) {
            const centerList = await firestore.getDocs("centers");
            const cName = centerList.find(c => c.id === chosenDoc.centerId)?.centerName || chosenDoc.centerId;
            await firestore.addDoc("alerts", {
              title: "Doctor Shortage",
              message: `Medical staff presence rate is critical (${Math.round(presentRate * 100)}%) at ${cName}`,
              severity: "warning",
              centerId: chosenDoc.centerId,
              resolved: false
            });
            if (onUpdateNotification) onUpdateNotification("Doctor Shortage alert triggered!");
          }
        }
      }

    } catch (e) {
      console.error("Simulation tick error", e);
    }
  }, 5000);
};

export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};
