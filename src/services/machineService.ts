import { db, auth } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, doc, getDoc, writeBatch, updateDoc, deleteDoc } from 'firebase/firestore';
import { Machine } from '../types';

const MACHINES_COLLECTION = 'machines';

export const addMachine = async (name: string, location?: string, type: 'strength' | 'treadmill' = 'strength') => {
    if (!auth.currentUser) throw new Error("User not authenticated");

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
        fields: fields as any, // Cast to avoid TS issues slightly with strict types if types/index needs update
        isArchived: false,
        lastUsed: Date.now()
    };

    const docRef = await addDoc(collection(db, MACHINES_COLLECTION), machineData);
    return { id: docRef.id, ...machineData };
};

export const updateMachine = async (id: string, updates: Partial<Machine>) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    // We can also verify ownership here if needed, but rules handle it
    const docRef = doc(db, MACHINES_COLLECTION, id);
    // Don't allow updating userId or id
    const { userId, id: _, ...safeUpdates } = updates as any;

    await updateDoc(docRef, safeUpdates);
};

export const deleteMachine = async (id: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    await deleteDoc(doc(db, MACHINES_COLLECTION, id));
};

export const getMachines = async (): Promise<Machine[]> => {
    if (!auth.currentUser) return [];

    const q = query(
        collection(db, MACHINES_COLLECTION),
        where("userId", "==", auth.currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const machines = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Machine));

    // Sort client-side
    return machines.sort((a, b) => a.name.localeCompare(b.name));
};

export const getMachine = async (id: string): Promise<Machine | null> => {
    if (!auth.currentUser) return null;
    // TODO: Verify ownership if strictly user-scoped
    const docRef = doc(db, MACHINES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Machine;
    }
    return null;
};

import { defaultMachines } from '../data/defaultMachines';

export const seedMachines = async () => {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);

    defaultMachines.forEach(m => {
        const newRef = doc(collection(db, MACHINES_COLLECTION));
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
