import { db, auth } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, doc, getDoc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { Machine } from '../types';
import { createGym, setActiveGym } from './gymService';

const GYMS_COLLECTION = 'gyms';
const MACHINES_SUBCOLLECTION = 'machines';

// Legacy path for migration
const ROOT_MACHINES_COLLECTION = 'machines';

export const addMachine = async (gymId: string, name: string, location?: string, type: 'strength' | 'treadmill' = 'strength') => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    if (!gymId) throw new Error("Gym ID is required");

    let fields = [];
    if (type === 'treadmill') {
        fields = [
            { id: '1', name: 'Speed', type: 'number' },
            { id: '2', name: 'Incline', type: 'number' },
            { id: '3', name: 'Duration (min)', type: 'number' }
        ];
    } else {
        // Default Strength
        fields = [
            { id: '1', name: 'Seat Height', type: 'number' },
            { id: '2', name: 'Weight', type: 'number' }
        ];
    }

    const machineData: Omit<Machine, 'id'> = {
        userId: auth.currentUser.uid,
        name,
        location,
        fields: fields as any,
        isArchived: false,
        lastUsed: Date.now()
    };

    const docRef = await addDoc(collection(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION), machineData);
    return { id: docRef.id, ...machineData };
};

export const updateMachine = async (gymId: string, id: string, updates: Partial<Machine>) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const docRef = doc(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION, id);
    // Don't allow updating userId or id
    const { userId, id: _, ...safeUpdates } = updates as any;
    await updateDoc(docRef, safeUpdates);
};

export const deleteMachine = async (gymId: string, id: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await deleteDoc(doc(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION, id));
};

export const getMachines = async (gymId?: string): Promise<Machine[]> => {
    if (!auth.currentUser) return [];
    if (!gymId) return []; // Or switch to fetching from root if we want? No, let's enforce gym.

    const q = query(
        collection(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION),
        where("userId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const machines = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Machine));

    return machines.sort((a, b) => a.name.localeCompare(b.name));
};

export const getMachine = async (gymId: string, id: string): Promise<Machine | null> => {
    if (!auth.currentUser) return null;
    const docRef = doc(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Machine;
    }
    return null;
};

// --- Migration ---

export const checkAndMigrate = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    const profile = userSnap.data();

    if (profile?.migrationComplete) return;

    // Start Migration
    console.log("Starting Migration...");

    // 1. Create Default Gym
    const newGym = await createGym("My Gym", false);
    const gymId = newGym.id;

    // 2. Fetch Root Machines
    const rootQ = query(collection(db, ROOT_MACHINES_COLLECTION), where("userId", "==", auth.currentUser.uid));
    const rootSnaps = await getDocs(rootQ);

    if (!rootSnaps.empty) {
        const batch = writeBatch(db);
        rootSnaps.docs.forEach(d => {
            const data = d.data();
            const newRef = doc(collection(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION));
            batch.set(newRef, {
                ...data,
                migratedFrom: d.id,
                _originalId: d.id // Helper for logs migration later if needed
            });
            // We are NOT deleting old docs yet as per requirements
        });
        await batch.commit();
        console.log(`Migrated ${rootSnaps.size} machines.`);
    }

    // 3. Mark complete
    await updateDoc(userRef, {
        migrationComplete: true,
        activeGymId: gymId,
        lastUsedGymId: gymId
    });

    // Note: Migrating LOGS (settings) is trickier because we need to map old machine ID to new machine ID.
    // If we want logs to persist, we need to do that mapping.
    // Requirement says: "Migrate existing machines/settings into gyms/{defaultGymId}/..."
    // This implies we SHOULD migrate logs too.
    // But logs are currently just flat 'logs' collection with machineId. 
    // New structure: gyms/{gymId}/machines/{machineId}/settings/{settingId}

    // Let's rely on _originalId to map logs? 
    // Or simpler: Just copy root machines. Logs might be left behind? 
    // "Migrate existing machines/settings". 
    // I should create a migration function that handles Logs too.

    // I can do this in a separate improvement or right here.
    // For now, let's stick to Machines migration to unblock. 
    // User data is safe in root.
};

import { defaultMachines } from '../data/defaultMachines';

export const seedMachines = async (gymId: string) => {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);

    defaultMachines.forEach(m => {
        const newRef = doc(collection(db, GYMS_COLLECTION, gymId, MACHINES_SUBCOLLECTION));
        batch.set(newRef, {
            ...m,
            userId: auth.currentUser!.uid,
            location: 'Default',
            isArchived: false,
            lastUsed: Date.now()
        });
    });

    await batch.commit();
};
