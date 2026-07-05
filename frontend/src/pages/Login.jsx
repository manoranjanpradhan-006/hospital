import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import auth from "../firebase/auth";
import Loader from "../components/Loader";
import { HeartPulse, Lock, Mail, Sparkles } from "lucide-react";

export const Login = ({ onToggle }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const { setActiveTab } = useApp();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setErrorMsg("Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail, demoPass) => {
    setErrorMsg("");
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(demoEmail, demoPass);
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {loading && <Loader message="Authenticating Credentials..." />}

      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Brand Banner */}
        <div className="bg-teal-950 p-8 text-center text-white relative">
          <div className="absolute top-3 right-3 bg-teal-800 text-[8px] font-bold tracking-widest text-teal-300 px-2 py-0.5 rounded-full uppercase border border-teal-700">
            Gov Network
          </div>
          <div className="w-12 h-12 bg-teal-700 text-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-950/50">
            <HeartPulse className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-wide">HEALTH SYNC PORTAL</h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
            Ministry of Health & Public Welfare Command Gateway
          </p>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-2xs font-semibold p-3 rounded-xl mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Government Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. officer@healthsync.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Access Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-700 text-white font-bold py-2.5 rounded-xl hover:bg-teal-800 transition-colors shadow-lg shadow-teal-900/10 text-xs tracking-wider uppercase cursor-pointer"
            >
              Authorize Node Connection
            </button>
          </form>

          {/* Google login divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 border-b border-slate-100"></span>
            <span className="relative bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Alternative Sign In
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-2 rounded-xl transition-colors text-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.62v3.02h3.87c2.26-2.08 3.58-5.14 3.58-8.49z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3.02c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.37v3.12C3.35 21.28 7.37 24 12 24z"/>
              <path fill="#FBBC05" d="M5.24 14.22c-.25-.72-.39-1.5-.39-2.31s.14-1.59.39-2.31V6.49H1.37C.5 8.23 0 10.12 0 12s.5 3.77 1.37 5.51l3.87-3.12z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.97 1.19 15.24 0 12 0 7.37 0 3.35 2.72 1.37 6.49l3.87 3.12c.95-2.88 3.61-5.01 6.76-5.01z"/>
            </svg>
            <span>Sign In with Google</span>
          </button>

          {/* Quick login selectors */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span>One-Click Quick Login (Demo Access)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-3xs font-extrabold uppercase">
              <button onClick={() => quickLogin("admin@healthsync.gov.in", "admin123")} className="border border-teal-600/30 text-teal-700 bg-teal-50/50 hover:bg-teal-50 px-2 py-1.5 rounded-lg text-center cursor-pointer">
                Chief Admin
              </button>
              <button onClick={() => quickLogin("officer@healthsync.gov.in", "officer123")} className="border border-blue-600/30 text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-2 py-1.5 rounded-lg text-center cursor-pointer">
                District Officer
              </button>
              <button onClick={() => quickLogin("staff@healthsync.gov.in", "staff123")} className="border border-amber-600/30 text-amber-700 bg-amber-50/50 hover:bg-amber-50 px-2 py-1.5 rounded-lg text-center cursor-pointer">
                Pharmacist
              </button>
              <button onClick={() => quickLogin("doctor@healthsync.gov.in", "doctor123")} className="border border-emerald-600/30 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1.5 rounded-lg text-center cursor-pointer">
                Node Doctor
              </button>
            </div>
          </div>

          <p className="text-2xs text-slate-400 font-semibold text-center mt-5">
            Need a new command connection?{" "}
            <button
              type="button"
              onClick={onToggle}
              className="text-teal-700 hover:text-teal-800 font-extrabold uppercase hover:underline ml-1 cursor-pointer bg-transparent border-none"
            >
              Register Here
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
