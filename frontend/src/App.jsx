import React, { useState } from "react";
import { useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Loader from "./components/Loader";
import AIChatbot from "./components/AIChatbot";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Centers from "./pages/Centers";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import MedicineStock from "./pages/MedicineStock";

export const App = () => {
  const { currentUser, authLoading, activeTab } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);

  if (authLoading) {
    return <Loader message="Establishing secure node credentials..." />;
  }

  if (!currentUser) {
    return isRegistering 
      ? <Signup onToggle={() => setIsRegistering(false)} /> 
      : <Login onToggle={() => setIsRegistering(true)} />;
  }

  // Router dispatcher
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "alerts":
        return <Alerts />;
      case "reports":
        return <Reports />;
      case "centers":
        return <Centers />;
      case "settings":
        return <Settings />;
      case "admin":
        return <AdminPanel />;
      case "stock-management":
        return <MedicineStock />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar - fixed left */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Navbar - fixed top */}
        <Navbar />

        {/* Dynamic page content container */}
        <main className="flex-1 pt-20 px-8 pb-8 overflow-y-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* Floating AI Agent chatbot helper */}
      <AIChatbot />
    </div>
  );
};

export default App;
