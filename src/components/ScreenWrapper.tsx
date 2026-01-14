import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
    children: React.ReactNode;
    bg?: string;
    safeArea?: boolean;
    className?: string;
}

export default function ScreenWrapper({ children, bg = "bg-gray-900", safeArea = true, className = "" }: ScreenWrapperProps) {
    const Container = safeArea ? SafeAreaView : View;

    return (
        <Container className={`flex-1 ${bg} ${className}`}>
            <StatusBar barStyle="light-content" />
            <View className="flex-1 px-4">
                {children}
            </View>
        </Container>
    );
}
