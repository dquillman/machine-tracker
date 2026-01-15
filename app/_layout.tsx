import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

function AuthLayout() {
    return (
        <>
            <Head>
                <title>Gym Machine Tracker</title>
                <link rel="icon" type="image/png" href="/favicon.png" />
            </Head>
            <InnerAuthLayout />
        </>
    );
}

function InnerAuthLayout() {
    const { user, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();


    useEffect(() => {
        // Global error handler for unhandled promise rejections
        const rejectionHandler = (event: PromiseRejectionEvent) => {
            console.error("Unhandled Promise Rejection Detected:", event.reason);
            // On web, we can see this. On invalid networks, this might catch the NetworkError
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', rejectionHandler);
        }

        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)'; // If using group
        // For now we just check if we are on index (login) or tabs
        // Actually simpler:

        if (!user) {
            // If not logged in, stick to auth screen. 
            // If we are deep inside app, redirect to /auth
            // But we don't have /auth route defined yet explicitly except maybe a file. 
            // Let's create `app/auth.tsx` (LoginScreen) and `app/(tabs)` (Protected).
            // If no user, redirect to /auth.
            // If user, redirect to /(tabs) if on /auth.
            router.replace("/auth");
        } else {
            if (segments[0] === "auth") {
                router.replace("/(tabs)");
            } else if (segments.length === 0) {
                // Redirect root to tabs
                router.replace("/(tabs)");
            }
        }
    }, [user, loading, segments]);

    if (loading) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return <Slot />;
}

export default function Layout() {
    return (
        <AuthProvider>
            <AuthLayout />
        </AuthProvider>
    );
}
