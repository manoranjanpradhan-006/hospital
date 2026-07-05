import React from "react";
import { useApp } from "../context/AppContext";
import firestore from "../firebase/firestore";
import { UserCheck, UserX, Clock, Stethoscope } from "lucide-react";

export const DoctorAttendance = () => {
  const { currentUser, attendance, centers, t } = useApp();

  const isDistrictScoped = true;
  const activeCenterId = isDistrictScoped ? (centers[0]?.id || "") : (currentUser?.centerId || centers[0]?.id || "");
  const centerDocs = attendance.filter(a => a.centerId === activeCenterId);

  const toggleAttendance = async (docId, currentStatus) => {
    // Doctors or Admins can mark attendance status
    if (true) {
      const nextStatus = currentStatus === "Present" ? "Absent" : "Present";
      const docRecord = centerDocs.find(d => d.doctorId === docId);
      if (docRecord) {
        await firestore.updateDoc("attendance", docRecord.id, { status: nextStatus });
      }
    }
  };

  const isAuthorized = true;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t("attendanceTrends")}</h3>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Daily Medical Staff Attendance Roster</p>
        </div>
        {isAuthorized && (
          <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold px-2 py-0.5 rounded-full uppercase">
            Roster: Write
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {centerDocs.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-4">No doctor records synced for this center.</p>
        ) : (
          centerDocs.map(doc => {
            const isPresent = doc.status === "Present";
            return (
              <div 
                key={doc.id} 
                className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                  isPresent 
                    ? "bg-emerald-50/20 border-emerald-100/50 hover:bg-emerald-50/40" 
                    : "bg-red-50/20 border-red-100/50 hover:bg-red-50/40"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isPresent ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">{doc.doctorName}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{doc.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] text-slate-400 font-bold uppercase flex items-center justify-end">
                      <Clock className="w-2.5 h-2.5 mr-0.5" /> Shift: 09:00 - 17:00
                    </p>
                  </div>

                  <button
                    onClick={() => toggleAttendance(doc.doctorId, doc.status)}
                    disabled={!isAuthorized}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-2xs font-extrabold uppercase transition-all ${
                      isPresent
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
                        : "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-700/20"
                    } ${!isAuthorized ? "opacity-90 cursor-default" : "cursor-pointer"}`}
                  >
                    {isPresent ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>{t("present")}</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3 h-3" />
                        <span>{t("absent")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="mt-3 text-center">
        <span className="text-[9px] text-slate-400 font-medium italic">
          {isAuthorized 
            ? "Tap Present/Absent badges to toggle physician presence in real-time" 
            : "Physician status requires administrative security credentials"
          }
        </span>
      </div>
    </div>
  );
};

export default DoctorAttendance;
