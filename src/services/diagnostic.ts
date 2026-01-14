import { db } from '../config/firebase';
import { getDoc, doc } from 'firebase/firestore';

export const checkConnectivity = async () => {
    const results = {
        internet: false,
        firestore: false,
        details: ""
    };

    // Check Internet (Google Ping)
    try {
        const response = await fetch("https://www.google.com/generate_204", { mode: 'no-cors' });
        results.internet = true; // If we get here, DNS and network are likely fine
    } catch (error: any) {
        results.details += `Internet Check Failed: ${error.message}\n`;
    }

    // Check Firestore (Read a non-existent doc just to test connection)
    try {
        await getDoc(doc(db, "diagnostics", "ping"));
        results.firestore = true;
    } catch (error: any) {
        results.details += `Firestore Check Failed: ${error.message}\n`;
    }

    return results;
};
