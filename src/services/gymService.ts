import { db, auth } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, writeBatch, deleteDoc, Timestamp } from 'firebase/firestore';
import { Gym, Machine, MachineLog } from '../types';

const GYMS_COLLECTION = 'gyms';
const USERS_COLLECTION = 'users';

export const createGym = async (name: string, seedFromLatest = true) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const userId = auth.currentUser.uid;

    // 1. Create Gym Doc
    const gymData: Omit<Gym, 'id'> = {
        userId,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    const gymRef = await addDoc(collection(db, GYMS_COLLECTION), gymData);
    const gymId = gymRef.id;

    // 2. Seed Machines if requested
    if (seedFromLatest) {
        await seedMachinesFromLatest(userId, gymId);
    }

    // 3. Set as Active Gym
    await setActiveGym(gymId);

    return { id: gymId, ...gymData };
};

export const getGyms = async (): Promise<Gym[]> => {
    if (!auth.currentUser) return [];
    try {
        const q = query(
            collection(db, GYMS_COLLECTION),
            where("userId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Gym));
    } catch (error) {
        // If query fails (likely due to missing index or rules), return empty for now
        console.error("Error fetching gyms:", error);
        return [];
    }
};

export const updateGym = async (id: string, updates: Partial<Gym>) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    const docRef = doc(db, GYMS_COLLECTION, id);
    await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
};

export const deleteGym = async (id: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    // Note: This only deletes the gym doc. Subcollections (machines) must be deleted recursively server-side or manually.
    // user is warned in UI.
    await deleteDoc(doc(db, GYMS_COLLECTION, id));
};


// --- User Profile & Active Gym ---

export const getUserProfile = async (uid: string) => {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (snap.exists()) return snap.data();
    return null;
};

export const setActiveGym = async (gymId: string) => {
    if (!auth.currentUser) return;
    const userRef = doc(db, USERS_COLLECTION, auth.currentUser.uid);
    // Use set with merge to create if not exists
    await import('firebase/firestore').then(({ setDoc }) =>
        setDoc(userRef, {
            activeGymId: gymId,
            lastUsedGymId: gymId,
            updatedAt: Date.now()
        }, { merge: true })
    );
};


// --- Seeding Logic ---

const seedMachinesFromLatest = async (userId: string, targetGymId: string) => {
    // Strategy: 
    // 1. Get User Profile for 'latestSettingsTemplate'
    // 2. OR fallback to finding last used gym's machines

    // For now, let's implement the "Copy from generic defaults" or "Copy from User Profile" 
    // Since we don't have the template maintenance logic fully built yet, 
    // let's assume we copy from the *most recent gym* or just generic defaults if first time.

    const userProfile = await getUserProfile(userId);
    let template = userProfile?.latestSettingsTemplate;

    if (!template) {
        // Fallback: If no template, maybe copy from default machines?
        // Let's explicitly look for machines in the "lastUsedGymId" if available.
        if (userProfile?.lastUsedGymId) {
            // Fetch machines from that gym... (Not implemented yet as getting subcollection requires gymId)
        }

        // If totally new, we might strictly want "Empty" or "Standard Defaults".
        // The requirement says: "If nothing exists: create gym with zero machines"
        return;
    }

    const batch = writeBatch(db);

    // Template is Record<machineKey, settings>
    // but we need Machine Details (Name, Type). 
    // The Template userProfile.latestSettingsTemplate might need to store more info than just settings 
    // OR we relies on the fact that we copy the *Machines* from previous gym, not just settings.

    // Refined Requirement: "default all machines to my latest machine settings (copied from my most recently-used gym/machine settings)"

    // So:
    // 1. Identify Source Gym (lastUsedGymId)
    // 2. Copy all machines from Source Gym -> Target Gym
    // 3. For each machine, carry over its latest "Settings" snapshot as the initial state?
    // Actually, requirement says "Create machines in the new gym... For each machineKey in template".

    // Let's implement full "Copy from Source Gym" logic:
    if (userProfile?.lastUsedGymId) {
        const sourceGymId = userProfile.lastUsedGymId;
        const machinesRef = collection(db, GYMS_COLLECTION, sourceGymId, 'machines');
        const sourceMachines = await getDocs(machinesRef);

        sourceMachines.docs.forEach((mDoc) => {
            const mData = mDoc.data();
            const newMachineRef = doc(collection(db, GYMS_COLLECTION, targetGymId, 'machines'));

            batch.set(newMachineRef, {
                ...mData,
                userId, // Ensure ID is set
                location: undefined, // Clear location specific string if any
                createdAt: Date.now(),
                isSeed: true
            });

            // Also copy the latest settings?
            // "lastSettingsRef" logic or just look for the "latestSettingsTemplate" map.
            // If we have a settings template, we should spawn a settings/log doc.

            if (template && template[mData.name]) { // assuming name is key
                const settingsRef = doc(collection(db, GYMS_COLLECTION, targetGymId, 'machines', newMachineRef.id, 'settings'));
                batch.set(settingsRef, {
                    ...template[mData.name],
                    date: Date.now(),
                    notes: "Seeded from latest",
                    isDefaultSeed: true
                });
            }
        });

        await batch.commit();
    }
};
