import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInAnonymously as firebaseSignInAnonymously,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
    signInWithEmail: (e: string, p: string) => Promise<void>;
    signUpWithEmail: (e: string, p: string) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                await fetchProfile(user.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const fetchProfile = async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                setUserProfile(snap.data() as UserProfile);
            }
        } catch (e) {
            console.error("Error fetching profile", e);
        }
    };

    const refreshProfile = async () => {
        if (user) await fetchProfile(user.uid);
    };

    const signInAnonymously = async () => {
        try {
            await firebaseSignInAnonymously(auth);
        } catch (error: any) {
            console.error("Error signing in anonymously:", error);
            const { Alert } = require('react-native');
            Alert.alert("Sign In Error", error.message || "Failed to sign in anonymously. Check your network connection.");
            setLoading(false);
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error(error);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error(error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signInAnonymously, logout, signInWithEmail, signUpWithEmail, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
