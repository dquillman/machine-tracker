import { db, auth } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc, collectionGroup } from 'firebase/firestore';
import { MachineLog } from '../types';
import { getMachine } from './machineService';

const GYMS_COLLECTION = 'gyms';
const MACHINES_SUBCOLLECTION = 'machines';
const SETTINGS_SUBCOLLECTION = 'settings';
const FLATTENED_LOGS_COLLECTION = 'machineLogs';

// Helper: Normalize Weight
const normalizeWeight = (raw: string | number | undefined): { val: number | undefined, unit: string } => {
    if (raw === undefined || raw === null || raw === '') return { val: undefined, unit: 'unknown' };

    const str = String(raw).toLowerCase().trim();

    // Check key phrases
    if (str.includes('plate')) return { val: undefined, unit: 'plate' };

    // Try parse number
    // Remove 'kg', 'lb', 'lbs' to find number
    // If it has 'kg', we normalize * 2.2

    const isKg = str.includes('kg');
    const cleanStr = str.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleanStr);

    if (isNaN(val)) return { val: undefined, unit: 'unknown' };

    if (isKg) {
        return { val: Math.round(val * 2.20462), unit: 'kg' };
    }

    // Default to lbs if just number
    return { val, unit: 'lb' };
};

export const addLog = async (gymId: string, machineId: string, settings: Record<string, string | number>, notes?: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const userId = auth.currentUser.uid;

    // 1. Fetch Machine to get machineKey and name
    const machine = await getMachine(gymId, machineId);
    const machineKey = machine?.machineKey || 'unknown';
    const machineName = machine?.name || 'Unknown Machine';

    // 2. Normalize Weight (Find field named 'Weight' or 'weight')
    const weightFieldKey = Object.keys(settings).find(k => k.toLowerCase().includes('weight'));
    const rawWeight = weightFieldKey ? settings[weightFieldKey] : undefined;
    const { val: weightNormalizedLb, unit: weightUnit } = normalizeWeight(rawWeight);

    const logData: Omit<MachineLog, 'id'> = {
        userId,
        gymId,
        machineId,
        machineKey,
        date: Date.now(),
        settings,
        notes,
        // Flattened fields
        weightRaw: rawWeight ? String(rawWeight) : undefined,
        weightValue: weightFieldKey ? parseFloat(String(rawWeight).replace(/[^0-9.]/g, '')) : undefined,
        weightUnit,
        weightNormalizedLb
    };

    // 3. Write to Nested Collection (Legacy / Gym-Scoped)
    const docRef = await addDoc(collection(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION, machineId, SETTINGS_SUBCOLLECTION), logData);

    // 4. Write to Flattened Collection (Fast Charting)
    // users/{uid}/machineLogs/{logId}
    const flatRef = collection(db, 'users', userId, FLATTENED_LOGS_COLLECTION);
    await addDoc(flatRef, {
        ...logData,
        originalLogId: docRef.id,
        machineNameSnapshot: machineName
    });

    return { id: docRef.id, ...logData };
};

export const getChartData = async (machineKey: string): Promise<MachineLog[]> => {
    if (!auth.currentUser) return [];

    const userId = auth.currentUser.uid;
    const q = query(
        collection(db, 'users', userId, FLATTENED_LOGS_COLLECTION),
        where("machineKey", "==", machineKey)
        // orderBy("date", "asc") // Index required? Ideally yes.
    );

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MachineLog));
    return logs.sort((a, b) => a.date - b.date);
};

export const deleteLog = async (gymId: string, machineId: string, logId: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    // Delete nested
    await deleteDoc(doc(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION, machineId, SETTINGS_SUBCOLLECTION, logId));

    // Also delete from flattened? 
    // We'd need to query by originalLogId to find it.
    // For MVP, we might leave it or do the query.
    // "Default: remove logs tied to that gym"
    const flatQ = query(collection(db, 'users', auth.currentUser.uid, FLATTENED_LOGS_COLLECTION), where("originalLogId", "==", logId));
    const flatSnaps = await getDocs(flatQ);
    flatSnaps.forEach(d => deleteDoc(d.ref));
};

export const getMachineLogs = async (gymId: string, machineId: string, limitCount = 10): Promise<MachineLog[]> => {
    if (!auth.currentUser) return [];
    // Keep using nested for specific machine detail list within a gym
    const q = query(
        collection(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION, machineId, SETTINGS_SUBCOLLECTION),
        where("userId", "==", auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MachineLog));

    // Sort client-side for now
    return logs.sort((a, b) => b.date - a.date).slice(0, limitCount);
};

export const getAllLogs = async (limitCount = 50): Promise<MachineLog[]> => {
    if (!auth.currentUser) return [];

    // Switch to using flattened logs for global history! Much faster.
    const q = query(
        collection(db, 'users', auth.currentUser.uid, FLATTENED_LOGS_COLLECTION)
    );

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MachineLog));

    return logs.sort((a, b) => b.date - a.date).slice(0, limitCount);
};
