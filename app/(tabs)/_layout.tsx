import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { Text } from "react-native";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#111827', // gray-900
                    borderTopColor: '#374151', // gray-700
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#3B82F6', // blue-500
                tabBarInactiveTintColor: '#9CA3AF', // gray-400
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Machines",
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size }}>🏋️</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ color, size }) => (
                        <Text style={{ fontSize: size }}>🕒</Text>
                    ),
                }}
            />
        </Tabs>
    );
}
