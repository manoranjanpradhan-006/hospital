// Simulated real-time Firestore database layer using localStorage and observers
// This allows true multi-panel real-time reactivity without external database setup.
import { 
  collection, 
  onSnapshot as sdkOnSnapshot, 
  addDoc as sdkAddDoc, 
  updateDoc as sdkUpdateDoc, 
  deleteDoc as sdkDeleteDoc,
  doc, 
  getDocs,
  setDoc
} from "firebase/firestore";
import { IS_MOCKED, dbInstance, authInstance } from "./firebase";

// Fallbacks are empty to guarantee a clean workspace
const INITIAL_CENTERS = {};
const INITIAL_STOCK = {};
const INITIAL_TRANSACTIONS = {};
const INITIAL_CONSUMPTION = {};
const INITIAL_PATIENTS = {};
const INITIAL_ATTENDANCE = {};
const INITIAL_ALERTS = {};

// Helper: Get user scope key to sandbox databases per credential
const getUserScope = () => {
  if (!IS_MOCKED) {
    return authInstance.currentUser?.uid || "anonymous";
  } else {
    try {
      const user = JSON.parse(localStorage.getItem("healthsync_auth_user"));
      return user?.uid || "anonymous";
    } catch (e) {
      return "anonymous";
    }
  }
};

// Helper: Get mock state scoped to user from local storage
const getMockState = (collectionName) => {
  const userId = getUserScope();
  const storageKey = `healthsync_db_${userId}_${collectionName}`;
  const data = localStorage.getItem(storageKey);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing localStorage key ${storageKey}`, e);
    }
  }
  const fallback = {};
  localStorage.setItem(storageKey, JSON.stringify(fallback));
  return fallback;
};

// Helper: Save mock state scoped to user in local storage
const saveMockState = (collectionName, data) => {
  const userId = getUserScope();
  const storageKey = `healthsync_db_${userId}_${collectionName}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};

// Observers mapping: collectionName -> Set of callback functions
const observers = {
  centers: new Set(),
  stock: new Set(),
  stock_transactions: new Set(),
  consumption_log: new Set(),
  patients: new Set(),
  attendance: new Set(),
  alerts: new Set()
};

const notifyObservers = (collectionName) => {
  if (observers[collectionName]) {
    const mockState = getMockState(collectionName);
    const dataList = Object.values(mockState);
    observers[collectionName].forEach(callback => {
      try {
        callback(dataList);
      } catch (e) {
        console.error("Observer callback error", e);
      }
    });
  }
};

export const firestore = {
  // Real-time listener registration
  onSnapshot: (collectionName, callback) => {
    if (!IS_MOCKED) {
      const userId = getUserScope();
      // Sandbox collection under /users/{userId}/{collectionName}
      const colRef = collection(dbInstance, "users", userId, collectionName);
      
      return sdkOnSnapshot(colRef, (snapshot) => {
        const items = [];
        snapshot.forEach(docSnap => {
          items.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        callback(items);
      });
    } else {
      if (!observers[collectionName]) return () => {};
      observers[collectionName].add(callback);
      
      // Immediate initial call
      const mockState = getMockState(collectionName);
      callback(Object.values(mockState));
      
      // Return unsubscribe function
      return () => {
        observers[collectionName].delete(callback);
      };
    }
  },

  // Read snapshot once
  getDocs: async (collectionName) => {
    if (!IS_MOCKED) {
      const userId = getUserScope();
      const colRef = collection(dbInstance, "users", userId, collectionName);
      const snapshot = await getDocs(colRef);
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      return items;
    } else {
      const mockState = getMockState(collectionName);
      return Object.values(mockState);
    }
  },

  // Update a document
  updateDoc: async (collectionName, docId, data) => {
    let mergedData = { ...data };
    if (collectionName === "stock") {
      if (data.name !== undefined) mergedData.medicineName = data.name;
      if (data.medicineName !== undefined) mergedData.name = data.medicineName;
      if (data.total_quantity !== undefined) mergedData.quantity = data.total_quantity;
      if (data.quantity !== undefined) mergedData.total_quantity = data.quantity;
      if (data.hospital_id !== undefined) mergedData.centerId = data.hospital_id;
      if (data.centerId !== undefined) mergedData.hospital_id = data.centerId;
      if (data.last_updated !== undefined) mergedData.updatedAt = data.last_updated;
      if (data.updatedAt !== undefined) mergedData.last_updated = data.updatedAt;
      if (data.expiry_date !== undefined) mergedData.expiryDate = data.expiry_date;
      if (data.expiryDate !== undefined) mergedData.expiry_date = data.expiryDate;
      if (mergedData.medicine_id === undefined) mergedData.medicine_id = docId;
    }

    const updatedAtStr = mergedData.updatedAt || new Date().toISOString();
    const lastUpdatedStr = mergedData.last_updated || new Date().toISOString();

    if (!IS_MOCKED) {
      const userId = getUserScope();
      const docRef = doc(dbInstance, "users", userId, collectionName, docId);
      await sdkUpdateDoc(docRef, {
        ...mergedData,
        updatedAt: updatedAtStr,
        last_updated: lastUpdatedStr
      });
      return true;
    } else {
      const mockState = getMockState(collectionName);
      if (mockState[docId]) {
        mockState[docId] = {
          ...mockState[docId],
          ...mergedData,
          updatedAt: updatedAtStr,
          last_updated: lastUpdatedStr
        };
        saveMockState(collectionName, mockState);
        notifyObservers(collectionName);
        return true;
      }
      return false;
    }
  },

  // Add a document
  addDoc: async (collectionName, data) => {
    let mergedData = { ...data };
    if (collectionName === "stock") {
      if (data.name !== undefined) mergedData.medicineName = data.name;
      if (data.medicineName !== undefined) mergedData.name = data.medicineName;
      if (data.total_quantity !== undefined) mergedData.quantity = data.total_quantity;
      if (data.quantity !== undefined) mergedData.total_quantity = data.quantity;
      if (data.hospital_id !== undefined) mergedData.centerId = data.hospital_id;
      if (data.centerId !== undefined) mergedData.hospital_id = data.centerId;
      if (data.last_updated !== undefined) mergedData.updatedAt = data.last_updated;
      if (data.updatedAt !== undefined) mergedData.last_updated = data.updatedAt;
      if (data.expiry_date !== undefined) mergedData.expiryDate = data.expiry_date;
      if (data.expiryDate !== undefined) mergedData.expiry_date = data.expiryDate;
    }

    const timestampStr = data.timestamp || new Date().toISOString();

    if (!IS_MOCKED) {
      const userId = getUserScope();
      if (data.id) {
        await setDoc(doc(dbInstance, "users", userId, collectionName, data.id), {
          ...mergedData,
          timestamp: timestampStr
        });
        return data.id;
      } else {
        const colRef = collection(dbInstance, "users", userId, collectionName);
        const docRef = await sdkAddDoc(colRef, {
          ...mergedData,
          timestamp: timestampStr
        });
        return docRef.id;
      }
    } else {
      const mockState = getMockState(collectionName);
      const newId = data.id || `${collectionName.slice(0, 3)}-${Date.now()}`;
      if (collectionName === "stock") {
        mergedData.medicine_id = newId;
      }
      const newDoc = {
        id: newId,
        ...mergedData,
        timestamp: timestampStr
      };
      mockState[newId] = newDoc;
      saveMockState(collectionName, mockState);
      notifyObservers(collectionName);
      return newId;
    }
  },

  // Delete a document
  deleteDoc: async (collectionName, docId) => {
    if (!IS_MOCKED) {
      const userId = getUserScope();
      const docRef = doc(dbInstance, "users", userId, collectionName, docId);
      await sdkDeleteDoc(docRef);
      return true;
    } else {
      const mockState = getMockState(collectionName);
      if (mockState[docId]) {
        delete mockState[docId];
        saveMockState(collectionName, mockState);
        notifyObservers(collectionName);
        return true;
      }
      return false;
    }
  }
};

export default firestore;
