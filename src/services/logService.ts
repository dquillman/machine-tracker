import { db, auth } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { MachineLog } from '../types';

const LOGS_COLLECTION = 'logs';

export const addLog = async (machineId: string, settings: Record<string, string | number>, notes?: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const logData: Omit<MachineLog, 'id'> = {
        userId: auth.currentUser.uid,
        machineId,
        date: Date.now(),
        settings,
        notes
    };

    const docRef = await addDoc(collection(db, LOGS_COLLECTION), logData);
    return { id: docRef.id, ...logData };
};

export const deleteLog = async (id: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await deleteDoc(doc(db, LOGS_COLLECTION, id));
};

export const getMachineLogs = async (machineId: string, limitCount = 10): Promise<MachineLog[]> => {
    if (!auth.currentUser) return [];

    const q = query(
        collection(db, LOGS_COLLECTION),
        where("userId", "==", auth.currentUser.uid),
        where("machineId", "==", machineId)
        // orderBy("date", "desc"),
        // limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MachineLog));

    // Sort and limit client-side
    return logs.sort((a, b) => b.date - a.date).slice(0, limitCount);
};

export const getAllLogs = async (limitCount = 50): Promise<MachineLog[]> => {
    if (!auth.currentUser) return [];

    const q = query(
        collection(db, LOGS_COLLECTION),
        where("userId", "==", auth.currentUser.uid)
        // orderBy("date", "desc") // Removed to avoid composite index requirement
        // limit(limitCount) // Limit applied client-side after sort
    );

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as MachineLog));

    // Sort and limit client-side
    return logs.sort((a, b) => b.date - a.date).slice(0, limitCount);
};
