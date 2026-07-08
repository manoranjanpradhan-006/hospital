import React, { useState, useEffect } from "react";
import auth from "../firebase/auth";
import firestore from "../firebase/firestore";
import Loader from "../components/Loader";
import { HeartPulse, Mail, Lock, User, MapPin, Briefcase } from "lucide-react";

export const Signup = ({ onToggle }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!district.trim()) {
      setErrorMsg("Please specify your District / Region.");
      return;
    }

    if (!role) {
      setErrorMsg("Please select a Professional Role.");
      return;
    }
    
    // Admins and District Officers scope district-wide ("all")
    const isDistrictScope = role === "Admin" || role === "District Officer";

    setLoading(true);
    try {
      await auth.createUserWithEmailAndPassword(email, password, {
        name: name.trim(),
        role,
        district: district.trim(),
        centerId: isDistrictScope ? "all" : ""
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {loading && <Loader message="Registering New Node Personnel..." />}

      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        
        {/* Banner */}
        <div className="bg-teal-950 p-6 text-center text-white relative">
          <div className="w-10 h-10 bg-teal-700 text-teal-100 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold tracking-wide">Register Account</h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
            Add medical node personnel credentials
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-2xs font-semibold p-3 rounded-xl mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. name@healthsync.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Security Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                District / Region
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                Professional Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Briefcase className="w-4 h-4" />
                </span>
                <select
                  value={role}
                  required
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-10 pr-4 py-2 bg-slate-50 focus:outline-none focus:border-teal-500 font-bold text-slate-700"
                >
                  <option value="">-- Choose Role --</option>
                  <option value="Admin">Admin</option>
                  <option value="District Officer">District Officer</option>
                  <option value="Staff">Staff</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Lab Technician">Lab Technician</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-700 text-white font-bold py-2.5 rounded-xl hover:bg-teal-800 transition-colors shadow-lg text-xs tracking-wider uppercase cursor-pointer"
            >
              Request Account Deployment
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-4 text-center">
            <p className="text-2xs text-slate-400 font-semibold">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onToggle}
                className="text-teal-700 hover:text-teal-800 font-extrabold uppercase hover:underline ml-1 cursor-pointer bg-transparent border-none"
              >
                Sign In
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
