import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword as sdkSignIn, 
  signOut as sdkSignOut, 
  createUserWithEmailAndPassword as sdkCreateUser 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { IS_MOCKED, authInstance, dbInstance } from "./firebase";

const DEFAULT_USERS = {
  "admin@healthsync.gov.in": {
    uid: "usr-admin",
    name: "Dr. Srikanth Sharma",
    email: "admin@healthsync.gov.in",
    role: "Admin",
    district: "Anantapur",
    centerId: "all"
  },
  "officer@healthsync.gov.in": {
    uid: "usr-officer",
    name: "Mr. Ramesh Reddy",
    email: "officer@healthsync.gov.in",
    role: "District Officer",
    district: "Anantapur",
    centerId: "all"
  },
  "staff@healthsync.gov.in": {
    uid: "usr-staff",
    name: "Anil Kumar",
    email: "staff@healthsync.gov.in",
    role: "Pharmacist",
    district: "Anantapur",
    centerId: ""
  },
  "doctor@healthsync.gov.in": {
    uid: "usr-doctor",
    name: "Dr. Rajesh Kumar",
    email: "doctor@healthsync.gov.in",
    role: "Doctor",
    district: "Anantapur",
    centerId: ""
  }
};

const authListeners = new Set();
let currentUser = null;

// Load current user from session/localStorage if exists
const savedSession = localStorage.getItem("healthsync_auth_user");
if (savedSession) {
  try {
    currentUser = JSON.parse(savedSession);
  } catch (e) {
    console.error("Auth session restore failed", e);
  }
}

const notifyAuthListeners = () => {
  authListeners.forEach(callback => callback(currentUser));
};

export const auth = {
  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    if (!IS_MOCKED) {
      return onAuthStateChanged(authInstance, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDocRef = doc(dbInstance, "users", firebaseUser.uid);
            const userSnapshot = await getDoc(userDocRef);
            
            if (userSnapshot.exists()) {
              currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                ...userSnapshot.data()
              };
            } else {
              // Fallback defaults if user was manually added in the console and has no Firestore profile doc
              const emailLower = (firebaseUser.email || "").toLowerCase();
              let role = "Staff";
              let centerId = "";
              if (emailLower.includes("admin")) {
                role = "Admin";
                centerId = "all";
              } else if (emailLower.includes("officer")) {
                role = "District Officer";
                centerId = "all";
              }
              
              currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
                role,
                district: "Anantapur",
                centerId
              };
              
              // Persist fallback to Firestore
              await setDoc(userDocRef, {
                name: currentUser.name,
                role: currentUser.role,
                district: currentUser.district,
                centerId: currentUser.centerId
              });
            }
          } catch (e) {
            console.error("Firestore user profile retrieval error:", e);
            currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.email.split("@")[0],
              role: "Staff",
              district: "Anantapur",
              centerId: ""
            };
          }
        } else {
          currentUser = null;
        }
        callback(currentUser);
      });
    } else {
      authListeners.add(callback);
      callback(currentUser);
      return () => {
        authListeners.delete(callback);
      };
    }
  },

  // Email login
  signInWithEmailAndPassword: async (email, password) => {
    const formattedEmail = email.toLowerCase().trim();
    
    if (!IS_MOCKED) {
      const userCredential = await sdkSignIn(authInstance, formattedEmail, password);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(dbInstance, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userSnapshot.data()
        };
      } else {
        const emailLower = formattedEmail;
        let role = "Staff";
        let centerId = "";
        if (emailLower.includes("admin")) {
          role = "Admin";
          centerId = "all";
        } else if (emailLower.includes("officer")) {
          role = "District Officer";
          centerId = "all";
        }
        
        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || formattedEmail.split("@")[0],
          role,
          district: "Anantapur",
          centerId
        };
        
        await setDoc(userDocRef, {
          name: currentUser.name,
          role: currentUser.role,
          district: currentUser.district,
          centerId: currentUser.centerId
        });
      }
      
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      return currentUser;
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (DEFAULT_USERS[formattedEmail]) {
        const passCheck = password.length >= 6;
        if (passCheck) {
          currentUser = DEFAULT_USERS[formattedEmail];
          localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
          notifyAuthListeners();
          return currentUser;
        }
      }
      
      const localUsers = JSON.parse(localStorage.getItem("healthsync_db_users") || "{}");
      if (localUsers[formattedEmail] && password.length >= 6) {
        currentUser = localUsers[formattedEmail];
        localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
        notifyAuthListeners();
        return currentUser;
      }
      
      throw new Error("Invalid credentials. Enter any email from default list (e.g. officer@healthsync.gov.in) with any password >= 6 characters.");
    }
  },

  // Google Login (logs in as a District Officer)
  signInWithGoogle: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    currentUser = {
      uid: "usr-google",
      name: "Dr. Sandeep Singh (Google Auth)",
      email: "sandeep.singh@gmail.com",
      role: "District Officer",
      district: "Anantapur",
      centerId: "all"
    };
    localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
    notifyAuthListeners();
    return currentUser;
  },

  // SignUp simulation
  createUserWithEmailAndPassword: async (email, password, extraData) => {
    const formattedEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    
    if (!IS_MOCKED) {
      const userCredential = await sdkCreateUser(authInstance, formattedEmail, password);
      const firebaseUser = userCredential.user;
      
      const profile = {
        name: extraData.name || "Healthcare Staff",
        role: extraData.role || "Staff",
        district: extraData.district || "Anantapur",
        centerId: extraData.centerId || ""
      };

      await setDoc(doc(dbInstance, "users", firebaseUser.uid), profile);

      currentUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...profile
      };

      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      return currentUser;
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        uid: `usr-${Date.now()}`,
        name: extraData.name || "Healthcare Staff",
        email: formattedEmail,
        role: extraData.role || "Staff",
        district: extraData.district || "Anantapur",
        centerId: extraData.centerId || ""
      };

      const localUsers = JSON.parse(localStorage.getItem("healthsync_db_users") || "{}");
      localUsers[formattedEmail] = newUser;
      localStorage.setItem("healthsync_db_users", JSON.stringify(localUsers));

      currentUser = newUser;
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      notifyAuthListeners();
      return currentUser;
    }
  },

  // Log out
  signOut: async () => {
    if (!IS_MOCKED) {
      await sdkSignOut(authInstance);
    }
    currentUser = null;
    localStorage.removeItem("healthsync_auth_user");
    notifyAuthListeners();
    return true;
  },

  // Retrieve current user sync
  getCurrentUser: () => currentUser
};

export default auth;
