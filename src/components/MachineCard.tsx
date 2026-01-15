import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Machine } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface MachineCardProps {
    machine: Machine;
    onPress: () => void;
    onLongPress?: () => void;
    disabled?: boolean;
    latestSettings?: Record<string, string | number> | null;
}

export default function MachineCard({ machine, onPress, onLongPress, disabled, latestSettings }: MachineCardProps) {
    // Format settings for display - show up to 2 key settings
    const formatSettings = () => {
        if (!latestSettings) return "No recent activity";

        const entries = Object.entries(latestSettings);
        if (entries.length === 0) return "No recent activity";

        // Prioritize showing Weight and Reps/Duration
        const priority = ['Weight', 'Reps', 'Duration (min)', 'Speed', 'Incline'];
        const sorted = entries.sort((a, b) => {
            const aIndex = priority.indexOf(a[0]);
            const bIndex = priority.indexOf(b[0]);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });

        return sorted.slice(0, 2).map(([key, value]) => `${key}: ${value}`).join(' • ');
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            disabled={disabled}
            className={`bg-gray-800 p-4 rounded-xl mb-3 border border-gray-700 flex-row justify-between items-center active:bg-gray-700 ${disabled ? 'opacity-80 scale-[1.02]' : ''}`}
        >
            <View className="flex-row items-center flex-1">
                <View className="mr-3">
                    <Ionicons name="reorder-two" size={24} color="#4B5563" />
                </View>
                <View className="flex-1">
                    <Text className="text-white text-lg font-bold">{machine.name}</Text>
                    {machine.location && (
                        <Text className="text-gray-400 text-sm mt-1">{machine.location}</Text>
                    )}
                    <Text className="text-gray-500 text-xs mt-1">{formatSettings()}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
        </TouchableOpacity>
    );
}
