import React from "react";
import { useApp } from "../context/AppContext";
import auth from "../firebase/auth";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  FileBarChart, 
  Map, 
  Settings, 
  ShieldCheck, 
  LogOut,
  HeartPulse,
  Pill
} from "lucide-react";

export const Sidebar = () => {
  const { currentUser, activeTab, setActiveTab, alerts, centers, t } = useApp();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out of the Health Sync platform?")) {
      await auth.signOut();
    }
  };

  // Determine tabs based on role
  const isDistrictScoped = true;
  
  const menuItems = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    ...(isDistrictScoped ? [{ id: "admin", label: t("adminPanel"), icon: ShieldCheck }] : []),
    ...(isDistrictScoped ? [{ id: "centers", label: t("centers"), icon: Map }] : []),
    { id: "stock-management", label: t("stockManagement"), icon: Pill },
    { id: "alerts", label: t("alerts"), icon: ShieldAlert, badge: alerts.filter(a => !a.resolved).length },
    { id: "reports", label: t("reports"), icon: FileBarChart },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-20 shadow-2xl border-r border-slate-800">
      {/* Brand Logo & Tagline */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
        <div className="bg-teal-700 p-2 rounded-xl text-teal-100 animate-pulse">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            HEALTH SYNC
          </h1>
          <span className="text-[9px] text-slate-400 tracking-widest block font-medium uppercase">
            Intelligent Platform
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? "bg-teal-700 text-white shadow-lg shadow-teal-900/40" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge > 0 && (
                <span className={`px-2 py-0.5 text-2xs font-bold rounded-full ${
                  isActive ? "bg-white text-teal-800" : "bg-red-500 text-white"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logged User Info & Signout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        {currentUser && (
          <div className="mb-4">
            <p className="text-xs text-slate-400 font-medium truncate">{currentUser.name}</p>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
            {currentUser.centerId && currentUser.centerId !== "all" && (
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase truncate">
                {centers.find(c => c.id === currentUser.centerId)?.centerName || "Health Center"}
              </p>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-red-950/20 hover:border-red-900/30 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
