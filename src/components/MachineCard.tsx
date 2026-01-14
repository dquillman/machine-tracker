import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Machine } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface MachineCardProps {
    machine: Machine;
    onPress: () => void;
}

export default function MachineCard({ machine, onPress }: MachineCardProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800 p-4 rounded-xl mb-3 border border-gray-700 flex-row justify-between items-center active:bg-gray-700"
        >
            <View>
                <Text className="text-white text-lg font-bold">{machine.name}</Text>
                {machine.location && (
                    <Text className="text-gray-400 text-sm mt-1">{machine.location}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
        </TouchableOpacity>
    );
}
